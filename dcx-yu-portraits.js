(() => {
  'use strict';

  const moods = {
    normal: 'normal',
    fear: 'medo',
    embarrassed: 'envergonhada',
    anger: 'raiva',
    happy: 'feliz'
  };
  const requests = new Map();
  const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const normalizeMood = mood => Object.hasOwn(moods, mood) ? mood : 'normal';

  function render(id, mood = 'normal', preset = 'standard') {
    const current = document.getElementById(id);
    if (!current) return;

    mood = normalizeMood(mood);
    preset = String(preset || 'standard').toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'standard';
    const still = motionPreference?.matches || document.documentElement.dataset.dcxReducedMotion === 'true';
    const previous = requests.get(id);
    if (previous?.mood === mood && previous.preset === preset && previous.still === still) return;

    const next = new Image();
    const request = { mood, preset, still, pending: next };
    requests.set(id, request);
    previous?.pending?.removeAttribute('src');
    if (still && current.getAttribute('src')?.endsWith('.gif')) current.hidden = true;

    const standard = `yumiya-${moods[mood]}`;
    const variants = preset === 'standard' ? [standard] : [`yumiya-${preset}-${moods[mood]}`, standard];
    const candidates = variants.flatMap(base => still ? [`${base}.png`] : [`${base}.gif`, `${base}.png`]);
    if (mood === 'normal') candidates.push('yumiya-portrait.png');

    function tryNext() {
      if (requests.get(id) !== request) return;
      const src = candidates.shift();
      if (src) {
        next.src = src;
        return;
      }
      current.hidden = true;
      request.pending = null;
    }

    // Keep the current portrait until the replacement loads. A stale request
    // must never replace a newer reaction, even when a GIF loads slowly.
    next.onload = () => {
      if (requests.get(id) !== request) return;
      request.pending = null;
      next.onload = next.onerror = null;
      next.id = current.id;
      next.className = current.className;
      next.alt = current.alt;
      current.replaceWith(next);
    };
    next.onerror = tryNext;
    tryNext();
  }

  function refreshMotion() {
    for (const [id, { mood, preset }] of requests) render(id, mood, preset);
  }

  motionPreference?.addEventListener?.('change', refreshMotion);
  new MutationObserver(refreshMotion).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-dcx-reduced-motion']
  });

  window.OPH.YumiyaPortraits = { normalizeMood, render };
})();
