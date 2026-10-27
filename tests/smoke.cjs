/*
 * Duman testleri (Playwright + Chromium).
 * Çalıştırma: npm test   (Playwright kurulu olmalı: npm i -D playwright && npx playwright install chromium)
 * Ekran görüntüleri tests/screenshots/ klasörüne yazılır.
 */
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..');
const PORT = 5199;
const URL = `http://localhost:${PORT}/`;
const SHOTS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

let failures = 0;
function check(ok, msg) {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failures++;
}

const VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 667, mobile: true },
  { name: 'iphone-15', width: 393, height: 852, mobile: true },
  { name: 'android', width: 412, height: 915, mobile: true },
  { name: 'kucuk-320', width: 320, height: 640, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: true },
  { name: 'masaustu', width: 1440, height: 900, mobile: false },
  { name: 'genis', width: 1920, height: 1080, mobile: false }
];

// Görünür olup ekran genişliğini taşan öğeleri bul (dekoratif sahne katmanları hariç).
async function overflowing(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (el.closest('.hero__stage, .curtain, dialog, .site-nav')) return;
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > vw + 1 || r.left < -1)) out.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80));
    });
    return { vw, scrollW: document.documentElement.scrollWidth, out: out.slice(0, 10) };
  });
}

const SAMPLE = `window.GOKBORU_ICERIK = {
  iletisim: { eposta: 'test@example.com', telefon: '+90 500 000 00 00', adres: '', instagram: '', youtube: '', formAdresi: '' },
  oyunlar: [
    { ad: 'Test Oyunu A', konu: 'Test konusu.', yasGrubu: 'İlkokul', sure: '40 dk', afis: '' },
    { ad: 'Test Oyunu B', konu: 'Test konusu.', yasGrubu: 'Ortaokul', afis: 'assets/img/og-image.jpg' }
  ],
  galeri: [
    { tur: 'foto', kucuk: 'assets/img/logo-480.webp', buyuk: 'assets/img/logo-960.webp', aciklama: 'Test foto' },
    { tur: 'video', dosya: 'yok.mp4', kapak: 'assets/img/logo-480.webp', aciklama: 'Test video' }
  ]
};`;

