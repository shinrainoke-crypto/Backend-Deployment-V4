import db from "../database/database.js";
import { sendEmail } from "../utils/mailer.js";

export const approveOrganizer = async (req, res) => {
  const { user_id } = req.body;

  try {
    // Get pending user
    const [results] = await db.query(
      "SELECT firstname, email FROM user WHERE user_id = ? AND status = 'Pending'",
      [user_id]
    );

    if (results.length === 0)
      return res.status(404).json({ msg: "Pending user not found" });

    const user = results[0];

    // Update status and role
    await db.query(
      `UPDATE user
       SET status = 'Active', role_id = 2
       WHERE user_id = ?`,
      [user_id]
    );

    // Send approval email
    try {
      const emailResult = await sendEmail(
        user.email,
        "Your Organizer Application is Approved!",
        `<h1>Hi ${user.firstname}!</h1>
         <p>Congratulations! Your application to become an Organizer has been approved.</p>
         <p>You now have full access to Organizer features.</p>`
      );
      
      if (emailResult.success) {
        console.log("✅ Approval email sent to:", user.email);
      } else {
        console.warn("⚠️ Approval email failed:", emailResult);
      }
    } catch (err) {
      console.error("❌ Failed to send approval email:", err);
    }

    return res.json({ msg: "User approved and notified successfully." });
  } catch (err) {
    console.error("Admin approval error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const rejectOrganizer = async (req, res) => {
  const user_id = req.body?.user_id;

  if (!user_id) {
    return res.status(400).json({ msg: "User ID is required" });
  }

  try {
    const [results] = await db.query(
      "SELECT firstname, email FROM user WHERE user_id = ? AND status = 'Pending' AND role_id IS NULL",
      [user_id]
    );

    if (results.length === 0) {
      return res.status(404).json({ msg: "Pending organizer request not found" });
    }

    const user = results[0];
    const [updateResult] = await db.query(
      `UPDATE user
       SET status = 'Rejected'
       WHERE user_id = ? AND status = 'Pending' AND role_id IS NULL`,
      [user_id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(409).json({ msg: "Organizer request is no longer pending" });
    }

    let emailSent = false;
    try {
      const emailResult = await sendEmail(
        user.email,
        "Your Organizer Application Update",
        `<h1>Organizer application update</h1>
         <p>Your request to become an organizer was not approved at this time.</p>
         <p>If you have questions, please contact the site administrators.</p>`
      );
      emailSent = emailResult.success;

      if (!emailSent) {
        console.error("Organizer rejection email failed:", emailResult.message);
      }
    } catch (emailError) {
      console.error("Failed to send organizer rejection email:", emailError);
    }

    return res.json({
      msg: emailSent
        ? "Organizer request rejected and applicant notified."
        : "Organizer request rejected, but the notification email could not be sent.",
      emailSent,
    });
  } catch (err) {
    console.error("Admin organizer rejection error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
