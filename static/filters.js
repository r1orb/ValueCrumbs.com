// Filter pills + search for ValueCrumbs lists. No dependencies.
// A toolbar with data-filter-scope="X" filters the [data-group] items inside #X.
document.querySelectorAll('[data-filter-scope]').forEach(function (toolbar) {
  var scope = toolbar.getAttribute('data-filter-scope');
  var list = document.getElementById(scope);
  if (!list) return;
  var items = list.querySelectorAll('[data-group]');
  var pills = toolbar.querySelectorAll('[data-filter]');
  var search = toolbar.querySelector('[data-search]');
  var empty = document.querySelector('[data-empty-for="' + scope + '"]');
  var group = 'all';

  function apply() {
    var q = search ? search.value.trim().toLowerCase() : '';
    var shown = 0;
    items.forEach(function (el) {
      var okGroup = group === 'all' || el.getAttribute('data-group') === group;
      var okText = !q || (el.getAttribute('data-search') || '').indexOf(q) !== -1;
      var visible = okGroup && okText;
      el.hidden = !visible;
      if (visible) shown++;
    });
    if (empty) empty.hidden = shown > 0 || items.length === 0;
  }

  pills.forEach(function (btn) {
    btn.addEventListener('click', function () {
      group = btn.getAttribute('data-filter');
      pills.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      apply();
    });
  });
  if (search) search.addEventListener('input', apply);
});

// Ranking buttons: [data-sort-for="X"] reorders the children of #X by their data-sort-<key> attribute
// (largest first, or A-Z with data-sort-asc) and renumbers their [data-rank] element.
document.querySelectorAll('[data-sort-for]').forEach(function (group) {
  var list = document.getElementById(group.getAttribute('data-sort-for'));
  if (!list) return;
  var buttons = group.querySelectorAll('[data-sort]');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = 'data-sort-' + btn.getAttribute('data-sort');
      var asc = btn.hasAttribute('data-sort-asc');
      var items = Array.prototype.filter.call(list.children, function (el) { return el.hasAttribute(key); });
      items.sort(function (a, b) {
        var x = a.getAttribute(key), y = b.getAttribute(key);
        return asc ? x.localeCompare(y) : y.localeCompare(x);
      });
      items.forEach(function (el, i) {
        list.appendChild(el);
        var rank = el.querySelector('[data-rank]');
        if (rank) rank.textContent = (rank.textContent.charAt(0) === '#' ? '#' : '') + (i + 1);
      });
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
    });
  });
});

// Featured YouTube video: nothing is loaded from YouTube until the visitor clicks play.
document.querySelectorAll('.player[data-embed]').forEach(function (box) {
  var btn = box.querySelector('.player-facade');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = box.getAttribute('data-embed');
    f.title = box.getAttribute('data-title') || 'YouTube video';
    f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.allowFullscreen = true;
    box.replaceChildren(f);
  });
});

// Stock-page price chart: TradingView loads only after the visitor clicks (no third-party requests before).
document.querySelectorAll('.tv-box[data-tv-symbol]').forEach(function (box) {
  var btn = box.querySelector('.tv-facade');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var symbol = box.getAttribute('data-tv-symbol');
    var wrap = document.createElement('div');
    wrap.className = 'tradingview-widget-container';
    var inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    var credit = document.createElement('div');
    credit.className = 'tradingview-widget-copyright';
    var a = document.createElement('a');
    a.href = box.getAttribute('data-tv-url');
    a.rel = 'noopener nofollow';
    a.target = '_blank';
    a.textContent = symbol + ' chart by TradingView';
    credit.appendChild(a);
    var s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    s.async = true;
    s.textContent = JSON.stringify({
      autosize: true, symbol: symbol, interval: 'W', timezone: 'exchange', theme: 'light', style: '3',
      backgroundColor: 'rgba(255, 255, 255, 1)', hide_side_toolbar: true, allow_symbol_change: false,
      save_image: false, calendar: false, locale: 'en', support_host: 'https://www.tradingview.com'
    });
    wrap.appendChild(inner);
    wrap.appendChild(credit);
    wrap.appendChild(s);
    box.classList.add('is-loaded');
    box.replaceChildren(wrap);
  });
});

