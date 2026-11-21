import db from "../database/database.js";

export const updateArchivedStatus = async () => {
  try {
    const [eventArchiveResult] = await db.execute(`
      UPDATE event
      SET status = 'archived'
      WHERE LOWER(COALESCE(approval_status, '')) = 'approved'
        AND LOWER(COALESCE(status, '')) != 'archived'
        AND COALESCE(end_date, event_date) < CURDATE()
    `);

    await db.execute(`
      UPDATE event
      SET status = CASE
        WHEN COALESCE(start_date, event_date) <= CURDATE() THEN 'ongoing'
        ELSE 'upcoming'
      END
      WHERE LOWER(COALESCE(approval_status, '')) = 'approved'
        AND LOWER(COALESCE(status, '')) != 'archived'
        AND COALESCE(end_date, event_date) >= CURDATE()
    `);

    const [announcementResult] = await db.execute(`
      UPDATE announcement
      SET status = 'archived'
      WHERE LOWER(COALESCE(status, '')) != 'archived'
        AND (approval_status IS NULL OR LOWER(approval_status) = 'approved')
        AND expiration_days IS NOT NULL
        AND DATE_ADD(created_at, INTERVAL expiration_days DAY) < CURDATE()
    `);

    return {
      eventsArchived: eventArchiveResult.affectedRows,
      announcementsArchived: announcementResult.affectedRows,
    };
  } catch (err) {
    console.error("Error updating archive:", err);
    throw err;
  }
};
