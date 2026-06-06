const axios = require("axios");
const FormData = require("form-data");

const { httpError } = require("../utils/httpError");

const appendAnalysisQuery = (baseUrl, options = {}) => {
  const params = new URLSearchParams();

  const allowedKeys = [
    "debug",
    "material_confidence",
    "overlap_threshold",
    "min_material_area_fraction",
    "rust_min_area",
    "rust_full_penalty_percent",
    "bend_full_penalty_threshold"
  ];

  allowedKeys.forEach((key) => {
    const value = options[key];

    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `${baseUrl}/analyze?${query}` : `${baseUrl}/analyze`;
};

const analyzeImages = async (files, options = {}) => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";

  const form = new FormData();

  files.forEach((file) => {
    form.append("images", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });
  });

  try {
    const response = await axios.post(appendAnalysisQuery(aiServiceUrl, options), form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 180_000
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      const detail =
        error.response.data?.detail ||
        error.response.data?.message ||
        `AI service error (${error.response.status})`;
      const status = error.response.status >= 500 ? 502 : error.response.status;
      throw httpError(status, detail);
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      throw httpError(
        503,
        "AI servisas neveikia. Įdiekite Python, tada paleiskite: cd ai-service && pip install -r requirements.txt && uvicorn app:app --host 0.0.0.0 --port 8001"
      );
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      throw httpError(504, "AI servisas neatsakė laiku. Bandykite dar kartą.");
    }

    throw httpError(502, error.message || "AI analizės klaida");
  }
};

module.exports = {
  analyzeImages
};
