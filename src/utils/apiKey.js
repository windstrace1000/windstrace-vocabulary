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
  if (model === 'gemini-3.0-flash-preview') return 'gemini-3-flash-preview';
  if (model === 'gemini-2.5-flash-preview-04-17') return 'gemini-2.5-flash';
  return model || DEFAULT_MODEL;
};

export const setGeminiModel = (modelName) => {
  localStorage.setItem(API_MODEL_STORAGE, modelName);
};
