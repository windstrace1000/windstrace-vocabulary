// ==========================================
// API 金鑰管理工具
// 使用 localStorage 儲存在使用者的瀏覽器中
// ==========================================

const API_KEY_STORAGE = 'vocabulary_master_gemini_api_key';

export const getGeminiApiKey = () => {
  return localStorage.getItem(API_KEY_STORAGE) || '';
};

export const setGeminiApiKey = (key) => {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
};

const API_MODEL_STORAGE = 'vocabulary_master_gemini_model';
const DEFAULT_MODEL = 'gemini-3-flash-preview';

export const getGeminiModel = () => {
  const model = localStorage.getItem(API_MODEL_STORAGE);
  if (model === 'gemini-3.0-flash-preview' || model === 'gemini-3-flash') return 'gemini-3-flash-preview';
  if (model === 'gemini-2.5-flash-preview-04-17' || model === 'gemini-2.5-flash') return 'gemini-2.5-flash';
  if (model === 'gemini-3.1-flash-lite-preview' || model === 'gemini-3.1-flash-lite') return 'gemini-3.1-flash-lite-preview';
  if (model === 'gemini-2.5-flash-lite') return 'gemini-2.5-flash-lite';
  return model || DEFAULT_MODEL;
};

export const setGeminiModel = (modelName) => {
  localStorage.setItem(API_MODEL_STORAGE, modelName);
};

// --- 語音朗讀速度設定 ---
const SPEECH_RATE_STORAGE = 'vocabulary_master_speech_rate';
const DEFAULT_SPEECH_RATE = '0.85';

export const getSpeechRate = () => {
  return localStorage.getItem(SPEECH_RATE_STORAGE) || DEFAULT_SPEECH_RATE;
};

export const setSpeechRate = (rate) => {
  localStorage.setItem(SPEECH_RATE_STORAGE, rate.toString());
};

// --- Notion 同步設定 ---
const NOTION_API_KEY_STORAGE = 'vocabulary_master_notion_api_key';
const NOTION_DATABASE_ID_STORAGE = 'vocabulary_master_notion_database_id';

export const getNotionApiKey = () => {
  return localStorage.getItem(NOTION_API_KEY_STORAGE) || '';
};

export const setNotionApiKey = (key) => {
  if (key) {
    localStorage.setItem(NOTION_API_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(NOTION_API_KEY_STORAGE);
  }
};

export const getNotionDatabaseId = () => {
  return localStorage.getItem(NOTION_DATABASE_ID_STORAGE) || '';
};

export const setNotionDatabaseId = (id) => {
  if (id) {
    localStorage.setItem(NOTION_DATABASE_ID_STORAGE, id.trim());
  } else {
    localStorage.removeItem(NOTION_DATABASE_ID_STORAGE);
  }
};
