# Data Sources and Attribution Notes

The cover dataset in `backend/data/covers.json` is manually curated for the Echo Chamber artwork. It combines known and researched cover performances with interpretive metadata written for this project.

Primary discovery/check sources used during curation:

- [MusicBrainz work page for "Knockin' on Heaven's Door"](https://musicbrainz.org/work/4195adde-cfcf-3cc5-ab3f-405a9fdca8a9)
- [SecondHandSongs versions page for "Knockin' on Heaven's Door"](https://secondhandsongs.com/work/249/versions)

Important distinction:

- Artist, year, and broad cover/performance existence are sourced or cross-checked from public music databases where possible.
- `context_notes`, `mood_hint`, `emotion_scores`, `era_tension`, `political_charge`, and `spiritual_weight` are project-authored interpretive metadata. They are not quoted from those databases.
- The LLM scoring pipeline can later replace or enrich the initial manual scores via `backend/scripts/02_score_covers.py`.

Before final submission, review any newly added cover entries against at least one public source and keep this file updated with additional references.
