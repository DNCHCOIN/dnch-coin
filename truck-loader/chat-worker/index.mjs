const pageOrigin = 'https://dnchcoin.github.io';
const model = '@cf/meta/llama-3.1-8b-instruct-fp8-fast';
const byteLimit = 12000;
const systemPrompt = [
  'Ти си помощник към калкулатора за товарене Truck Loader. Отговаряй кратко на български.',
  'Помагай с палети, размери и разпределение. Поискай липсващите размери и тегла.',
  'Справочен факт: отпечатъкът на EPAL 1 е 1200 × 800 mm. EPAL обозначава дължина 800 mm и ширина 1200 mm. При товарене ориентацията на палета определя коя страна е по дължината на ремаркето.',
  'Нямаш достъп до данните в калкулатора. Не твърди, че си проверил разпределение, осово натоварване или обезопасяване.',
  'Напомняй за проверка на важните изчисления и ограничения с калкулатора и отговорника за товара.',
].join(' ');

const cors = {
  'Access-Control-Allow-Origin': pageOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
  Vary: 'Origin',
};

function json(status, value) {
  return Response.json(value, {status, headers: cors});
}

async function readMessages(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > byteLimit) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, {stream: true});
  }
  const {messages} = JSON.parse(text + decoder.decode());
  if (!Array.isArray(messages) || !messages.length || messages.length > 7) return null;
  if (messages.at(-1)?.role !== 'user') return null;
  if (messages.some(item => !item || !['user', 'assistant'].includes(item.role) ||
      typeof item.content !== 'string' || !item.content.trim() || item.content.length > 2400)) return null;
  return messages.map(({role, content}) => ({role, content}));
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/chat') return new Response('Not found', {status: 404});
    if (request.headers.get('Origin') !== pageOrigin) return new Response('Forbidden', {status: 403});
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: cors});
    if (request.method !== 'POST') return json(405, {error: 'method'});
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json(415, {error: 'type'});

    try {
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip || !env.CHAT_LIMIT || !env.AI) return json(503, {error: 'unavailable'});
      const {success} = await env.CHAT_LIMIT.limit({key: ip});
      if (!success) return json(429, {error: 'limit'});
    } catch {
      return json(503, {error: 'unavailable'});
    }

    let messages;
    try {
      messages = await readMessages(request);
    } catch {
      return json(400, {error: 'invalid'});
    }
    if (!messages) return json(400, {error: 'invalid'});

    try {
      const result = await env.AI.run(model, {
        messages: [{role: 'system', content: systemPrompt}, ...messages],
        max_tokens: 450,
      });
      const reply = result?.response?.trim();
      return reply ? json(200, {reply: reply.slice(0, 2400)}) : json(502, {error: 'unavailable'});
    } catch {
      return json(502, {error: 'unavailable'});
    }
  },
};
