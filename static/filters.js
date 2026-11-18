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
