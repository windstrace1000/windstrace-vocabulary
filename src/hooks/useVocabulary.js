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
  const [posFilter, setPosFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isGrouped, setIsGrouped] = useState(false);
  const [expandedWordId, setExpandedWordId] = useState(null);

  // 從後端載入單字
  const fetchWords = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const words = await getWords(userId);
      setSavedWords(words);
    } catch (error) {
      console.error('載入單字失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

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

  // 取得所有不重複的詞性列表
  const uniquePosList = useMemo(() => {
    const posSet = new Set(savedWords.map(w => w.partOfSpeech).filter(Boolean));
    return Array.from(posSet).sort();
  }, [savedWords]);

  // 取得所有不重複的分類清單
  const uniqueCategoryList = useMemo(() => {
    const categoryMap = new Map();
    savedWords.forEach(w => {
      const type = w.category?.type || 'lifestyle';
      let id = 'lifestyle';
      let label = '日常・生活';
      if (type === 'textbook') {
        id = `textbook-${w.category.version}-${w.category.book}`;
        label = `課本 (${w.category.version} 第${w.category.book}冊)`;
      } else if (type === 'magazine') {
        id = `magazine-${w.category.brand}-${w.category.year}-${w.category.month}`;
        label = `雜誌 (${w.category.brand} ${w.category.year}/${w.category.month})`;
      }
      categoryMap.set(id, { id, label, type });
    });
    return Array.from(categoryMap.values()).sort((a, b) => b.type.localeCompare(a.type));
  }, [savedWords]);

  // 篩選、排序後的單字列表
  const processedWords = useMemo(() => {
    let result = savedWords;
    if (posFilter !== 'all') result = result.filter(w => w.partOfSpeech === posFilter);
    if (categoryFilter !== 'all') {
      result = result.filter(w => {
        const type = w.category?.type || 'lifestyle';
        let id = 'lifestyle';
        if (type === 'textbook') id = `textbook-${w.category.version}-${w.category.book}`;
        else if (type === 'magazine') id = `magazine-${w.category.brand}-${w.category.year}-${w.category.month}`;
        return id === categoryFilter;
      });
    }
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
  }, [savedWords, filterText, sortBy, posFilter]);

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
    posFilter, setPosFilter,
    categoryFilter, setCategoryFilter,
    viewMode, setViewMode,
    isGrouped, setIsGrouped,
    expandedWordId, setExpandedWordId,
    uniquePosList, uniqueCategoryList, processedWords, groupedWords,
    saveWord, removeWord, refreshWords: fetchWords,
  };
}
