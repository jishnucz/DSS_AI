/**
 * 🌐 API Utility Functions
 * Centralized API handling with retry logic, error handling, and caching
 */

// Default API base URL
const API_BASE = "http://localhost:8000";

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch with automatic retry
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors
      if (error.message?.includes("4")) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
}

/**
 * GET request with caching
 */
export async function apiGet(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const cacheKey = url + JSON.stringify(options);
  
  // Check cache
  if (!options.noCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  const data = await fetchWithRetry(url, { method: "GET", ...options });
  
  // Store in cache
  cache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}

/**
 * POST request
 */
export async function apiPost(endpoint, body, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  return fetchWithRetry(url, {
    method: "POST",
    body: JSON.stringify(body),
    ...options,
  });
}

/**
 * Upload file via FormData
 */
export async function apiUpload(endpoint, file, additionalData = {}) {
  const url = `${API_BASE}${endpoint}`;
  const formData = new FormData();
  formData.append("file", file);
  
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Check API health status
 */
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE}/`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Clear API cache
 */
export function clearCache() {
  cache.clear();
}

// ============================================================
// SPECIFIC API ENDPOINTS
// ============================================================

/**
 * Get DSS recommendation
 */
export async function getDSSRecommendation(params) {
  return apiPost("/dss", params);
}

/**
 * Enhanced DSS with classifier data
 */
export async function getDSSEnhanced(params, classifierData = null) {
  return apiPost("/dss-enhanced", { ...params, classifier_data: classifierData });
}

/**
 * Quick DSS for map
 */
export async function getQuickDSS(location, crop) {
  return apiGet(`/dss-quick/${encodeURIComponent(location)}/${encodeURIComponent(crop)}`);
}

/**
 * Get map data (crops, regions)
 */
export async function getMapData() {
  return apiGet("/map-data");
}

/**
 * Classify crop from image
 */
export async function classifyCrop(imageFile) {
  return apiUpload("/classify-crop", imageFile);
}

/**
 * Chat message
 */
export async function sendChatMessage(message) {
  return apiPost("/api/chat", { message });
}

/**
 * AI Agent query
 */
export async function queryAIAgent(query, context = {}) {
  return apiPost("/api/ai-agent/query", { query, context });
}

/**
 * Get model comparison
 */
export async function getModelComparison(features) {
  return apiPost("/api/research/model-compare", { features });
}

/**
 * Get SHAP explanation
 */
export async function getSHAPExplanation(features) {
  return apiPost("/api/research/shap", { features });
}

/**
 * Get climate projections
 */
export async function getClimateProjections(taluk) {
  return apiGet(`/api/research/climate-projections/${encodeURIComponent(taluk)}`);
}

/**
 * Get taluk stress data
 */
export async function getTalukStressData() {
  return apiGet("/api/research/taluk-stress");
}

// React hook for API calls
import { useState, useCallback } from "react";

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const call = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);
  
  return { call, loading, error };
}

export default {
  fetchWithRetry,
  apiGet,
  apiPost,
  apiUpload,
  checkApiHealth,
  clearCache,
  getDSSRecommendation,
  getDSSEnhanced,
  getQuickDSS,
  getMapData,
  classifyCrop,
  sendChatMessage,
  queryAIAgent,
  getModelComparison,
  getSHAPExplanation,
  getClimateProjections,
  getTalukStressData,
  useApi,
};
