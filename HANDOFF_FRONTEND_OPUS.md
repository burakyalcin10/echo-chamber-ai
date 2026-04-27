# ECHO CHAMBER — Frontend Handoff (Claude Opus)

## Proje Özeti

"Echo Chamber", Bob Dylan'ın "Knockin' on Heaven's Door" şarkısının 50+ yıllık cover'larını
3D galaksi olarak görselleştiren interaktif bir web deneyimidir.

Her cover, uzayda bir yıldız. Yıldızların konumu duygu benzerliğinden gelir.
Kullanıcı galaksiyi döndürür, yıldızlara tıklar, cover'ları karşılaştırır,
ve kendi vedasını yazarak galaksideki yerini bulur.

Bu dosya **frontend geliştirici** içindir. Backend ayrı çalışıyor, API dökümanı aşağıda.

---

## Tech Stack

| Katman | Teknoloji |
|---|---|
| Framework | Vanilla HTML + JS (React kullanma — dependency yükü yok) |
| 3D engine | Three.js (r158+) — CDN'den |
| Post-processing | Three.js `EffectComposer` + `UnrealBloomPass` |
| HTTP | `fetch` API — async/await |
| CSS | Custom properties, no framework |
| Font | `Space Grotesk` (Google Fonts) — dönem hissi için |
| Ses (opsiyonel) | Web Audio API — ambient ses katmanı |

---

## Dosya Yapısı

```
frontend/
├── index.html
├── style.css
├── js/
│   ├── main.js          # Giriş noktası, sahne init
│   ├── galaxy.js        # Three.js galaksi + cover noktaları
│   ├── ui.js            # Panel, form, butonlar
│   └── api.js           # Backend fetch çağrıları
└── assets/
    └── grain.png        # Film grain texture (isteğe bağlı)
```

---

## Görsel Dil & Atmosfer

**Referans estetik:** 1970'lerin Super-8 film + uzay gözlemevi + karanlık oda.
Siyah zemin üzerinde amber/turuncu yıldızlar, ince mavi parlama efektleri.
Her şey kasıtlı olarak biraz "yıpranmış" ve "analog" görünmeli.

### Renk Paleti

```css
:root {
  --bg: #080608;               /* Neredeyse siyah — mor tonu */
  --star-base: #C8995A;        /* Amber — cover noktaları */
  --star-original: #E8C87A;    /* Altın — Dylan'ın orijinali */
  --star-user: #7EB8D4;        /* Buz mavisi — kullanıcı noktası */
  --star-selected: #FFFFFF;    /* Beyaz — seçili */
  --glow-color: #5A3A8C;       /* Mor parlama — bloom */
  --text-primary: #E8E0D0;     /* Krem — ana metin */
  --text-secondary: #8A7D6A;   /* Kahve gri — ikincil */
  --panel-bg: rgba(12, 8, 16, 0.88);
  --panel-border: rgba(200, 153, 90, 0.2);
  --accent: #C8995A;
}
```

### Tipografi

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500&display=swap" rel="stylesheet">
```

- Body: `Space Grotesk 300`
- Başlıklar: `Space Grotesk 400`
- Yıl etiketleri: `Space Grotesk 500`, letter-spacing: 0.1em
- Büyük quote'lar: `font-style: italic`, opacity 0.6

---

## Ekran Düzeni

```
┌─────────────────────────────────────────────────────┐
│  [ECHO CHAMBER]                    [?] [↻ reset]    │  ← Header (fixed, minimal)
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│           THREE.JS GALAXY (tam ekran)               │
│              [yıldızlar döner]                      │
│                                                     │
│                                                     │
├──────────────────────┬──────────────────────────────┤
│  LEFT PANEL          │  RIGHT PANEL                 │
│  (cover detayı)      │  (karşılaştırma / eşleşme)  │
│  sadece seçilince    │  sadece aktifken görünür     │
│  görünür             │                             │
└──────────────────────┴──────────────────────────────┘