(async () => {
  const server = spawn(process.execPath, ['server.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch();

  try {
    /* 1. Perde animasyonu */
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
      await ctx.addInitScript(() => {
        new MutationObserver(() => {
          if (document.getElementById('curtain')) window.__perdeGoruldu = true;
          else if (window.__perdeGoruldu && !window.__perdeKalkti) window.__perdeKalkti = performance.now();
        }).observe(document, { childList: true, subtree: true });
      });
      await page.goto(URL);
      await page.waitForTimeout(500);
      check(await page.locator('#curtain').isVisible(), 'Perde ilk açılışta görünür');
      await page.screenshot({ path: path.join(SHOTS, 'perde-1-kapali.png') });
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(SHOTS, 'perde-2-aciliyor.png') });
      await page.waitForFunction(() => !document.getElementById('curtain'), null, { timeout: 6000 });
      const t = await page.evaluate(() => ({ kalkti: window.__perdeKalkti, fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0 }));
      const sure = Math.round(t.kalkti - t.fcp);
      check(sure > 2000 && sure < 3700, `Perde ilk boyamadan ${sure} ms sonra tamamen kaldırıldı`);
      check(!(await page.evaluate(() => document.documentElement.classList.contains('curtain-on'))), 'curtain-on sınıfı temizlendi');
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(SHOTS, 'perde-3-acik.png') });
      await page.reload();
      await page.waitForTimeout(200);
      check(await page.locator('#curtain').count() === 0, 'Aynı oturumda yeniden yüklemede perde tekrar etmiyor');
      await page.click('.site-nav__list a[href="#galeri"]');
      await page.waitForTimeout(900);
      check(await page.locator('#curtain').count() === 0, 'Menü geçişinde perde tekrar etmiyor');
      check(errors.length === 0, `Konsol hatası yok ${errors.length ? JSON.stringify(errors) : ''}`);
      await ctx.close();
    }

    /* 2. Azaltılmış hareket */
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(URL);
      await page.waitForTimeout(150);
      check(await page.locator('#curtain').count() === 0, 'Azaltılmış harekette perde atlanıyor');
      check(await page.locator('.hero__title').isVisible(), 'Azaltılmış harekette başlık hemen görünür');
      await ctx.close();
    }

    /* 3. JavaScript kapalıyken */
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(URL);
      check(!(await page.locator('#curtain').isVisible()), 'JS kapalıyken perde ekranı kapatmıyor');
      const op = await page.locator('#hakkimizda .about__text').evaluate((el) => getComputedStyle(el).opacity);
      check(op === '1', 'JS kapalıyken içerik görünür');
      await ctx.close();
    }

    /* 4. Görünümler: yatay taşma + ekran görüntüleri */
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1 });
      await ctx.addInitScript(() => { try { sessionStorage.setItem('gb-perde', '1'); } catch (e) {} });
      const page = await ctx.newPage();
      await page.goto(URL, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')));
      await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; }));
      await page.waitForTimeout(1300);
      const o = await overflowing(page);
      check(o.scrollW <= o.vw && o.out.length === 0, `${vp.name} (${vp.width}px): yatay taşma yok ${o.out.length ? JSON.stringify(o.out) : ''}`);
      const small = await page.evaluate(() => Array.from(document.querySelectorAll('a, button')).filter((el) => {
        const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return r.width > 0 && s.visibility !== 'hidden' && r.height < 40 && !el.classList.contains('skip-link') && !el.closest('p');
      }).map((el) => el.textContent.trim().slice(0, 30)));
      if (vp.mobile) check(small.length === 0, `${vp.name}: dokunma hedefleri ≥40px ${small.length ? JSON.stringify(small) : ''}`);
      await page.screenshot({ path: path.join(SHOTS, `${vp.name}-ust.png`) });
      await page.screenshot({ path: path.join(SHOTS, `${vp.name}-tam.png`), fullPage: true });
      await ctx.close();
    }

    /* 5. Mobil menü ve butonlar */
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await ctx.addInitScript(() => { try { sessionStorage.setItem('gb-perde', '1'); } catch (e) {} });
      const page = await ctx.newPage();
      await page.goto(URL);
      const toggle = page.locator('.nav-toggle');
      check(await toggle.isVisible(), 'Mobilde menü düğmesi görünür');
      await toggle.tap();
      await page.waitForTimeout(450);
      check(await toggle.getAttribute('aria-expanded') === 'true', 'Menü açılıyor (aria-expanded=true)');
      check(await page.locator('.site-nav__list a[href="#iletisim"]').isVisible(), 'Menü bağlantıları görünür');
      const navH = await page.locator('#site-nav').evaluate((el) => el.getBoundingClientRect().height);
      check(navH >= 840, `Açık menü tüm ekranı kaplıyor (${Math.round(navH)}px)`);
      await page.evaluate(() => window.scrollTo(0, 1500));
      await page.waitForTimeout(300);
      const navH2 = await page.locator('#site-nav').evaluate((el) => el.getBoundingClientRect().height);
      check(navH2 >= 840, `Sayfa kaydırılmışken de menü tüm ekranı kaplıyor (${Math.round(navH2)}px)`);
      await page.screenshot({ path: path.join(SHOTS, 'mobil-menu-acik.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      check(await toggle.getAttribute('aria-expanded') === 'false', 'Esc ile menü kapanıyor');
      await toggle.tap();
      await page.waitForTimeout(400);
      await page.locator('.site-nav__list a[href="#galeri"]').tap();
      await page.waitForTimeout(1200);
      check(await toggle.getAttribute('aria-expanded') === 'false', 'Bağlantıya dokununca menü kapanıyor');
      const galTop = await page.locator('#galeri').evaluate((el) => el.getBoundingClientRect().top);
      check(Math.abs(galTop) < 120, `Galeri bölümüne kaydırıldı (top=${Math.round(galTop)})`);

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.locator('.hero__actions a[href="#oyunlar"]').tap();
      await page.waitForTimeout(1200);
      const pTop = await page.locator('#oyunlar').evaluate((el) => el.getBoundingClientRect().top);
      check(Math.abs(pTop) < 120, `"Oyunlarımızı Keşfet" butonu oyunlara götürüyor (top=${Math.round(pTop)})`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.locator('.hero__actions a[href="#iletisim"]').tap();
      await page.waitForTimeout(1200);
      const cTop = await page.locator('#iletisim').evaluate((el) => el.getBoundingClientRect().top);
      check(Math.abs(cTop) < 120, `"Gösteri İçin İletişime Geç" butonu iletişime götürüyor (top=${Math.round(cTop)})`);

      /* 6. Form (sunucu bağlı değil) */
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
      await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')));
      await page.waitForTimeout(1000);
      await page.locator('#form-submit').tap();
      await page.waitForTimeout(200);
      const errs = await page.locator('.field__error').count();
      check(errs >= 6, `Boş form gönderiminde ${errs} alan hatası gösteriliyor`);
      check(/henüz bir sunucuya bağlı değil/.test(await page.locator('#form-mode').textContent()), 'Formun bağlı olmadığı açıkça belirtiliyor');
      await page.fill('#f-okul', 'Test Okulu');
      await page.fill('#f-yetkili', 'Ad Soyad');
      await page.fill('#f-eposta', 'test@example.com');
      await page.fill('#f-telefon', '05000000000');
      await page.selectOption('#f-yas', { index: 2 });
      await page.check('#f-onay');
      await page.locator('#form-submit').tap();
      await page.waitForTimeout(200);
      const res = await page.locator('#form-result').textContent();
      check(/gönderilmedi/.test(res), 'Geçerli formda sahte "gönderildi" mesajı yok');
      await page.locator('#request-form').screenshot({ path: path.join(SHOTS, 'form-mobil.png') });
      await ctx.close();
    }

    /* 7. İçerik dosyası doldurulduğunda (örnek test verisi) */
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await ctx.addInitScript(() => { try { sessionStorage.setItem('gb-perde', '1'); } catch (e) {} });
      await ctx.route('**/js/content.js', (r) => r.fulfill({ contentType: 'text/javascript', body: SAMPLE }));
      const page = await ctx.newPage();
      await page.goto(URL);
      check(await page.locator('.play').count() === 2, 'Oyun kartları içerik dosyasından oluşturuluyor');
      check(await page.locator('.play').first().locator('dt', { hasText: 'Süre' }).count() === 1, 'Süre bilindiğinde gösteriliyor');
      check(await page.locator('.play').nth(1).locator('dt', { hasText: 'Süre' }).count() === 0, 'Süre bilinmiyorsa gizleniyor');
      check(await page.locator('.tile').count() === 2 && await page.locator('.gallery-filter').isVisible(), 'Galeri ve filtre oluşturuluyor');
      await page.locator('.tile__btn').first().click();
      check(await page.locator('#lightbox').isVisible(), 'Galeri görüntüleyici açılıyor');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      check(!(await page.locator('#lightbox').isVisible()), 'Görüntüleyici Esc ile kapanıyor');
      check(await page.locator('#contact-list li').count() === 2, 'İletişim bilgileri gösteriliyor');
      check(/E-posta ile/.test(await page.locator('#form-submit').textContent()), 'E-posta varken form e-posta moduna geçiyor');
      await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')));
      await page.waitForTimeout(1000);
      await page.locator('#oyunlar').screenshot({ path: path.join(SHOTS, 'ornek-icerik-oyunlar.png') });
      await ctx.close();
    }

    /* 8. Performans: sayfa ağırlığı */
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      let bytes = 0;
      page.on('response', async (r) => { try { if (r.url().startsWith(URL)) bytes += (await r.body()).length; } catch (e) {} });
      const t = Date.now();
      await page.goto(URL, { waitUntil: 'load' });
      const load = Date.now() - t;
      check(bytes < 400 * 1024, `Yerel kaynakların toplamı ${(bytes / 1024).toFixed(0)} KB (< 400 KB), load ${load} ms`);
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }

  console.log(failures ? `\n${failures} kontrol başarısız.` : '\nTüm kontroller geçti.');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
