# ECHO CHAMBER — Backend Handoff (Codex)

## Proje Özeti

"Echo Chamber", Bob Dylan'ın "Knockin' on Heaven's Door" şarkısının 50+ yıllık cover'larını
duygu uzayında haritalayan interaktif bir web deneyimidir. Kullanıcı cover'ları 3D galakside
keşfeder, iki cover'ı karşılaştırır, dönemin tarihî sesini dinler ve kendi vedasını yazarak
galaksideki yerini bulur.

Bu dosya **backend geliştirici** içindir. Frontend ayrı bir ekip tarafından yapılıyor.

---

## Tech Stack

| Katman | Teknoloji |
|---|---|
| Backend framework | FastAPI (Python 3.11+) |
| LLM | Anthropic Claude API (`claude-opus-4-5` veya `claude-3-5-sonnet`) |
| RAG | LlamaIndex + ChromaDB (local persistent) |
| Embedding | `sentence-transformers` — `all-MiniLM-L6-v2` |
| Dim reduction | `umap-learn` |
| Veri | Manuel JSON + MusicBrainz API (karma) |
| Env yönetimi | `python-dotenv` |
| CORS | FastAPI CORS middleware (frontend localhost:5173 için) |

---

## Proje Yapısı

```
echo-chamber/
├── backend/
│   ├── main.py                  # FastAPI app, tüm router'lar burada
│   ├── config.py                # ENV, sabitler
│   ├── data/
│   │   ├── covers.json          # Ham cover verisi (elle + MusicBrainz)
│   │   ├── historical_docs/     # RAG için TXT belgeler
│   │   │   ├── vietnam_letters.txt
│   │   │   ├── pat_garrett_synopsis.txt
│   │   │   ├── 1973_news.txt
│   │   │   ├── dylan_nobel_lecture.txt
│   │   │   └── counterculture_1973.txt
│   │   └── processed/
│   │       ├── covers_with_embeddings.json   # Umap sonrası 3D koordinatlar
│   │       └── chroma_db/                    # ChromaDB persist dir
│   ├── scripts/
│   │   ├── 01_build_covers.py   # MusicBrainz'den veri çek + manuel JSON birleştir
│   │   ├── 02_score_covers.py   # LLM ile duygu skoru üret
│   │   ├── 03_embed_and_umap.py # Embedding + UMAP → 3D koordinatlar
│   │   └── 04_build_rag.py      # LlamaIndex index oluştur
│   └── requirements.txt
└── frontend/                    # Ayrı ekip — bu handoff'ta yok
```

---

## Adım 0 — Ortam Kurulumu

```bash
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn anthropic llama-index llama-index-vector-stores-chroma \
    chromadb sentence-transformers umap-learn numpy pandas python-dotenv \
    musicbrainzngs requests
```

`.env` dosyası:
```
ANTHROPIC_API_KEY=sk-ant-...
MUSICBRAINZ_APP_NAME=EchoChamber/1.0
MUSICBRAINZ_CONTACT=your@email.com
```

---

## Adım 1 — Cover Verisi (`scripts/01_build_covers.py`)

### Veri Stratejisi (karma)

**Manuel JSON (`data/covers.json`)** — önce bu dosyayı oluştur, yaklaşık 50 cover.
MusicBrainz'den çekilen veriyle zenginleştirilecek.

Manuel JSON şeması:
```json
[
  {
    "id": "dylan_1973",
    "artist": "Bob Dylan",
    "year": 1973,
    "album": "Pat Garrett & Billy the Kid",
    "is_original": true,
    "context_notes": "Written for dying sheriff in Sam Peckinpah's Western. Vietnam War era, Nixon presidency.",
    "genre": "folk",
    "mood_hint": "surrender, mortality, farewell"
  },
  {
    "id": "clapton_1975",
    "artist": "Eric Clapton",
    "year": 1975,
    "album": "461 Ocean Boulevard",
    "is_original": false,
    "context_notes": "Post-Vietnam America, Watergate aftermath, Clapton's heroin recovery period.",
    "genre": "rock",
    "mood_hint": "redemption, blues, exhaustion"
  }
]
```