Alt kısımda sabit: [Vedan nedir?] input çubuğu
```

Tüm paneller `position: fixed`, `backdrop-filter: blur(12px)`, başlangıçta `display: none`.

---

## Three.js Galaksi (`js/galaxy.js`)

### Sahne Kurulumu

```javascript
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
```

### Bloom Post-processing

```javascript
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8,    // strength
  0.4,    // radius
  0.85    // threshold
);
composer.addPass(bloomPass);
```

### Cover Noktaları

Backend `/api/graph`'tan gelen veriden her cover için bir nokta oluştur:

```javascript
function createCoverPoint(cover) {
  const isOriginal = cover.is_original;
  const tension = cover.era_tension;       // 0-1 arası

  // Boyut: önemli cover'lar daha büyük
  const size = isOriginal ? 0.18 : 0.08 + tension * 0.06;

  // Renk: era_tension → amber sıcaklığı
  const hue = THREE.MathUtils.lerp(0.08, 0.04, tension); // amber → kırmızımsı
  const color = new THREE.Color().setHSL(hue, 0.8, 0.55 + tension * 0.15);

  const geometry = new THREE.SphereGeometry(size, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(cover.position.x, cover.position.y, cover.position.z);
  mesh.userData = cover;  // Tıklama için

  return mesh;
}
```

### Arka Plan Partikülleri (derinlik hissi)

```javascript
function createStarField(count = 2000) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 80;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x332244,
    size: 0.05,
    transparent: true,
    opacity: 0.6
  });
  return new THREE.Points(geo, mat);
}
```

### Kamera Kontrolü (OrbitControls benzeri — elle yaz)

```javascript
let isDragging = false, prevMouse = { x: 0, y: 0 };
const rotation = { x: 0, y: 0 };

canvas.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mousemove', e => {
  if (!isDragging) return;
  rotation.y += (e.clientX - prevMouse.x) * 0.005;
  rotation.x += (e.clientY - prevMouse.y) * 0.005;
  prevMouse = { x: e.clientX, y: e.clientY };
  galaxyGroup.rotation.set(rotation.x, rotation.y, 0);
});

// Mouse wheel zoom
canvas.addEventListener('wheel', e => {
  camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.02, 8, 40);
});
```

### Hover & Tıklama (Raycasting)

```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(coverMeshes);
  if (intersects.length > 0) {
    document.body.style.cursor = 'pointer';
    showTooltip(intersects[0].object.userData, e);
  } else {
    document.body.style.cursor = 'default';
    hideTooltip();
  }
});

canvas.addEventListener('click', e => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(coverMeshes);
  if (intersects.length > 0) {
    selectCover(intersects[0].object.userData);
  }
});
```

### Tooltip

Küçük, minimal tooltip — hover'da cover adı + yıl:

```html
<div id="tooltip" style="
  position: fixed;
  pointer-events: none;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-primary);
  letter-spacing: 0.05em;
  display: none;
">
  <span id="tooltip-artist"></span>
  <span id="tooltip-year" style="color: var(--text-secondary); margin-left: 8px;"></span>
</div>
```

---

## Seçili Cover Paneli — Sol (`#panel-cover`)

Bir cover'a tıklanınca `GET /api/cover/{id}` çağrılır, panel açılır.

```html
<div id="panel-cover" style="
  position: fixed;
  left: 24px; bottom: 24px;
  width: 320px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  padding: 24px;
  backdrop-filter: blur(16px);
  display: none;
">
  <div id="pc-artist" style="font-size: 18px; color: var(--text-primary);"></div>
  <div id="pc-year" style="font-size: 13px; color: var(--accent); letter-spacing: 0.12em; margin-top: 4px;"></div>
  <div id="pc-meaning" style="font-size: 13px; color: var(--text-secondary); margin-top: 16px; line-height: 1.7; font-style: italic;"></div>

  <!-- Duygu skorları — mini bar chart -->
  <div id="pc-scores" style="margin-top: 20px;"></div>

  <!-- Butonlar -->
  <div style="margin-top: 20px; display: flex; gap: 8px;">
    <button onclick="openVoice(currentCover.id)" class="btn-ghost">Dönemin sesi →</button>
    <button onclick="openCompare(currentCover.id)" class="btn-ghost">Karşılaştır →</button>
  </div>
</div>
```

