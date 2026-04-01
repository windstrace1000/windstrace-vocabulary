const STORAGE_KEY = 'vocabulary_categories';

// 預設分類選項
const DEFAULT_CATEGORIES = {
  textbookVersions: ['三民', '龍騰', '南一', '翰林'],
  magazineBrands: ['常春藤', 'LiveABC', '空中英語教室', 'TIME'],
};

/**
 * 取得目前設定的分類選項
 * @returns {{textbookVersions: string[], magazineBrands: string[]}}
 */
export const getCategorySettings = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // 合併預設值，確保不會有遺漏的欄位
      return { ...DEFAULT_CATEGORIES, ...parsed };
    } catch (e) {
      console.error('解析分類設定失敗', e);
    }
  }
  return DEFAULT_CATEGORIES;
};

/**
 * 儲存分類選項設定
 * @param {{textbookVersions: string[], magazineBrands: string[]}} settings 
 */
export const saveCategorySettings = (settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
