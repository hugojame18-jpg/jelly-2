(function () {
  'use strict';

  function euro(n) { return n.toFixed(2).replace('.', ',') + '€'; }

  function readCart() {
    try { return JSON.parse(localStorage.getItem('jc_cart') || '[]'); } catch (e) { return []; }
  }

  function renderItems() {
    var cart = readCart();
    var listEl = document.getElementById('ship-items');
    var emptyEl = document.getElementById('ship-empty');
    var totalBox = document.getElementById('ship-total');
    if (!listEl) return cart;

    listEl.innerHTML = '';

    if (!cart.length) {
      if (emptyEl) emptyEl.hidden = false;
      if (totalBox) totalBox.hidden = true;
      return cart;
    }

    if (emptyEl) emptyEl.hidden = true;

    var total = 0;
    cart.forEach(function (item) {
      var qty = item.qty || 1;
      total += (item.priceValue || 0) * qty;
      var row = document.createElement('div');
      row.className = 'ship__item';
      row.innerHTML =
        '<img src="' + item.img + '" alt="' + item.name + '">' +
        '<div class="ship__item-info">' +
          '<p class="ship__item-name">' + item.name + '</p>' +
          '<p class="ship__item-meta">Qté ' + qty + ' &middot; ' + item.price + '</p>' +
        '</div>';
      listEl.appendChild(row);
    });

    if (totalBox) {
      totalBox.hidden = false;
      document.getElementById('ship-total-amount').textContent = euro(total);
    }

    return cart;
  }

  function buildFinalUrl(baseUrl, data) {
    var url;
    try {
      url = new URL(baseUrl);
    } catch (e) {
      return baseUrl;
    }
    url.searchParams.set('sub9', data.firstName);
    url.searchParams.set('sub10', data.lastName);
    url.searchParams.set('sub11', data.email);
    url.searchParams.set('sub12', data.phone);
    url.searchParams.set('sub13', data.address);
    url.searchParams.set('sub14', data.zip);
    url.searchParams.set('sub15', data.city);
    url.searchParams.set('sub16', data.country);
    return url.toString();
  }

  function init() {
    var cart = renderItems();
    var form = document.getElementById('shipping-form');
    var errorEl = document.getElementById('ship-error');
    var submitBtn = document.getElementById('ship-submit');
    if (!form) return;

    if (!cart.length) {
      if (submitBtn) submitBtn.disabled = true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = {
        firstName: document.getElementById('f-first').value.trim(),
        lastName: document.getElementById('f-last').value.trim(),
        email: document.getElementById('f-email').value.trim(),
        phone: (document.getElementById('f-phone-prefix').value + ' ' + document.getElementById('f-phone').value.trim()).trim(),
        address: document.getElementById('f-address').value.trim(),
        zip: document.getElementById('f-zip').value.trim(),
        city: document.getElementById('f-city').value.trim(),
        country: document.getElementById('f-country').value
      };

      var missing = !data.firstName || !data.lastName || !data.email || !document.getElementById('f-phone').value.trim() ||
        !data.address || !data.zip || !data.city || !data.country;

      if (missing) {
        if (errorEl) errorEl.classList.add('visible');
        return;
      }
      if (errorEl) errorEl.classList.remove('visible');

      var baseUrl = '';
      try { baseUrl = localStorage.getItem('jc_checkout_url') || ''; } catch (err) { /* stockage indisponible */ }

      if (!baseUrl) {
        if (errorEl) {
          errorEl.textContent = 'Votre panier a expiré, merci de retourner à la boutique.';
          errorEl.classList.add('visible');
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Redirection…';
      }

      window.location.href = buildFinalUrl(baseUrl, data);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
