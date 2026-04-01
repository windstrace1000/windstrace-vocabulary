// ==========================================
// useQuiz Hook - 管理測驗邏輯
// 智慧動態間隔答題系統
// ==========================================

import { useState, useEffect } from 'react';

export function useQuiz(savedWords) {
  const [quizList, setQuizList] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizMode, setQuizMode] = useState('en-zh');
  const [quizScore, setQuizScore] = useState(0);

  // 當單字列表載入時，初始化測驗清單
  useEffect(() => {
    if (savedWords.length > 0 && quizList.length === 0) {
      setQuizList([...savedWords]);
    }
  }, [savedWords]);

  // 處理答題結果
  const handleAnswer = (level) => {
    const currentWord = quizList[quizIndex];

    if (level === 'mastered') {
      setQuizScore(prev => prev + 1);
    }

    // 取得已考過的歷史清單（包含這題）
    const pastList = quizList.slice(0, quizIndex + 1);

    // 取得未來還沒考的題目，並過濾掉目前這個單字避免重複疊加
    let futureList = quizList.slice(quizIndex + 1).filter(w => w.word !== currentWord.word);

    if (level === 'familiar') {
      // 還不熟悉：後續出現 1 次（放在隊伍最後面）
      futureList.push(currentWord);
    } else if (level === 'unknown') {
      // 完全不會：後續出現 2 次
      // 一次插在中間，一次放在最後面，避免背靠背連續出現
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
    handleAnswer,
    restart,
    changeMode,
    currentWord: quizList[quizIndex] || null,
    isComplete: quizList.length > 0 && quizIndex >= quizList.length,
    hasWords: savedWords.length > 0,
  };
}
