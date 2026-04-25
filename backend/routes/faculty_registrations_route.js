const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/users");
const Notification = require("../models/notification");

const canManageStudentRegistrations = (role) =>
  ["faculty", "admin"].includes(role);

const getActorDepartmentCode = async (req) => {
  if (req.user.role === "admin") return undefined;
  const actor = await User.findById(req.user.userId).select("departmentCode");
  return actor?.departmentCode;
};

const getStudentFilter = async (req) => {
  const baseFilter = {
    role: "student",
    approvalStatus: "pending",
  };

  if (req.user.role === "admin") {
    return baseFilter;
  }

  const departmentCode = await getActorDepartmentCode(req);
  if (!departmentCode) return null;

  return {
    ...baseFilter,
    departmentCode,
  };
};

router.get("/pending-students", auth, async (req, res) => {
  try {
    if (!canManageStudentRegistrations(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const filter = await getStudentFilter(req);
    if (!filter) {
      return res
        .status(400)
        .json({ message: "Faculty profile is missing department mapping" });
    }

    const students = await User.find(filter)
      .select(
        "username email firstName lastName enrollmentNo departmentCode departmentName createdAt approvalStatus",
      )
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    console.error("Error fetching pending students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/students/:id/approve", auth, async (req, res) => {
  try {
    if (!canManageStudentRegistrations(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await User.findById(req.params.id);
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.approvalStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "Student registration is not pending" });
    }

    if (req.user.role === "faculty") {
      const actorDepartmentCode = await getActorDepartmentCode(req);
      if (
        !actorDepartmentCode ||
        actorDepartmentCode !== student.departmentCode
      ) {
        return res
          .status(403)
          .json({
            message: "You can only approve students from your department",
          });
      }
    }

    const comment =
      typeof req.body?.comment === "string" ? req.body.comment.trim() : "";

    student.approvalStatus = "approved";
    student.approvedBy = req.user.userId;
    student.approvedAt = new Date();
    student.approvalComment = comment || undefined;
    await student.save();

    await Notification.create({
      user: student._id,
      title: "Student registration approved",
      message: "Your student account is approved. You can now log in.",
      type: "student_registration_approved",
      relatedId: student._id,
      actionLink: "/login",
    });

    res.json({
      message: "Student approved successfully",
      student: {
        id: student._id,
        username: student.username,
        approvalStatus: student.approvalStatus,
      },
    });
  } catch (error) {
    console.error("Error approving student:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/students/:id/decline", auth, async (req, res) => {
  try {
    if (!canManageStudentRegistrations(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await User.findById(req.params.id);
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.approvalStatus !== "pending") {
      return res
        .status(400)
        .json({ message: "Student registration is not pending" });
    }

    if (req.user.role === "faculty") {
      const actorDepartmentCode = await getActorDepartmentCode(req);
      if (
        !actorDepartmentCode ||
        actorDepartmentCode !== student.departmentCode
      ) {
        return res
          .status(403)
          .json({
            message: "You can only decline students from your department",
          });
      }
    }

    const comment =
      typeof req.body?.comment === "string" ? req.body.comment.trim() : "";

    student.approvalStatus = "declined";
    student.approvedBy = req.user.userId;
    student.approvedAt = new Date();
    student.approvalComment = comment || "Registration declined by faculty";
    await student.save();

    await Notification.create({
      user: student._id,
      title: "Student registration declined",
      message:
        student.approvalComment || "Your registration was declined by faculty.",
      type: "student_registration_declined",
      relatedId: student._id,
      actionLink: "/register",
    });

    res.json({
      message: "Student declined successfully",
      student: {
        id: student._id,
        username: student.username,
        approvalStatus: student.approvalStatus,
      },
    });
  } catch (error) {
    console.error("Error declining student:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
