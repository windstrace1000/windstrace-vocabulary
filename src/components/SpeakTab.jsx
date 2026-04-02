// ==========================================
// SpeakTab 口說練習頁面組件 (Live API 版)
// 使用 Gemini Live API WebSocket 即時語音對話
// ==========================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, RotateCw, Sparkles, Loader2, AlertCircle, Phone, PhoneOff } from 'lucide-react';
import { getGeminiApiKey } from '../utils/apiKey';

// 對話情境選項
const SCENARIOS = [
  { id: '旅遊點餐', icon: '🍽️', label: '旅遊點餐', description: '在餐廳點餐' },
  { id: '機場通關', icon: '✈️', label: '機場通關', description: '機場入境通關' },
  { id: '購物', icon: '🛍️', label: '購物', description: '在店裡買東西' },
  { id: '日常閒聊', icon: '💬', label: '日常閒聊', description: '和朋友聊天' },
  { id: '自由對話', icon: '🆓', label: '自由對話', description: '聊任何話題' },
];

// 各情境的 System Prompt
const SCENARIO_PROMPTS = {
  '旅遊點餐': `你們現在在一間餐廳裡，你是服務生，學生剛坐下來。請用英文招呼他，問他想吃什麼。`,
  '機場通關': `你是機場的海關人員，學生正在通關入境。請用英文問他要護照。`,
  '購物': `你是一間服飾店的店員，學生走進店裡。請用英文歡迎他並問他想找什麼。`,
  '日常閒聊': `你是學生的外國朋友，你們在咖啡廳碰面聊天。請用英文跟他打招呼。`,
  '自由對話': `你和學生自由聊天，可以聊任何話題。請用英文跟他打招呼，問他想聊什麼。`,
};

// 核心 System Prompt
const SYSTEM_PROMPT_BASE = `你是一位超級有耐心的英文口說老師，正在和一個英文初學者進行即時語音對話練習。

你的教學風格：
1. 像爸爸/媽媽教小朋友說話一樣：溫柔、鼓勵、絕對不責怪
2. 學生可能只會說簡單的單字（例如 "water"、"hungry"、"go airport"），你要能理解他的意圖
3. 每次回應都必須主動提出新問題或話題，引導對話繼續下去
4. 如果學生的英文有小錯誤，溫柔地用中文指出正確說法
5. 大量使用鼓勵性的詞彙（"Great!", "Good job!", "Nice try!"）
6. 用簡單的英文，句子短一點，適合初學者
7. 在英文回應之後，用繁體中文簡短解釋你剛才說了什麼，並建議學生可以怎麼回應
8. 保持對話在情境主題內

重要：你的回答格式必須是先說英文，然後換行說中文翻譯和建議。`;

// WebSocket 端點
const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const LIVE_MODEL = 'gemini-3.1-flash-live-preview';

// AudioWorklet 處理器程式碼（用 Blob URL 載入）
const AUDIO_WORKLET_CODE = `
class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 2400; // 每 150ms 一次 (16000 * 0.15)
    this._buffer = new Float32Array(0);
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];

    // 合併到緩衝區
    const newBuffer = new Float32Array(this._buffer.length + channelData.length);
    newBuffer.set(this._buffer);
    newBuffer.set(channelData, this._buffer.length);
    this._buffer = newBuffer;

    // 當緩衝區夠大時，轉換並送出
    while (this._buffer.length >= this._bufferSize) {
      const chunk = this._buffer.slice(0, this._bufferSize);
      this._buffer = this._buffer.slice(this._bufferSize);

      // 轉成 16-bit PCM
      const pcm16 = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      this.port.postMessage({ pcmData: pcm16.buffer }, [pcm16.buffer]);
    }

    return true;
  }
}

registerProcessor('pcm-recorder-processor', PCMRecorderProcessor);
`;

