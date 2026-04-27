# Echo Chamber - Kanban ve Product Backlog

Bu doküman, `Project_Assignment.pdf`, `HANDOFF_BACKEND_CODEX.md` ve `HANDOFF_FRONTEND_OPUS.md` dosyalarına göre hazırlanmış proje çalışma panosudur. Amaç sadece "ne yapacağız?" sorusunu değil, ödev rubriğinde hangi kanıtla puan alacağımızı da görünür tutmaktır.

## Proje Özeti

**Echo Chamber**, Bob Dylan'ın "Knockin' on Heaven's Door" şarkısının 1973'ten bugüne uzanan cover'larını duygu, tarih ve kültürel bağlam üzerinden 3D bir galaksi olarak gösteren interaktif web deneyimidir.

Kullanıcı:

- Cover'ları 3D galakside keşfeder.
- Bir cover'ın dönemsel iç sesini RAG destekli LLM çıktısı olarak okur.
- İki cover arasında anlam kaymasını karşılaştırır.
- Kendi veda metnini yazar ve embedding benzerliğiyle galaksideki karşılığını bulur.

## Ödev Şartlarıyla Eşleşme

| Ödev şartı | Echo Chamber karşılığı | Kanıt |
|---|---|---|
| En az 2 ayrı AI tekniği | LLM tabanlı müzikolojik analiz, embedding/UMAP duygu haritası, RAG destekli dönem sesi | Backend scriptleri, API endpointleri, README AI bölümü |
| Özgün kod | FastAPI backend, veri işleme pipeline'ı, 3D frontend, kullanıcı eşleştirme akışı | GitHub repo, modüler dosya yapısı |
| Tarihsel bağlam | Vietnam, Watergate, Pat Garrett & Billy the Kid, karşı kültür, dönemsel cover yorumları | RAG belgeleri, cover metadata, manifesto |
| Artist's manifesto | 1500-3000 kelime kişisel ve felsefi metin | `MANIFESTO.md` veya PDF |
| Sunulabilir artwork | Çalışan web deneyimi + demo senaryosu | Lokal demo, ekran görüntüleri, README |

**Not:** Rubrikte "iki farklı LLM prompt'u iki teknik sayılmaz" uyarısı var. Bu yüzden projeyi yalnızca prompt çeşitliliğine yaslamıyoruz. LLM analiz, embedding tabanlı görselleştirme/eşleştirme ve RAG destekli üretim tekniklerini açıkça ayıracağız. Zaman kalırsa TTS/voiceover opsiyonu ikinci generative tekniği daha tartışmasız hale getiren güçlü bir artı olur.

## Kanban Panosu

### Done

