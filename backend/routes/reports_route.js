const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Book = require("../models/books");
const User = require("../models/users");
const BorrowRequest = require("../models/borrowRequest");
const Reservation = require("../models/reservation");
const Fine = require("../models/fine");
const Feedback = require("../models/feedback");

const isAdmin = (role) => role === "admin";
const isStaff = (role) => role === "admin" || role === "librarian";

const formatMonthLabel = (year, monthIndex) => {
  const date = new Date(year, monthIndex, 1);
  return date.toLocaleString("en-US", { month: "short" });
};

const buildMonthBuckets = (monthCount = 6) => {
  const now = new Date();
  const buckets = [];
  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      month: formatMonthLabel(d.getFullYear(), d.getMonth()),
    });
  }
  return buckets;
};

const getMonthKey = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const getDisplayName = (userDoc) => {
  if (!userDoc) return "Unknown";
  const fullName = [userDoc.firstName, userDoc.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || userDoc.username || userDoc.email || "Unknown";
};

const incrementCount = (target, key, by = 1) => {
  target[key] = (target[key] || 0) + by;
};

const getPeriodRange = (period) => {
  const now = new Date();
  if (period === "week") {
    return {
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      to: now,
    };
  }
  if (period === "month") {
    return {
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      to: now,
    };
  }
  if (period === "year") {
    return {
      from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      to: now,
    };
  }
  return null;
};

// Circulation and operations analytics for dashboards
router.get("/circulation-overview", auth, async (req, res) => {
  try {
    if (!isStaff(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Librarian or admin access required" });
    }

    const [books, users, borrowRequests, reservations, fines] =
      await Promise.all([
        Book.find({})
          .select("status categories totalCopies availableCopies createdAt")
          .lean(),
        User.find({})
          .select(
            "role departmentCode departmentName approvalStatus firstName lastName username email createdAt",
          )
          .lean(),
        BorrowRequest.find({})
          .select(
            "status requestedAt approvedAt returned returnedAt dueDate overdueDays fineAmount fineStatus processedBy renewalStatus renewalDecisionBy renewalDecisionAt",
          )
          .lean(),
        Reservation.find({})
          .select("status requestedAt fulfilledAt expiryDate")
          .lean(),
        Fine.find({})
          .select("status amount overdueDays approvedBy approvedAt createdAt")
          .lean(),
      ]);

    const now = new Date();
    const months = buildMonthBuckets(6);
    const monthSet = new Set(months.map((m) => m.key));

    const roleCounts = {
      student: 0,
      faculty: 0,
      external: 0,
      librarian: 0,
      admin: 0,
    };
    const studentApprovalStatus = {
      pending: 0,
      approved: 0,
      declined: 0,
    };
    const studentsByDepartment = {};
    const studentRegistrationByMonthCount = {};
    const librarianDirectory = [];
    const librarianActivityMap = {};

    users.forEach((user) => {
      if (roleCounts[user.role] !== undefined) {
        roleCounts[user.role] += 1;
      }

      if (user.role === "student") {
        const approval = user.approvalStatus || "pending";
        if (studentApprovalStatus[approval] !== undefined) {
          studentApprovalStatus[approval] += 1;
        }

        const department =
          user.departmentName || user.departmentCode || "Unassigned";
        incrementCount(studentsByDepartment, department);

        const monthKey = getMonthKey(user.createdAt);
        if (monthKey && monthSet.has(monthKey)) {
          incrementCount(studentRegistrationByMonthCount, monthKey);
        }
      }

      if (user.role === "librarian") {
        const librarian = {
          id: String(user._id),
          name: getDisplayName(user),
          email: user.email || "",
          joinedAt: user.createdAt,
        };
        librarianDirectory.push(librarian);
        librarianActivityMap[librarian.id] = {
          ...librarian,
          approvedLoans: 0,
          declinedRequests: 0,
          renewalsHandled: 0,
          finesApproved: 0,
          totalActions: 0,
        };
      }
    });

    const bookStatusCounts = {
      available: 0,
      reserved: 0,
      borrowed: 0,
      unavailable: 0,
    };
    const catalogByCategory = {};
    const catalogAddedByMonthCount = {};
    let totalCopies = 0;
    let availableCopies = 0;

    books.forEach((book) => {
      if (bookStatusCounts[book.status] !== undefined) {
        bookStatusCounts[book.status] += 1;
      }

      totalCopies += Number(book.totalCopies || 0);
      availableCopies += Number(book.availableCopies || 0);

      const categories = Array.isArray(book.categories) ? book.categories : [];
      if (categories.length === 0) {
        incrementCount(catalogByCategory, "Uncategorized");
      } else {
        categories.forEach((c) => {
          const value = String(c || "").trim() || "Uncategorized";
          incrementCount(catalogByCategory, value);
        });
      }

      const monthKey = getMonthKey(book.createdAt);
      if (monthKey && monthSet.has(monthKey)) {
        incrementCount(catalogAddedByMonthCount, monthKey);
      }
    });

    let activeLoans = 0;
    let returnedLoans = 0;
    let overdueLoans = 0;
    let pendingBorrowRequests = 0;
    let approvedBorrowRequests = 0;
    let declinedBorrowRequests = 0;
    let onTimeReturns = 0;
    let overdueReturns = 0;

    const circulationByMonthMap = {};
    months.forEach((m) => {
      circulationByMonthMap[m.key] = {
        key: m.key,
        month: m.month,
        approvedLoans: 0,
        returns: 0,
        reservations: 0,
        studentRegistrations: 0,
        finesCollectedAmount: 0,
        booksAdded: 0,
      };
    });

    borrowRequests.forEach((request) => {
      if (request.status === "pending") pendingBorrowRequests += 1;
      if (request.status === "declined") declinedBorrowRequests += 1;
      if (request.status === "approved") approvedBorrowRequests += 1;

      const isReturned = Boolean(request.returned);
      const dueDateValid =
        request.dueDate && !Number.isNaN(new Date(request.dueDate).getTime());
      const isOverdueActive =
        !isReturned &&
        request.status === "approved" &&
        dueDateValid &&
        new Date(request.dueDate) < now;

      if (request.status === "approved" && !isReturned) activeLoans += 1;
      if (isReturned) returnedLoans += 1;
      if (isOverdueActive) overdueLoans += 1;

      if (isReturned) {
        const overdueDays = Number(request.overdueDays || 0);
        if (overdueDays > 0) overdueReturns += 1;
        else onTimeReturns += 1;
      }

      const approvedMonthKey = getMonthKey(request.approvedAt);
      if (approvedMonthKey && circulationByMonthMap[approvedMonthKey]) {
        circulationByMonthMap[approvedMonthKey].approvedLoans += 1;
      }

      const returnedMonthKey = getMonthKey(request.returnedAt);
      if (returnedMonthKey && circulationByMonthMap[returnedMonthKey]) {
        circulationByMonthMap[returnedMonthKey].returns += 1;
      }

      const processorId = request.processedBy
        ? String(request.processedBy)
        : null;
      if (processorId && librarianActivityMap[processorId]) {
        if (request.status === "approved") {
          librarianActivityMap[processorId].approvedLoans += 1;
        } else if (request.status === "declined") {
          librarianActivityMap[processorId].declinedRequests += 1;
        }
      }

      const renewalProcessorId = request.renewalDecisionBy
        ? String(request.renewalDecisionBy)
        : null;
      if (
        renewalProcessorId &&
        librarianActivityMap[renewalProcessorId] &&
        ["approved", "declined"].includes(request.renewalStatus)
      ) {
        librarianActivityMap[renewalProcessorId].renewalsHandled += 1;
      }
    });

    let pendingReservations = 0;
    const reservationStatusCounts = {
      pending: 0,
      fulfilled: 0,
      expired: 0,
      cancelled: 0,
    };

    reservations.forEach((reservation) => {
      if (reservationStatusCounts[reservation.status] !== undefined) {
        reservationStatusCounts[reservation.status] += 1;
      }
      if (reservation.status === "pending") pendingReservations += 1;

      const monthKey = getMonthKey(reservation.requestedAt);
      if (monthKey && circulationByMonthMap[monthKey]) {
        circulationByMonthMap[monthKey].reservations += 1;
      }
    });

    let pendingFinePayments = 0;
    let paidFineCount = 0;
    let totalFinePendingAmount = 0;
    let totalFineCollectedAmount = 0;

    fines.forEach((fine) => {
      const amount = Number(fine.amount || 0);
      if (fine.status === "pending_payment") {
        pendingFinePayments += 1;
        totalFinePendingAmount += amount;
      }
      if (fine.status === "paid") {
        paidFineCount += 1;
        totalFineCollectedAmount += amount;
      }

      const fineApproverId = fine.approvedBy ? String(fine.approvedBy) : null;
      if (fineApproverId && librarianActivityMap[fineApproverId]) {
        librarianActivityMap[fineApproverId].finesApproved += 1;
      }

      const approvedMonthKey = getMonthKey(fine.approvedAt);
      if (approvedMonthKey && circulationByMonthMap[approvedMonthKey]) {
        circulationByMonthMap[approvedMonthKey].finesCollectedAmount += amount;
      }
    });

    months.forEach((m) => {
      circulationByMonthMap[m.key].studentRegistrations =
        studentRegistrationByMonthCount[m.key] || 0;
      circulationByMonthMap[m.key].booksAdded =
        catalogAddedByMonthCount[m.key] || 0;
    });

    const librarianActivity = Object.values(librarianActivityMap)
      .map((item) => ({
        ...item,
        totalActions:
          item.approvedLoans +
          item.declinedRequests +
          item.renewalsHandled +
          item.finesApproved,
      }))
      .sort((a, b) => b.totalActions - a.totalActions);

    const circulationByMonth = months.map((m) => circulationByMonthMap[m.key]);

    const librarianOverview = {
      summary: {
        totalCatalogBooks: books.length,
        totalCopies,
        availableCopies,
        borrowedCopies: Math.max(0, totalCopies - availableCopies),
        activeLoans,
        overdueLoans,
        returnedLoans,
        pendingBorrowRequests,
        approvedBorrowRequests,
        declinedBorrowRequests,
        pendingReservations,
        pendingFinePayments,
        totalFinePendingAmount,
        totalFineCollectedAmount,
        paidFineCount,
        onTimeReturns,
        overdueReturns,
      },
      catalogStatus: Object.entries(bookStatusCounts).map(
        ([status, count]) => ({
          status,
          count,
        }),
      ),
      catalogByCategory: Object.entries(catalogByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      reservationsByStatus: Object.entries(reservationStatusCounts).map(
        ([status, count]) => ({ status, count }),
      ),
      borrowRequestsByStatus: [
        { status: "pending", count: pendingBorrowRequests },
        { status: "approved", count: approvedBorrowRequests },
        { status: "declined", count: declinedBorrowRequests },
      ],
      finesByStatus: [
        { status: "pending_payment", count: pendingFinePayments },
        { status: "paid", count: paidFineCount },
      ],
      circulationByMonth,
      studentApprovals: studentApprovalStatus,
      studentsByDepartment: Object.entries(studentsByDepartment)
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };

    const response = {
      generatedAt: new Date().toISOString(),
      months: months.map((m) => ({ key: m.key, month: m.month })),
      role: req.user.role,
      librarian: librarianOverview,
    };

    if (isAdmin(req.user.role)) {
      response.admin = {
        summary: {
          totalUsers: users.length,
          totalStudents: roleCounts.student,
          totalLibrarians: roleCounts.librarian,
          totalBooks: books.length,
          activeLoans,
          overdueLoans,
          pendingBorrowRequests,
          pendingReservations,
          pendingFinePayments,
          totalFineCollectedAmount,
        },
        usersByRole: Object.entries(roleCounts).map(([role, count]) => ({
          role,
          count,
        })),
        studentsByDepartment: librarianOverview.studentsByDepartment,
        studentApprovalStatus,
        circulationByMonth,
        librarianDirectory,
        librarianActivity,
      };
    }

    res.json(response);
  } catch (error) {
    console.error("Error generating circulation overview:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Generate catalog report data
router.get("/catalog-report", auth, async (req, res) => {
  try {
    if (!isAdmin(req.user.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const period = String(req.query.period || "all"); // 'week', 'month', 'year', 'all'

    let dateFilter = {};
    const periodRange = getPeriodRange(period);
    if (periodRange) {
      dateFilter = {
        createdAt: { $gte: periodRange.from, $lte: periodRange.to },
      };
    }

    const books = await Book.find(dateFilter)
      .select(
        "title description isbn status publisher publicationYear createdAt",
      )
      .sort({ createdAt: -1 });

    const approvedBorrowFilter = { status: "approved" };
    if (periodRange) {
      approvedBorrowFilter.approvedAt = {
        $gte: periodRange.from,
        $lte: periodRange.to,
      };
    }

    const [
      approvedBorrows,
      librarians,
      feedbackDocs,
      feedbackSubjectStats,
      feedbackRatingStats,
      feedbackStatusStats,
    ] = await Promise.all([
      BorrowRequest.find(approvedBorrowFilter)
        .select("book processedBy approvedAt")
        .lean(),
      User.find({ role: "librarian" })
        .select("firstName lastName username email createdAt")
        .lean(),
      Feedback.find(periodRange ? dateFilter : {})
        .select("name email subject message rating status createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Feedback.aggregate([
        ...(periodRange ? [{ $match: dateFilter }] : []),
        { $group: { _id: "$subject", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Feedback.aggregate([
        ...(periodRange ? [{ $match: dateFilter }] : []),
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Feedback.aggregate([
        ...(periodRange ? [{ $match: dateFilter }] : []),
        {
          $group: {
            _id: { $ifNull: ["$status", "pending"] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const borrowCountByBook = {};
    const approvedByLibrarian = {};

    approvedBorrows.forEach((entry) => {
      if (entry.book) {
        const bookId = String(entry.book);
        incrementCount(borrowCountByBook, bookId);
      }
      if (entry.processedBy) {
        const librarianId = String(entry.processedBy);
        incrementCount(approvedByLibrarian, librarianId);
      }
    });

    const popularBookIds = Object.keys(borrowCountByBook)
      .sort((a, b) => borrowCountByBook[b] - borrowCountByBook[a])
      .slice(0, 10);

    const popularBookDocs = popularBookIds.length
      ? await Book.find({ _id: { $in: popularBookIds } })
          .select("title author isbn totalCopies availableCopies")
          .lean()
      : [];

    const popularBookMap = new Map(
      popularBookDocs.map((book) => [String(book._id), book]),
    );

    const popularBooks = popularBookIds.map((id, index) => {
      const book = popularBookMap.get(id);
      return {
        rank: index + 1,
        bookId: id,
        title: book?.title || "Unknown Book",
        author: book?.author || "Unknown Author",
        isbn: book?.isbn || "N/A",
        borrowCount: borrowCountByBook[id] || 0,
        totalCopies: Number(book?.totalCopies || 0),
        availableCopies: Number(book?.availableCopies || 0),
      };
    });

    const librarianRanking = librarians
      .map((librarian) => {
        const id = String(librarian._id);
        const approvedCount = Number(approvedByLibrarian[id] || 0);
        return {
          librarianId: id,
          name: getDisplayName(librarian),
          email: librarian.email || "",
          approvedCount,
          joinedAt: librarian.createdAt,
        };
      })
      .sort((a, b) => b.approvedCount - a.approvedCount)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    const normalizedFeedback = feedbackDocs.map((item) => ({
      id: String(item._id),
      name: item.name,
      email: item.email,
      subject: item.subject,
      message: item.message,
      rating: item.rating,
      status: item.status || "pending",
      createdAt: item.createdAt,
    }));

    const feedbackSummary = {
      total: normalizedFeedback.length,
      averageRating:
        normalizedFeedback.length > 0
          ? Number(
              (
                normalizedFeedback.reduce(
                  (sum, item) => sum + Number(item.rating || 0),
                  0,
                ) / normalizedFeedback.length
              ).toFixed(2),
            )
          : 0,
      statusBreakdown: feedbackStatusStats.map((entry) => ({
        status: entry._id,
        count: entry.count,
      })),
      subjectBreakdown: feedbackSubjectStats.map((entry) => ({
        subject: entry._id,
        count: entry.count,
      })),
      ratingBreakdown: feedbackRatingStats.map((entry) => ({
        rating: Number(entry._id),
        count: entry.count,
      })),
    };

    res.json({
      period: period || "all",
      generatedAt: new Date().toISOString(),
      totalBooks: books.length,
      books: books.map((b) => ({
        title: b.title,
        description: b.description ? b.description.substring(0, 100) : "",
        isbn: b.isbn || "N/A",
        status: b.status,
        publisher: b.publisher || "N/A",
        year: b.publicationYear || "N/A",
        addedOn: b.createdAt,
      })),
      popularBooks,
      librarianRanking,
      feedbackSummary,
      feedbacks: normalizedFeedback,
    });
  } catch (error) {
    console.error("Error generating catalog report:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
