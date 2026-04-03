import WebSocket from 'ws';

const API_KEY = process.argv[2];
const LIVE_MODEL = 'gemini-2.0-flash-exp';
const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const wsUrl = `${WS_BASE}?key=${API_KEY}`;
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
    console.log('connected');
    const msg = {
        setup: {
            model: `models/${LIVE_MODEL}`,
            generationConfig: {
              responseModalities: ["AUDIO"]
            }
        }
    };
    ws.send(JSON.stringify(msg));
});

ws.on('message', (data) => {
    console.log('msg:', data.toString());
});

ws.on('close', (code, reason) => {
    console.log('close:', code, reason.toString());
});

ws.on('error', (err) => {
    console.log('err:', err);
});
