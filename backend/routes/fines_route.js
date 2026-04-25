const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Fine = require("../models/fine");
const BorrowRequest = require("../models/borrowRequest");
const Notification = require("../models/notification");

const isLibrarian = (role) => ["librarian", "admin"].includes(role);

router.get("/my-fines", auth, async (req, res) => {
  try {
    const fines = await Fine.find({ user: req.user.userId })
      .populate("book", "title author coverImage")
      .sort({ createdAt: -1 });

    res.json(fines);
  } catch (error) {
    console.error("Error fetching my fines:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/pending-payments", auth, async (req, res) => {
  try {
    if (!isLibrarian(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const fines = await Fine.find({ status: "pending_payment" })
      .populate("book", "title author coverImage")
      .populate("user", "username firstName lastName email enrollmentNo")
      .sort({ createdAt: 1 });

    res.json(fines);
  } catch (error) {
    console.error("Error fetching pending fine payments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/approve-payment", auth, async (req, res) => {
  try {
    if (!isLibrarian(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const fine = await Fine.findById(req.params.id);
    if (!fine) {
      return res.status(404).json({ message: "Fine not found" });
    }

    if (fine.status !== "pending_payment") {
      return res
        .status(400)
        .json({ message: "Fine payment is already processed" });
    }

    const { note } = req.body || {};

    fine.status = "paid";
    fine.note = note || fine.note;
    fine.approvedBy = req.user.userId;
    fine.approvedAt = new Date();
    await fine.save();

    await BorrowRequest.findByIdAndUpdate(fine.borrowRequest, {
      fineStatus: "paid",
      fineApprovedBy: req.user.userId,
      fineApprovedAt: new Date(),
    });

    await Notification.create({
      user: fine.user,
      title: "Fine payment approved",
      message: `Your offline payment of Rs. ${fine.amount} has been approved by librarian.`,
      type: "fine_paid",
      relatedId: fine._id,
      actionLink: "/loans",
    });

    res.json({ message: "Fine payment approved", fine });
  } catch (error) {
    console.error("Error approving fine payment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