**Önerilen cover listesi (elle yaz):**
Dylan (1973), Clapton (1975), Randy Crawford (1980), Guns N' Roses (1990, Use Your Illusion II),
Bryan Adams (1992), Avril Lavigne (2004, acoustic), Antony and the Johnsons (2005),
Patti Smith (2005), Warren Zevon (2003, posthumous), Jeff Buckley (1994 live),
Bob Marley (1978 reggae), Wyclef Jean (1997), Rainie Yang (2009, Mandarin),
My Chemical Romance (2004 cover), Knockin' on Heaven's Door — Matrix Reloaded (2003),
Dunblane charity (1996, Scotland shooting memorial), various more up to 2020.

**MusicBrainz ile zenginleştirme:**
```python
import musicbrainzngs

musicbrainzngs.set_useragent(APP_NAME, "1.0", CONTACT)

def fetch_mb_recording(artist: str, year: int) -> dict:
    result = musicbrainzngs.search_recordings(
        query=f'knockin on heavens door artist:"{artist}"',
        limit=1
    )
    # recording bilgisi varsa: duration, release country, label ekle
    ...
```

Script çıktısı `data/covers.json`'u in-place günceller.

---

## Adım 2 — LLM ile Duygu Skoru (`scripts/02_score_covers.py`)

Her cover için Claude'a şunu sor:

```python
SCORE_PROMPT = """
You are a musicologist and cultural historian. Analyze this cover of "Knockin' on Heaven's Door":

Artist: {artist}
Year: {year}
Context: {context_notes}
Genre: {genre}

Return a JSON object with EXACTLY these fields (no markdown, no explanation):
{{
  "emotion_scores": {{
    "surrender": 0.0-1.0,
    "defiance": 0.0-1.0,
    "grief": 0.0-1.0,
    "hope": 0.0-1.0,
    "exhaustion": 0.0-1.0,
    "transcendence": 0.0-1.0
  }},
  "era_tension": 0.0-1.0,
  "political_charge": 0.0-1.0,
  "spiritual_weight": 0.0-1.0,
  "meaning_shift": "one sentence: how this cover reinterprets the song vs the original",
  "historical_pulse": "one sentence: what was happening in the world when this was recorded"
}}
"""
```

Skorları `covers.json`'daki her objeye `llm_analysis` alanı olarak ekle.
Rate limit için `time.sleep(1)` koy araya.

---

## Adım 3 — Embedding + UMAP (`scripts/03_embed_and_umap.py`)

### Embedding vektörü oluşturma

Her cover için embedding'e girecek metin:
```python
def build_embedding_text(cover: dict) -> str:
    scores = cover["llm_analysis"]["emotion_scores"]
    return (
        f"{cover['artist']} {cover['year']}. "
        f"{cover['context_notes']} "
        f"{cover['llm_analysis']['meaning_shift']} "
        f"Surrender:{scores['surrender']:.1f} "
        f"Defiance:{scores['defiance']:.1f} "
        f"Grief:{scores['grief']:.1f} "
        f"Hope:{scores['hope']:.1f} "
        f"Exhaustion:{scores['exhaustion']:.1f} "
        f"Transcendence:{scores['transcendence']:.1f}"
    )
```

### UMAP (3D çıktı — Three.js için)

```python
from sentence_transformers import SentenceTransformer
import umap
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")
texts = [build_embedding_text(c) for c in covers]
vectors = model.encode(texts)

reducer = umap.UMAP(n_components=3, n_neighbors=8, min_dist=0.3, random_state=42)
coords_3d = reducer.fit_transform(vectors)

# Normalize to [-1, 1] for Three.js scene units
for i, (x, y, z) in enumerate(coords_3d):
    covers[i]["position"] = {
        "x": float(np.interp(x, [coords_3d[:,0].min(), coords_3d[:,0].max()], [-8, 8])),
        "y": float(np.interp(y, [coords_3d[:,1].min(), coords_3d[:,1].max()], [-8, 8])),
        "z": float(np.interp(z, [coords_3d[:,2].min(), coords_3d[:,2].max()], [-8, 8]))
    }
    covers[i]["embedding_vector"] = vectors[i].tolist()  # Modül C için sakla

# Kaydet
with open("data/processed/covers_with_embeddings.json", "w") as f:
    json.dump(covers, f, indent=2)
```

