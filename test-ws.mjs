// 最小化 Live API 連線測試腳本
// 用法: node test-ws.mjs <API_KEY>

import WebSocket from 'ws';

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error('請提供 API Key: node test-ws.mjs <YOUR_API_KEY>');
  process.exit(1);
}

const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

// 依序測試這些模型
const MODELS_TO_TEST = [
  'gemini-3.1-flash-live-preview',
  'gemini-2.0-flash-live-001',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
];

async function testModel(modelName) {
  return new Promise((resolve) => {
    console.log(`\n--- 測試模型: ${modelName} ---`);
    const wsUrl = `${WS_BASE}?key=${API_KEY}`;
    const ws = new WebSocket(wsUrl);

    const timeout = setTimeout(() => {
      console.log(`  ⏰ 超時，關閉連線`);
      ws.close();
      resolve(false);
    }, 10000);

    ws.on('open', () => {
      console.log(`  ✅ WebSocket 已連線`);

      // 用最精簡的設定
      const msg = {
        setup: {
          model: `models/${modelName}`,
          generationConfig: {
            responseModalities: ['AUDIO'],
          }
        }
      };
      console.log(`  📤 發送設定: ${JSON.stringify(msg)}`);
      ws.send(JSON.stringify(msg));
    });

    ws.on('message', (data) => {
      const response = JSON.parse(data.toString());
      if (response.setupComplete) {
        console.log(`  🎉 setupComplete 成功！此模型可用！`);
        clearTimeout(timeout);
        ws.close(1000);
        resolve(true);
      } else if (response.error) {
        console.log(`  ❌ API 錯誤:`, JSON.stringify(response.error));
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      } else {
        console.log(`  📩 收到訊息:`, JSON.stringify(response).substring(0, 200));
      }
    });

    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      const reasonStr = reason ? reason.toString() : '(無原因)';
      console.log(`  🔌 連線關閉: code=${code}, reason=${reasonStr}`);
      resolve(false);
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      console.log(`  💥 錯誤:`, err.message);
      resolve(false);
    });
  });
}

async function main() {
  console.log('=== Gemini Live API 模型連線測試 ===');
  console.log(`API Key: ${API_KEY.substring(0, 8)}...`);

  for (const model of MODELS_TO_TEST) {
    const success = await testModel(model);
    if (success) {
      console.log(`\n✅ 找到可用模型: ${model}`);
      
      // 再測試帶 System Prompt 的版本
      console.log(`\n--- 再測試帶 System Prompt 的 ${model} ---`);
      const success2 = await testModelWithPrompt(model);
      if (success2) {
        console.log(`✅ 帶 System Prompt 也正常！`);
      } else {
        console.log(`⚠️  帶 System Prompt 會失敗 → System Prompt 太長！`);
      }
      break;
    }
  }
}

async function testModelWithPrompt(modelName) {
  return new Promise((resolve) => {
    const wsUrl = `${WS_BASE}?key=${API_KEY}`;
    const ws = new WebSocket(wsUrl);

    const timeout = setTimeout(() => {
      ws.close();
      resolve(false);
    }, 10000);

    ws.on('open', () => {
      const msg = {
        setup: {
          model: `models/${modelName}`,
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
            parts: [{ text: 'You are a patient English teacher. Speak simple English. After each response, add a brief Chinese translation.' }]
          }
        }
      };
      ws.send(JSON.stringify(msg));
    });

    ws.on('message', (data) => {
      const response = JSON.parse(data.toString());
      if (response.setupComplete) {
        console.log(`  🎉 帶 Prompt 的 setupComplete 成功！`);
        clearTimeout(timeout);
        ws.close(1000);
        resolve(true);
      } else if (response.error) {
        console.log(`  ❌ 帶 Prompt 的 API 錯誤:`, JSON.stringify(response.error));
        clearTimeout(timeout);
        ws.close();
        resolve(false);
      }
    });

    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      console.log(`  🔌 帶 Prompt 連線關閉: code=${code}, reason=${reason?.toString() || '(無)'}`);
      resolve(false);
    });

    ws.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

main();
