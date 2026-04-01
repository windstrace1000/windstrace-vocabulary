// ==========================================
// 使用者 ID 管理（取代 Firebase 匿名認證）
// 使用 localStorage 儲存一個 UUID
// ==========================================

const USER_ID_KEY = 'vocabulary_master_user_id';

/**
 * 取得使用者 ID，若不存在則自動產生一個隨機 ID
 */
export const getUserId = () => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    // 預設產生一個短一點的隨機 ID，方便手動輸入，或者保留 UUID
    userId = crypto.randomUUID().split('-')[0]; // 取前段作為預設，較好記
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

/**
 * 手動設定使用者 ID (自定義 ID)
 */
export const setUserId = (newId) => {
  if (newId && newId.trim()) {
    localStorage.setItem(USER_ID_KEY, newId.trim());
    return true;
  }
  return false;
};
