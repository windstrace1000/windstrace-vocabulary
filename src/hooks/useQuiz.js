// ==========================================
// useQuiz Hook - 管理測驗邏輯
// 智慧動態間隔答題系統
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { updateWordReviewProgress } from '../services/api';
import { isDueForReview } from '../utils/ebbinghaus';

export function useQuiz(savedWords, userId, saveWord) {
  const [quizList, setQuizList] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizMode, setQuizMode] = useState('en-zh');
  const [quizScore, setQuizScore] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(true); // 預設開啟今日複習模式

  // 當單字列表載入或模式改變時，初始化測驗清單
  const initQuiz = useCallback(() => {
    let list = [...savedWords];
    if (isReviewMode) {
      list = list.filter(w => isDueForReview(w.nextReview));
      // 如果今日沒有待複習單字，且是從其他頁面進來的，可以考慮自動關閉 reviewMode 或者顯示提示
    }
    setQuizList(list);
    setQuizIndex(0);
    setQuizScore(0);
    setShowAnswer(false);
  }, [savedWords, isReviewMode]);

  useEffect(() => {
    if (savedWords.length > 0 && quizList.length === 0) {
      initQuiz();
    }
  }, [savedWords, initQuiz]);

  // 處理答題結果
  const handleAnswer = async (level) => {
    const currentWord = quizList[quizIndex];
    if (!currentWord) return;

    const isCorrect = level === 'mastered';
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }

    // 更新資料庫中的複習進度
    if (userId && saveWord) {
      await updateWordReviewProgress(userId, currentWord, isCorrect);
      // 注意：這會觸發 savedWords 的更新，進而可能觸發 useEffect
    }

    // 取得已考過的歷史清單（包含這題）
    const pastList = quizList.slice(0, quizIndex + 1);
    
    // 取得未來還沒考的題目
    let futureList = quizList.slice(quizIndex + 1).filter(w => w.word !== currentWord.word);

    if (level === 'familiar') {
      futureList.push(currentWord);
    } else if (level === 'unknown') {
      if (futureList.length >= 2) {
        const midIndex = Math.floor(futureList.length / 2);
        futureList.splice(midIndex, 0, currentWord);
        futureList.push(currentWord);
      } else {
        futureList.push(currentWord, currentWord);
      }
    }

    setQuizList([...pastList, ...futureList]);
    setShowAnswer(false);
    setQuizIndex(prev => prev + 1);
  };

  // 重新開始測驗
  const restart = () => {
    setQuizList([...savedWords]);
    setQuizIndex(0);
    setQuizScore(0);
    setShowAnswer(false);
  };

  // 切換測驗模式
  const changeMode = (mode) => {
    if (quizMode !== mode) {
      setQuizMode(mode);
      // 切換模式時重新開始
      setQuizList([...savedWords]);
      setQuizIndex(0);
      setQuizScore(0);
      setShowAnswer(false);
    }
  };

  return {
    quizList,
    quizIndex,
    showAnswer,
    setShowAnswer,
    quizMode,
    quizScore,
    isReviewMode,
    setIsReviewMode,
    handleAnswer,
    restart: initQuiz,
    changeMode,
    currentWord: quizList[quizIndex] || null,
    isComplete: quizList.length > 0 && quizIndex >= quizList.length,
    hasWords: savedWords.length > 0,
    dueCount: savedWords.filter(w => isDueForReview(w.nextReview)).length,
  };
}
