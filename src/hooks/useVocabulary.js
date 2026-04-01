// ==========================================
// useVocabulary Hook - 管理單字本資料
// ==========================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getWords, saveWord as apiSaveWord, deleteWord as apiDeleteWord } from '../services/api';

export function useVocabulary(userId) {
  const [savedWords, setSavedWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterText, setFilterText] = useState('');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('all');
  const [categoryL2Filter, setCategoryL2Filter] = useState('all');
  const [categoryL3Filter, setCategoryL3Filter] = useState('all');
  const [categoryL4Filter, setCategoryL4Filter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isGrouped, setIsGrouped] = useState(false);
  const [expandedWordId, setExpandedWordId] = useState(null);

  // 從後端載入單字
  const fetchWords = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const words = await getWords(userId);
      // 正規化 categories
      const normalizedWords = words.map(w => ({
        ...w,
        categories: Array.isArray(w.category) ? w.category : (w.category ? [w.category] : [{ type: 'lifestyle' }])
      }));
      setSavedWords(normalizedWords);
    } catch (error) {
      console.error('載入單字失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // 當主分類改變時，重置子分類
  useEffect(() => {
    setCategoryL2Filter('all');
    setCategoryL3Filter('all');
    setCategoryL4Filter('all');
  }, [categoryTypeFilter]);

  // 儲存單字
  const saveWord = useCallback(async (wordData) => {
    if (!userId) return;
    try {
      await apiSaveWord(userId, wordData);
      await fetchWords();
    } catch (error) {
      console.error('儲存失敗:', error);
    }
  }, [userId, fetchWords]);

  // 刪除單字
  const removeWord = useCallback(async (word) => {
    if (!userId) return;
    try {
      await apiDeleteWord(userId, word);
      await fetchWords();
    } catch (error) {
      console.error('刪除失敗:', error);
    }
  }, [userId, fetchWords]);

  // 移除 uniquePosList，保留 uniqueCategoryList

  // 取得目前分類可用的選項清單
  const filterOptions = useMemo(() => {
    const l2Set = new Set();
    const l3Set = new Set();
    const l4Set = new Set();

    savedWords.forEach(w => {
      const categories = w.categories || (w.category ? [w.category] : [{ type: 'lifestyle' }]);
      categories.forEach(cat => {
        if (cat.type === categoryTypeFilter) {
          if (cat.type === 'textbook') {
            if (cat.version) l2Set.add(cat.version);
            if (cat.book) l3Set.add(String(cat.book));
            if (cat.unit) l4Set.add(String(cat.unit));
          } else if (cat.type === 'magazine') {
            if (cat.brand) l2Set.add(cat.brand);
            if (cat.year) l3Set.add(String(cat.year));
            if (cat.month) l4Set.add(String(cat.month));
          }
        }
      });
    });

    return {
      l2List: Array.from(l2Set).sort(),
      l3List: Array.from(l3Set).sort((a,b) => parseInt(a) - parseInt(b)),
      l4List: Array.from(l4Set).sort((a,b) => parseInt(a) - parseInt(b)),
    };
  }, [savedWords, categoryTypeFilter]);

  // 篩選、排序後的單字列表
  const processedWords = useMemo(() => {
    let result = savedWords;
    
    // 主分類過濾
    if (categoryTypeFilter !== 'all') {
      result = result.filter(w => {
        const categories = w.categories || (w.category ? [w.category] : [{ type: 'lifestyle' }]);
        return categories.some(cat => {
          if (cat.type !== categoryTypeFilter) return false;
          
          if (categoryTypeFilter === 'textbook') {
            if (categoryL2Filter !== 'all' && cat.version !== categoryL2Filter) return false;
            if (categoryL3Filter !== 'all' && String(cat.book) !== categoryL3Filter) return false;
            if (categoryL4Filter !== 'all' && String(cat.unit) !== categoryL4Filter) return false;
          } else if (categoryTypeFilter === 'magazine') {
            if (categoryL2Filter !== 'all' && cat.brand !== categoryL2Filter) return false;
            if (categoryL3Filter !== 'all' && String(cat.year) !== categoryL3Filter) return false;
            if (categoryL4Filter !== 'all' && String(cat.month) !== categoryL4Filter) return false;
          }
          return true;
        });
      });
    }
    
    // 關鍵字搜尋過濾
    if (filterText.trim()) {
      result = result.filter(w =>
        w.word.toLowerCase().includes(filterText.toLowerCase()) ||
        w.translation.includes(filterText)
      );
    }
    
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return b.createdAt - a.createdAt;
        case 'date-asc': return a.createdAt - b.createdAt;
        case 'alpha-asc': return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
        case 'alpha-desc': return b.word.toLowerCase().localeCompare(a.word.toLowerCase());
        default: return 0;
      }
    });
    return result;
  }, [savedWords, filterText, sortBy, categoryTypeFilter, categoryL2Filter, categoryL3Filter, categoryL4Filter]);

  // 按日期分組
  const groupedWords = useMemo(() => {
    if (!isGrouped) return null;
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    processedWords.forEach(word => {
      const date = new Date(word.createdAt);
      let label = '';
      if (date.toDateString() === today.toDateString()) {
        label = '今天';
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = '昨天';
      } else {
        label = date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }
      if (!groups[label]) groups[label] = { label, timestamp: date.getTime(), words: [] };
      groups[label].words.push(word);
    });

    return Object.values(groups).sort((a, b) => {
      return sortBy === 'date-asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    });
  }, [processedWords, isGrouped, sortBy]);

  return {
    savedWords, loading,
    sortBy, setSortBy,
    filterText, setFilterText,
    categoryTypeFilter, setCategoryTypeFilter,
    categoryL2Filter, setCategoryL2Filter,
    categoryL3Filter, setCategoryL3Filter,
    categoryL4Filter, setCategoryL4Filter,
    viewMode, setViewMode,
    isGrouped, setIsGrouped,
    expandedWordId, setExpandedWordId,
    filterOptions, processedWords, groupedWords,
    saveWord, removeWord, refreshWords: fetchWords,
  };
}
