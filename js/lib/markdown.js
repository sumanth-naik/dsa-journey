// Thin wrapper around the CDN `marked` global, with a safe fallback if it hasn't loaded.
export function md(text) {
  if (!text) return '';
  if (window.marked) {
    try { return window.marked.parse(text, { breaks: true }); } catch {}
  }
  // Fallback: escape + preserve paragraphs so content is still readable.
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}
