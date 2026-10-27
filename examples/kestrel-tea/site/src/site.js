// Progressive enhancements only; every page is complete without JavaScript.
(() => {
  const toast = (text) => {
    const el = document.getElementById('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
  };
  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied ${label}`);
    } catch {
      toast('Copy failed. Select the text instead.');
    }
  };

  // Base URL for the brand files: the deployed SITE_URL if set, otherwise this page's folder.
  const base = document.querySelector('meta[name="site-url"]')?.content
    || new URL('.', location.href).href;
  const prompt = `Read the Kestrel Tea brand files at ${base}BRAND.md and ${base}DESIGN.md and follow them for anything you write or design for Kestrel Tea. Check the Claims section before stating any fact about the product.`;

  document.querySelectorAll('[data-ai]').forEach((a) => {
    const url = new URL(a.dataset.ai === 'claude' ? 'https://claude.ai/new' : 'https://chatgpt.com/');
    url.searchParams.set('q', prompt);
    a.href = url.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });

  document.addEventListener('click', (e) => {
    const hex = e.target.closest('[data-copy]');
    if (hex) copy(hex.dataset.copy, hex.dataset.copy);
    const from = e.target.closest('[data-copy-from]');
    if (from) copy(document.getElementById(from.dataset.copyFrom).textContent, 'to clipboard');
    if (e.target.closest('[data-copy-prompt]')) copy(prompt, 'prompt');
  });
})();
