import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

// Common headers — ngrok-skip-browser-warning bypasses ngrok's interstitial page
const COMMON_HEADERS = {
  "ngrok-skip-browser-warning": "true",
};

/**
 * Upload a video file and run deepfake analysis.
 * @param {File} file - The video file to analyze.
 * @param {function} onUploadProgress - Callback receiving 0-100 integer.
 * @returns {Promise<object>} Analysis result from the API.
 */
export async function analyzeVideo(file, onUploadProgress) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(`${API_URL}/analyze`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...COMMON_HEADERS,
      },
      timeout: 300000, // 5 minutes for slow CPU analysis
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        onUploadProgress(percent);
      },
    });
    return response.data;
  } catch (error) {
    if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED") {
      throw new Error(
        "Backend is starting up, please wait 60 seconds and try again."
      );
    }
    if (error.code === "ECONNABORTED") {
      throw new Error("Analysis timed out — video may be too long.");
    }
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error(error.message || "An unexpected error occurred.");
  }
}

/**
 * Check if the backend API is healthy and model is loaded.
 * @returns {Promise<object|null>} Health data or null if unreachable.
 */
export async function checkHealth() {
  try {
    const response = await axios.get(`${API_URL}/health`, {
      headers: COMMON_HEADERS,
      timeout: 10000,
    });
    return response.data;
  } catch {
    return null;
  }
}