| ID | İş | Çıktı |
|---|---|---|
| DISC-01 | Ödev PDF'i incelendi | Zorunlu şartlar, teslimler ve rubrik çıkarıldı |
| DISC-02 | Backend handoff incelendi | FastAPI, LLM, RAG, embedding, UMAP akışı netleşti |
| DISC-03 | Frontend handoff incelendi | API kontratı ve 3D galaksi beklentileri netleşti |
| REPO-01 | Git repo kuruldu | `main` branch ve ilk commit geçmişi oluşturuldu |
| REPO-02 | GitHub push yapıldı | Public repo: `burakyalcin10/echo-chamber-ai` |
| ARCH-01 | Repo yapısı oluşturuldu | `backend/`, `docs/`, veri ve script klasörleri oluştu |
| BE-01 | FastAPI iskeleti | `/health`, CORS ve temel app çalışıyor |
| DATA-01 | İlk cover veri seti | 26 kayıtlık çekirdek `covers.json` eklendi |
| API-01 | `/api/graph` | Frontend galaksi payload'u dönüyor |
| API-02 | `/api/cover/{id}` | Cover detay payload'u dönüyor |
| AI-01 | Gemini/OpenAI provider wrapper | Anthropic bağımlılığı çıkarıldı, provider seçimi `.env` ile yapılıyor |
| AI-02 | `02_score_covers.py` temel akışı | Gemini/OpenAI structured JSON skorlama scripti eklendi |
| AI-03 | LLM cache/idempotency | Skor cache'i, incremental çalışma ve ücretli çağrı tekrarı azaltma eklendi |
| AI-04 | JSON schema validation | LLM JSON parse, alan doğrulama, retry ve key-yok hata akışı eklendi |
| EMB-01 | Embedding metni oluşturucu | Cover bağlamı ve duygu skorlarından embedding metni üretiliyor |
| EMB-02 | SentenceTransformers embedding scripti | `03_embed_and_umap.py` içinde embedding üretimi eklendi |
| EMB-03 | UMAP 3D reducer scripti | Normalize 3D pozisyon üretimi eklendi |
| EMB-04 | Reducer pickle kaydı | UMAP reducer ve bounds kaydı eklendi |
| RAG-02 | Yerel RAG index scripti | `04_build_rag.py` ile historical docs chunk/index akışı eklendi |
| RAG-03 | RAG query helper | `/api/voice` için local semantic retrieval helper eklendi |
| DOC-01 | README omurgası | Kurulum, pipeline, API ve RAG notları belgelendi |
| API-06A | `/api/match` demo-safe fallback | API key yokken lokal bridge text ve keyword fallback ile çalışıyor |
| TEST-01 | Backend smoke testleri | Health, graph, cover, match ve compare guard testleri eklendi |
| EMB-05 | Embedding/UMAP script smoke run | Processed covers, UMAP reducer ve bounds lokal olarak üretildi |
| API-06 | `/api/match` gerçek embedding modu | Processed data varken cosine similarity ve projected user position dönüyor |
| TEST-02 | Script dry-run kontrolleri | Skor ve embedding scriptleri dry-run/subprocess testleriyle doğrulanıyor |
| API-03A | `/api/compare` demo-safe fallback | API key yokken lokal karşılaştırma analizi ve source metadata dönüyor |
| API-04A | `/api/voice` demo-safe fallback | API key/RAG yokken lokal dönem monoloğu ve source metadata dönüyor |
| FE-CONTRACT-01 | Frontend API sözleşmesi | `docs/API_CONTRACT.md` içinde endpoint request/response alanları sabitlendi |
| DATA-03 | Veri doğrulama helper'ı | `00_validate_covers.py` cover şeması, skor aralıkları ve tek-orijinal kuralını test ediyor |
| BE-03 | Health debug metrikleri | `/health` raw/processed cover sayılarını döndürüyor |
| RAG-04 | RAG doküman validation workflow | `00_validate_rag_docs.py` format, kaynak ve minimum uzunluk kontrolü yapıyor |
| RAG-05 | RAG index dry-run | `04_build_rag.py --dry-run` doküman/chunk kontrolünü model yüklemeden yapıyor |
| API-07 | Typed API response modelleri | FastAPI OpenAPI şemaları `GraphResponse`, `CoverDetailResponse`, `CompareResponse`, `VoiceResponse`, `MatchResponse` ile sabitlendi |
| CI-01 | Backend CI workflow | GitHub Actions push/PR üzerinde validation, dry-run ve pytest çalıştırıyor |
| CI-02 | Node 24 uyumlu Actions | CI workflow `actions/checkout@v6` ve `actions/setup-python@v6` kullanıyor |

### Ready

| ID | İş | Öncelik | Kabul kriteri |
|---|---|---|---|
| DATA-02 | Nihai cover veri seti | P1 | Yaklaşık 50 cover ve temel metadata tamamlanır |
| RAG-01 | Tarihsel belge klasörü | P0 | En az 5 tarihsel doküman hazırlanır |
| AI-06 | Gerçek provider ile ilk skor batch'i | P0 | API key ile 3-5 cover skorlanır ve cache davranışı görülür |

### Next

| ID | İş | Öncelik | Bağımlılık |
|---|---|---|---|
| API-03 | `/api/compare` kalite iyileştirmesi | P1 | Gerçek `llm_analysis` çıktıları |
| API-04 | `/api/voice` RAG kaynaklı test | P1 | `RAG-01`, `04_build_rag.py` |
| MAN-01 | Manifesto taslağı | P1 | Konsept ve teknik kararlar |

### Later

