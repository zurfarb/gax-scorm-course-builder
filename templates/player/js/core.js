/* Shared helpers: DOM building, limited Markdown, icons, shuffling. */
(function (GAX) {
  'use strict';

  function escapeHtml(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Inline Markdown: **bold**, *italic*, [text](https://...). Input is escaped first,
   * so course text can never inject HTML; only http(s)/mailto links are allowed. */
  function inline(text) {
    var s = escapeHtml(text);
    s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
    return s;
  }

  /* Block Markdown: paragraphs separated by blank lines, "- " bullets, "1. " numbered lists. */
  function rich(text) {
    var chunks = String(text || '').replace(/\r\n?/g, '\n').split(/\n\s*\n/);
    var html = [];
    chunks.forEach(function (chunk) {
      var lines = chunk.split('\n').filter(function (l) { return l.trim() !== ''; });
      if (!lines.length) return;
      var bullet = /^\s*[-*]\s+/;
      var numbered = /^\s*\d+[.)]\s+/;
      var listType = bullet.test(lines[0]) ? 'ul' : numbered.test(lines[0]) ? 'ol' : null;
      if (listType) {
        var marker = listType === 'ul' ? bullet : numbered;
        var items = [];
        lines.forEach(function (line) {
          if (marker.test(line)) items.push(line.replace(marker, ''));
          else if (items.length) items[items.length - 1] += ' ' + line.trim();
        });
        html.push('<' + listType + '>' + items.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</' + listType + '>');
      } else {
        html.push('<p>' + lines.map(function (l) { return inline(l.trim()); }).join('<br>') + '</p>');
      }
    });
    return html.join('');
  }

  /* h('div', {class: 'x', onclick: fn}, [children]) */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === 'class') el.className = value;
        else if (key === 'html') el.innerHTML = value;
        else if (key === 'text') el.textContent = value;
        else if (key.indexOf('on') === 0 && typeof value === 'function') el.addEventListener(key.slice(2), value);
        else if (value === true) el.setAttribute(key, '');
        else el.setAttribute(key, value);
      });
    }
    append(el, children);
    return el;
  }

  function append(el, children) {
    if (children === undefined || children === null) return el;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c === undefined || c === null || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  var ICON_PATHS = {
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-5M12 8h.01"/>',
    tip: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>',
    warning: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    important: '<circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    cross: '<path d="M18 6 6 18M6 6l12 12"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    flip: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
  };

  function icon(name, cls) {
    var span = document.createElement('span');
    span.className = 'icon' + (cls ? ' ' + cls : '');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">' + (ICON_PATHS[name] || '') + '</svg>';
    return span;
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  var uid = 0;
  function nextId(prefix) { uid += 1; return (prefix || 'gax') + '-' + uid; }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function image(img, cls) {
    if (!img) return null;
    var fig = h('figure', { class: 'figure' + (cls ? ' ' + cls : '') }, [
      h('img', { src: img.src, alt: img.alt || '', loading: 'lazy' })
    ]);
    if (img.caption) fig.appendChild(h('figcaption', { html: inline(img.caption) }));
    return fig;
  }

  GAX.util = {
    escapeHtml: escapeHtml, inline: inline, rich: rich, h: h, append: append,
    icon: icon, shuffle: shuffle, nextId: nextId, image: image,
    prefersReducedMotion: prefersReducedMotion
  };
})(window.GAX = window.GAX || {});
