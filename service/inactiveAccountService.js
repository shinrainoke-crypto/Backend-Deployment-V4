import db from "../database/database.js";

export const deactivateInactiveAccounts = async () => {
  const [result] = await db.query(`
    UPDATE user
    SET status = 'Inactive'
    WHERE LOWER(status) = 'active'
      AND last_active IS NOT NULL
      AND last_active <= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `);

  return result.affectedRows;
};
