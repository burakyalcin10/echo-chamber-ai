# RAG Preparation Guide

This is the source package we need for the RAG part of Echo Chamber. The goal is not to collect random facts, but to give the model a historical memory it can speak from.

Please prepare the files as `.txt` or `.md`. Put them under:

```text
backend/data/historical_docs/
```

## Format For Each File

Use this structure:

```text
Title:
Timeframe:
Why it matters for Knockin' on Heaven's Door:

Key facts:
- ...
- ...
- ...

Emotional / cultural keywords:
- ...
- ...

Short narrative:
Write 500-1000 words in your own words.

Sources:
- URL or book/article name
- URL or book/article name
```

Avoid long copyrighted quotes. Short quotes are okay when they are necessary, but most of the text should be your own summary and interpretation.

## Core Files To Prepare

### 1. `1973_world_events.txt`

Focus:

- Watergate and the crisis of trust in American institutions.
- Paris Peace Accords and the winding down of the Vietnam War.
- Chilean coup of 1973.
- First oil crisis.
- General mood of exhaustion, suspicion, and transition.

Why we need it:

This becomes the broad historical weather behind Dylan's original 1973 recording.

### 2. `vietnam_and_returning_soldiers.txt`

Focus:

- Vietnam War fatigue in the United States.
- Returning soldiers and the psychological/social aftermath.
- Anti-war protest and public disillusionment.
- The meaning of uniforms, badges, guns, duty, and moral exhaustion.

Why we need it:

The lyric "take this badge off of me" becomes much stronger when the model understands war-weariness and moral injury.

### 3. `pat_garrett_film_context.txt`

Focus:

- Sam Peckinpah's *Pat Garrett & Billy the Kid*.
- The dying sheriff scene and why the song was written for it.
- Western mythology, lawmen, outlaws, aging violence, and the end of an era.
- Dylan's role in the film and soundtrack.

Why we need it:

This is the original narrative doorway of the song. It anchors the whole artwork.

### 4. `counterculture_and_dylan_1970s.txt`

Focus:

- The post-1960s counterculture mood.
- Dylan's relationship to protest music, myth, refusal, and reinvention.
- How Dylan's 1970s work differs from his 1960s protest image.
- The feeling of a generation moving from revolution to fatigue.

Why we need it:

The project should not treat Dylan as just a famous singer. It should understand the worldview around the song.

### 5. `dylan_nobel_and_songwriting.txt`

Focus:

- Dylan's 2016 Nobel lecture ideas about songs, literature, oral tradition, and influence.
- Folk tradition, borrowing, transformation, and songs traveling through voices.
- Why covers are not copies but reinterpretations.

Why we need it:

This helps us justify the "five decades of covers as an emotional galaxy" concept in the manifesto and RAG outputs.

## Strong Optional Files

### 6. `covers_as_cultural_afterlives.txt`

Pick 8-12 important covers from our data and write short notes:

- Bob Dylan 1973
- Eric Clapton 1975
- Bob Marley 1978
- Guns N' Roses 1990
- Dunblane charity ensemble 1996
- Wyclef Jean 1997
- Warren Zevon 2003
- Patti Smith 2005
- Antony and the Johnsons 2005
- Dolly Parton 2023

For each:

- What changed emotionally?
- What historical/cultural moment does it belong to?
- Is it more surrender, grief, defiance, hope, exhaustion, or transcendence?

### 7. `1990s_and_2000s_reinterpretations.txt`

Focus:

- End of the Cold War.
- Stadium rock, MTV, soundtrack culture.
- Post-9/11 atmosphere.
- Emo, alternative rock, and public mourning.

Why we need it:

Our cover map extends far beyond 1973, so the RAG archive should understand later eras too.

### 8. `personal_manifesto_notes.txt`

This one is not for factual RAG only; it can help the manifesto.

Write rough notes answering:

- Why does this song catch us?
- What is "the door" in our lives?
- Is AI a tool, collaborator, mirror, archive, or something else?
- Why a galaxy of covers instead of a normal music player?

## Minimum Useful Package

If time is tight, prepare these five first:

1. `1973_world_events.txt`
2. `vietnam_and_returning_soldiers.txt`
3. `pat_garrett_film_context.txt`
4. `counterculture_and_dylan_1970s.txt`
5. `dylan_nobel_and_songwriting.txt`

With these, the RAG voice endpoint can already produce grounded outputs.

## Validation Commands

After adding your files, run these from `backend/`:

```bash
python scripts/00_validate_rag_docs.py
python scripts/04_build_rag.py --dry-run
python scripts/04_build_rag.py
```

For a partial draft folder while you are still writing:

```bash
python scripts/00_validate_rag_docs.py --allow-missing-core --min-words 100
```

The full validator expects the five core files, the section headers from this guide, at least 300 words per document, and at least one URL source when possible.
