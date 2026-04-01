// ==========================================
// ArticleTab 文章閱讀組件
// 支援貼上文章或拍照識別，點擊單字即可查詢
// ==========================================

import { useState, useRef, useCallback } from 'react';
import { FileText, Camera, Loader2, X, RotateCcw, Volume2, BookmarkPlus, BookmarkCheck, Clipboard, ImagePlus, Sparkles } from 'lucide-react';
import { playAudio } from '../utils/audio';
import { ocrImage, analyzeArticle } from '../services/api';
import ChooseCategoryModal from './ChooseCategoryModal';

export default function ArticleTab({ onSearch, savedWords, onSaveWord, searchResult, isSearching }) {
  // 文章輸入模式：'idle' | 'paste' | 'camera' | 'display'
  const [mode, setMode] = useState('idle');
  const [articleText, setArticleText] = useState('');
  const [pasteInput, setPasteInput] = useState('');
  const [isOcr, setIsOcr] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordPopupPosition, setWordPopupPosition] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // AI 文章分析相關狀態
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlights, setHighlights] = useState([]);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const articleRef = useRef(null);

  // 處理貼上文本
  const handlePasteSubmit = useCallback(() => {
    if (!pasteInput.trim()) return;
    setArticleText(pasteInput.trim());
    setMode('display');
  }, [pasteInput]);

  // 處理圖片上傳
  const handleImageUpload = useCallback(async (file) => {
    if (!file) return;

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      setOcrError('請選擇圖片檔案');
      return;
    }

    // 檢查檔案大小（限制 10MB）
    if (file.size > 10 * 1024 * 1024) {
      setOcrError('圖片大小不能超過 10MB');
      return;
    }

    setIsOcr(true);
    setOcrError('');

    try {
      // 讀取圖片為 base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await ocrImage(base64);
      if (result.text && result.text !== '未偵測到英文文字') {
        setArticleText(result.text);
        setMode('display');
      } else {
        setOcrError('未偵測到英文文字，請嘗試其他圖片');
      }
    } catch (error) {
      setOcrError(error.message || 'OCR 識別失敗');
    } finally {
      setIsOcr(false);
    }
  }, []);

  // 開啟相機
  const startCamera = useCallback(async () => {
    setMode('camera');
    setOcrError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setOcrError('無法存取相機，請確認已授權相機權限');
      setMode('idle');
    }
  }, []);

  // 拍照
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // 停止相機
    stopCamera();

    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setIsOcr(true);
    setOcrError('');

    try {
      const result = await ocrImage(base64);
      if (result.text && result.text !== '未偵測到英文文字') {
        setArticleText(result.text);
        setMode('display');
      } else {
        setOcrError('未偵測到英文文字，請嘗試重新拍照');
        setMode('idle');
      }
    } catch (error) {
      setOcrError(error.message || 'OCR 識別失敗');
      setMode('idle');
    } finally {
      setIsOcr(false);
    }
  }, []);

  // 停止相機
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // 文章分析
  const handleAnalyze = useCallback(async () => {
    if (!articleText || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const results = await analyzeArticle(articleText);
      setHighlights(results);
    } catch (error) {
      console.error('分析失敗:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [articleText, isAnalyzing]);

  // 重置所有狀態
  const resetAll = useCallback(() => {
    stopCamera();
    setMode('idle');
    setArticleText('');
    setPasteInput('');
    setSelectedWord(null);
    setWordPopupPosition(null);
    setOcrError('');
    setHighlights([]);
    setIsAnalyzing(false);
  }, [stopCamera]);

  // 處理單字點擊
  const handleWordClick = useCallback((word, event) => {
    // 清理單字（移除標點符號等）
    const cleanWord = word.replace(/[^a-zA-Z'-]/g, '');
    if (!cleanWord || cleanWord.length < 2) return;

    setSelectedWord(cleanWord);

    // 計算彈出位置
    const rect = event.target.getBoundingClientRect();
    const articleRect = articleRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
    
    setWordPopupPosition({
      top: rect.bottom - articleRect.top + 8,
      left: Math.max(0, rect.left - articleRect.left + rect.width / 2 - 140),
      word: cleanWord,
    });

    // 自動觸發查詢
    onSearch(cleanWord);
  }, [onSearch]);

  // 關閉彈出視窗
  const closePopup = useCallback(() => {
    setSelectedWord(null);
    setWordPopupPosition(null);
  }, []);

  // 檢查單字是否已儲存
  const isWordSaved = selectedWord && savedWords.some(
    w => w.word.toLowerCase() === selectedWord.toLowerCase()
  );

  // 將文字分段並斷詞
  const renderArticle = useCallback(() => {
    if (!articleText) return null;

    const paragraphs = articleText.split('\n').filter(p => p.trim());

    return paragraphs.map((paragraph, pIdx) => (
      <p key={pIdx} className="mb-4 leading-loose text-[17px]">
        {paragraph.split(/(\s+)/).map((token, tIdx) => {
          // 如果是空白，直接渲染
          if (/^\s+$/.test(token)) return <span key={tIdx}>{token}</span>;

          // 提取純英文單字
          const cleanWord = token.replace(/[^a-zA-Z'-]/g, '');
          const isEnglish = /[a-zA-Z]/.test(cleanWord) && cleanWord.length >= 2;
          const isSaved = isEnglish && savedWords.some(
            w => w.word.toLowerCase() === cleanWord.toLowerCase()
          );
          const isSelected = isEnglish && selectedWord?.toLowerCase() === cleanWord.toLowerCase();

          if (isEnglish) {
            // 取得前後標點
            const leadMatch = token.match(/^([^a-zA-Z'-]*)/);
            const trailMatch = token.match(/([^a-zA-Z'-]*)$/);
            const lead = leadMatch ? leadMatch[1] : '';
            const trail = trailMatch ? trailMatch[1] : '';
            const core = token.slice(lead.length, token.length - (trail.length || 0));

            return (
              <span key={tIdx}>
                {lead}
                <button
                  onClick={(e) => handleWordClick(core, e)}
                  className={`
                    relative inline-block px-0.5 rounded-md transition-all duration-200 cursor-pointer
                    hover:bg-indigo-100 hover:text-indigo-700
                    active:scale-95
                    ${isSelected
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                      : isSaved
                        ? 'text-emerald-600 underline decoration-emerald-300 decoration-2 underline-offset-4'
                        : 'text-slate-800'
                    }
                  `}
                  style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
                >
                  {core}
                  {isSaved && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  )}
                </button>
                {trail}
              </span>
            );
          }

          return <span key={tIdx}>{token}</span>;
        })}
      </p>
    ));
  }, [articleText, savedWords, selectedWord, handleWordClick]);

  // 儲存單字（帶分類）
  const handleSaveWithCategory = (categoryData) => {
    if (!searchResult) return;

    const existingWord = savedWords.find(
      w => w.word.toLowerCase() === searchResult.word.toLowerCase()
    );

    let newCategories = existingWord ? [...(existingWord.categories || [])] : [];
    const isDuplicate = newCategories.some(c => JSON.stringify(c) === JSON.stringify(categoryData));
    if (!isDuplicate) {
      newCategories.push(categoryData);
    }

    onSaveWord({
      ...(existingWord || searchResult),
      category: newCategories
    });
    setIsCategoryModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">

      {/* === 初始模式：選擇輸入方式 === */}
      {mode === 'idle' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              文章閱讀模式
            </h2>
            <p className="text-sm text-slate-500 mb-6">貼上英文文章或拍照識別，點擊任意單字即可查詢</p>

            {ocrError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {ocrError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 貼上文章 */}
              <button
                onClick={() => { setMode('paste'); setOcrError(''); }}
                className="group flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-2 border-indigo-100 hover:border-indigo-300 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-100"
              >
                <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                  <Clipboard className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">貼上文章</p>
                  <p className="text-xs text-slate-500 mt-1">直接貼入英文文章</p>
                </div>
              </button>

              {/* 拍照識別 */}
              <button
                onClick={startCamera}
                className="group flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-violet-50 to-violet-100/50 border-2 border-violet-100 hover:border-violet-300 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-violet-100"
              >
                <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                  <Camera className="w-8 h-8 text-violet-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">拍照識別</p>
                  <p className="text-xs text-slate-500 mt-1">用相機拍攝文章</p>
                </div>
              </button>

              {/* 上傳圖片 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-amber-100 hover:border-amber-300 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-100"
              >
                <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                  <ImagePlus className="w-8 h-8 text-amber-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">上傳圖片</p>
                  <p className="text-xs text-slate-500 mt-1">從相簿選擇照片</p>
                </div>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files?.[0])}
            />
          </div>

          {/* OCR 處理中 */}
          {isOcr && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-20" />
              </div>
              <p className="text-slate-600 font-medium">AI 正在識別圖片中的文字...</p>
              <p className="text-xs text-slate-400">這可能需要幾秒鐘</p>
            </div>
          )}
        </div>
      )}

      {/* === 貼上模式 === */}
      {mode === 'paste' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-indigo-600" />
              貼上英文文章
            </h2>
            <button
              onClick={() => { setMode('idle'); setPasteInput(''); }}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <textarea
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            placeholder="在此貼上英文文章...&#10;&#10;例如：The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet."
            className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-[15px] leading-relaxed"
            autoFocus
          />
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-slate-400">
              {pasteInput.length > 0
                ? `已輸入 ${pasteInput.split(/\s+/).filter(w => w).length} 個單字`
                : '支援段落、換行等格式'}
            </p>
            <button
              onClick={handlePasteSubmit}
              disabled={!pasteInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <FileText className="w-5 h-5" />
              開始閱讀
            </button>
          </div>
        </div>
      )}

      {/* === 相機模式 === */}
      {mode === 'camera' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-violet-600" />
              拍照識別文章
            </h2>
            <button
              onClick={() => { stopCamera(); setMode('idle'); }}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative bg-black aspect-[4/3] sm:aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* 拍照框線指引 */}
            <div className="absolute inset-4 border-2 border-white/30 rounded-2xl pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
            </div>
            <p className="absolute bottom-8 left-0 right-0 text-center text-white/70 text-sm">
              將文章對準框線內，按下拍照按鈕
            </p>
          </div>

          <div className="p-4 flex justify-center">
            <button
              onClick={capturePhoto}
              disabled={isOcr}
              className="w-16 h-16 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-violet-200 active:scale-95 disabled:opacity-50"
            >
              {isOcr ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Camera className="w-8 h-8" />
              )}
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* === 文章顯示模式 === */}
      {mode === 'display' && (
        <div className="space-y-4">
          {/* 工具列 */}
          <div className="bg-white px-4 sm:px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-600">
                  共 {articleText.split(/\s+/).filter(w => /[a-zA-Z]/.test(w)).length} 個單字
                </span>
              </div>
              
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                  isAnalyzing 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : highlights.length > 0
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 分析中...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> {highlights.length > 0 ? '重新分析' : 'AI 偵測片語'}</>
                )}
              </button>
            </div>

            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors ml-auto sm:ml-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">重新選擇</span>
              <span className="sm:hidden text-xs">重選</span>
            </button>
          </div>

          {/* AI 分析出的重點清單 */}
          {highlights.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-100 animate-in fade-in zoom-in-95">
              <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI 老師推薦的學習內容 (含片語)
              </h4>
              <div className="flex flex-wrap gap-2">
                {highlights.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      if (item.type === 'word') {
                        handleWordClick(item.originalText, e);
                      } else {
                        // 片語查詢特別處理
                        setSelectedWord(item.originalText);
                        onSearch(item.originalText);
                        setWordPopupPosition({
                          top: e.target.getBoundingClientRect().bottom - articleRef.current?.getBoundingClientRect().top + 8,
                          left: Math.max(0, e.target.getBoundingClientRect().left - articleRef.current?.getBoundingClientRect().left + e.target.getBoundingClientRect().width / 2 - 140),
                          word: item.originalText
                        });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1 ${
                      item.type === 'phrase'
                      ? 'bg-white text-purple-600 border border-purple-200 hover:border-purple-400'
                      : 'bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-400'
                    }`}
                  >
                    {item.type === 'phrase' && <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-0.5" />}
                    {item.originalText}
                    <span className="font-normal text-slate-400 mx-1">/</span>
                    <span className="text-slate-600 truncate max-w-[120px]">{item.translation}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 文章內容 */}
          <div
            ref={articleRef}
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 relative"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            {renderArticle()}

            {/* 單字查詢彈出視窗 */}
            {selectedWord && wordPopupPosition && (
              <div
                className="absolute z-20 w-[90vw] sm:w-72 max-w-sm animate-in fade-in zoom-in-95 duration-200"
                style={{
                  top: `${wordPopupPosition.top}px`,
                  left: `${Math.max(4, Math.min(wordPopupPosition.left, (articleRef.current?.clientWidth || 300) - (window.innerWidth < 640 ? window.innerWidth * 0.9 : 288) - 4))}px`,
                }}
              >
                {/* 三角箭頭 */}
                <div className="w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45 ml-8 -mb-1.5 relative z-10" />
                
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                  {/* 查詢中 */}
                  {isSearching && (
                    <div className="p-4 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                      <span className="text-sm text-slate-600">正在查詢 <strong>{selectedWord}</strong>...</span>
                    </div>
                  )}

                  {/* 查詢結果 */}
                  {!isSearching && searchResult && searchResult.word?.toLowerCase() === selectedWord.toLowerCase() && (
                    <div>
                      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-extrabold text-slate-900">{searchResult.word}</h4>
                            <button
                              onClick={() => playAudio(searchResult.word)}
                              className="p-1 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={closePopup}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">
                            {searchResult.partOfSpeech}
                          </span>
                          <span className="text-sm text-slate-700">{searchResult.translation}</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* 例句 */}
                        <div className="text-sm">
                          <p className="text-slate-700 italic">"{searchResult.exampleSentence}"</p>
                          <p className="text-slate-400 text-xs mt-1">{searchResult.exampleTranslation}</p>
                        </div>

                        {/* 相關詞形（簡化顯示） */}
                        {searchResult.relatedForms?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {searchResult.relatedForms.slice(0, 4).map((form, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleWordClick(form.formWord, { target: { getBoundingClientRect: () => ({ bottom: 0, left: 0, width: 0 }) } })}
                                className="text-xs px-2 py-1 bg-slate-50 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                title={form.formName}
                              >
                                {form.formWord}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 儲存按鈕 */}
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => setIsCategoryModalOpen(true)}
                          className={`w-full flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-lg transition-colors ${
                            isWordSaved
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-white bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          {isWordSaved
                            ? <><BookmarkCheck className="w-4 h-4" /> 加入其他分類</>
                            : <><BookmarkPlus className="w-4 h-4" /> 記下來</>
                          }
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 未匹配時（可能是其他單字的查詢結果） */}
                  {!isSearching && (!searchResult || searchResult.word?.toLowerCase() !== selectedWord.toLowerCase()) && (
                    <div className="p-4 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                      <span className="text-sm text-slate-600">正在查詢 <strong>{selectedWord}</strong>...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 已儲存單字提示 */}
          <div className="flex items-center gap-4 text-xs text-slate-400 px-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" /> 已收錄的單字
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-3 bg-indigo-500 rounded-sm" /> 目前選取的單字
            </span>
          </div>
        </div>
      )}

      {/* 分類選擇視窗 */}
      <ChooseCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        wordToSave={searchResult}
        onConfirm={handleSaveWithCategory}
      />
    </div>
  );
}
