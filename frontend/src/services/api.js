const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";

const DEFAULT_TIMEOUT_MS = 30000;

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export const enhanceContent = async (text, mode) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/enhance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode }),
    });

    let data;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const textBody = await response.text();
      throw new Error(textBody || "Unexpected response from server");
    }

    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const healthCheck = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error("Health check failed");
    }
    return await response.json();
  } catch (error) {
    console.error("Health check error:", error);
    throw error;
  }
};