export default function SpeakTab() {
  // 狀態管理
  const [scenario, setScenario] = useState(null);
  const [showScenarios, setShowScenarios] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState('');
  const [transcripts, setTranscripts] = useState([]); // { role: 'user'|'ai', text: string }
  const [currentAiText, setCurrentAiText] = useState('');
  const [currentUserText, setCurrentUserText] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Refs
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const playbackContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const chatEndRef = useRef(null);

  // 自動捲動
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, currentAiText, currentUserText]);

  // 清理函式
  useEffect(() => {
    return () => {
      disconnectSession();
    };
  }, []);

  // ==========================================
  // 播放 AI 回傳的 PCM 音訊
  // ==========================================
  const playAudioChunk = useCallback((base64Data) => {
    // 將 base64 解碼為 raw PCM bytes
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 加入播放佇列
    audioQueueRef.current.push(bytes);
    processAudioQueue();
  }, []);

  const processAudioQueue = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    setIsAiSpeaking(true);

    const bytes = audioQueueRef.current.shift();

    // 建立播放用的 AudioContext (24kHz 輸出)
    if (!playbackContextRef.current) {
      playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = playbackContextRef.current;

    // 轉成 Float32 陣列
    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      if (audioQueueRef.current.length > 0) {
        processAudioQueue();
      } else {
        setIsAiSpeaking(false);
      }
    };
    source.start();
  }, []);

  // ==========================================
  // WebSocket 連線管理
  // ==========================================
  const connectSession = useCallback(async (selectedScenario) => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setError('請先在右上角「設定」中輸入您的 Gemini API Key');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // 1. 建立 WebSocket
      const wsUrl = `${WS_BASE}?key=${apiKey}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket 已連線');

        // 2. 發送初始設定
        const scenarioPrompt = SCENARIO_PROMPTS[selectedScenario] || SCENARIO_PROMPTS['自由對話'];
        const fullPrompt = `${SYSTEM_PROMPT_BASE}\n\n目前的對話情境：${selectedScenario}\n${scenarioPrompt}`;

        const configMessage = {
          setup: {
            model: `models/${LIVE_MODEL}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Puck'
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: fullPrompt }]
            },
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false
              }
            },
            outputAudioTranscription: {},
            inputAudioTranscription: {}
          }
        };

        ws.send(JSON.stringify(configMessage));
        console.log('設定已發送');
      };

      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);

        // 處理設定完成
        if (response.setupComplete) {
          console.log('Live API 設定完成');
          setIsConnected(true);
          setIsConnecting(false);
          // 啟動麥克風
          startMicrophone();
          return;
        }

        // 處理伺服器內容
        if (response.serverContent) {
          const sc = response.serverContent;

          // 處理 AI 音訊回覆
          if (sc.modelTurn?.parts) {
            for (const part of sc.modelTurn.parts) {
              if (part.inlineData) {
                playAudioChunk(part.inlineData.data);
              }
            }
          }

          // 處理使用者語音轉文字
          if (sc.inputTranscription?.text) {
            const text = sc.inputTranscription.text;
            setCurrentUserText(prev => prev + text);
          }

          // 處理 AI 語音轉文字
          if (sc.outputTranscription?.text) {
            const text = sc.outputTranscription.text;
            setCurrentAiText(prev => prev + text);
          }

          // 當 AI 回合結束時，將暫存文字移到正式記錄
          if (sc.turnComplete) {
            setCurrentUserText(prev => {
              if (prev.trim()) {
                setTranscripts(t => [...t, { role: 'user', text: prev.trim() }]);
              }
              return '';
            });
            setCurrentAiText(prev => {
              if (prev.trim()) {
                setTranscripts(t => [...t, { role: 'ai', text: prev.trim() }]);
              }
              return '';
            });
          }
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket 錯誤:', e);
        setError('連線發生錯誤，請確認 API Key 是否正確');
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = (e) => {
        console.log('WebSocket 已關閉:', e.code, e.reason);
        setIsConnected(false);
        setIsConnecting(false);
        if (e.code !== 1000 && e.code !== 1005) {
          setError(`連線已中斷 (${e.code})，請重新開始`);
        }
      };
    } catch (err) {
      console.error('連線失敗:', err);
      setError(err.message || '連線失敗');
      setIsConnecting(false);
    }
  }, [playAudioChunk]);

  // ==========================================
  // 麥克風錄音 (AudioWorklet + PCM 16kHz)
  // ==========================================
  const startMicrophone = useCallback(async () => {
    try {
      // 取得麥克風權限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      // 建立 AudioContext (16kHz)
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      // 載入 AudioWorklet
      const blob = new Blob([AUDIO_WORKLET_CODE], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      await audioCtx.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      // 建立處理節點
      const source = audioCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtx, 'pcm-recorder-processor');
      workletNodeRef.current = workletNode;

      // 收到 PCM 資料時透過 WebSocket 送出
      workletNode.port.onmessage = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && !isMuted) {
          const pcmBuffer = e.data.pcmData;
          const uint8 = new Uint8Array(pcmBuffer);

          // 轉 base64
          let binary = '';
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64 = btoa(binary);

          const audioMessage = {
            realtimeInput: {
              mediaChunks: [{
                data: base64,
                mimeType: 'audio/pcm;rate=16000'
              }]
            }
          };
          wsRef.current.send(JSON.stringify(audioMessage));
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioCtx.destination); // 需要連接才能處理
      console.log('麥克風已啟動');
    } catch (err) {
      console.error('麥克風啟動失敗:', err);
      setError('無法取得麥克風權限，請允許瀏覽器使用麥克風');
    }
  }, [isMuted]);

  // ==========================================
  // 中斷連線
  // ==========================================
  const disconnectSession = useCallback(() => {
    // 關閉 WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }

    // 停止麥克風
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    // 關閉錄音 AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // 關閉播放 AudioContext
    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }

    // 清空音訊佇列
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    workletNodeRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
    setCurrentAiText('');
    setCurrentUserText('');
  }, []);

  // 開始情境
  const startScenario = useCallback((selectedScenario) => {
    setScenario(selectedScenario);
    setShowScenarios(false);
    setTranscripts([]);
    setError('');
    connectSession(selectedScenario);
  }, [connectSession]);

  // 重新開始
  const resetConversation = useCallback(() => {
    disconnectSession();
    setScenario(null);
    setShowScenarios(true);
    setTranscripts([]);
    setError('');
    setTextInput('');
  }, [disconnectSession]);

  // 發送文字訊息
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const msg = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text: textInput.trim() }]
        }],
        turnComplete: true
      }
    };
    wsRef.current.send(JSON.stringify(msg));
    setTranscripts(prev => [...prev, { role: 'user', text: textInput.trim() }]);
    setTextInput('');
  };

  // 切換靜音
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // ==========================================
  // 渲染 - 情境選擇畫面
  // ==========================================
  if (showScenarios) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">AI 即時口說練習</h2>
          <p className="text-slate-500 text-sm sm:text-base">選擇一個情境，直接和 AI 老師「打電話」練英文！</p>
          <p className="text-slate-400 text-xs mt-1">使用 Gemini Live API — 即時語音對話，延遲超低 ⚡</p>
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
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
      {/* 頂部 - 通話狀態列 */}
      <div className="bg-white rounded-t-2xl border border-slate-100 border-b-0 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">{SCENARIOS.find(s => s.id === scenario)?.icon}</span>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">{scenario}</h3>
          {isConnected && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              即時通話中
            </span>
          )}
          {isConnecting && (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              連線中...
            </span>
          )}
        </div>
        <button
          onClick={resetConversation}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>換情境</span>
        </button>
      </div>

      {/* 對話文字記錄區 */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white border-x border-slate-100 px-3 sm:px-4 py-4 space-y-3">
        {/* 歡迎提示 */}
        {transcripts.length === 0 && isConnected && !currentAiText && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-3">
              <Mic className="w-6 h-6 text-indigo-500" />
            </div>
            <p className="text-slate-500 text-sm">已連線！直接開口說英文吧 🎤</p>
            <p className="text-slate-400 text-xs mt-1">AI 老師正在聆聽，說什麼都可以</p>
          </div>
        )}

        {transcripts.map((t, idx) => (
          <div key={idx} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {t.role === 'ai' ? (
              <div className="max-w-[88%] sm:max-w-[80%]">
                <div className="bg-white rounded-2xl rounded-tl-md p-3 sm:p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs font-bold text-indigo-500">🎓 AI 老師</span>
                  </div>
                  <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">{t.text}</p>
                </div>
              </div>
            ) : (
              <div className="max-w-[80%] sm:max-w-[70%]">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
                  <p className="text-sm sm:text-base leading-relaxed">{t.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 即時 AI 文字 */}
        {currentAiText && (
          <div className="flex justify-start">
            <div className="max-w-[88%] sm:max-w-[80%]">
              <div className="bg-white rounded-2xl rounded-tl-md p-3 sm:p-4 shadow-sm border border-indigo-200">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs font-bold text-indigo-500">🎓 AI 老師</span>
                  {isAiSpeaking && <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />}
                </div>
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">{currentAiText}</p>
              </div>
            </div>
          </div>
        )}

        {/* 即時使用者文字 */}
        {currentUserText && (
          <div className="flex justify-end">
            <div className="max-w-[80%] sm:max-w-[70%]">
              <div className="bg-indigo-400/70 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
                <p className="text-sm sm:text-base leading-relaxed italic">{currentUserText}</p>
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

      {/* 底部 - 控制區 */}
      <div className="bg-white rounded-b-2xl border border-slate-100 border-t-0 p-3 sm:p-4 shadow-sm">
        {isConnected ? (
          <>
            <div className="flex items-center justify-center gap-4 mb-2">
              {/* 靜音/開麥 */}
              <button
                onClick={toggleMute}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
                  isMuted
                    ? 'bg-slate-200 text-slate-500'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-200 animate-pulse'
                }`}
                title={isMuted ? '開啟麥克風' : '靜音'}
              >
                {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>

              {/* 掛斷 */}
              <button
                onClick={resetConversation}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-200 transition-all active:scale-95"
                title="結束通話"
              >
                <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* 文字輸入 (備用) */}
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="也可以用打字的..."
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-slate-50 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="flex-shrink-0 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-40 active:scale-95 text-sm font-medium"
              >
                送出
              </button>
            </form>

            <p className="text-center text-slate-400 text-[10px] sm:text-xs mt-1.5">
              {isMuted ? '🔇 麥克風已靜音 — 點擊麥克風開啟' : '🎤 麥克風已開啟 — 直接說英文，AI 老師在聽'}
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            {isConnecting ? (
              <div className="flex items-center justify-center gap-2 text-indigo-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">正在連線到 AI 老師...</span>
              </div>
            ) : (
              <button
                onClick={() => connectSession(scenario)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all active:scale-95 shadow-md"
              >
                重新連線
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
