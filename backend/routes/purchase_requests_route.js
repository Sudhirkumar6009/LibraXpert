const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const PurchaseRequest = require("../models/purchaseRequest");
const OwnedBook = require("../models/ownedBook");
const Book = require("../models/books");
const User = require("../models/users");
const Notification = require("../models/notification");

const isLibrarian = (role) => ["librarian", "admin"].includes(role);

const getRequesterName = (requester) => {
  if (!requester) return "A user";
  const full = [requester.firstName, requester.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    full ||
    requester.enrollmentNo ||
    requester.username ||
    requester.email ||
    "A user"
  );
};

router.post("/", auth, async (req, res) => {
  try {
    const { title, author, isbn, reason } = req.body || {};

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const created = await PurchaseRequest.create({
      title,
      author: author || "",
      isbn: isbn || "",
      reason: reason || "",
      requestedBy: req.user.userId,
      status: "pending",
    });

    const requester = await User.findById(req.user.userId).select(
      "username email firstName lastName enrollmentNo",
    );
    const requesterName = getRequesterName(requester);

    const librarians = await User.find({
      role: { $in: ["librarian", "admin"] },
    }).select("_id");
    if (librarians.length) {
      await Notification.insertMany(
        librarians.map((librarian) => ({
          user: librarian._id,
          title: "New purchase request",
          message: `${requesterName} requested purchase for "${title}"`,
          type: "purchase_request",
          relatedId: created._id,
          actionLink: "/management/purchase-requests",
        })),
      );
    }

    res
      .status(201)
      .json({ message: "Purchase request created", request: created });
  } catch (error) {
    console.error("Error creating purchase request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/my-requests", auth, async (req, res) => {
  try {
    const requests = await PurchaseRequest.find({
      requestedBy: req.user.userId,
    })
      .populate("linkedBook", "title author coverImage")
      .populate("ownedBook")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching my purchase requests:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/manage", auth, async (req, res) => {
  try {
    if (!isLibrarian(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const requests = await PurchaseRequest.find()
      .populate("requestedBy", "username firstName lastName email enrollmentNo")
      .populate("linkedBook", "title author coverImage")
      .populate("ownedBook")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching managed purchase requests:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/approve", auth, async (req, res) => {
  try {
    if (!isLibrarian(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const requestDoc = await PurchaseRequest.findById(req.params.id);
    if (!requestDoc) {
      return res.status(404).json({ message: "Purchase request not found" });
    }

    if (requestDoc.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be approved" });
    }

    const { adminNote } = req.body || {};

    requestDoc.status = "approved";
    requestDoc.adminNote = adminNote || requestDoc.adminNote;
    requestDoc.processedBy = req.user.userId;
    requestDoc.approvedAt = new Date();
    await requestDoc.save();

    await Notification.create({
      user: requestDoc.requestedBy,
      title: "Purchase request approved",
      message: `Your purchase request for "${requestDoc.title}" is approved. Complete offline payment and ask librarian to mark it paid.`,
      type: "purchase_request_approved",
      relatedId: requestDoc._id,
      actionLink: "/purchase-requests",
    });

    res.json({ message: "Purchase request approved", request: requestDoc });
  } catch (error) {
    console.error("Error approving purchase request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/reject", auth, async (req, res) => {
  try {
    if (!isLibrarian(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const requestDoc = await PurchaseRequest.findById(req.params.id);
    if (!requestDoc) {
      return res.status(404).json({ message: "Purchase request not found" });
    }

    if (requestDoc.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be rejected" });
    }

    const { adminNote } = req.body || {};

    requestDoc.status = "rejected";
    requestDoc.adminNote = adminNote || requestDoc.adminNote;
    requestDoc.processedBy = req.user.userId;
    requestDoc.rejectedAt = new Date();
    await requestDoc.save();

    await Notification.create({
      user: requestDoc.requestedBy,
      title: "Purchase request rejected",
      message: `Your purchase request for "${requestDoc.title}" was rejected.${requestDoc.adminNote ? ` Note: ${requestDoc.adminNote}` : ""}`,
      type: "purchase_request_rejected",
      relatedId: requestDoc._id,
      actionLink: "/purchase-requests",
    });

    res.json({ message: "Purchase request rejected", request: requestDoc });
  } catch (error) {
    console.error("Error rejecting purchase request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/mark-paid", auth, async (req, res) => {
  try {
    if (!isLibrarian(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const requestDoc = await PurchaseRequest.findById(req.params.id);
    if (!requestDoc) {
      return res.status(404).json({ message: "Purchase request not found" });
    }

    if (requestDoc.status !== "approved") {
      return res
        .status(400)
        .json({
          message: "Only approved requests can be marked as payment success",
        });
    }

    const { linkedBookId, note } = req.body || {};

    let linkedBook = null;
    if (linkedBookId) {
      linkedBook = await Book.findById(linkedBookId);
      if (!linkedBook) {
        return res.status(404).json({ message: "Linked book not found" });
      }
    }

    const ownershipPayload = {
      user: requestDoc.requestedBy,
      purchaseRequest: requestDoc._id,
      book: linkedBook ? linkedBook._id : undefined,
      title: linkedBook ? linkedBook.title : requestDoc.title,
      author: linkedBook ? linkedBook.author : requestDoc.author,
      isbn: requestDoc.isbn,
      paymentApprovedBy: req.user.userId,
      paymentApprovedAt: new Date(),
      note: note || undefined,
    };

    const ownedBook = await OwnedBook.findOneAndUpdate(
      { purchaseRequest: requestDoc._id },
      ownershipPayload,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    requestDoc.status = "purchased";
    requestDoc.processedBy = req.user.userId;
    requestDoc.purchasedAt = new Date();
    requestDoc.linkedBook = linkedBook ? linkedBook._id : requestDoc.linkedBook;
    requestDoc.ownedBook = ownedBook._id;
    await requestDoc.save();

    await Notification.create({
      user: requestDoc.requestedBy,
      title: "Purchase completed",
      message: `Offline payment for "${requestDoc.title}" is verified. This book is now in your owned books section.`,
      type: "purchase_request_paid",
      relatedId: requestDoc._id,
      actionLink: "/profile",
    });

    res.json({
      message: "Payment approved and ownership assigned",
      request: requestDoc,
      ownedBook,
    });
  } catch (error) {
    console.error("Error marking purchase as paid:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
