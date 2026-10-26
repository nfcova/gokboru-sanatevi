# Gökbörü Sanat Evi — Web Sitesi

Okullara giderek öğrencilere tiyatro gösterileri sunan **Gökbörü Sanat Evi** için tek sayfalık,
mobil öncelikli tanıtım sitesi. Sitede açılış perdesi animasyonu, oyunlar, hakkımızda, galeri ve okullar için gösteri talep formu bulunur.

## Teknoloji

- **Saf HTML + CSS + JavaScript.** Çerçeve, derleme adımı veya `npm install` gerekmez.
- Yazı tipleri: Google Fonts (Cormorant Garamond, Manrope). Türkçe karakterleri destekler ve sayfanın çizilmesini bekletmeden yüklenir.
- Yerel geliştirme için bağımlılıksız küçük bir Node.js sunucusu (`server.mjs`) kullanılır.
- Testler Playwright + Chromium ile yazılmış duman testleridir (`tests/smoke.cjs`).

Bu dosyalar herhangi bir statik barındırma hizmetinde doğrudan yayınlanabilir: GitHub Pages, Netlify, Vercel, Cloudflare Pages veya klasik bir hosting.

## Çalıştırma

```bash
# Node.js 18+ ile
npm start            # http://localhost:5173

# veya Node olmadan
python3 -m http.server 5173
```

VS Code kullanıyorsanız `gokboru-sanat-evi.code-workspace` dosyasını açın. Önerilen "Live Server" eklentisiyle de çalıştırabilirsiniz.

### Testler

```bash
npm i -D playwright && npx playwright install chromium   # bir kez
npm test
```

Testler şunları denetler:

- Perdenin ilk açılışta göründüğünü ve yaklaşık 2,5 sn içinde DOM'dan kalktığını, aynı oturumda tekrar etmediğini.
- Azaltılmış hareket ayarında perdenin atlandığını; JavaScript kapalıyken sitenin kullanılabildiğini.
- 320, 375, 393, 412, 768, 1440 ve 1920 px genişliklerde yatay taşma olmadığını ve dokunma hedeflerinin yeterince büyük olduğunu.
- Mobil menüyü, butonları, form doğrulamasını ve içerik dosyası doldurulduğunda kartların oluşturulmasını.

Ekran görüntüleri `tests/screenshots/` klasörüne yazılır (depoya eklenmez).

## Klasör yapısı

```
index.html              Tek sayfa: perde, menü, giriş, oyunlar, hakkımızda, galeri, iletişim, alt bilgi
css/styles.css          Tasarım sistemi (renk değişkenleri, kumaş dokusu, perde animasyonu)
js/content.js           ✏️ DÜZENLENECEK İÇERİK: oyunlar, galeri, iletişim bilgileri, form adresi
js/main.js              Perde, menü, galeri görüntüleyici, form davranışı
assets/img/             Optimize edilmiş logo (webp/jpg), amblem, favicon ve paylaşım görseli
brand/logo-orijinal.png Yüklenen orijinal logo dosyası (kaynak, sitede doğrudan kullanılmaz)
server.mjs              Yerel geliştirme sunucusu
tests/smoke.cjs         Tarayıcı testleri
```

## İçerik ekleme

Gerçek bilgiler hazır olduğunda **yalnızca `js/content.js`** dosyasını düzenlemeniz yeterli:

- **Oyunlar:** Her oyun için ad, konu, yaş grubu, süre ve afiş girilir. Süre bilinmiyorsa boş bırakılır ve sitede gösterilmez. Afişleri `assets/oyunlar/` klasörüne koyun. Önerilen oran 2:3'tür (örneğin 800×1200, WebP).
- **Galeri:** Fotoğraf (küçük ve büyük görsel), YouTube videosu (video kimliği) veya kendi `.mp4` dosyanızı ekleyebilirsiniz. Videolar otomatik başlamaz.
- **İletişim:** Telefon, e-posta, adres ve sosyal medya bağlantıları. Dolu olan alanlar iletişim kartında ve alt bilgide görünür.

Liste boşken sitede dürüst bir "yakında" mesajı gösterilir. Uydurma oyun, telefon, adres, referans veya istatistik bulunmaz.

## Gösteri talep formu

Form şu anda **bir sunucuya bağlı değildir** ve bu durum ziyaretçiye açıkça yazılır. Form hiçbir zaman sahte bir "gönderildi" mesajı göstermez. Formu bağlamak için iki seçenek var:

1. **Form servisi (önerilen):** Formspree, Basin veya Getform gibi JSON kabul eden bir servisten form adresi alın ve `content.js` içindeki `formAdresi` alanına yazın. Form, talebi gerçekten gönderir; başarılı ya da başarısız sonucu kullanıcıya gösterir.
2. **Yalnızca e-posta:** `formAdresi` boşsa ve `eposta` doluysa form, talebi kullanıcının e-posta uygulamasında hazır bir e-posta olarak açar.

Form adresi gizli bir anahtar değildir, ancak hiçbir API anahtarını veya parolayı depoya eklemeyin. Gerekirse `.env` kullanın (zaten `.gitignore` içinde).

## Logo

Kullanılan logo, yüklenen orijinal görselin (`brand/logo-orijinal.png`) yeniden boyutlandırılmış sürümleridir. Oranlar korunmuş, tasarım değiştirilmemiştir.

- Görselin zaten koyu olan dış kenarı, CSS maskesiyle zemine yumuşakça karışır.
- Üst menüde ve favicon'da, küçük boyutta okunabilmesi için logonun **amblem bölümünün kırpılmış hâli** kullanılır (kurt ve maskeler, değiştirilmeden).
- Logoyu güncellemek için yeni dosyayı `brand/` klasörüne koyup `assets/img/` içindeki boyutları yeniden üretin.
- Arka planı şeffaf (PNG/SVG) bir logo sürümünüz varsa, siteye çok daha iyi oturur.

## Yayına alma (GitHub Pages örneği)

1. Depoyu GitHub'a gönderin.
2. **Settings → Pages → Build and deployment → Source: "Deploy from a branch"** yolunu izleyin, `main` dalını ve `/ (root)` klasörünü seçin.
3. Alan adı belli olduğunda `index.html` içine `<link rel="canonical">` ekleyin, `og:image` adresini tam URL yapın ve `robots.txt` dosyasına site haritası satırını ekleyin.
