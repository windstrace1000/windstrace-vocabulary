// ==========================================
// Gemini AI 搜尋代理 - 保護 API Key 不暴露在前端
// POST /api/search
// Body: { word: "example" }
// ==========================================

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { word, model } = body;

    if (!word || !word.trim()) {
      return Response.json({ error: '請提供要查詢的單字' }, { status: 400 });
    }

    const apiKey = request.headers.get('X-Gemini-Api-Key');
    if (!apiKey) {
      return Response.json({ error: '請先在設定中輸入您的 Gemini API Key' }, { status: 401 });
    }

    const aiModel = model || 'gemini-3-flash-preview'; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`;

    // === 全域快取：先檢查資料庫是否已經有這個單字或片語的紀錄 ===
    if (env.DB) {
      try {
        const cleanWord = word.trim().toLowerCase();
        const isChinese = /[\u4e00-\u9fa5]/.test(cleanWord);
        
        if (!isChinese) {
          const { results } = await env.DB.prepare(
            'SELECT * FROM vocabulary WHERE word = ? LIMIT 1'
          ).bind(cleanWord).all();
          
          if (results && results.length > 0) {
            const row = results[0];
            return Response.json({
              word: row.word,
              translation: row.translation,
              partOfSpeech: row.part_of_speech,
              candidates: [{ word: row.word, translation: row.translation }],
              relatedForms: JSON.parse(row.related_forms || '[]'),
              similarWords: JSON.parse(row.similar_words || '[]'),
              relatedPhrases: JSON.parse(row.related_phrases || '[]'),
              exampleSentence: row.example_sentence,
              exampleTranslation: row.example_translation,
              teacherExplanation: row.teacher_explanation || ''
            });

          }
        }

      } catch (dbError) {
        console.error('資料庫快取查詢內容:', dbError);
        // 若查詢失敗則繼續透過 Gemini API 查詢，不中斷流程
      }
    }
    // ===============================================

    const prompt = `請以專業英文老師的角色分析 "${word.trim()}"。
1. 如果輸入是中文：
   - 請找出其對應的 3-5 個常用的英文單字或片語。
   - 將「最貼切或最常用」的一個單字作為主分析對象，填入下方 JSON 的其餘欄位。
   - 將所有可能的英文選項（包含主分析對象）填入 "candidates" 陣列中，每個項目包含英文與簡短解釋。
2. 如果輸入是英文單字，請分析該單字，"candidates" 陣列中只需包含該單字本身。
3. 如果輸入是英文片語，請分析該片語，"candidates" 陣列中只需包含該片語本身。

請提供該英文單字/片語的繁體中文翻譯、以及主要的詞性（請使用繁體中文，如：名詞、動詞、形容詞、副詞、介系詞、代名詞、連接詞、感嘆詞、助動詞、片語等）、相關詞形變化（衍生字）、拼寫相似或容易混淆的單字（形似字）、至少 2 個相關英文片語與其翻譯，以及一個實用的英文例句和翻譯。
請額外加上一段『老師講解』(teacherExplanation)。用親切的英文老師口吻（開頭為：各位同學好！我是你們的英文老師。今天我們要來仔細學習一個生活中非常實用、出現頻率極高的單字...），包含：
(5) 常見搭配詞或片語（Collocations），並附上中文意思。

這段內容請「嚴格依照以下結構與格式」排版：
1. **開頭引言**：使用親切的口吻（如：各位同學好！我是你們的英文老師...）。
2. **區塊分隔**：在每個大項目之間（如 1. 跟 2. 之間）務必插入 \`---\` 分隔線。
3. **具體章節內容**（請使用數字標題，例如 1. 、 2. 等）：
   - **1. KK音標與詞性**：包含單字、KK音標與詞性分類。
   - **2. 繁體中文解釋**：包含詳細解釋與 (老師的小叮嚀)。
   - **3. 3個情境英文例句**：請使用「情境：...」作為引導，並附上例句與中文。
   - **4. 同義詞與反義詞**：請使用 🟢 同義詞 (Synonyms) 與 🔴 反義詞 (Antonyms) 標籤。**不需要提供音標**（格式如：**abrupt** (adj.) 突然的）。
   - **5. 常見搭配詞或片語**：請使用 ✨ 必背片語、🔗 常見搭配名詞 等圖示標記。**不需要提供音標**（格式如：**break up** (v. phr.) 破碎、分手）。
4. **結尾鼓勵**：一段簡單的鼓勵。

格式細節要求：
- **項目標題獨立行**：每個大項目標題（如 1. 、 2. 等）務必「單獨佔據第一行」，且後方若有內容必須「強制換行」。
- **繁體中文解釋換行**：解釋文字中，只要遇到「句號(。)」就必須立即換行。
- **實用英文例句拆分**：每個例句的「情境」、「英文」、「中文翻譯」都必須「分開佔據三行」，且「每組情境例句之間務必空一行」。
- **列表項獨立行**：同義詞、反義詞、搭配詞、片語，每項內容都必須「單獨一行」，不准併排。格式應統一為：**單字** (詞性) 中文解釋。
- **標示強調**：標題請使用 **粗體**。重要內容請適度使用 **粗體** 或 \`<u>\`底線\`</u>\`。
- **視覺重心**：確保標題號碼（1. 2.等）下方不要有文字遮擋（透過前端組件達成，AI 僅需確保換行邏輯正確）。
- 請確保排版空間感十足，視覺上極度清晰，例句之間一定要有明顯的空行。`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: "你是一個嚴謹的英文老師，請務必完全依照要求的 JSON 格式回傳。所有詞性標記 (partOfSpeech) 必須使用繁體中文。相關片語 (relatedPhrases) 應包含 2-3 個該單字的常見短語搭配。" }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            word: { type: "STRING", description: "主要分析的英文單字" },
            translation: { type: "STRING", description: "主要分析單字的翻譯" },
            partOfSpeech: { type: "STRING" },
            candidates: {
              type: "ARRAY",
              description: "其他可能的英文單字及其繁體中文解釋",
              items: {
                type: "OBJECT",
                properties: {
                  word: { type: "STRING" },
                  translation: { type: "STRING", description: "針對此單字的具體翻譯" }
                },
                required: ["word", "translation"]
              }
            },
            relatedForms: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  formName: { type: "STRING" },
                  formWord: { type: "STRING" }
                }
              }
            },
            similarWords: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  word: { type: "STRING" },
                  meaning: { type: "STRING" }
                }
              }
            },
            relatedPhrases: {
              type: "ARRAY",
              description: "該單字常見的 2-3 個英文片語與翻譯",
              items: {
                type: "OBJECT",
                properties: {
                  phrase: { type: "STRING", description: "英文片語" },
                  meaning: { type: "STRING", description: "繁體中文意思" }
                }
              }
            },
            exampleSentence: { type: "STRING" },
            exampleTranslation: { type: "STRING" },
            teacherExplanation: { type: "STRING", description: "老師的詳細講解內容" }
          },
          required: ["word", "translation", "partOfSpeech", "candidates", "relatedForms", "similarWords", "relatedPhrases", "exampleSentence", "exampleTranslation", "teacherExplanation"]
        }
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
    console.error('搜尋 API 錯誤:', error);
    return Response.json(
      { error: error.message || '查詢失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
