import { API_BASE_URL } from "./client.js";
import { getStoredToken } from "../utils/storage.js";

export const analyzeImagesRequest = async (files) => {
  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append("images", file);
  });

  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Image analysis failed");
  }

  return payload.data;
};