// Position history: the sparkline button opens a row with the weight (bars) and shares (line) per quarter.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, text) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function fmtShares(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(Math.round(n));
  }
  function chart(rows, width) {
    var W = Math.max(320, Math.min(720, Math.round(width || 640))), H = W < 480 ? 200 : 220, L = 44, R = 56, T = 16, B = 30, n = rows.length;
    var maxW = Math.max.apply(null, rows.map(function (r) { return r.w; })) || 1;
    var maxS = Math.max.apply(null, rows.map(function (r) { return r.s; })) || 1;
    var step = (W - L - R) / n, bw = Math.min(34, step * 0.6);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'hist-chart', role: 'img',
      'aria-label': 'Portfolio weight and shares held, quarter by quarter' });
    [0, 0.5, 1].forEach(function (f) {
      var y = T + (H - T - B) * (1 - f);
      svg.appendChild(el('line', { x1: L, x2: W - R, y1: y, y2: y, class: 'grid' }));
      svg.appendChild(el('text', { x: L - 6, y: y + 4, class: 'axis', 'text-anchor': 'end' }, (maxW * f).toFixed(1) + '%'));
      svg.appendChild(el('text', { x: W - R + 6, y: y + 4, class: 'axis axis-shares' }, fmtShares(maxS * f)));
    });
    var pts = [];
    rows.forEach(function (r, i) {
      var cx = L + step * i + step / 2;
      var h = (H - T - B) * r.w / maxW, y = T + (H - T - B) - h;
      var bar = el('rect', { x: cx - bw / 2, y: y, width: bw, height: Math.max(h, r.w > 0 ? 1.5 : 0), rx: 3,
        class: i === n - 1 ? 'bar bar-last' : 'bar' });
      bar.appendChild(el('title', {}, r.q + ': ' + r.w.toFixed(2) + '% of portfolio, ' + fmtShares(r.s) + ' shares'));
      svg.appendChild(bar);
      if ((n - 1 - i) % Math.ceil(48 / step) === 0)
        svg.appendChild(el('text', { x: cx, y: H - 10, class: 'axis', 'text-anchor': 'middle' }, r.q.replace(' 20', " '")));
      pts.push([cx, T + (H - T - B) * (1 - r.s / maxS)]);
    });
    svg.appendChild(el('polyline', { points: pts.map(function (p) { return p.join(','); }).join(' '), class: 'shares-line' }));
    pts.forEach(function (p, i) {
      var c = el('circle', { cx: p[0], cy: p[1], r: 3.5, class: 'shares-dot' });
      c.appendChild(el('title', {}, rows[i].q + ': ' + fmtShares(rows[i].s) + ' shares'));
      svg.appendChild(c);
    });
    return svg;
  }
  function table(rows) {
    var t = document.createElement('table');
    t.className = 'hist-table mono';
    var head = '<thead><tr><th>Quarter</th><th class="num">% of portfolio</th><th class="num">Shares</th><th class="num">Change</th></tr></thead>';
    var body = rows.slice().reverse().map(function (r, i, arr) {
      var prev = arr[i + 1], ch = '';
      if (prev) {
        if (!prev.s && r.s) ch = 'New';
        else if (prev.s && !r.s) ch = 'Sold out';
        else if (prev.s) { var p = 100 * (r.s - prev.s) / prev.s; ch = Math.abs(p) < 0.5 ? '—' : (p > 0 ? '+' : '') + p.toFixed(0) + '%'; }
      }
      return '<tr><td>' + r.q + '</td><td class="num">' + (r.s ? r.w.toFixed(2) + '%' : '—') + '</td><td class="num">' +
        (r.s ? fmtShares(r.s) : '—') + '</td><td class="num">' + ch + '</td></tr>';
    }).join('');
    t.innerHTML = head + '<tbody>' + body + '</tbody>';
    return t;
  }
  document.querySelectorAll('.hist-btn[data-hist]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('tr');
      var open = row.nextElementSibling && row.nextElementSibling.classList.contains('hist-row') ? row.nextElementSibling : null;
      if (open) { open.remove(); btn.setAttribute('aria-expanded', 'false'); return; }
      var rows = btn.getAttribute('data-hist').split(';').map(function (x) {
        var p = x.split('|'); return { q: p[0], w: parseFloat(p[1]) || 0, s: parseFloat(p[2]) || 0 };
      });
      var tr = document.createElement('tr');
      tr.className = 'hist-row';
      var td = document.createElement('td');
      td.colSpan = row.children.length;
      var box = document.createElement('div');
      box.className = 'hist-box';
      var h = document.createElement('p');
      h.className = 'hist-title';
      h.textContent = btn.getAttribute('data-title');
      var legend = document.createElement('p');
      legend.className = 'hist-legend small muted';
      legend.innerHTML = '<span class="key key-bar"></span> % of portfolio (left) <span class="key key-line"></span> shares held (right)';
      box.appendChild(h); box.appendChild(legend);
      td.appendChild(box); tr.appendChild(td);
      row.parentNode.insertBefore(tr, row.nextSibling);
      box.appendChild(chart(rows, box.clientWidth - 24));      // drawn at its real width: labels stay readable
      box.appendChild(table(rows));
      btn.setAttribute('aria-expanded', 'true');
    });
  });
})();

// Filtering or sorting a table closes its open history rows (they would be left out of place).
document.addEventListener('click', function (e) {
  if (!e.target.closest('[data-filter], [data-sort]')) return;
  document.querySelectorAll('tr.hist-row').forEach(function (r) { r.remove(); });
  document.querySelectorAll('.hist-btn[aria-expanded="true"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
}, true);
document.addEventListener('input', function (e) {
  if (!e.target.matches('[data-search]')) return;
  document.querySelectorAll('tr.hist-row').forEach(function (r) { r.remove(); });
  document.querySelectorAll('.hist-btn[aria-expanded="true"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
}, true);

// Tabs ([data-tabs]): the buttons with data-tab show the [data-panel] with the same name.
document.querySelectorAll('[data-tabs]').forEach(function (box) {
  var tabs = box.querySelectorAll('[data-tab]');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (o) { var on = o === t; o.setAttribute('aria-selected', on); o.setAttribute('aria-pressed', on); });
      box.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== t.getAttribute('data-tab'); });
    });
  });
});

// Floating header: a shadow once the page scrolls, the real header height for #anchor links,
// and on phones the current page's menu item scrolled into view.
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;
  function measure() { document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px'); }
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  measure(); onScroll();
  window.addEventListener('resize', measure);
  window.addEventListener('scroll', onScroll, { passive: true });
  var nav = header.querySelector('.nav'), current = nav && nav.querySelector('[aria-current="page"]');
  if (current && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = current.offsetLeft - nav.clientWidth / 2 + current.offsetWidth / 2;
})();
