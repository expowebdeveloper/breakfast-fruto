import axios from "axios";
import Cookies from "js-cookie";
import { persistor } from "@/Redux/store";

export const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

export const authAxios = axios.create({
  baseURL: baseURL,
  headers: {
    "content-type": "application/json",
  },
});

const MULTIPART = "multipart";

const createAuthorizedInstance = (type) => {
  const APIAxios = axios.create({
    baseURL: baseURL,
  });

  APIAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
      ? `Bearer ${localStorage.getItem("token")}`
      : "Token";
    config.headers["content-type"] =
      type === MULTIPART ? "multipart/form-data" : "application/json";
    config.headers["Authorization"] = token;

    return config;
  });

  APIAxios.interceptors.response.use(
    (response) => {
      return response;
    },
    function (error) {
      console.log(error, "this issssssss");
      if (error?.response?.data?.code === "token_not_valid") {
        localStorage.clear();
        Cookies.remove("token");
        sessionStorage.removeItem("welcome-modal-shown");
        // Clear persisted Redux state
        persistor.purge();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return APIAxios;
};

export const authorizeAxios = createAuthorizedInstance();
export const authorizeFileInstance = createAuthorizedInstance(MULTIPART);
