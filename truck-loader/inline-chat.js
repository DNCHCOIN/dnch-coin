'use strict';
(() => {
  const panel = document.querySelector('.inline-chat');
  const endpoint = panel.dataset.chatEndpoint;
  const form = panel.querySelector('form');
  const input = panel.querySelector('textarea');
  const button = form.querySelector('button');
  const log = panel.querySelector('.inline-chat-log');
  const status = panel.querySelector('.inline-chat-status');
  const messages = [];

  function updateStatus(message, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
  }

  function appendMessage(role, text) {
    const item = document.createElement('li');
    item.dataset.role = role;
    const author = document.createElement('strong');
    author.textContent = role === 'user' ? 'Ти' : 'AI';
    const content = document.createElement('p');
    content.textContent = text;
    item.append(author, content);
    log.append(item);
    log.scrollTop = log.scrollHeight;
  }

  async function applyAction({reply, cargo = [], calculate = false}) {
    if (!Array.isArray(cargo) || cargo.length > 100 || typeof calculate !== 'boolean') throw new Error('INVALID');
    if (!cargo.length && !calculate) return reply;

    const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
    if (cargo.some(group => !group || !positive(group.length) || !positive(group.width) ||
        !['mm', 'cm', 'm'].includes(group.unit) || !Number.isInteger(group.quantity) ||
        group.quantity < 1 || group.quantity > 100 ||
        (group.weightKg != null && !positive(group.weightKg)) ||
        (group.height != null && !positive(group.height)))) {
      return 'Провери броя, мерните единици, размерите и теглото за всяка група и ги изпрати отново.';
    }

    const missingWeight = cargo.filter(group => group.weightKg == null);
    if (missingWeight.length) {
      const units = {mm: 'мм', cm: 'см', m: 'м'};
      const groups = missingWeight.map(group =>
        group.quantity + ' бр. × ' + group.length + ' × ' + group.width + ' ' + units[group.unit]);
      return 'Колко килограма тежи една бройка от всяка от тези групи? ' + groups.join(', ') + '.';
    }

    const solve = document.getElementById('solve');
    if (solve.disabled) return 'Калкулаторът вече подрежда товарите. Изчакай резултата и опитай отново.';
    const current = state();
    const empty = row => [row.l, row.w, row.height, row.weight, row.totalWeight].every(value => !value.trim());
    const existing = current.rows.filter(row => !empty(row));
    const incoming = cargo.reduce((sum, group) => sum + group.quantity, 0);
    if (incoming && existing.reduce((sum, row) => sum + Number(row.q), incoming) > 100) {
      return 'Калкулаторът приема до 100 товара общо. Намали броя, за да ги добавя.';
    }
    if (current.stacking && cargo.some(group => group.height == null)) {
      return 'Включено е товарене един върху друг. Каква е височината на всяка група?';
    }
    if (!incoming && !existing.length) return 'Първо въведи или изпрати размерите, броя и теглото на товарите.';

    if (cargo.length) {
      const rows = document.getElementById('rows');
      [...rows.children].forEach((row, index) => {
        if (empty(current.rows[index])) row.remove();
      });
      cargo.forEach(group => add({
        name: 'Товар ' + (rows.children.length + 1),
        l: group.length, w: group.width, height: group.height,
        unit: group.unit, q: group.quantity, weight: group.weightKg, rotate: true,
      }));
      changed();
    }

    const added = incoming ? 'Добавих ' + incoming + ' бр. в ' + cargo.length + ' реда. ' : '';
    if (!calculate) return added.trim();

    run();
    if (solve.disabled) {
      await new Promise(resolve => {
        const observer = new MutationObserver(() => {
          if (solve.disabled) return;
          observer.disconnect();
          resolve();
        });
        observer.observe(solve, {attributes: true, attributeFilter: ['disabled']});
      });
    }
    const used = document.getElementById('used').textContent;
    const remaining = document.getElementById('remaining');
    const resultStatus = document.getElementById('status').textContent;
    if (used === '—') return added + resultStatus;
    const overflow = remaining.nextElementSibling.textContent.includes('извън');
    return added + 'По плана: ' + used + ' л.м. заети или резервирани. ' +
      (overflow ? 'Извън ремаркето: ' : 'Свободни: ') + remaining.textContent + ' л.м.';
  }

  if (!endpoint) {
    button.disabled = true;
    updateStatus('AI чатът още не е свързан.');
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question || button.disabled) return;
    button.disabled = true;
    input.readOnly = true;
    updateStatus('AI подготвя отговор…');

    try {
      const context = [...messages.slice(-6), {role: 'user', content: question}];
      const encoder = new TextEncoder();
      let body = JSON.stringify({messages: context, calculatorAgent: true});
      while (context.length > 1 && encoder.encode(body).byteLength > 12000) {
        context.splice(0, 2);
        body = JSON.stringify({messages: context, calculatorAgent: true});
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body,
        signal: AbortSignal.timeout(25000),
        credentials: 'omit',
      });
      if (response.status === 429) throw new Error('LIMIT');
      if (!response.ok) throw new Error('UNAVAILABLE');
      const reply = await applyAction(await response.json());
      if (typeof reply !== 'string' || !reply.trim()) throw new Error('EMPTY');

      messages.push({role: 'user', content: question}, {role: 'assistant', content: reply});
      if (messages.length > 8) messages.splice(0, messages.length - 8);
      appendMessage('user', question);
      appendMessage('assistant', reply);
      input.value = '';
      updateStatus('');
    } catch (error) {
      updateStatus(error.message === 'LIMIT' ? 'Достигнат е лимитът за заявки. Опитай отново по-късно.' : 'Чатът не отговори. Въпросът ти остава в полето.', true);
    } finally {
      button.disabled = false;
      input.readOnly = false;
      input.focus();
    }
  });
})();