| ID | İş | Öncelik | Neden sonra |
|---|---|---|---|
| MB-01 | MusicBrainz zenginleştirme | P2 | Manuel veri çekirdeği çalıştıktan sonra |
| TTS-01 | Dönemin sesi için TTS/voiceover | P2 | Ana demo stabil olduktan sonra |
| POLISH-01 | Demo senaryosu ve ekran görüntüleri | P2 | Frontend ayağa kalkınca |
| RAG-03 | Kaynak izleme ve alıntı metadata'sı | P2 | RAG temel akışı çalışınca |
| PERF-01 | Model yükleme/cache optimizasyonu | P2 | İlk darboğaz görülünce |

### Blocked / Riskli

| ID | Risk | Etki | Çözüm |
|---|---|---|---|
| RISK-01 | Gemini/OpenAI API key yoksa LLM scriptleri çalışmaz | P0 blokaj | `.env.example`, fallback mock analiz dosyası |
| RISK-02 | Embedding/UMAP model kurulumları ağır olabilir | Geliştirme yavaşlar | Venv, sabit requirements, küçük veriyle ilk smoke test |
| RISK-03 | RAG belgeleri yüzeysel kalırsa rubrikte tarihsel derinlik düşer | Felsefi/tarihsel puan kaybı | Belgeleri manifesto ve endpoint çıktılarıyla ilişkilendir |
| RISK-04 | "İki AI tekniği" jüride tartışmalı görülebilir | Teknik puan riski | README'de teknikleri net ayır; mümkünse TTS ekle |
| RISK-05 | 50 cover'ın hepsi için kaliteli metadata zaman alır | Veri kalitesi düşer | Önce 25 güçlü kayıt, sonra genişletme |

## Sprint Planı

### Sprint 0 - Hazırlık ve Mimari

**Hedef:** Çalışılabilir repo temeli, veri şeması ve API kontratını sabitlemek.

| ID | Task | Öncelik | Tahmin | Kabul kriteri |
|---|---|---:|---:|---|
| ARCH-01 | Klasör yapısını oluştur | P0 | 0.5g | Handoff'taki `backend/` ve `frontend/` yapısı oluşur |
| ARCH-02 | Backend config tasarımı | P0 | 0.5g | `.env`, path sabitleri, model isimleri tek yerden yönetilir |
| ARCH-03 | Veri şemasını kesinleştir | P0 | 0.5g | Cover JSON alanları README'de belgelenir |
| ARCH-04 | API response sözleşmelerini yaz | P0 | 0.5g | Frontend'in beklediği alanlar örnek JSON ile netleşir |
| DOC-01 | README omurgasını aç | P0 | 0.5g | Proje, kurulum, mimari, AI teknikleri başlıkları vardır |

### Sprint 1 - Veri ve İlk Backend

**Hedef:** Frontend'in kullanabileceği ilk galaksi verisini backend'den döndürmek.

| ID | Task | Öncelik | Tahmin | Kabul kriteri |
|---|---|---:|---:|---|
| BE-01 | FastAPI app iskeleti | P0 | 0.5g | `uvicorn main:app --reload --port 8000` çalışır |
| BE-02 | CORS ve health endpoint | P0 | 0.25g | `/health` 200 döner, frontend originleri izinlidir |
| DATA-01 | 25 cover'lık manuel veri seti | P0 | 1g | Dylan, Clapton, GNR, Marley, Zevon gibi çekirdek kayıtlar vardır |
| DATA-02 | 50 cover'a genişletme | P1 | 1g | Yıl, artist, album, genre, context_notes tutarlı olur |
| DATA-03 | Veri doğrulama helper'ı | P1 | 0.5g | Eksik `id/year/context_notes` gibi alanlar raporlanır |
| API-01 | `/api/graph` mock/ham veri | P0 | 0.5g | Geçici pozisyonlarla bile frontend galaksi verisi alır |
| API-02 | `/api/cover/{id}` | P0 | 0.5g | Var olmayan id için 404, geçerli id için detay döner |

### Sprint 2 - AI Analiz ve Duygu Uzayı

**Hedef:** Cover'ları anlamlı duygu skorları ve 3D koordinatlarla işlemek.