### Duygu Skoru Bar'ları

```javascript
function renderEmotionBars(scores) {
  const labels = {
    surrender: 'Teslimiyet',
    defiance: 'İsyan',
    grief: 'Yas',
    hope: 'Umut',
    exhaustion: 'Yorgunluk',
    transcendence: 'Aşkınlık'
  };

  return Object.entries(scores).map(([key, val]) => `
    <div style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-bottom: 3px;">
        <span>${labels[key]}</span>
        <span>${Math.round(val * 100)}%</span>
      </div>
      <div style="height: 2px; background: rgba(200,153,90,0.15); border-radius: 1px;">
        <div style="height: 100%; width: ${val * 100}%; background: var(--accent); border-radius: 1px; transition: width 0.6s ease;"></div>
      </div>
    </div>
  `).join('');
}
```

---

## Dönemin Sesi Paneli (`#panel-voice`)

`POST /api/voice` çağrılır. Yükleme sırasında typewriter efekti göster.

```html
<div id="panel-voice" style="
  position: fixed;
  left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 480px; max-height: 70vh;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  padding: 40px;
  backdrop-filter: blur(20px);
  overflow-y: auto;
  display: none;
">
  <div id="voice-year" style="font-size: 11px; letter-spacing: 0.2em; color: var(--accent);"></div>
  <div id="voice-artist" style="font-size: 22px; color: var(--text-primary); margin-top: 8px;"></div>
  <div id="voice-text" style="
    font-size: 15px; line-height: 1.9; color: var(--text-secondary);
    margin-top: 24px; font-style: italic;
  "></div>
  <button onclick="closeVoice()" style="
    position: absolute; top: 16px; right: 16px;
    background: none; border: none; color: var(--text-secondary);
    cursor: pointer; font-size: 18px;
  ">×</button>
</div>
```

### Typewriter efekti

```javascript
function typewriterEffect(element, text, speed = 18) {
  element.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    element.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}
```

---

## Karşılaştırma Modu

İlk cover seçili. "Karşılaştır" butonuna basınca:
1. Galakside tüm cover'lar soluklaşır (`opacity: 0.3`)
2. "İkinci cover'ı seç" talimatı belirir
3. Kullanıcı ikinci cover'a tıklar → `POST /api/compare` çağrılır
4. Sağ panelde analiz metni görünür
5. İki cover arasında ince bir çizgi çizilir (Three.js `Line`)

```javascript
function drawComparisonLine(posA, posB) {
  const points = [
    new THREE.Vector3(posA.x, posA.y, posA.z),
    new THREE.Vector3(posB.x, posB.y, posB.z)
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0xC8995A,
    transparent: true,
    opacity: 0.4
  });
  comparisonLine = new THREE.Line(geo, mat);
  scene.add(comparisonLine);
}
```

---

## Kullanıcı Girişi — "Vedan Nedir?" (`#input-bar`)

Ekranın alt ortasında sabit input çubuğu. Her zaman görünür.

```html
<div id="input-bar" style="
  position: fixed;
  bottom: 32px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 40px;
  padding: 12px 20px;
  backdrop-filter: blur(16px);
  width: min(560px, 90vw);
">
  <input
    id="farewell-input"
    type="text"
    placeholder="Kapıya yaklaştığında ne hissediyorsun?"
    style="
      background: none; border: none; outline: none;
      color: var(--text-primary); font-family: inherit;
      font-size: 14px; flex: 1;
    "
  />
  <button onclick="submitFarewell()" style="
    background: var(--accent); border: none;
    color: #080608; padding: 8px 16px;
    border-radius: 20px; cursor: pointer;
    font-family: inherit; font-size: 13px;
  ">Kapını bul →</button>
</div>
```

### Eşleşme Sonucu

`POST /api/match` döndükten sonra:
1. Galakside eşleşen cover büyür + parlama artar
2. Kullanıcının konumu mavi bir nokta olarak eklenir
3. Aralarında ince mavi bir enerji çizgisi çizilir
4. Sol panelde bridge_text görünür

