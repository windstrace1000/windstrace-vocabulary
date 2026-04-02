// ==========================================
// SpeakTab 口說練習頁面組件
// 讓使用者透過語音與 AI 老師即時對話
// ==========================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Send, RotateCw, MessageSquare, Sparkles, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { chatWithAI } from '../services/api';
import { playAudio } from '../utils/audio';

// 對話情境選項
const SCENARIOS = [
  { id: '旅遊點餐', icon: '🍽️', label: '旅遊點餐', description: '在餐廳點餐' },
  { id: '機場通關', icon: '✈️', label: '機場通關', description: '機場入境通關' },
  { id: '購物', icon: '🛍️', label: '購物', description: '在店裡買東西' },
  { id: '日常閒聊', icon: '💬', label: '日常閒聊', description: '和朋友聊天' },
  { id: '自由對話', icon: '🆓', label: '自由對話', description: '聊任何話題' },
];

// AI 老師的各情境開場白（前端版，用來在 UI 立即顯示）
const SCENARIO_OPENERS = {
  '旅遊點餐': 'Hi there! Welcome to our restaurant. Here is the menu. What would you like to have today?',
  '機場通關': 'Hello! Welcome. May I see your passport, please?',
  '購物': 'Hi! Welcome to our store. Are you looking for anything special today?',
  '日常閒聊': "Hey! It's so nice to see you! How have you been?",
  '自由對話': "Hi there! I'm your English teacher. What would you like to talk about today? We can talk about anything you like!",
};

const SCENARIO_OPENER_HINTS = {
  '旅遊點餐': '🎉 老師說：「嗨！歡迎來到我們餐廳。這是菜單，你今天想吃什麼？」\n\n💡 你可以試著說出你想吃的東西，像是 "chicken"、"rice" 或 "I want soup" 都可以喔！',
  '機場通關': '🎉 老師說：「你好！歡迎。請讓我看看你的護照好嗎？」\n\n💡 你可以回答 "Here you go" 或 "Sure" 就好囉！',
  '購物': '🎉 老師說：「嗨！歡迎光臨。你在找什麼特別的東西嗎？」\n\n💡 你可以說你想買的東西，像是 "shirt"、"shoes" 或 "I want to look around" 都行！',
  '日常閒聊': '🎉 老師說：「嘿！好高興見到你！你最近怎麼樣？」\n\n💡 你可以簡單回答 "I\'m good" 或 "I\'m fine, thank you" 喔！',
  '自由對話': '🎉 老師說：「嗨！我是你的英文老師。你今天想聊什麼？我們可以聊任何話題！」\n\n💡 你可以說任何你感興趣的話題，像是 "food"、"movie"、"travel" 都行！',
};