| ID | Task | Öncelik | Tahmin | Kabul kriteri |
|---|---|---:|---:|---|
| AI-01 | Gemini/OpenAI provider wrapper | P0 | 0.5g | Timeout, retry ve JSON parse hataları yönetilir |
| AI-02 | `02_score_covers.py` | P0 | 1g | Her cover'a `llm_analysis` eklenir |
| AI-03 | LLM cache/idempotency | P1 | 0.5g | Daha önce skorlanmış cover tekrar ücretli çağrı yapmaz |
| AI-04 | JSON schema validation | P0 | 0.5g | Skorlar 0-1 aralığında ve tüm alanlar mevcut |
| EMB-01 | Embedding metni oluşturucu | P0 | 0.25g | Artist, bağlam, anlam kayması ve duygu skorlarını içerir |
| EMB-02 | SentenceTransformers embedding | P0 | 0.5g | Tüm cover'lar için vektör üretilir |
| EMB-03 | UMAP 3D reducer | P0 | 0.5g | Koordinatlar `[-8, 8]` aralığına normalize edilir |
| EMB-04 | Reducer pickle kaydı | P1 | 0.25g | `/api/match` için `umap_reducer.pkl` oluşur |
| API-03 | `/api/graph` gerçek veri | P0 | 0.25g | Pozisyon ve duygu skorları frontend kontratına uyar |

### Sprint 3 - RAG ve Üretken Deneyim

**Hedef:** Dönemsel iç ses ve karşılaştırma gibi sanat deneyimini taşıyan endpointleri yapmak.

| ID | Task | Öncelik | Tahmin | Kabul kriteri |
|---|---|---:|---:|---|
| RAG-01 | Tarihsel dokümanları yaz | P0 | 1.5g | Vietnam, 1973 haberleri, film, Nobel, counterculture dosyaları olur |
| RAG-02 | Chroma/LlamaIndex index scripti | P0 | 0.75g | `data/processed/chroma_db` oluşur |
| RAG-03 | RAG query helper | P1 | 0.5g | Yıl/kültür sorgusuna ilgili bağlam döner |
| API-04 | `/api/voice` | P1 | 1g | 150 kelimelik dönem monoloğu + kullanılan kaynak listesi döner |
| API-05 | `/api/compare` | P1 | 1g | İki cover için 2-3 paragraflık anlam kayması üretir |
| API-06 | `/api/match` | P1 | 1g | Kullanıcı metni en yakın cover, skor, bridge text ve user position döndürür |
| AI-05 | Hassas kullanıcı metni için ton kontrolü | P1 | 0.5g | Yas/veda metinlerine empatik, iddiasız yanıt üretilir |

### Sprint 4 - Entegrasyon, Test ve Dokümantasyon

**Hedef:** Teslim edilebilir, anlatılabilir ve gösterilebilir hale getirmek.

| ID | Task | Öncelik | Tahmin | Kabul kriteri |
|---|---|---:|---:|---|
| TEST-01 | Backend smoke testleri | P1 | 0.75g | Health, graph, cover, compare/match happy path test edilir |
| TEST-02 | Script dry-run kontrolleri | P1 | 0.5g | Veri dosyaları yoksa anlaşılır hata verir |
| DOC-02 | API dokümantasyonu | P0 | 0.5g | Request/response örnekleri README'de vardır |
| DOC-03 | AI teknikleri bölümü | P0 | 0.5g | Hangi teknik nerede kullanılıyor açıkça anlatılır |
| DOC-04 | Kurulum ve demo talimatı | P0 | 0.5g | Temiz makinede kurulabilir komut sırası vardır |
| FE-CONTRACT-01 | Frontend ekibiyle endpoint doğrulama | P1 | 0.5g | Handoff'taki tüm alanlar backend'de bulunur |
| POLISH-01 | Demo scripti | P2 | 0.5g | Sergide izlenecek 3 dakikalık akış yazılır |
| POLISH-02 | Ekran görüntüleri/example outputs | P2 | 0.5g | README'ye görsel kanıt eklenir |

### Sprint 5 - Manifesto ve Sunum

**Hedef:** Projenin felsefi kalbini teknik çalışmayla aynı seviyeye getirmek.

