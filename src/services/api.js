// ==========================================
// API 服務層 - 與後端 Cloudflare Functions 通訊
// ==========================================

import { getGeminiApiKey, getGeminiModel } from '../utils/apiKey';

const API_BASE = '/api';

// 建立全域的查詢快取，避免重複對相同的單字發送 API 請求
const searchCache = new Map();

/**
 * 查詢單字（透過後端呼叫 Gemini AI）
 */
export const searchWord = async (word) => {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();
  
  if (!apiKey) {
    throw new Error('請先在設定中輸入您的 Gemini API Key');
  }

  // 檢查快取
  const cacheKey = `${word.trim().toLowerCase()}_${model}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const response = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Gemini-Api-Key': apiKey
    },
    body: JSON.stringify({ word, model }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '查詢失敗');
  }
  
  const result = await response.json();
  // 寫入快取
  searchCache.set(cacheKey, result);
  return result;
};

/**
 * 取得使用者所有單字
 */
export const getWords = async (userId) => {
  const response = await fetch(`${API_BASE}/words?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error('載入單字失敗');
  return response.json();
};

/**
 * 儲存單字到資料庫
 */
export const saveWord = async (userId, wordData) => {
  const response = await fetch(`${API_BASE}/words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...wordData }),
  });
  if (!response.ok) throw new Error('儲存失敗');
  return response.json();
};

/**
 * 從資料庫刪除單字
 */
export const deleteWord = async (userId, word) => {
  const response = await fetch(
    `${API_BASE}/words/${encodeURIComponent(word)}?userId=${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  );
  if (!response.ok) throw new Error('刪除失敗');
  return response.json();
};
