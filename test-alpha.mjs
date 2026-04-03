import WebSocket from 'ws';

const KEY = process.argv[2];
const endpoints = [
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'
];

const models = [
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash-live-preview',
  'gemini-3.1-flash-live-preview',
  'gemini-2.0-flash'
];

async function test(ep, model) {
  console.log(`\nTesting ${model} on ${ep.includes('v1alpha') ? 'v1alpha' : 'v1beta'}`);
  return new Promise((resolve) => {
    const ws = new WebSocket(`${ep}?key=${KEY}`);
    const timeout = setTimeout(() => { ws.close(); console.log('Timeout'); resolve(); }, 3000);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        setup: {
          model: `models/${model}`,
          generationConfig: { responseModalities: ['AUDIO'] }
        }
      }));
    });
    ws.on('message', d => { console.log(d.toString()); clearTimeout(timeout); resolve(); });
    ws.on('close', (c, r) => { console.log(c, r.toString()); clearTimeout(timeout); resolve(); });
    ws.on('error', e => { console.log(e.message); clearTimeout(timeout); resolve(); });
  });
}

(async () => {
  for (const ep of endpoints) {
    for (const model of models) {
      await test(ep, model);
    }
  }
})();