| ID | Task | Öncelik | Tahmin | Kabul kriteri |
|---|---|---:|---:|---|
| MAN-01 | Manifesto outline | P1 | 0.5g | PDF'teki 4 ana soru başlıklandırılır |
| MAN-02 | Kişisel "door" bölümü | P1 | 1g | Samimi, jenerik olmayan kişisel eşik anlatısı vardır |
| MAN-03 | AI rolü bölümü | P1 | 0.75g | AI'ın araç/ayna/ortak rolü dürüstçe tartışılır |
| MAN-04 | Tarihsel bağlam bölümü | P1 | 0.75g | Vietnam, 1973, Dylan ve film bağlama bağlanır |
| MAN-05 | Son redaksiyon | P1 | 0.5g | 1500-3000 kelime aralığında, teslim edilebilir metin |
| PRES-01 | Sunum konuşma notları | P2 | 0.5g | Teknik ve felsefi açıklama dengeli olur |

## Backend Backlog Detayı

### Veri Modeli

Beklenen cover alanları:

```json
{
  "id": "gnr_1990",
  "artist": "Guns N' Roses",
  "year": 1990,
  "album": "Use Your Illusion II",
  "is_original": false,
  "context_notes": "...",
  "genre": "rock",
  "mood_hint": "defiance, grief, exhaustion",
  "llm_analysis": {
    "emotion_scores": {
      "surrender": 0.0,
      "defiance": 0.0,
      "grief": 0.0,
      "hope": 0.0,
      "exhaustion": 0.0,
      "transcendence": 0.0
    },
    "era_tension": 0.0,
    "political_charge": 0.0,
    "spiritual_weight": 0.0,
    "meaning_shift": "...",
    "historical_pulse": "..."
  },
  "position": { "x": 0.0, "y": 0.0, "z": 0.0 },
  "embedding_vector": []
}
```

### Endpoint Definition of Done

| Endpoint | Done sayılması için |
|---|---|
| `GET /health` | Servis adı, status ve data dosyalarının varlığı döner |
| `GET /api/graph` | Büyük embedding vektörlerini göndermeden hafif graph payload döner |
| `GET /api/cover/{cover_id}` | Panel için meaning, historical pulse ve skorlar eksiksiz döner |
| `POST /api/compare` | Hatalı id için 404, aynı id için 400, başarılı durumda LLM analizi döner |
| `POST /api/voice` | RAG index yoksa açıklayıcı hata, varsa kaynak listeli monolog döner |
| `POST /api/match` | Boş metin için 400, başarılı durumda cover + similarity + bridge + position döner |

### Teknik Kalite Kontrol Listesi

- Path'ler `config.py` içinde merkezi yönetilecek.
- Scriptler tekrar çalıştırılabilir olacak; var olan çıktıyı bozmayacak.
- LLM çağrıları cache'lenebilir/idempotent olacak.
- API response'larında frontend için gereksiz büyük alanlar, özellikle embedding vektörleri, gönderilmeyecek.
- Eksik veri veya işlenmemiş dosya durumunda traceback yerine anlaşılır HTTP hatası dönecek.
- README'de script çalıştırma sırası birebir yazacak.
- `.env.example` gerçek key içermeyecek.

## Frontend Koordinasyon Backlog'u

Frontend bu dosyada ana sorumluluğumuz değil, ama backend'in üretmesi gereken sözleşme için takip edilecek işler:

| ID | İş | Backend etkisi |
|---|---|---|
| FE-01 | Galaksi ilk açılış verisi | `/api/graph` hızlı ve küçük payload olmalı |
| FE-02 | Cover seçimi | `/api/cover/{id}` detaylı fakat tek cover'a özel olmalı |
| FE-03 | Karşılaştırma modu | `/api/compare` response'u `shift_direction`, yıllar ve bağlam içermeli |
| FE-04 | Dönemin sesi paneli | `/api/voice` response'u kısa, okunabilir ve kaynaklı olmalı |
| FE-05 | Vedanı bul input'u | `/api/match` user_position ve matched_cover döndürmeli |
| FE-06 | Backend kapalı hata hali | CORS, HTTP status ve error JSON tutarlı olmalı |

## Rubrik Odaklı Yapılacaklar

### Technical Depth - 30%

