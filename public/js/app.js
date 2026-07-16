// AGRICHAIN 360 — Client-side Application Logic
// Additional interactive features beyond inline scripts

console.log('%c[AGRICHAIN 360] Client scripts loaded successfully.', 'color:#2E7D32');

// Global search handler
document.addEventListener('DOMContentLoaded', () => {
  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch) {
    globalSearch.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        const q = encodeURIComponent(this.value.trim());
        window.location.href = `/marketplace?q=${q}`;
      }
    });
  }
});

// Keyboard shortcut for search focus
document.addEventListener('keydown', function(e) {
  if (e.key === '/' && document.activeElement.tagName === 'BODY') {
    e.preventDefault();
    const search = document.getElementById('globalSearch');
    if (search) search.focus();
  }
});

// Easter egg: console command
window.AGRICHAIN = {
  version: '1.0.0',
  author: 'Batesa Ibrahim',
  contact: '0746022547'
};