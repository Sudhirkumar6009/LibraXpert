const express = require("express");
const router = express.Router();
const AssistantSession = require("../models/assistantSession");
const Book = require("../models/books");
const User = require("../models/users");
const BorrowRequest = require("../models/borrowRequest");
const { authenticateToken } = require("../middleware/auth");

const MAX_BOOK_RESULTS = 5;

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAIResponseSafe = async (prompt, context, fallbackText) => {
  try {
    return await getAIResponse(prompt, context);
  } catch (error) {
    console.error(
      "[Assistant AI Error] Provider call failed, using fallback response.",
    );
    console.error("[Assistant AI Error] Message:", error.message);
    if (error.stack) {
      console.error("[Assistant AI Error] Stack:", error.stack);
    }
    return fallbackText;
  }
};

const extractBookCandidate = (query = "") => {
  return String(query)
    .toLowerCase()
    .replace(
      /\b(can|i|me|my|please|a|an|the|about|for|on|of|to|is|are|borrow|loan|checkout|get|take|summary|summarize|tell|describe|explain|book|new)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
};

const findBooksForQuery = async (query, limit = MAX_BOOK_RESULTS) => {
  const safeLimit = Math.max(
    1,
    Math.min(Number(limit) || MAX_BOOK_RESULTS, 20),
  );
  const rawQuery = String(query || "").trim();

  if (!rawQuery) return [];

  try {
    const textMatches = await Book.find({ $text: { $search: rawQuery } }).limit(
      safeLimit,
    );
    if (textMatches.length > 0) {
      return textMatches;
    }
  } catch (error) {
    console.warn(
      "Book text search failed, falling back to regex:",
      error.message,
    );
  }

  const candidate = extractBookCandidate(rawQuery) || rawQuery;
  const tokens = candidate
    .split(/\s+/)
    .filter((token) => token.length >= 3)
    .slice(0, 6);
  const regexFilters = [
    { title: { $regex: escapeRegex(candidate), $options: "i" } },
    { author: { $regex: escapeRegex(candidate), $options: "i" } },
    ...tokens.map((token) => ({
      title: { $regex: escapeRegex(token), $options: "i" },
    })),
    ...tokens.map((token) => ({
      author: { $regex: escapeRegex(token), $options: "i" },
    })),
  ];

  return Book.find({ $or: regexFilters })
    .sort({ availableCopies: -1, createdAt: -1 })
    .limit(safeLimit);
};

const summarizeBookWithoutAI = (book) => {
  const description = String(book.description || "").trim();
  const shortDescription = description
    ? description
        .split(/(?<=[.!?])\s+/)
        .slice(0, 3)
        .join(" ")
    : `"${book.title}" by ${book.author} is available in the library catalog.`;

  return `${book.title} by ${book.author}. ${shortDescription}`.trim();
};

const resolveAIProvider = () => {
  const configuredProvider = String(process.env.AI_PROVIDER || "")
    .trim()
    .toLowerCase();

  if (configuredProvider === "gemini" || configuredProvider === "openai") {
    return configuredProvider;
  }

  // Default to Gemini for assistant responses when not explicitly configured.
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "gemini";
};

const buildAssistantAction = (partial = {}) => ({
  type: partial.type || "none",
  redirectPath: partial.redirectPath || null,
  meta: partial.meta || {},
});

// AI Service (OpenAI/Gemini)
const getAIResponse = async (prompt, context) => {
  const provider = resolveAIProvider();
  const apiKey =
    provider === "gemini"
      ? process.env.GEMINI_API_KEY
      : process.env.OPENAI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  if (!apiKey) {
    throw new Error(
      `AI API key not configured for provider "${provider}".`,
    );
  }

  if (provider === "gemini") {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${context}\n\n${prompt}` }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        console.error("[Gemini API Error] HTTP status:", response.status);
        console.error("[Gemini API Error] Response payload:", data);
        throw new Error(data.error?.message || "Gemini API failed");
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("[Gemini API Error] Request failed in getAIResponse.");
      console.error("[Gemini API Error] Model:", geminiModel);
      console.error("[Gemini API Error] Message:", error.message);
      throw error;
    }
  } else {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: context },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI API error:", data);
      throw new Error(data.error?.message || "OpenAI API failed");
    }
    return data.choices[0].message.content;
  }
};

// Get user context
const getUserContext = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User account not found");
  }

  const loans = await BorrowRequest.find({
    user: userId,
    status: "approved",
  }).populate("book");
  const borrowedBooks = loans.filter((l) => !l.returned).map((l) => l.book);
  const completedBooks = loans.filter((l) => l.returned).map((l) => l.book);

  return {
    user,
    loans,
    borrowedBooks,
    completedBooks,
    totalBorrowed: borrowedBooks.length,
    totalCompleted: completedBooks.length,
  };
};

// POST /api/assistant/chat
router.post("/chat", authenticateToken, async (req, res) => {
  try {
    const { message, mode } = req.body;
    const userId = req.user.userId;

    if (!message) return res.status(400).json({ error: "Message required" });

    const context = await getUserContext(userId);
    let session = await AssistantSession.findOne({ userId }).sort({
      createdAt: -1,
    });

    if (!session) {
      session = new AssistantSession({
        userId,
        userProgress: {
          borrowedBooks: context.borrowedBooks.map((b) => b._id),
          completedBooks: context.completedBooks.map((b) => b._id),
          weakAreas: [],
          interests: [],
        },
      });
    }

    let response;
    let actionableData = null;

    switch (mode) {
      case "explain":
        response = await handleExplainMode(message, context);
        break;
      case "next-step":
        response = await handleNextStepMode(message, context);
        actionableData = response.suggestions;
        break;
      case "quiz":
        response = await handleQuizMode(message, context);
        actionableData = response.questions;
        break;
      case "summary":
        response = await handleSummaryMode(message, context);
        break;
      case "weakness":
        response = await handleWeaknessMode(context);
        actionableData = response.weakAreas;
        break;
      default:
        response = await handleGeneralMode(message, context);
    }

    session.messages.push(
      { role: "user", content: message, mode },
      { role: "assistant", content: response.answer, mode },
    );
    session.updatedAt = Date.now();
    await session.save();

    res.json({
      answer: response.answer,
      whyMatters: response.whyMatters,
      nextAction: response.nextAction,
      action: response.action || buildAssistantAction(),
      data: actionableData,
    });
  } catch (error) {
    console.error("Assistant error:", error);
    res.status(500).json({ error: "Assistant unavailable" });
  }
});

// Explain Mode
const handleExplainMode = async (topic, context) => {
  const books = await findBooksForQuery(topic, 3);

  const systemContext = `You are a library study assistant. Explain "${topic}" in simple terms.
User has borrowed ${context.totalBorrowed} books and completed ${context.totalCompleted}.
Available books on this topic: ${books.map((b) => b.title).join(", ")}

Format:
- Simple explanation (2-3 sentences)
- Real example
- 3 key points`;

  const fallbackText =
    books.length > 0
      ? `${topic} is related to library resources like "${books[0].title}". Start with core concepts, review examples, and then test understanding with practice questions.`
      : `${topic} is an important study area. Start from basics, connect concepts to examples, and build up to advanced topics gradually.`;

  const aiResponse = await getAIResponseSafe(
    topic,
    systemContext,
    fallbackText,
  );

  return {
    answer: aiResponse,
    whyMatters: `Understanding ${topic} helps you explore ${books.length} related books in our library`,
    nextAction:
      books.length > 0
        ? `Browse: ${books[0].title}`
        : "Search library for related books",
  };
};

// Next-Step Mode
const handleNextStepMode = async (query, context) => {
  const { borrowedBooks, completedBooks } = context;
  const borrowedCategories = [
    ...new Set(borrowedBooks.flatMap((b) => b.categories || [])),
  ];

  const suggestions = await Book.find({
    categories: { $in: borrowedCategories },
    _id: {
      $nin: [
        ...borrowedBooks.map((b) => b._id),
        ...completedBooks.map((b) => b._id),
      ],
    },
  }).limit(3);

  const systemContext = `User borrowed: ${borrowedBooks.map((b) => b.title).join(", ")}.
Completed: ${completedBooks.map((b) => b.title).join(", ")}.
Suggest next book based on progress.`;

  const fallbackText =
    suggestions.length > 0
      ? `Based on your borrowing history, a strong next step is "${suggestions[0].title}" by ${suggestions[0].author}.`
      : "You have explored your current categories well. Try a related new category to broaden your knowledge.";

  const aiResponse = await getAIResponseSafe(
    "What should I read next?",
    systemContext,
    fallbackText,
  );

  return {
    answer: aiResponse,
    whyMatters: "Personalized based on your reading history",
    nextAction:
      suggestions.length > 0
        ? `Check out: ${suggestions[0].title}`
        : "Explore new categories",
    suggestions: suggestions.map((b) => ({
      id: b._id,
      title: b.title,
      author: b.author,
    })),
  };
};

// Quiz Mode
const handleQuizMode = async (topic, context) => {
  const books = await findBooksForQuery(topic, 1);

  const systemContext = `Generate 3 quiz questions about "${topic}" from library context.
Related book: ${books[0]?.title || "General knowledge"}

Format each as:
Q: [question]
A: [answer]
B: [wrong]
C: [wrong]
Correct: A`;

  const fallbackQuiz = `Q: What is a core concept in ${topic}?
A: Understanding the fundamentals before advanced topics
B: Skipping basics and memorizing answers only
C: Avoiding practice questions
Correct: A`;

  const aiResponse = await getAIResponseSafe(
    "Generate quiz",
    systemContext,
    fallbackQuiz,
  );

  const questions = parseQuizResponse(aiResponse);

  return {
    answer: `Quiz on ${topic} (${questions.length} questions)`,
    whyMatters: "Test your understanding before borrowing advanced books",
    nextAction: "Complete quiz to identify knowledge gaps",
    questions,
  };
};

// Summary Mode
const handleSummaryMode = async (bookTitle, context) => {
  const books = await findBooksForQuery(bookTitle, 1);
  const book = books[0];

  if (!book) {
    return {
      answer: "Book not found in library",
      whyMatters: "Search our catalog for available books",
      nextAction: "Try different search terms",
    };
  }

  const systemContext = `Summarize "${book.title}" by ${book.author} in max 7 bullet points.
Description: ${book.description}`;

  const aiResponse = await getAIResponseSafe(
    "Summarize this book",
    systemContext,
    summarizeBookWithoutAI(book),
  );

  return {
    answer: aiResponse,
    whyMatters: "Quick overview before borrowing",
    nextAction: `Borrow "${book.title}" if interested`,
  };
};

// Weakness Detection Mode
const handleWeaknessMode = async (context) => {
  const { borrowedBooks, completedBooks } = context;
  const allCategories = await Book.distinct("categories");
  const userCategories = [
    ...new Set(borrowedBooks.flatMap((b) => b.categories || [])),
  ];
  const unexplored = allCategories
    .filter((c) => !userCategories.includes(c))
    .slice(0, 3);

  const systemContext = `User explored: ${userCategories.join(", ")}.
Unexplored areas: ${unexplored.join(", ")}.
Suggest improvement areas.`;

  const fallbackText =
    unexplored.length > 0
      ? `To improve, explore ${unexplored.join(", ")}. This helps you build balanced subject coverage.`
      : "Continue deepening your current subjects and add one new category this month.";

  const aiResponse = await getAIResponseSafe(
    "What areas should I improve?",
    systemContext,
    fallbackText,
  );

  return {
    answer: aiResponse,
    whyMatters: "Broaden your knowledge across subjects",
    nextAction: `Explore: ${unexplored[0] || "New categories"}`,
    weakAreas: unexplored,
  };
};

// General Mode
const handleGeneralMode = async (query, context) => {
  const Fine = require("../models/fine");
  const books = await findBooksForQuery(query, 5);
  const normalizedQuery = String(query || "").toLowerCase();

  // Check for fine-related queries
  const fineKeywords = [
    "fine",
    "pay",
    "payment",
    "owe",
    "penalty",
    "fee",
    "fines",
  ];
  const isFineQuery = fineKeywords.some((kw) => normalizedQuery.includes(kw));

  if (isFineQuery) {
    const fines = await Fine.find({
      user: context.user._id,
      status: { $in: ["pending_payment", "pending_approval"] },
    });
    const totalFine = fines.reduce((sum, f) => sum + (f.amount || 0), 0);

    if (totalFine > 0) {
      return {
        answer: `You have Rs. ${totalFine} in pending fines. ${fines.length} fine(s) need to be paid offline to the librarian.`,
        whyMatters: "Clear fines to continue borrowing books",
        nextAction: "Visit library to pay fines offline",
        action: buildAssistantAction({
          type: "open_loans_and_show_fines",
          redirectPath: "/loans",
          meta: { totalFine, fineCount: fines.length },
        }),
      };
    } else {
      return {
        answer: "Great news! You have no pending fines.",
        whyMatters: "Your account is in good standing",
        nextAction: "Continue borrowing books",
        action: buildAssistantAction({
          type: "open_loans",
          redirectPath: "/loans",
          meta: { totalFine: 0, fineCount: 0 },
        }),
      };
    }
  }

  const loanCountKeywords = [
    "how many loans",
    "my loans",
    "loan count",
    "borrowed books",
    "active loans",
    "loan status",
  ];
  const isLoanCountQuery = loanCountKeywords.some((kw) =>
    normalizedQuery.includes(kw),
  );

  if (isLoanCountQuery) {
    const Fine = require("../models/fine");
    const activeLoans = context.loans.filter((loan) => !loan.returned);
    const pendingFines = await Fine.find({
      user: context.user._id,
      status: "pending_payment",
    });
    const overdueAmount = pendingFines.reduce((sum, fine) => {
      return sum + (fine.amount || 0);
    }, 0);

    const fineNotice =
      overdueAmount > 0
        ? `You have pending Rs. ${overdueAmount} overdue fine. Please pay it ASAP.`
        : "You currently have no pending overdue fine.";

    return {
      answer: `You currently have ${activeLoans.length} active loan(s). Redirecting you to the Loans page now. ${fineNotice}`,
      whyMatters: "Loans page shows due dates, renewals, and overdue details",
      nextAction:
        overdueAmount > 0
          ? "Open Loans page and clear pending overdue fine soon"
          : "Open Loans page to review your current books",
      action: buildAssistantAction({
        type: "open_loans_with_count",
        redirectPath: "/loans",
        meta: {
          activeLoanCount: activeLoans.length,
          overdueAmount,
          hasOverdue: overdueAmount > 0,
        },
      }),
    };
  }

  // Check for borrow-related queries
  const borrowKeywords = [
    "borrow",
    "loan",
    "checkout",
    "check out",
    "get",
    "take",
  ];
  const isBorrowQuery = borrowKeywords.some((kw) =>
    normalizedQuery.includes(kw),
  );

  let borrowCandidates = books;
  if (isBorrowQuery && borrowCandidates.length === 0) {
    const candidate = extractBookCandidate(query);
    if (candidate) {
      borrowCandidates = await findBooksForQuery(candidate, 5);
    }
  }

  if (isBorrowQuery && borrowCandidates.length > 0) {
    const availableBooks = borrowCandidates.filter(
      (b) => b.availableCopies > 0,
    );
    if (availableBooks.length > 0) {
      const book = availableBooks[0];
      return {
        answer: `Yes! "${book.title}" by ${book.author} is available. We have ${book.availableCopies} cop${book.availableCopies > 1 ? "ies" : "y"} available.`,
        whyMatters: "Book is ready to borrow",
        nextAction: `Go to catalog and request to borrow "${book.title}"`,
      };
    } else {
      return {
        answer: `"${borrowCandidates[0].title}" is currently unavailable. All copies are borrowed.`,
        whyMatters: "You can reserve it for when it becomes available",
        nextAction: "Make a reservation for this book",
      };
    }
  }

  // Check for summary/book info queries
  const summaryKeywords = [
    "summary",
    "summarize",
    "about",
    "what is",
    "tell me",
    "describe",
    "explain",
  ];
  const isSummaryQuery = summaryKeywords.some((kw) =>
    normalizedQuery.includes(kw),
  );

  if (isSummaryQuery && books.length > 0) {
    const book = books[0];
    const systemContext = `Provide a brief summary of "${book.title}" by ${book.author}.\nDescription: ${book.description || "No description available"}\n\nKeep it concise (3-4 sentences).`;
    const aiResponse = await getAIResponseSafe(
      query,
      systemContext,
      summarizeBookWithoutAI(book),
    );

    return {
      answer: aiResponse,
      whyMatters: `Learn about "${book.title}" before borrowing`,
      nextAction:
        book.availableCopies > 0
          ? `Borrow "${book.title}"`
          : `Reserve "${book.title}"`,
    };
  }

  // General library query with AI
  const systemContext = `You are LibraXpert AI assistant helping with library services.

User context:
- Active loans: ${context.totalBorrowed}
- Completed books: ${context.totalCompleted}
- Books found matching query: ${books.length}

Available books: ${books.map((b) => `"${b.title}" by ${b.author} (${b.availableCopies} available)`).join(", ")}

Answer the user's question about library services, books, borrowing, or recommendations. Be helpful and specific.
If the query is completely unrelated to library services, politely redirect them to library topics.`;

  const defaultLibraryReply =
    books.length > 0
      ? `I found related books including "${books[0].title}" by ${books[0].author}. You can ask me for a summary, availability, or borrowing help.`
      : "I can help with library topics like book summaries, borrowing availability, fines, and recommendations. Tell me a book title or topic.";

  const aiResponse = await getAIResponseSafe(
    query,
    systemContext,
    defaultLibraryReply,
  );

  return {
    answer: aiResponse,
    whyMatters:
      books.length > 0
        ? `${books.length} related book(s) found`
        : "Explore our catalog for more",
    nextAction:
      books.length > 0
        ? `Check out: ${books[0].title}`
        : "Browse library catalog",
  };
};

// Helper: Parse quiz response
const parseQuizResponse = (text) => {
  const questions = [];
  const blocks = text.split(/Q\d*:/i).filter(Boolean);

  blocks.slice(0, 3).forEach((block, i) => {
    const lines = block.trim().split("\n");
    questions.push({
      id: i + 1,
      question: lines[0].trim(),
      options: lines
        .slice(1, 4)
        .map((l) => l.replace(/^[A-C]:\s*/i, "").trim()),
      correct: 0,
    });
  });

  if (questions.length === 0) {
    questions.push({
      id: 1,
      question:
        "What is the best first step before borrowing a new topic book?",
      options: [
        "Read a short summary and check availability",
        "Ignore prerequisites",
        "Borrow random books only",
      ],
      correct: 0,
    });
  }

  return questions;
};

// GET /api/assistant/history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const session = await AssistantSession.findOne({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json({ messages: session?.messages.slice(-20) || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// POST /api/assistant/search-books
router.post("/search-books", authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    const books = await findBooksForQuery(query, 5);

    res.json({
      books: books.map((b) => ({
        id: b._id,
        title: b.title,
        author: b.author,
        available: b.availableCopies > 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
