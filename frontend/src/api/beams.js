import { apiClient } from "./client.js";

export const listBeamsRequest = async () => {
  const response = await apiClient.get("/beams");
  return response.data;
};

export const createBeamRequest = async (beamPayload) => {
  const response = await apiClient.post("/beams", {
    type: "beam",
    ...beamPayload
  });

  return response.data;
};
