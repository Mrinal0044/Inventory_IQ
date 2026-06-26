import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
});

export const getActiveFile = () => {
  return localStorage.getItem("active_file_path") || "";
};

export const setActiveFile = (filePath) => {
  if (filePath) {
    localStorage.setItem("active_file_path", filePath);
  } else {
    localStorage.removeItem("active_file_path");
  }
};

export const uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

export const getProfile = async (filePath = getActiveFile()) => {
  return api.post("/profile", { file_path: filePath });
};

export const getInventoryAnalysis = async (filePath = getActiveFile()) => {
  return api.post("/inventory-analysis", { file_path: filePath });
};

export const getCategoryDemand = async (filePath = getActiveFile()) => {
  return api.post("/category-demand", { file_path: filePath });
};

export const getForecast = async (filePath = getActiveFile(), product = "") => {
  return api.post("/forecast", { file_path: filePath, product });
};

export default api;