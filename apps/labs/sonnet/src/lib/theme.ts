// Executes before first paint. The timer is only for local theme boundaries.
export const THEME_SCRIPT = `(() => {
  let timer;
  function update() {
    const now = new Date();
    const hour = now.getHours();
    document.documentElement.dataset.theme = hour >= 6 && hour < 18 ? 'day' : 'night';
    const next = new Date(now);
    next.setHours(hour < 6 ? 6 : hour < 18 ? 18 : 30, 0, 0, 0);
    clearTimeout(timer);
    timer = setTimeout(update, next.getTime() - now.getTime() + 20);
  }
  update();
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.dataset.themeReady = 'true'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
})();`;
