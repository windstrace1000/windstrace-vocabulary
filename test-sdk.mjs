import { GoogleGenAI } from '@google/genai';

const apiKey = process.argv[2];
const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
    console.log('Connecting to Live API...');
    const session = await ai.live.connect({
      model: "gemini-2.0-flash-exp",
      config: {
        responseModalities: ["AUDIO"],
      }
    });
    console.log('Connected! Waiting for events...');
    for await (const message of session.receive()) {
      console.log('Message:', JSON.stringify(message));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
