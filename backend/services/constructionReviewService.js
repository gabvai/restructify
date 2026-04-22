const { pool } = require("../db");
const { httpError } = require("../utils/httpError");

const ALLOWED_REVIEW_STATUSES = ["approved", "rejected"];

const toConstructionReviewDto = (row) => ({
  id: row.id,
  user_id: row.user_id,
  type: row.type,
  title: row.title,
  description: row.description,
  status: row.status,
  reviewed_by: row.reviewed_by,
  reviewed_at: row.reviewed_at,
  review_comment: row.review_comment,
  created_at: row.created_at,
  updated_at: row.updated_at
});

const listPendingConstructions = async () => {
  const result = await pool.query(
    `
      SELECT
        id, user_id, type, title, description, status,
        reviewed_by, reviewed_at, review_comment, created_at, updated_at
      FROM constructions
      WHERE status = 'pending_review'
      ORDER BY created_at ASC
    `
  );

  return result.rows.map(toConstructionReviewDto);
};

const reviewConstruction = async (constructionId, reviewerId, payload) => {
  if (!ALLOWED_REVIEW_STATUSES.includes(payload.status)) {
    throw httpError(400, "status must be either approved or rejected");
  }

  const result = await pool.query(
    `
      UPDATE constructions
      SET
        status = $1,
        review_comment = $2,
        reviewed_by = $3,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $4
      RETURNING
        id, user_id, type, title, description, status,
        reviewed_by, reviewed_at, review_comment, created_at, updated_at
    `,
    [payload.status, payload.review_comment || null, reviewerId, constructionId]
  );

  if (result.rowCount === 0) {
    throw httpError(404, "Construction not found");
  }

  return toConstructionReviewDto(result.rows[0]);
};

module.exports = {
  listPendingConstructions,
  reviewConstruction
};