- İki veya daha fazla AI tekniğini README'de ayrı ayrı anlat.
- Pipeline'ı "tek API çağrısı" gibi göstermemek için script sırasını ve veri dönüşümünü belgele.
- Mimari diyagram ekle: veri -> LLM skor -> embedding -> UMAP -> API -> Three.js.
- Test veya smoke komutlarını ekle.

### Artistic Originality - 30%

- Galaksi metaforunu sadece görsel efekt değil, duygu uzayının sonucu olarak kur.
- Kullanıcının vedasını projeye dahil ederek işi pasif data viz olmaktan çıkar.
- Karşılaştırma ve dönem sesi metinlerini şiirsel ama tarihsel olarak temelli tut.

### Philosophical Engagement - 25%

- Manifesto teknik rapor gibi değil, kişisel eşik fikri etrafında yazılmalı.
- Dylan'ın şarkıdaki "badge" ve "door" imgeleriyle kişisel tema kurulmalı.
- Vietnam/Watergate/Pat Garrett bağlamı sadece paragraf süsü değil, endpoint çıktılarına ve veri şemasına bağlı olmalı.

### Presentation and Craft - 15%

- Demo sırasında izlenecek akış:
  1. Galaksiyi aç.
  2. Dylan 1973 cover'ını seç.
  3. GNR veya Clapton ile karşılaştır.
  4. Dönemin sesi panelini aç.
  5. Kısa bir kişisel veda metni girip eşleşmeyi göster.
- Demo verisi önceden hazırlanmış olmalı; API key/rate limit canlı sunumu bozmamalı.

## Minimum Viable Artwork

Bu seviyeye gelince proje teslim edilebilir kabul edilir:

- Backend ayağa kalkar.
- En az 25 cover gerçek metadata ile bulunur.
- LLM skorlama çıktıları kaydedilmiştir.
- Embedding + UMAP ile 3D pozisyonlar üretilmiştir.
- `/api/graph`, `/api/cover/{id}`, `/api/match` çalışır.
- Frontend galaksiyi gösterir ve kullanıcı bir cover seçebilir.
- README kurulumu anlatır.
- Manifesto taslağı vardır.

## Strong Submission

Bu seviye rubrikte yüksek puanı hedefler:

- Yaklaşık 50 cover tamamlanmıştır.
- `/api/compare` ve `/api/voice` kaliteli, tarihsel bağlamlı metinler üretir.
- RAG kaynakları gerçekten dönemsel yoğunluk taşır.
- Kullanıcının veda metni galakside mavi nokta olarak görünür.
- README'de mimari diyagram, örnek çıktılar ve AI şeffaflığı vardır.
- Manifesto kişisel, felsefi ve teknik kararlarla bağlantılıdır.

## Stretch Goals

| ID | İş | Değer |
|---|---|---|
| TTS-01 | RAG monoloğunu TTS ile seslendirmek | İkinci generative teknik algısını güçlendirir |
| AUDIO-01 | Cover duygu skorlarından ambient soundscape üretmek | Sanatsal özgünlük artar |
| MB-01 | MusicBrainz metadata zenginleştirme | Veri güvenilirliği artar |
| EXPORT-01 | Kullanıcının eşleşmesini küçük görsel kart olarak dışa aktarmak | Sunum/polish artar |
| SOURCE-01 | RAG kaynaklarını response içinde daha izlenebilir yapmak | Akademik şeffaflık artar |

## İlk Uygulama Sırası

Backend'e başlarken önerilen net sıra:

1. `backend/` iskeleti, `requirements.txt`, `.env.example`, `config.py`.
2. `data/covers.json` için 25 kayıtlık çekirdek veri.
3. `main.py` içinde `/health`, `/api/graph`, `/api/cover/{id}`.
4. `scripts/02_score_covers.py` ile LLM analiz.
5. `scripts/03_embed_and_umap.py` ile pozisyon/embedding.
6. `/api/match`.
7. RAG dokümanları ve `/api/voice`.
8. `/api/compare`.
9. README, test, manifesto ve demo polish.

Bu sıra frontend'in erken mock/gerçek veriyle çalışmasını sağlar ve en riskli AI pipeline'larını fazla geçe bırakmaz.
