// dom.js — safe DOM construction helpers. We never assign raw HTML to element contents.
// - el()/h(): hyperscript for building elements from data (attrs & text are set safely).
// - mount()/clear(): swap children via replaceChildren.
// - fromTrustedHTML(): parse AUTHORED markup (our own markdown output / templates) with
//   DOMParser and return nodes. Used ONLY for content we author in this repo — never for
//   user-entered text. User input (e.g. notes) is always rendered with textContent.

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;           // safe text
    else if (k === 'html') node.append(fromTrustedHTML(v)); // trusted authored html only
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in node && k !== 'list') { try { node[k] = v; } catch { node.setAttribute(k, v); } }
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}
export const h = el;

export function clear(node) { node.replaceChildren(); return node; }
export function mount(node, ...children) { node.replaceChildren(...children.flat().filter(Boolean)); return node; }

// Parse a string of AUTHORED (trusted) markup into a DocumentFragment via DOMParser.
export function fromTrustedHTML(htmlString) {
  const doc = new DOMParser().parseFromString(`<body>${htmlString}</body>`, 'text/html');
  const frag = document.createDocumentFragment();
  frag.append(...doc.body.childNodes);
  return frag;
}
