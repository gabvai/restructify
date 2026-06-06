import { API_BASE_URL } from "../api/client.js";

/**
 * Turns stored paths like /uploads/listing-images/foo.jpg into absolute URLs
 * on the API host. Relative paths load from the Vite origin and break after reload.
 */
export const toAbsoluteMediaUrl = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const base = typeof API_BASE_URL === "string" ? API_BASE_URL.replace(/\/$/, "") : "";
  if (!base) {
    if (import.meta.env.DEV) {
      console.warn(
        "[mediaUrl] VITE_API_URL is not set — listing images will not load. Add VITE_API_URL=http://localhost:4000 to frontend/.env"
      );
    }
    return trimmed;
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
};
