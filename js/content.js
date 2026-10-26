/*
 * Gökbörü Sanat Evi — Site içeriği
 * ------------------------------------------------------------------
 * Gerçek bilgiler hazır oldukça yalnızca bu dosyayı düzenlemeniz yeterli.
 * Boş bırakılan alanlar sitede gösterilmez; uydurma bilgi eklemeyin.
 *
 * Görselleri assets/img/ (veya assets/oyunlar/, assets/galeri/) klasörüne
 * koyup yolunu aşağıya yazın. Önerilen afiş oranı: 2:3 (ör. 800×1200), WebP/JPG.
 */
window.GOKBORU_ICERIK = {
  iletisim: {
    eposta: '',      // ör. 'iletisim@ornek.com'
    telefon: '',     // ör. '+90 5xx xxx xx xx'
    adres: '',
    instagram: '',   // tam bağlantı, ör. 'https://instagram.com/...'
    youtube: '',     // tam bağlantı
    /*
     * Formun gerçekten bir sunucuya gönderilmesi için JSON kabul eden bir
     * form servisi adresi (ör. Formspree: 'https://formspree.io/f/xxxx').
     * Boşsa ve e-posta doluysa form, e-posta uygulamasını hazır mesajla açar.
     * İkisi de boşsa form gönderim yapmaz ve bunu kullanıcıya açıkça söyler.
     */
    formAdresi: ''
  },

  /*
   * Oyunlar. Örnek kayıt (yorum satırlarını kaldırıp doldurun):
   * {
   *   ad: 'Oyunun Adı',
   *   konu: 'Kısa konu özeti…',
   *   yasGrubu: 'İlkokul (1–4. sınıf)',
   *   sure: '40 dakika',                    // bilinmiyorsa boş bırakın
   *   afis: 'assets/oyunlar/oyun-adi.webp', // yoksa boş bırakın
   *   afisAlt: 'Oyunun Adı afişi'
   * }
   */
  oyunlar: [],

  /*
   * Galeri. Fotoğraf:
   *   { tur: 'foto', kucuk: 'assets/galeri/k-01.webp', buyuk: 'assets/galeri/01.webp', aciklama: '…' }
   * YouTube videosu:
   *   { tur: 'video', youtube: 'VIDEO_KIMLIGI', aciklama: '…' }
   * Kendi video dosyanız:
   *   { tur: 'video', dosya: 'assets/galeri/video.mp4', kapak: 'assets/galeri/kapak.webp', aciklama: '…' }
   */
  galeri: []
};
