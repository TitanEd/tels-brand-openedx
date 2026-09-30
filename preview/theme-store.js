// Theme templates ({ themes, selected, previewing }, see theme-template.js) and uploaded fonts ([{ family, weight, style, file }]),
// kept by the preview server in saved-theme/ (scripts/saved-theme.js). Like token-store.js, the page only talks to
// these objects, so another backend only has to accept and return the same data.
async function request(url, options) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  if (!response.ok) { throw new Error(`${options?.method || 'GET'} ${url}: ${response.status} ${await response.text()}`); }
  return response.json();
}

export const themeStore = {
  load: () => request('/api/themes'),
  save: ({ themes, selected, previewing }) => request('/api/themes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ themes, selected: selected ?? null, previewing: previewing ?? null }),
  }),
};

export const fontStore = {
  list: () => request('/api/fonts'),
  /** Uploads `file` as { family, weight, style } and returns the stored font. */
  upload: (file, { family, weight, style }) => request(`/api/fonts?${new URLSearchParams({ family, weight, style })}`, {
    method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file,
  }),
  url: (font) => `/uploaded-fonts/${encodeURIComponent(font.file)}`,
};
