import { apiClient } from "./client.js";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl.js";

const normalizeBeam = (beam) => {
  if (!beam || typeof beam !== "object") {
    return beam;
  }

  return {
    ...beam,
    image_src: toAbsoluteMediaUrl(beam.image_src),
    drawings: toAbsoluteMediaUrl(beam.drawings),
    certificate_src: toAbsoluteMediaUrl(beam.certificate_src)
  };
};

export const listBeamsRequest = async () => {
  const response = await apiClient.get("/beams");
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map(normalizeBeam);
};

export const listAllBeamsRequest = async () => {
  const response = await apiClient.get("/beams/all");
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map(normalizeBeam);
};

export const listSellerBeamsRequest = async (sellerId) => {
  const response = await apiClient.get(`/beams/seller/${sellerId}`);
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map(normalizeBeam);
};

export const createBeamRequest = async (beamPayload) => {
  const response = await apiClient.post("/beams", {
    type: "beam",
    ...beamPayload
  });

  return normalizeBeam(response.data);
};

export const getBeamPublicRequest = async (beamId) => {
  const response = await apiClient.get(`/beams/all/${beamId}`);
  return normalizeBeam(response.data);
};

export const getBeamRequest = async (beamId) => {
  const response = await apiClient.get(`/beams/${beamId}`);
  return normalizeBeam(response.data);
};

export const updateBeamRequest = async (beamId, beamPayload) => {
  const response = await apiClient.put(`/beams/${beamId}`, {
    type: "beam",
    ...beamPayload
  });

  return normalizeBeam(response.data);
};

export const deleteBeamRequest = async (beamId) => {
  await apiClient.delete(`/beams/${beamId}`);
};
