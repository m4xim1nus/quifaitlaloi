// Markdown minimal des récits (recits/*.md) : paragraphes, **gras**, *italique* et liens
// [texte](url). Le texte est échappé avant toute balise : le résultat se rend avec {@html}.

const ECHAPPE: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const echapper = (t: string) => t.replace(/[&<>"]/g, (c) => ECHAPPE[c]);

/** Une ligne de texte en HTML (sans paragraphe). */
export function enLigne(texte: string): string {
  return echapper(texte)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t: string, url: string) =>
      /^(https?:|\/)/.test(url)
        ? `<a href="${url}"${url.startsWith('http') ? ' rel="external"' : ''}>${t}</a>`
        : t
    );
}

/** Des paragraphes (séparés par une ligne vide) en HTML. */
export function paragraphes(texte: string): string {
  return texte
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${enLigne(p.replace(/\s*\n\s*/g, ' '))}</p>`)
    .join('');
}
