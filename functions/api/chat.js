// ==========================================
// AI 口說練習對話 API
// POST /api/chat
// Body: { messages: [...], scenario: "旅遊點餐", model: "..." }
// 回傳: { englishReply, chineseHint, suggestedSentence }
// ==========================================

// 各情境的開場白設定
const SCENARIO_STARTERS = {
  '旅遊點餐': {
    context: '你們現在在一間餐廳裡，學生剛坐下來，服務生（你）過來招呼。',
    opener: 'Hi there! Welcome to our restaurant. Here is the menu. What would you like to have today?'
  },
  '機場通關': {
    context: '你是機場的海關人員，學生正在通關入境。',
    opener: 'Hello! Welcome. May I see your passport, please?'
  },
  '購物': {
    context: '你是一間服飾店的店員，學生走進店裡。',
    opener: 'Hi! Welcome to our store. Are you looking for anything special today?'
  },
  '日常閒聊': {
    context: '你是學生的外國朋友，你們在咖啡廳碰面聊天。',
    opener: 'Hey! It\'s so nice to see you! How have you been?'
  },
  '自由對話': {
    context: '你和學生自由聊天，可以聊任何話題。',
    opener: 'Hi there! I\'m your English teacher. What would you like to talk about today? We can talk about anything you like!'
  }
};

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const body = await request.json();
    const { messages, scenario, model } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: '請提供對話訊息' }, { status: 400 });
    }

    const apiKey = request.headers.get('X-Gemini-Api-Key');
    if (!apiKey) {
      return Response.json({ error: '請先在設定中輸入您的 Gemini API Key' }, { status: 401 });
    }

    const aiModel = model || 'gemini-3-flash-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;

    // 取得情境設定
    const scenarioConfig = SCENARIO_STARTERS[scenario] || SCENARIO_STARTERS['自由對話'];

    // 組裝 System Prompt
    const systemPrompt = `你是一位超級有耐心的英文口說老師，正在和一個英文初學者進行即時對話練習。

目前的對話情境：${scenario || '自由對話'}
情境描述：${scenarioConfig.context}

你的教學風格：
1. 像爸爸/媽媽教小朋友說話一樣：溫柔、鼓勵、絕對不責怪
2. 學生可能只會說簡單的單字（例如 "water"、"hungry"、"go airport"），你要能理解他的意圖，並用完整但簡單的英文回覆
3. 每次回應都必須主動提出新問題或話題，引導對話繼續下去，不要讓對話冷場
4. 如果學生的英文有小錯誤，用中文溫柔地指出正確說法，例如：「你說得很好！不過更自然的說法是 "Can I have..." 而不是 "I want have..."」
5. 大量使用鼓勵性的詞彙開頭（"Great!", "Good job!", "Nice try!", "That's right!"）
6. 用簡單的英文，句子短一點，語速慢一點，適合初學者的程度
7. 保持對話在情境主題內，但如果學生想聊別的也可以配合

回覆格式要求（必須嚴格遵守 JSON 格式）：
- englishReply: 你用英文對學生說的話（語速慢、用字簡單、句子短）
- chineseHint: 用繁體中文解釋：(1) 你剛才說了什麼 (2) 如果學生剛剛有說錯的地方，指出正確說法 (3) 建議學生可以怎麼回應
- suggestedSentence: 給學生一個建議的英文回應句子，讓他可以練習念出來（要簡單、實用）`;

    // 把對話歷史轉成 Gemini API 格式
    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            englishReply: { type: "STRING", description: "英文回應（簡單、適合初學者）" },
            chineseHint: { type: "STRING", description: "繁體中文教學提示：翻譯 + 糾錯 + 引導" },
            suggestedSentence: { type: "STRING", description: "建議學生回覆的英文句子" }
          },
          required: ["englishReply", "chineseHint", "suggestedSentence"]
        },
        temperature: 0.8
      }
    };

    // 帶重試機制的 API 呼叫
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`API 回應錯誤: ${response.status} - ${errBody}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error('API 未回傳內容');

        const parsed = JSON.parse(text);
        return Response.json(parsed);
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  } catch (error) {
    console.error('對話 API 錯誤:', error);
    return Response.json(
      { error: error.message || '對話失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