```javascript
async function submitFarewell() {
  const text = document.getElementById('farewell-input').value;
  if (!text.trim()) return;

  setLoadingState(true);
  const result = await api.match(text);

  // Kullanıcı noktasını ekle
  addUserPoint(result.user_position);

  // Eşleşen cover'ı vurgula
  highlightMatch(result.matched_cover.id);

  // Bridge text göster
  showBridgeText(result.bridge_text, result.matched_cover);

  setLoadingState(false);
}
```

---

## API Çağrıları (`js/api.js`)

```javascript
const BASE = 'http://localhost:8000/api';

export const api = {
  async graph() {
    const r = await fetch(`${BASE}/graph`);
    return r.json();
  },

  async cover(id) {
    const r = await fetch(`${BASE}/cover/${id}`);
    return r.json();
  },

  async compare(idA, idB) {
    const r = await fetch(`${BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_id_a: idA, cover_id_b: idB })
    });
    return r.json();
  },

  async voice(id) {
    const r = await fetch(`${BASE}/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_id: id })
    });
    return r.json();
  },

  async match(text) {
    const r = await fetch(`${BASE}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_text: text })
    });
    return r.json();
  }
};
```

---

## Yükleme Ekranı

Uygulama açılınca galaxy yüklenirken:

```html
<div id="loading-screen" style="
  position: fixed; inset: 0;
  background: var(--bg);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 1000;
">
  <div style="font-size: 11px; letter-spacing: 0.3em; color: var(--accent);">ECHO CHAMBER</div>
  <div style="
    width: 1px; height: 60px;
    background: linear-gradient(to bottom, var(--accent), transparent);
    margin: 24px auto;
    animation: pulse 1.5s ease-in-out infinite;
  "></div>
  <div style="font-size: 12px; color: var(--text-secondary); letter-spacing: 0.1em;">
    "Mama, take this badge off of me"
  </div>
</div>
```

```css
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

---

## Önemli UX Notları

1. **Galaksi hiç durmaz** — çok yavaş oto-rotasyon (`rotation.y += 0.0003` per frame). Kullanıcı sürüklediğinde oto-rotasyon durur, bırakınca devam eder.

2. **Paneller galaksiyi kapatmaz** — tüm paneller saydamdır, galaksi arka planda görünür.

3. **Dylan'ın orijinali** — her zaman biraz daha büyük, biraz daha parlak. Galaksinin "merkezi" gibi hissettir ama gerçek merkez değil — UMAP'tan gelen konumu ne ise o.

4. **Mobil** — Three.js canvas touch event'lerini handle et. Paneller mobilde tam ekran olabilir.

5. **Hata durumu** — Backend'e ulaşamazsa sade metin: *"Galaksi şu an sessiz."*

---

## Animasyon Referansları

- Noktalara tıklama: `scale` 1'den 1.4'e, 200ms ease-out, sonra geri 1.15'e settle
- Panel açılışı: `opacity` 0→1, `transform: translateY(8px)→0`, 250ms
- Cover seçimi değişince: eski cover yavaşça söner (300ms), yeni cover solar
- Karşılaştırma çizgisi: `opacity` 0→0.4, 400ms, hafif dash animasyonu

---

## Teslim

- `index.html`, `style.css`, `js/` klasörü
- Herhangi bir build tool yok — doğrudan `open index.html` ile çalışmalı
- `README.md`: kurulum yok, sadece backend'in ayakta olması gerekiyor

---

## Backend Koordinatları Hatırlatma

`/api/graph` şu formatı döner:
```json
{
  "covers": [
    {
      "id": "dylan_1973",
      "artist": "Bob Dylan",
      "year": 1973,
      "position": { "x": 1.2, "y": -0.8, "z": 3.1 },
      "emotion_scores": { "surrender": 0.9, "grief": 0.7, ... },
      "era_tension": 0.75,
      "political_charge": 0.88,
      "is_original": true
    }
  ]
}
```

`position.x/y/z` değerleri `[-8, 8]` aralığında normalize edilmiş.
Three.js sahnesinde doğrudan `mesh.position.set(x, y, z)` yap.
