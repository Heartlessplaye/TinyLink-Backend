import HttpStatusCodes from "../constants/httpCodes.js";
import { pool } from "../utils/dbConnection.js";
import AppError from "../utils/errorHandler.js";

export async function addLink(shortCode, originalUrl) {
  const q = `
    INSERT INTO links (code, url)
    VALUES ($1, $2)
    RETURNING *;
  `;

  try {
    const result = await pool.query(q, [shortCode, originalUrl]);
    return result.rows[0];
  } catch (err) {
    if (err.code == "23505") {
      throw new AppError(HttpStatusCodes.CONFLICT, "Duplicate Code");
    } else {
      throw new AppError(
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        "Database Connection Error"
      );
    }
  }
}

export async function getLinkByCode(shortCode) {
  const q = `
    SELECT * FROM links WHERE code = $1;
  `;

  const result = await pool.query(q, [shortCode]);
  return result.rows[0] || null;
}

export async function incrementClicks(shortCode) {
  const q = `
      UPDATE links
SET 
  total_clicks = total_clicks + 1,
  last_clicked_at = NOW()
WHERE code = $1
RETURNING *;
    `;

  const result = await pool.query(q, [shortCode]);
  return result.rows[0] || null;
}

export async function deleteLink(shortCode) {
  const q = `
      DELETE FROM links WHERE code = $1 RETURNING *;
    `;
  const result = await pool.query(q, [shortCode]);
  return result.rows[0] || null;
}

export async function listLinks(search = "") {
  const q = `
    SELECT *
    FROM links
    WHERE code ILIKE $1 OR url ILIKE $1
    ORDER BY created_at DESC;
  `;
  const result = await pool.query(q, [`%${search}%`]);
  return result.rows;
}
