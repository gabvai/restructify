import { API_BASE_URL } from "./client.js";
import { getStoredToken } from "../utils/storage.js";

const buildQuery = (options = {}) => {
  const params = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

const parseResponseSafely = async (response) => {
  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(
        `Server returned a non-JSON response. Status: ${response.status}. Response: ${text.slice(0, 200)}`
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        payload?.detail ||
        text ||
        `Image analysis failed with status ${response.status}`
    );
  }

  return payload;
};

export const analyzeImagesRequest = async (files, options = {}) => {
  const fileArray = Array.from(files || []);

  if (fileArray.length > 5) {
    throw new Error("Galima įkelti daugiausiai 5 nuotraukas vienu metu.");
  }

  const formData = new FormData();

  fileArray.forEach((file) => {
    formData.append("images", file);
  });

  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}/ai/analyze${buildQuery(options)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const payload = await parseResponseSafely(response);

  return payload.data;
};
