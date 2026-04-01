// ==========================================
// 使用者 ID 管理（取代 Firebase 匿名認證）
// 使用 localStorage 儲存一個 UUID
// ==========================================

const USER_ID_KEY = 'vocabulary_master_user_id';

/**
 * 取得使用者 ID，若不存在則自動產生
 * @returns {string} UUID 格式的使用者 ID
 */
export const getUserId = () => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};
