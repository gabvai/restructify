import { API_BASE_URL } from "./client.js";
import { getStoredToken } from "../utils/storage.js";

export const uploadDrawingPdfRequest = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const headers = {};
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/uploads/drawings`, {
    method: "POST",
    headers,
    body: formData
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message =
      (payload && (payload.message || payload.error)) ||
      `Įkėlimas nepavyko (${response.status})`;
    throw new Error(message);
  }

  return payload.data;
};

export const uploadListingPhotoRequest = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const headers = {};
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/uploads/photos`, {
    method: "POST",
    headers,
    body: formData
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message =
      (payload && (payload.message || payload.error)) ||
      `Įkėlimas nepavyko (${response.status})`;
    throw new Error(message);
  }

  return payload.data;
};
