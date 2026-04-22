const { pool } = require("../db");
const { httpError } = require("../utils/httpError");

const beamSelectColumns = `
  c.id AS construction_id,
  c.user_id,
  c.type,
  c.title,
  c.description,
  c.status,
  c.reviewed_by,
  c.reviewed_at,
  c.review_comment,
  c.created_at,
  c.updated_at,
  b.id AS beam_id,
  b.beam_name,
  b.beam_type,
  b.profile_name,
  b.length_mm,
  b.weight_kg,
  b.height_mm,
  b.width_mm,
  b.web_thickness_mm,
  b.flange_thickness_mm,
  b.steel_grade,
  b.surface_coating,
  b.condition,
  b.defects,
  b.usage_history,
  b.drawings,
  b.quantity,
  b.location,
  b.price_eur
`;

const toMergedBeam = (row) => ({
  id: row.beam_id,
  construction_id: row.construction_id,
  user_id: row.user_id,
  type: row.type,
  title: row.title,
  description: row.description,
  status: row.status,
  reviewed_by: row.reviewed_by,
  reviewed_at: row.reviewed_at,
  review_comment: row.review_comment,
  created_at: row.created_at,
  updated_at: row.updated_at,
  beam_name: row.beam_name,
  beam_type: row.beam_type,
  profile_name: row.profile_name,
  length_mm: row.length_mm,
  weight_kg: row.weight_kg,
  height_mm: row.height_mm,
  width_mm: row.width_mm,
  web_thickness_mm: row.web_thickness_mm,
  flange_thickness_mm: row.flange_thickness_mm,
  steel_grade: row.steel_grade,
  surface_coating: row.surface_coating,
  condition: row.condition,
  defects: row.defects,
  usage_history: row.usage_history,
  drawings: row.drawings,
  quantity: row.quantity,
  location: row.location,
  price_eur: row.price_eur
});

const isAdmin = (user) => user.role === "admin";
const isSpecialist = (user) => user.role === "specialist";

const assertCanMutate = (authUser, ownerId) => {
  if (isAdmin(authUser)) {
    return;
  }

  if (isSpecialist(authUser)) {
    throw httpError(403, "Specialist role cannot modify beam listings");
  }

  if (Number(authUser.id) !== Number(ownerId)) {
    throw httpError(403, "You can only modify your own beam listings");
  }
};

const getBeamByIdForAuth = async (beamId) => {
  const result = await pool.query(
    `
      SELECT ${beamSelectColumns}
      FROM beams b
      INNER JOIN constructions c ON c.id = b.construction_id
      WHERE b.id = $1
      LIMIT 1
    `,
    [beamId]
  );

  if (result.rowCount === 0) {
    throw httpError(404, "Beam not found");
  }

  return result.rows[0];
};

