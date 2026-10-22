(() => {
  const install = document.getElementById('install-app');
  const help = document.getElementById('install-help');
  const status = document.getElementById('app-status');
  let promptEvent;
  const standalone = window.matchMedia('(display-mode: standalone)');
  function reflectMode() { install.hidden = standalone.matches; }
  reflectMode();
  standalone.addEventListener('change', reflectMode);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); promptEvent = event; install.hidden = standalone.matches;
  });
  install.addEventListener('click', async () => {
    if (!promptEvent) { help.hidden = !help.hidden; return; }
    const pending = promptEvent; promptEvent = null;
    try {
      await pending.prompt();
      const result = await pending.userChoice;
      if (result.outcome === 'accepted') { install.hidden = true; help.hidden = true; }
    } catch { help.hidden = false; }
  });
  window.addEventListener('appinstalled', () => { promptEvent = null; install.hidden = true; help.hidden = true; });
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js', {scope:'./',updateViaCache:'none'});
        // Never force a reload while the user is editing a loading plan.
        const ready = await navigator.serviceWorker.ready;
        if (ready.scope === registration.scope) status.textContent = 'Приложението е готово и за работа без интернет. За предложенията е нужна връзка.';
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) status.textContent = 'Има нова версия. Запази плана си и затвори всички прозорци на приложението, за да се обнови при следващото отваряне.';
          });
        });
      } catch { status.textContent = 'Офлайн режимът не е готов. При връзка с интернет сайтът работи нормално.'; }
    });
  }
})();