---

## Adım 4 — RAG Index (`scripts/04_build_rag.py`)

### Tarihî belgeler içeriği

`data/historical_docs/` altına şu TXT dosyalarını oluştur (içerik tamamen elle yazılabilir, ~500-1000 kelime her biri):

- **vietnam_letters.txt** — Gerçek veya temsili Vietnam asker mektupları, 1968-1973 arası
- **1973_news.txt** — 1973'ün önemli olayları: Watergate, Paris Barış Anlaşması, Şili darbesi, ilk petrol krizi
- **pat_garrett_synopsis.txt** — Sam Peckinpah filmi özeti, tema analizi, Dylan'ın katılımı
- **dylan_nobel_lecture.txt** — Dylan'ın 2016 Nobel konuşmasından alıntılar (kamu malı)
- **counterculture_1973.txt** — Anti-savaş hareketi, Woodstock sonrası kültür, Nixon karşıtı protesto

### LlamaIndex kurulumu

```python
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

chroma_client = chromadb.PersistentClient(path="data/processed/chroma_db")
collection = chroma_client.get_or_create_collection("historical_docs")

vector_store = ChromaVectorStore(chroma_collection=collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

documents = SimpleDirectoryReader("data/historical_docs").load_data()
index = VectorStoreIndex.from_documents(documents, storage_context=storage_context)
print("RAG index oluşturuldu.")
```

---

## API Endpoints

### `GET /api/graph`

Tüm cover'ları 3D koordinatlarla döndür.

```python
@app.get("/api/graph")
async def get_graph():
    covers = load_covers()  # covers_with_embeddings.json
    return {
        "covers": [
            {
                "id": c["id"],
                "artist": c["artist"],
                "year": c["year"],
                "position": c["position"],
                "emotion_scores": c["llm_analysis"]["emotion_scores"],
                "era_tension": c["llm_analysis"]["era_tension"],
                "political_charge": c["llm_analysis"]["political_charge"],
                "is_original": c["is_original"]
            }
            for c in covers
        ]
    }
```

---

### `POST /api/compare`

**Modül A** — İki cover arasındaki anlam kaymasını analiz et.

Request body:
```json
{ "cover_id_a": "dylan_1973", "cover_id_b": "gnr_1990" }
```

Response:
```json
{
  "analysis": "...",         // LLM üretimi paragraf
  "shift_direction": "surrender→defiance",
  "key_year_a": 1973,
  "key_year_b": 1990,
  "historical_context_a": "...",
  "historical_context_b": "..."
}
```

LLM prompt:
```python
COMPARE_PROMPT = """
You are a cultural critic and musicologist analyzing two covers of "Knockin' on Heaven's Door".

Cover A: {artist_a} ({year_a})
Analysis: {analysis_a}
Historical context: {hist_a}

Cover B: {artist_b} ({year_b})
Analysis: {analysis_b}
Historical context: {hist_b}

Write 2-3 paragraphs examining the MEANING SHIFT between these two covers.
How did the song's emotional core transform across time and culture?
What does this shift reveal about each era?
Be specific, poetic, and historically grounded. Write as if narrating a documentary.
Language: English.
"""
```

---

### `POST /api/voice`

**Modül B** — Seçilen cover'ın döneminin iç sesi (RAG destekli).

Request body:
```json
{ "cover_id": "gnr_1990" }
```

Response:
```json
{
  "monologue": "...",        // LLM + RAG üretimi iç monolog
  "year": 1990,
  "artist": "Guns N' Roses",
  "rag_sources_used": ["1973_news", "counterculture_1973"]
}
```

LLM prompt (RAG context eklenerek):
```python
VOICE_PROMPT = """
You are a literary AI channeling the internal voice of an era.

The year is {year}. {artist} just recorded "Knockin' on Heaven's Door".

Historical context from the archives:
{rag_context}

Write a 150-word first-person interior monologue as if you are the era itself —
the collective unconscious of {year} — speaking through this recording.
Use sensory details. Reference real historical events. Be poetic but grounded.
Do NOT use clichés. Do NOT explain — evoke.
"""
```