export default function SpeakTab() {
  // 狀態管理
  const [scenario, setScenario] = useState(null);        // 目前選擇的情境
  const [messages, setMessages] = useState([]);            // 對話歷史
  const [isLoading, setIsLoading] = useState(false);       // AI 回覆中
  const [isRecording, setIsRecording] = useState(false);   // 錄音中
  const [textInput, setTextInput] = useState('');           // 文字輸入
  const [error, setError] = useState('');                   // 錯誤訊息
  const [showScenarios, setShowScenarios] = useState(true); // 是否顯示情境選擇
  const [speechSupported, setSpeechSupported] = useState(true); // 瀏覽器是否支援語音辨識
  const [interimText, setInterimText] = useState('');      // 即時語音辨識文字

  // Refs
  const chatEndRef = useRef(null);          // 自動捲動到對話底部
  const recognitionRef = useRef(null);      // 語音辨識實例
  const synthPlayingRef = useRef(false);    // TTS 是否正在播放

  // 自動捲動到最新訊息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, interimText]);

  // 初始化語音辨識
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;    // 即時顯示辨識中的文字
    recognition.continuous = false;        // 放開即停
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = '';
      let interimTextVal = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interimTextVal += event.results[i][0].transcript;
        }
      }
      setInterimText(interimTextVal);
      if (finalText) {
        setInterimText('');
        handleSendMessage(finalText.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('語音辨識錯誤:', event.error);
      if (event.error === 'not-allowed') {
        setError('請允許瀏覽器使用麥克風權限');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setError('語音辨識發生錯誤，請再試一次');
      }
      setIsRecording(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 開始情境對話
  const startScenario = useCallback((selectedScenario) => {
    setScenario(selectedScenario);
    setShowScenarios(false);
    setError('');
    setMessages([]);

    // 直接在前端顯示 AI 開場白，不需呼叫 API
    const opener = SCENARIO_OPENERS[selectedScenario] || SCENARIO_OPENERS['自由對話'];
    const hint = SCENARIO_OPENER_HINTS[selectedScenario] || SCENARIO_OPENER_HINTS['自由對話'];

    const aiMessage = {
      role: 'assistant',
      content: opener,
      chineseHint: hint,
      suggestedSentence: '',  // 開場白不需要建議句
      timestamp: Date.now(),
    };
    setMessages([aiMessage]);

    // 自動播放開場白語音
    setTimeout(() => playAudio(opener), 500);
  }, []);

  // 發送訊息給 AI
  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    setError('');

    // 新增使用者訊息
    const userMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setTextInput('');
    setIsLoading(true);

    try {
      // 組裝對話歷史給 API（只傳 role 和 content）
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
      }));

      const result = await chatWithAI(apiMessages, scenario);

      const aiMessage = {
        role: 'assistant',
        content: result.englishReply,
        chineseHint: result.chineseHint,
        suggestedSentence: result.suggestedSentence,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // 自動播放 AI 回覆的英文語音
      setTimeout(() => playAudio(result.englishReply), 300);
    } catch (err) {
      setError(err.message || '對話失敗，請確認網路連線或 API Key');
    } finally {
      setIsLoading(false);
    }
  }, [messages, scenario, isLoading]);

  // 錄音控制 - 開始
  const startRecording = useCallback(() => {
    if (!recognitionRef.current || isLoading) return;
    setError('');
    setInterimText('');
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e) {
      // 如果已經在錄音就忽略
      console.error('開始錄音失敗:', e);
    }
  }, [isLoading]);

  // 錄音控制 - 停止
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error('停止錄音失敗:', e);
    }
    setIsRecording(false);
  }, []);

  // 文字送出
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleSendMessage(textInput.trim());
    }
  };

  // 重新開始對話
  const resetConversation = () => {
    setMessages([]);
    setScenario(null);
    setShowScenarios(true);
    setError('');
    setTextInput('');
    setInterimText('');
    setIsLoading(false);
  };

  // ==========================================
  // 渲染 - 情境選擇畫面
  // ==========================================
  if (showScenarios) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">AI 口說練習</h2>
          <p className="text-slate-500 text-sm sm:text-base">選擇一個情境，開始和 AI 老師練習英文對話！</p>
          <p className="text-slate-400 text-xs mt-1">即使只會說簡單單字也沒關係，老師會耐心教你 😊</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => startScenario(s.id)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all text-left group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{s.label}</h3>
                  <p className="text-sm text-slate-400">{s.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {!speechSupported && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">您的瀏覽器不支援語音辨識</p>
              <p className="mt-1">建議使用 Chrome 或 Edge 瀏覽器。不過別擔心，您仍然可以用打字的方式練習對話！</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 渲染 - 對話畫面
  // ==========================================
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-2">
      {/* 頂部 - 情境標題列 */}
      <div className="bg-white rounded-t-2xl border border-slate-100 border-b-0 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">{SCENARIOS.find(s => s.id === scenario)?.icon}</span>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">{scenario}</h3>
          <span className="text-xs text-slate-400 hidden sm:inline">— AI 口說練習</span>
        </div>
        <button
          onClick={resetConversation}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>換情境</span>
        </button>
      </div>

      {/* 對話區域 */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white border-x border-slate-100 px-3 sm:px-4 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' ? (
              // AI 老師的訊息
              <div className="max-w-[88%] sm:max-w-[80%] space-y-2">
                {/* 英文回應氣泡 */}
                <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-xs font-bold text-indigo-500">🎓 AI 老師</span>
                      </div>
                      <p className="text-slate-800 text-sm sm:text-base leading-relaxed">{msg.content}</p>
                    </div>
                    <button
                      onClick={() => playAudio(msg.content)}
                      className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors flex-shrink-0 mt-1"
                      title="重播語音"
                    >
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* 中文提示區 */}
                {msg.chineseHint && (
                  <div className="bg-indigo-50/80 rounded-2xl rounded-tl-md p-3 sm:p-4 border border-indigo-100/60">
                    <p className="text-indigo-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{msg.chineseHint}</p>
                  </div>
                )}

                {/* 建議句子 */}
                {msg.suggestedSentence && (
                  <div className="bg-emerald-50/80 rounded-2xl rounded-tl-md p-3 border border-emerald-100/60 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-600 block mb-0.5">💡 你可以試著說：</span>
                      <p className="text-emerald-800 text-sm sm:text-base font-medium">{msg.suggestedSentence}</p>
                    </div>
                    <button
                      onClick={() => playAudio(msg.suggestedSentence)}
                      className="p-1.5 text-emerald-500 hover:bg-emerald-100 rounded-full transition-colors flex-shrink-0"
                      title="聽聽看怎麼說"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // 使用者的訊息
              <div className="max-w-[80%] sm:max-w-[70%]">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
                  <p className="text-sm sm:text-base leading-relaxed">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 即時語音辨識文字 */}
        {interimText && (
          <div className="flex justify-end">
            <div className="max-w-[80%] sm:max-w-[70%]">
              <div className="bg-indigo-400/60 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm animate-pulse">
                <p className="text-sm sm:text-base leading-relaxed italic">{interimText}...</p>
              </div>
            </div>
          </div>
        )}

        {/* AI 正在思考 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-indigo-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI 老師正在思考...</span>
              </div>
            </div>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 底部 - 輸入區 */}
      <div className="bg-white rounded-b-2xl border border-slate-100 border-t-0 p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-2">
          {/* 麥克風按鈕 */}
          {speechSupported && (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
              disabled={isLoading}
              className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                isRecording
                  ? 'bg-red-500 shadow-red-200 animate-pulse scale-110'
                  : isLoading
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200 hover:shadow-lg hover:scale-105'
              }`}
              title={isRecording ? '放開以送出' : '按住說話'}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>
          )}

          {/* 文字輸入框 */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isRecording ? '🎤 正在聆聽...' : '或是用打字的也可以...'}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base bg-slate-50 focus:bg-white"
              disabled={isLoading || isRecording}
            />
            <button
              type="submit"
              disabled={isLoading || !textInput.trim() || isRecording}
              className="flex-shrink-0 p-2.5 sm:p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-40 active:scale-95 shadow-sm"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
        </div>

        {/* 錄音提示 */}
        <div className="text-center mt-2">
          {isRecording ? (
            <p className="text-red-500 text-xs font-medium animate-pulse">🎤 正在聆聽你的聲音...放開按鈕即送出</p>
          ) : (
            <p className="text-slate-400 text-[10px] sm:text-xs">
              {speechSupported ? '按住麥克風說英文 🎤 或直接打字送出' : '輸入英文訊息開始練習 ✍️'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
