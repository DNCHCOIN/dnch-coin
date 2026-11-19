const pageOrigin = 'https://dnchcoin.github.io';
const model = '@cf/meta/llama-3.1-8b-instruct-fp8-fast';
const agentModel = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const agentPrompt = [
  'You are the Bulgarian Truck Loader calculator assistant. Reply in concise Bulgarian.',
  'Return one JSON object with reply (string), calculate (boolean), cargo (array).',
  'Each cargo group is {length:number,width:number,height:number|null,unit:"mm"|"cm"|"m",quantity:integer,weightKg:number}.',
  'Add groups only if the user asks to enter them or supplies a shipment for calculation. A group needs length, width, unit, quantity and kilograms per piece. Height is optional. Read Bulgarian decimals and x/х/× and handle multiple groups. For EPAL 1 use 120 by 80 cm. If a weight is explicitly total, divide it by the quantity.',
  'If data is missing or ambiguous ask a specific question and return cargo:[] and calculate:false. Use previous user turns to resolve a follow-up. Do not guess weights or units.',
  'Set calculate:true if the user asks to arrange or compute loading meters, including when no new groups are needed. Use only NEW groups, never repeat groups the assistant already reported adding. For informational questions return cargo:[] and calculate:false.',
  'Never calculate or invent loading meters yourself. For an actionable response use reply:"". The website will run the calculator and report its result.',
].join(' ');
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
  const {messages, calculatorAgent} = JSON.parse(text + decoder.decode());
  if (!Array.isArray(messages) || !messages.length || messages.length > 7) return null;
  if (messages.at(-1)?.role !== 'user') return null;
  if (messages.some(item => !item || !['user', 'assistant'].includes(item.role) ||
      typeof item.content !== 'string' || !item.content.trim() || item.content.length > 2400)) return null;
  return {messages: messages.map(({role, content}) => ({role, content})), calculatorAgent: calculatorAgent === true};
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

    let payload;
    try {
      payload = await readMessages(request);
    } catch {
      return json(400, {error: 'invalid'});
    }
    if (!payload) return json(400, {error: 'invalid'});
    const {messages, calculatorAgent} = payload;

    try {
      if (calculatorAgent) {
        const {response} = await env.AI.run(agentModel, {
          messages: [{role: 'system', content: agentPrompt}, ...messages],
          response_format: {type: 'json_object'},
          temperature: 0.1,
          max_tokens: 1600,
        });
        const action = typeof response === 'string' ? JSON.parse(response) : response;
        if (!action || !Array.isArray(action.cargo) || typeof action.calculate !== 'boolean' ||
            typeof action.reply !== 'string') return json(502, {error: 'invalid_output'});
        return json(200, {reply: action.reply.slice(0, 2400), cargo: action.cargo, calculate: action.calculate});
      }

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