const createBeam = async (authUser, payload) => {
  if (!authUser) {
    throw httpError(401, "Authentication required");
  }

  if (isSpecialist(authUser)) {
    throw httpError(403, "Specialist role cannot create beam listings");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const constructionInsert = await client.query(
      `
        INSERT INTO constructions (
          user_id, type, title, description, status, reviewed_by, reviewed_at, review_comment
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        authUser.id,
        payload.type,
        payload.title,
        payload.description || null,
        payload.status || "draft",
        payload.reviewed_by || null,
        payload.reviewed_at || null,
        payload.review_comment || null
      ]
    );

    const constructionId = constructionInsert.rows[0].id;

    const beamInsert = await client.query(
      `
        INSERT INTO beams (
          construction_id, beam_name, beam_type, profile_name, length_mm, weight_kg,
          height_mm, width_mm, web_thickness_mm, flange_thickness_mm, steel_grade,
          surface_coating, condition, defects, usage_history, drawings, quantity, location, price_eur
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18, $19
        )
        RETURNING id
      `,
      [
        constructionId,
        payload.beam_name,
        payload.beam_type,
        payload.profile_name || null,
        payload.length_mm || null,
        payload.weight_kg || null,
        payload.height_mm || null,
        payload.width_mm || null,
        payload.web_thickness_mm || null,
        payload.flange_thickness_mm || null,
        payload.steel_grade || null,
        payload.surface_coating || null,
        payload.condition || null,
        payload.defects || null,
        payload.usage_history || null,
        payload.drawings || null,
        payload.quantity || null,
        payload.location || null,
        payload.price_eur || null
      ]
    );

    const beamId = beamInsert.rows[0].id;

    const mergedResult = await client.query(
      `
        SELECT ${beamSelectColumns}
        FROM beams b
        INNER JOIN constructions c ON c.id = b.construction_id
        WHERE b.id = $1
        LIMIT 1
      `,
      [beamId]
    );

    await client.query("COMMIT");
    return toMergedBeam(mergedResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const listBeams = async (authUser) => {
  if (!authUser) {
    throw httpError(401, "Authentication required");
  }

  const queryBase = `
    SELECT ${beamSelectColumns}
    FROM beams b
    INNER JOIN constructions c ON c.id = b.construction_id
  `;

  const result = isAdmin(authUser)
    ? await pool.query(`${queryBase} ORDER BY b.id DESC`)
    : await pool.query(`${queryBase} WHERE c.user_id = $1 ORDER BY b.id DESC`, [authUser.id]);

  return result.rows.map(toMergedBeam);
};

const getBeamById = async (authUser, beamId) => {
  if (!authUser) {
    throw httpError(401, "Authentication required");
  }

  const row = await getBeamByIdForAuth(beamId);

  if (!isAdmin(authUser) && Number(row.user_id) !== Number(authUser.id)) {
    throw httpError(403, "You can only view your own beam listings");
  }

  return toMergedBeam(row);
};

const updateBeam = async (authUser, beamId, payload) => {
  if (!authUser) {
    throw httpError(401, "Authentication required");
  }

  const existing = await getBeamByIdForAuth(beamId);
  assertCanMutate(authUser, existing.user_id);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE constructions
        SET
          type = $1,
          title = $2,
          description = $3,
          status = $4,
          reviewed_by = $5,
          reviewed_at = $6,
          review_comment = $7,
          updated_at = NOW()
        WHERE id = $8
      `,
      [
        payload.type,
        payload.title,
        payload.description || null,
        payload.status || existing.status,
        payload.reviewed_by || null,
        payload.reviewed_at || null,
        payload.review_comment || null,
        existing.construction_id
      ]
    );

    await client.query(
      `
        UPDATE beams
        SET
          beam_name = $1,
          beam_type = $2,
          profile_name = $3,
          length_mm = $4,
          weight_kg = $5,
          height_mm = $6,
          width_mm = $7,
          web_thickness_mm = $8,
          flange_thickness_mm = $9,
          steel_grade = $10,
          surface_coating = $11,
          condition = $12,
          defects = $13,
          usage_history = $14,
          drawings = $15,
          quantity = $16,
          location = $17,
          price_eur = $18
        WHERE id = $19
      `,
      [
        payload.beam_name,
        payload.beam_type,
        payload.profile_name || null,
        payload.length_mm || null,
        payload.weight_kg || null,
        payload.height_mm || null,
        payload.width_mm || null,
        payload.web_thickness_mm || null,
        payload.flange_thickness_mm || null,
        payload.steel_grade || null,
        payload.surface_coating || null,
        payload.condition || null,
        payload.defects || null,
        payload.usage_history || null,
        payload.drawings || null,
        payload.quantity || null,
        payload.location || null,
        payload.price_eur || null,
        existing.beam_id
      ]
    );

    const updatedResult = await client.query(
      `
        SELECT ${beamSelectColumns}
        FROM beams b
        INNER JOIN constructions c ON c.id = b.construction_id
        WHERE b.id = $1
        LIMIT 1
      `,
      [existing.beam_id]
    );

    await client.query("COMMIT");
    return toMergedBeam(updatedResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteBeam = async (authUser, beamId) => {
  if (!authUser) {
    throw httpError(401, "Authentication required");
  }

  const existing = await getBeamByIdForAuth(beamId);
  assertCanMutate(authUser, existing.user_id);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM beams WHERE id = $1", [existing.beam_id]);
    await client.query("DELETE FROM constructions WHERE id = $1", [existing.construction_id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return {
    deleted: true,
    beam_id: existing.beam_id,
    construction_id: existing.construction_id
  };
};

module.exports = {
  createBeam,
  listBeams,
  getBeamById,
  updateBeam,
  deleteBeam
};
