/* Page categorie : grille produits selon ?c=<cle> */
(function () {
  'use strict';

  var key = new URLSearchParams(location.search).get('c') || 'tous-les-jellypins';
  var cats = window.CATEGORIES || {};
  var cat = cats[key] || cats['tous-les-jellypins'];
  var PFX = window.IMG_PREFIX;

  document.title = cat.title + ' – Site Web Officiel Jellypin';
  document.querySelector('[data-title]').textContent = cat.title;
  document.querySelector('[data-intro]').textContent = cat.intro || '';

  /* --- Fil d'Ariane ------------------------------------------------------- */
  var crumbs = document.querySelector('[data-crumbs]');
  (cat.crumbs || ['Accueil']).forEach(function (label, i) {
    var a = document.createElement('a');
    a.href = i === 0 ? 'index.html' : '#';
    a.textContent = label;
    crumbs.appendChild(a);
    crumbs.appendChild(document.createTextNode(' / '));
  });
  var last = document.createElement('span');
  last.textContent = cat.title;
  crumbs.appendChild(last);

  /* --- Sous-categories ---------------------------------------------------- */
  if (cat.subs && cat.subs.length) {
    var subs = document.querySelector('[data-subs]');
    subs.hidden = false;
    cat.subs.forEach(function (s) {
      var a = document.createElement('a');
      a.href = 'category.html?c=' + s[1];
      a.textContent = s[0];
      subs.appendChild(a);
    });
  }

  /* --- Grille produits ---------------------------------------------------- */
  var grid = document.querySelector('[data-grid]');
  /* Construire les lignes : soit depuis cat.rows, soit depuis PRODUCTS (mode dynamique) */
  var rows;
  if (cat.dynamic && window.PRODUCTS) {
    var filterCat = cat.filterBadge || null;
    var pool = window.PRODUCTS.filter(function(p) {
      return filterCat ? p.badge === filterCat : true;
    });
    // Mystere en tete, puis les Jellypins normaux
    var rank = function (p) {
      if (p.badge === 'Mystère') return 0;
      return 1;
    };
    pool.sort(function (a, b) { return rank(a) - rank(b); });
    rows = pool.map(function(p) {
      return { slug: p.slug, name: p.name, price: p.priceLabel || (p.price.toFixed(2).replace('.',',')+'\u20ac'), badge: p.badge, img: p.imgs[0] };
    });
  } else {
    rows = (cat.rows || []).map(function (r) {
      var p = r.split('|');
      return { slug: p[0], name: p[1], price: p[2], badge: p[3], img: (p[4] && /^(https?:|img\/)/.test(p[4]) ? p[4] : PFX + p[4]) };
    });
  }

  if (!rows.length) {
    document.querySelector('[data-empty]').hidden = false;
    return;
  }

  document.querySelector('[data-bar]').hidden = false;
  document.querySelector('[data-count]').textContent = (cat.count || rows.length) + ' articles';

  function num(price) {
    var m = price.match(/(\d+),(\d{2})/);
    return m ? parseFloat(m[1] + '.' + m[2]) : 0;
  }

  function paint(list) {
    grid.innerHTML = '';
    list.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'card';
      a.href = 'product.html?p=' + p.slug;
      a.innerHTML =
        '<div class="card__img">' +
          (p.badge ? '<span class="card__badge">' + p.badge + '</span>' : '') +
          (p.img ? '<img src="' + p.img + '" alt="' + p.name.replace(/"/g, '&quot;') + '" loading="lazy">' : '') +
          '<span class="card__wish" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-7-9.3A4 4 0 0112 8a4 4 0 017 2.7C19 15.4 12 20 12 20z"/></svg></span>' +
        '</div>' +
        '<p class="card__name">' + p.name + '</p>' +
        '<p class="card__price">' + p.price + '</p>';
      grid.appendChild(a);
    });
  }

  /* --- Filtres + tri -------------------------------------------------------
     Filtre et tri se composent : on part toujours de `rows`, on retire ce qui
     ne passe pas les filtres, puis on trie le reste. */
  var countEl   = document.querySelector('[data-count]');
  var panel     = document.querySelector('[data-filters]');
  var toggle    = document.querySelector('[data-filter-toggle]');
  var currentSort = 'pertinence';
  var picked = { badge: [], price: [] };

  function uniq(values) {
    var seen = {}, out = [];
    values.forEach(function (v) { if (v && !seen[v]) { seen[v] = 1; out.push(v); } });
    return out;
  }

  function matches(p) {
    if (picked.badge.length && picked.badge.indexOf(p.badge) === -1) return false;
    if (picked.price.length && picked.price.indexOf(p.price) === -1) return false;
    return true;
  }

  function render() {
    var list = rows.filter(matches);
    if (currentSort === 'az')   list.sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); });
    if (currentSort === 'za')   list.sort(function (a, b) { return b.name.localeCompare(a.name, 'fr'); });
    if (currentSort === 'asc')  list.sort(function (a, b) { return num(a.price) - num(b.price); });
    if (currentSort === 'desc') list.sort(function (a, b) { return num(b.price) - num(a.price); });
    if (currentSort === 'nouveaute') list.sort(function (a, b) { return (b.badge === 'Nouveauté') - (a.badge === 'Nouveauté'); });
    paint(list);
    /* Des qu'un filtre est actif, on affiche le compte reel plutot que le
       compteur de la fiche categorie. */
    var actif = picked.badge.length || picked.price.length;
    if (countEl) countEl.textContent = actif
      ? list.length + ' article' + (list.length > 1 ? 's' : '') + ' sur ' + rows.length
      : (cat.count || rows.length) + ' articles';
  }

  function group(title, key, values) {
    return '<div class="cat__filters-group"><h3>' + title + '</h3><div class="cat__filters-list">' +
      values.map(function (v) {
        return '<label class="cat__chip"><input type="checkbox" data-key="' + key +
               '" value="' + String(v).replace(/"/g, '&quot;') + '">' + v + '</label>';
      }).join('') +
      '</div></div>';
  }

  if (panel && toggle) {
    var badges = uniq(rows.map(function (p) { return p.badge; }));
    var prices = uniq(rows.map(function (p) { return p.price; }))
      .sort(function (a, b) { return num(a) - num(b); });

    var html = '';
    if (badges.length > 1) html += group('Collection', 'badge', badges);
    if (prices.length > 1) html += group('Prix', 'price', prices);

    if (html) {
      panel.innerHTML = html + '<button class="cat__filters-reset" type="button" data-filters-reset>Tout effacer</button>';

      toggle.addEventListener('click', function () {
        var open = panel.hidden;
        panel.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      panel.addEventListener('change', function (e) {
        var box = e.target;
        if (!box.matches('input[data-key]')) return;
        var key = box.getAttribute('data-key');
        var i = picked[key].indexOf(box.value);
        if (box.checked) { if (i === -1) picked[key].push(box.value); }
        else if (i !== -1) picked[key].splice(i, 1);
        render();
      });

      panel.addEventListener('click', function (e) {
        if (!e.target.matches('[data-filters-reset]')) return;
        picked = { badge: [], price: [] };
        panel.querySelectorAll('input[data-key]').forEach(function (b) { b.checked = false; });
        render();
      });
    } else {
      /* Rien a filtrer dans cette categorie : on retire le bouton plutot que
         de laisser un controle sans effet. */
      toggle.hidden = true;
    }
  }

  document.querySelector('[data-sort]').addEventListener('change', function (e) {
    currentSort = e.target.value;
    render();
  });

  render();
})();