RAG query: `f"What was happening in {cover['year']} culturally and politically?"`

---

### `POST /api/match`

**Modül C** — Kullanıcının vedasını embedding ile cover'lara eşleştir.

Request body:
```json
{ "user_text": "Annemin ölümünden sonra yazdığım bir veda..." }
```

Response:
```json
{
  "matched_cover": { "id": "...", "artist": "...", "year": ... },
  "similarity_score": 0.87,
  "bridge_text": "...",       // LLM üretimi bağlantı metni
  "user_position": { "x": 2.1, "y": -1.4, "z": 0.8 }  // Graf'taki konumu
}
```

İşlem:
```python
# 1. Kullanıcı metnini embed et
user_vector = model.encode([user_text])[0]

# 2. Tüm cover vektörleriyle cosine similarity
from sklearn.metrics.pairwise import cosine_similarity
similarities = cosine_similarity([user_vector], cover_vectors)[0]
best_idx = similarities.argmax()
matched = covers[best_idx]

# 3. Kullanıcının UMAP konumunu hesapla (fit transform yerine approximate)
user_3d = reducer.transform([user_vector])[0]  # reducer pickle olarak saklanmalı

# 4. LLM ile bağlantı metni
MATCH_PROMPT = """
A user wrote this farewell:
"{user_text}"

They have been matched to {artist}'s {year} cover of "Knockin' on Heaven's Door".
This cover's essence: {meaning_shift}
Historical context: {historical_pulse}

Write 3 sentences connecting their personal farewell to this cover and its era.
Be empathetic, literary, and specific. Do not be generic.
"""
```

**Önemli:** `reducer` objesini `pickle` ile kaydet:
```python
import pickle
with open("data/processed/umap_reducer.pkl", "wb") as f:
    pickle.dump(reducer, f)
```

---

### `GET /api/cover/{cover_id}`

Tek cover'ın tüm detaylarını döndür (panel için).

```json
{
  "id": "gnr_1990",
  "artist": "Guns N' Roses",
  "year": 1990,
  "album": "Use Your Illusion II",
  "position": { "x": 3.2, "y": 1.1, "z": -2.4 },
  "emotion_scores": { ... },
  "meaning_shift": "...",
  "historical_pulse": "...",
  "era_tension": 0.82,
  "political_charge": 0.91,
  "spiritual_weight": 0.34
}
```

---

## CORS & Genel Ayarlar

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Hata Yönetimi

- LLM timeout: `httpx.Timeout(30.0)` — Claude bazen yavaş
- Rate limit: Anthropic rate limit'e düşersen `time.sleep(2)` + retry (max 3)
- ChromaDB: Index yoksa `04_build_rag.py` çalıştırılmamış demektir — 500 yerine anlamlı hata ver
- Covers JSON: `covers_with_embeddings.json` yoksa `03_embed_and_umap.py` önce çalıştır

---

## Script Çalıştırma Sırası

```bash
cd backend
python scripts/01_build_covers.py    # ~5 dk
python scripts/02_score_covers.py    # ~15 dk (50 LLM call)
python scripts/03_embed_and_umap.py  # ~2 dk
python scripts/04_build_rag.py       # ~1 dk
uvicorn main:app --reload --port 8000
```

---

## Frontend'e Söyle

Backend `http://localhost:8000` üzerinde çalışır.
Tüm endpointler `/api/` prefix'i alır.
`/api/graph` endpoint'i Three.js sahnesinin başlangıç verisidir — uygulama açılınca ilk bu çağrılır.
Cover'ların `position.x/y/z` değerleri `[-8, 8]` aralığında normalize edilmiştir, Three.js scene unit'leriyle doğrudan uyumludur.

---

## Teslim

- `README.md` içinde tüm script sırası ve API dokümantasyonu
- `.env.example` (gerçek key olmadan)
- `requirements.txt`
- GitHub repo linki
