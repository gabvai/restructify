import { apiClient } from "./client.js";

export const registerRequest = async ({ email, password, name, phone }) => {
  const response = await apiClient.post(
    "/auth/register",
    { email, password, name, phone },
    { auth: false }
  );

  return response.data;
};

export const loginRequest = async ({ email, password }) => {
  const response = await apiClient.post(
    "/auth/login",
    { email, password },
    { auth: false }
  );

  return response.data;
};
