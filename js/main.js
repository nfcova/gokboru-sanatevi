(function () {
  'use strict';

  var root = document.documentElement;
  var icerik = window.GOKBORU_ICERIK || { iletisim: {}, oyunlar: [], galeri: [] };
  var iletisim = icerik.iletisim || {};

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Açılış perdesi ---------- */
  function initCurtain() {
    var curtain = $('#curtain');
    if (!curtain) return;
    if (!root.classList.contains('curtain-on')) { curtain.remove(); return; }

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      root.classList.remove('curtain-on');
      curtain.remove();
      try { sessionStorage.setItem('gb-perde', '1'); } catch (e) {}
    }
    curtain.addEventListener('animationend', function (e) {
      if (e.target === curtain) finish();
    });
    // Tıklama / tuş ile atlanabilir; animasyon olayı gelmezse de kesin kaldırılır.
    curtain.addEventListener('click', finish);
    document.addEventListener('keydown', function onKey() {
      finish();
      document.removeEventListener('keydown', onKey);
    });
    setTimeout(finish, 3600);
  }

  /* ---------- Üst bilgi ve mobil menü ---------- */
  function initHeader() {
    var header = $('.site-header');
    var toggle = $('.nav-toggle');
    var nav = $('#site-nav');

    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.nav-toggle__label').textContent = open ? 'Kapat' : 'Menü';
      root.classList.toggle('nav-open', open);
      if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
    }
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
    });
    // Masaüstüne geçildiğinde açık kalan mobil menüyü kapat.
    var mq = window.matchMedia('(min-width: 960px)');
    var onMq = function () { if (mq.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else mq.addListener(onMq);

    // Aktif bölümü menüde işaretle.
    if ('IntersectionObserver' in window) {
      var links = $all('.site-nav__list a');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) {
            var on = a.getAttribute('href') === '#' + en.target.id;
            a.classList.toggle('is-current', on);
            if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $all('main > section[id]').forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- Oyunlar ---------- */
  function renderPlays() {
    var list = icerik.oyunlar || [];
    if (!list.length) return;
    var wrap = $('#plays-list');
    wrap.innerHTML = '<ul class="plays__grid" role="list">' + list.map(function (o) {
      var poster = o.afis
        ? '<img src="' + esc(o.afis) + '" alt="' + esc(o.afisAlt || (o.ad + ' afişi')) + '" width="800" height="1200" loading="lazy" decoding="async">'
        : '<span class="poster__placeholder" aria-hidden="true">' + esc(o.ad) + '</span>';
      var meta = '';
      if (o.yasGrubu) meta += '<div><dt>Yaş grubu</dt><dd>' + esc(o.yasGrubu) + '</dd></div>';
      if (o.sure) meta += '<div><dt>Süre</dt><dd>' + esc(o.sure) + '</dd></div>';
      return '<li class="play reveal">' +
        '<div class="poster">' + poster + '</div>' +
        '<div class="play__body">' +
          '<h3 class="play__title">' + esc(o.ad) + '</h3>' +
          (o.konu ? '<p class="play__summary">' + esc(o.konu) + '</p>' : '') +
          (meta ? '<dl class="play__meta">' + meta + '</dl>' : '') +
          '<a class="play__cta" href="#iletisim" data-oyun="' + esc(o.ad) + '">Bu oyunu okulumda izlemek istiyorum →</a>' +
        '</div></li>';
    }).join('') + '</ul>';
    wrap.removeAttribute('data-empty');

    wrap.addEventListener('click', function (e) {
      var a = e.target.closest('[data-oyun]');
      if (!a) return;
      var msg = $('#f-mesaj');
      if (msg && !msg.value) msg.value = 'İlgilendiğimiz oyun: ' + a.getAttribute('data-oyun');
    });
  }

  /* ---------- Galeri ---------- */
  function renderGallery() {
    var list = icerik.galeri || [];
    if (!list.length) return;
    var wrap = $('#gallery-list');
    wrap.innerHTML = '<ul class="gallery__grid" role="list">' + list.map(function (g, i) {
      var thumb, label;
      if (g.tur === 'video') {
        thumb = g.kapak || (g.youtube ? 'https://i.ytimg.com/vi/' + encodeURIComponent(g.youtube) + '/hqdefault.jpg' : '');
        label = 'Videoyu oynat';
      } else {
        thumb = g.kucuk || g.buyuk;
        label = 'Fotoğrafı büyüt';
      }
      return '<li class="tile reveal" data-tur="' + (g.tur === 'video' ? 'video' : 'foto') + '">' +
        '<button type="button" class="tile__btn" data-index="' + i + '" aria-label="' + esc(label + (g.aciklama ? ': ' + g.aciklama : '')) + '">' +
          (thumb ? '<img src="' + esc(thumb) + '" alt="" loading="lazy" decoding="async">' : '') +
          (g.tur === 'video' ? '<span class="tile__play" aria-hidden="true"></span>' : '') +
        '</button></li>';
    }).join('') + '</ul>';
    wrap.removeAttribute('data-empty');

    var hasVideo = list.some(function (g) { return g.tur === 'video'; });
    var hasPhoto = list.some(function (g) { return g.tur !== 'video'; });
    var filter = $('.gallery-filter');
    if (hasVideo && hasPhoto) {
      filter.hidden = false;
      filter.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-filter]');
        if (!btn) return;
        var f = btn.getAttribute('data-filter');
        $all('.chip', filter).forEach(function (c) {
          var on = c === btn;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-pressed', String(on));
        });
        $all('.tile', wrap).forEach(function (t) {
          t.hidden = !(f === 'tumu' || t.getAttribute('data-tur') === f);
        });
      });
    }

    var dlg = $('#lightbox');
    var body = $('#lightbox-body');
    var cap = $('#lightbox-caption');
    var lastFocus = null;
    function close() {
      body.innerHTML = ''; // videoyu durdurur
      if (dlg.open) dlg.close();
    }
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.tile__btn');
      if (!btn) return;
      var g = list[+btn.getAttribute('data-index')];
      lastFocus = btn;
      if (g.tur === 'video' && g.youtube) {
        body.innerHTML = '<div class="lightbox__video"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(g.youtube) +
          '" title="' + esc(g.aciklama || 'Gösteri videosu') + '" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
      } else if (g.tur === 'video' && g.dosya) {
        body.innerHTML = '<div class="lightbox__video"><video src="' + esc(g.dosya) + '" controls playsinline preload="metadata"' +
          (g.kapak ? ' poster="' + esc(g.kapak) + '"' : '') + '></video></div>';
      } else {
        body.innerHTML = '<img src="' + esc(g.buyuk || g.kucuk) + '" alt="' + esc(g.aciklama || 'Gösteriden bir kare') + '">';
      }
      cap.textContent = g.aciklama || '';
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    });
    $('.lightbox__close').addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('close', function () { body.innerHTML = ''; if (lastFocus) lastFocus.focus(); });
  }

  /* ---------- İletişim bilgileri ---------- */
  function renderContact() {
    var items = [];
    if (iletisim.telefon) items.push({ k: 'Telefon', v: iletisim.telefon, href: 'tel:' + iletisim.telefon.replace(/[^\d+]/g, '') });
    if (iletisim.eposta) items.push({ k: 'E-posta', v: iletisim.eposta, href: 'mailto:' + iletisim.eposta });
    if (iletisim.adres) items.push({ k: 'Adres', v: iletisim.adres });
    if (iletisim.instagram) items.push({ k: 'Instagram', v: 'Instagram', href: iletisim.instagram, ext: true });
    if (iletisim.youtube) items.push({ k: 'YouTube', v: 'YouTube', href: iletisim.youtube, ext: true });
    if (!items.length) return;

    function li(it) {
      var val = it.href
        ? '<a href="' + esc(it.href) + '"' + (it.ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(it.v) + '</a>'
        : esc(it.v);
      return '<li><span class="k">' + esc(it.k) + '</span><span class="v">' + val + '</span></li>';
    }
    var list = $('#contact-list');
    list.innerHTML = items.map(li).join('');
    list.hidden = false;
    $('#contact-empty').hidden = true;
    $('#footer-contact').insertAdjacentHTML('afterbegin', items.map(li).join(''));
  }

  /* ---------- Gösteri talep formu ---------- */
  function initForm() {
    var form = $('#request-form');
    var result = $('#form-result');
    var modeNote = $('#form-mode');
    var submit = $('#form-submit');
    var mode = iletisim.formAdresi ? 'endpoint' : (iletisim.eposta ? 'mailto' : 'none');

    if (mode === 'mailto') {
      modeNote.textContent = 'Not: Form, talebinizi hazır bir e-posta olarak e-posta uygulamanızda açar; göndermek için e-postayı onaylamanız gerekir.';
      submit.textContent = 'Talebi E-posta ile Hazırla';
    } else if (mode === 'none') {
      modeNote.textContent = 'Not: Çevrimiçi form henüz bir sunucuya bağlı değildir; şu an talepler bu form üzerinden iletilemez. İletişim bilgilerimiz çok yakında eklenecek.';
    } else {
      modeNote.hidden = true;
    }

    function fieldError(input, msg) {
      var field = input.closest('.field');
      var err = field.querySelector('.field__error');
      if (!msg) {
        input.removeAttribute('aria-invalid');
        if (err) err.remove();
        return;
      }
      input.setAttribute('aria-invalid', 'true');
      if (!err) {
        err = document.createElement('p');
        err.className = 'field__error';
        err.id = input.id + '-hata';
        field.appendChild(err);
        input.setAttribute('aria-describedby', err.id);
      }
      err.textContent = msg;
    }
    function validate(input) {
      var v = input.validity;
      if (v.valid) { fieldError(input, ''); return true; }
      var msg = 'Bu alan zorunludur.';
      if (input.type === 'checkbox') msg = 'Devam etmek için onay vermeniz gerekir.';
      else if (v.typeMismatch && input.type === 'email') msg = 'Geçerli bir e-posta adresi girin.';
      else if (v.rangeUnderflow || v.badInput) msg = 'Geçerli bir değer girin.';
      fieldError(input, msg);
      return false;
    }
    $all('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value || el.hasAttribute('aria-invalid')) validate(el); });
      el.addEventListener('change', function () { if (el.hasAttribute('aria-invalid')) validate(el); });
    });

    function summary(data) {
      var labels = { okul: 'Okul', yetkili: 'Yetkili', gorev: 'Görevi', eposta: 'E-posta', telefon: 'Telefon',
        il: 'İl / İlçe', yas: 'Öğrenci grubu', sayi: 'Tahmini öğrenci sayısı', tarih: 'Tercih edilen tarih', mesaj: 'Mesaj' };
      return Object.keys(labels).filter(function (k) { return data[k]; })
        .map(function (k) { return labels[k] + ': ' + data[k]; }).join('\n');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      result.className = 'form-status';
      result.textContent = '';
      var invalid = $all('input, select, textarea', form).filter(function (el) { return !validate(el); });
      if (invalid.length) {
        invalid[0].focus();
        result.classList.add('form-status--error');
        result.textContent = 'Lütfen işaretli alanları kontrol edin.';
        return;
      }
      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v; });

      if (mode === 'none') {
        result.classList.add('form-status--info');
        result.textContent = 'Bilgileriniz geçerli, ancak form henüz bir sunucuya bağlı olmadığından talebiniz gönderilmedi.';
        return;
      }
      if (mode === 'mailto') {
        var subject = 'Gösteri talebi — ' + data.okul;
        window.location.href = 'mailto:' + iletisim.eposta + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(summary(data));
        result.classList.add('form-status--info');
        result.textContent = 'E-posta uygulamanız açılıyor. Talebiniz, e-postayı gönderdiğinizde bize ulaşır.';
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Gönderiliyor…';
      fetch(iletisim.formAdresi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(Object.assign({ _subject: 'Gösteri talebi — ' + data.okul }, data))
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        result.classList.add('form-status--ok');
        result.textContent = 'Teşekkürler! Talebiniz bize ulaştı; en kısa sürede dönüş yapacağız.';
      }).catch(function () {
        result.classList.add('form-status--error');
        result.textContent = 'Talebiniz gönderilemedi. Lütfen daha sonra tekrar deneyin.';
      }).then(function () {
        submit.disabled = false;
        submit.textContent = 'Talebi Gönder';
      });
    });
  }

  /* ---------- Kaydırınca beliren öğeler ---------- */
  function initReveal() {
    var els = $all('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  initCurtain();
  initHeader();
  renderPlays();
  renderGallery();
  renderContact();
  initForm();
  initReveal();
  var y = $('#yil'); if (y) y.textContent = new Date().getFullYear();
})();
