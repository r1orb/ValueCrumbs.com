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
