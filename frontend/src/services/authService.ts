import { apiFetch } from "@/utils/fetcher";

export const registerUser = async (data: any) => {
  return apiFetch("/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const loginUser = async (data: any) => {
  return apiFetch("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
};