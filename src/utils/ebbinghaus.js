/**
 * 艾賓浩斯遺忘曲線相關工具與演算法
 */

// 記憶階段對應的複習間隔 (單位: 毫秒)
export const REVIEW_INTERVALS = [
  0,                     // 階段 0: 初始
  30 * 60 * 1000,        // 階段 1: 30 分鐘 (0.5h)
  12 * 60 * 60 * 1000,   // 階段 2: 12 小時
  24 * 60 * 60 * 1000,   // 階段 3: 1 天
  2 * 24 * 60 * 60 * 1000, // 階段 4: 2 天
  4 * 24 * 60 * 60 * 1000, // 階段 5: 4 天
  7 * 24 * 60 * 60 * 1000, // 階段 6: 7 天
  15 * 24 * 60 * 60 * 1000, // 階段 7: 15 天
  30 * 24 * 60 * 60 * 1000, // 階段 8: 30 天
];

/**
 * 計算下一個複習進度
 * @param {number} currentStage 目前階段
 * @param {boolean} isCorrect 是否答對
 * @returns {object} { nextStage, nextReviewTime }
 */
export const calculateNextProgress = (currentStage, isCorrect) => {
  const now = Date.now();
  let nextStage;

  if (isCorrect) {
    // 答對則晉升下一階段，最高到階段 8
    nextStage = Math.min(currentStage + 1, REVIEW_INTERVALS.length - 1);
    // 確保至少從階段 1 開始計算
    if (nextStage === 0) nextStage = 1;
  } else {
    // 答錯則退回階段 1 (重新學習)，或依照需求調整為 currentStage - 1
    nextStage = 1;
  }

  const nextReviewTime = now + REVIEW_INTERVALS[nextStage];

  return {
    nextStage,
    nextReviewTime,
    lastReviewed: now
  };
};

/**
 * 檢查單字是否到期需要複習
 * @param {number} nextReviewTime 下次複習時間戳
 * @returns {boolean}
 */
export const isDueForReview = (nextReviewTime) => {
  if (!nextReviewTime) return true; // 從未複習過
  return Date.now() >= nextReviewTime;
};

/**
 * 取得記憶強度百分比 (僅供 UI 參考)
 */
export const getMemoryStrength = (stage) => {
  return Math.round((stage / (REVIEW_INTERVALS.length - 1)) * 100);
};
