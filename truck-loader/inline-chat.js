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
      let body = JSON.stringify({messages: context});
      while (context.length > 1 && encoder.encode(body).byteLength > 12000) {
        context.splice(0, 2);
        body = JSON.stringify({messages: context});
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
      const {reply} = await response.json();
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
