# Echo Chamber — Exhibition Demo Script

**Target duration:** 5–7 minutes  
**Setup:** Backend running on :8000, frontend open on :3000 in fullscreen browser.  
Pre-load the page and let the galaxy settle before the audience arrives.

---

## Pre-Demo Checklist

- [ ] `cd backend && source .venv/Scripts/activate && uvicorn main:app --port 8000`
- [ ] `cd frontend && npm run dev` → open `http://localhost:3000`
- [ ] Wait ~5 seconds for the 3D galaxy to fully render
- [ ] Set browser to fullscreen (`F11`)
- [ ] Confirm health: `curl http://localhost:8000/health` shows `"llm_configured": true`
- [ ] Have the demo farewell text ready to paste (Step 5 below)

---

## Step 1 — Open the Galaxy (≈ 1 min)

**What to do:** Let the galaxy idle. Drag to rotate slowly.

**What to say:**
> "This is Echo Chamber. Every node you see is a different artist's cover of Bob Dylan's 'Knockin' on Heaven's Door' — fifty versions, spanning fifty-one years, from 1973 to 2024. The position of each node isn't random. It reflects where that cover sits emotionally: how much surrender it carries, how much grief, how much defiance."

Point to the relationship legend (top-right).

> "These edges connect covers that are emotionally close, historically near, or genre-adjacent. Switch to **Emotional** mode."

Click **RELATIONSHIP → Emotional** in the TopBar.

> "Now you see only the emotional proximity network. The covers that feel the same way about the same door cluster together."

---

## Step 2 — The Original vs. The Arena (≈ 1.5 min)

**What to do:** Click on Dylan's original node.  
*(Search "Dylan" in the TopBar if it's hard to find by eye.)*

**What to say:**
> "This is Bob Dylan, 1973. Surrender: 92%. Defiance: 18%. He wrote this for a dying sheriff in a Sam Peckinpah Western. The man is not fighting. He is letting go."

Show the emotional profile bars in the right panel.

> "Now look at this."

Click **Compare** button, then select **Guns N' Roses, 1990** as the second cover.

**Wait for the LLM response.**

> "Defiance: 88%. Axl Rose turned an eight-line folk song about dying into a stadium anthem. The LLM finds the exact inflection point — where the surrender became a war cry. That shift is the project's central question: what happens to a song about letting go when the world refuses to let go?"

---

## Step 3 — The Most Opposite Covers (≈ 1 min)

**What to do:** If time permits, show the starkest emotional contrast.

Compare **Jeff Buckley (1994)** vs **Guns N' Roses (1990)**.

| | Surrender | Defiance | Grief |
|--|--|--|--|
| Jeff Buckley 1994 | 0.82 | **0.12** | 0.86 |
| Guns N' Roses 1990 | 0.42 | **0.88** | 0.56 |

**What to say:**
> "Jeff Buckley's version has almost no defiance. It is pure surrender and grief — 86% grief. Guns N' Roses has the highest defiance in the entire dataset. These two covers are standing at the same door and experiencing completely opposite things. The LLM can articulate why."

---

## Step 4 — Era Voice: History Speaks (≈ 1 min)

**What to do:** Click on **Warren Zevon (2003)**.  
Click **Era Voice** in the detail panel.

**What to say — before the response loads:**
> "Warren Zevon recorded his cover in 2003. He had been diagnosed with inoperable mesothelioma and given three months to live. He chose not to undergo chemotherapy so he could finish his final album. This cover was recorded weeks before his death. Surrender: 90%. Grief: 88%."

**After the RAG response loads:**
> "What you're hearing is not a hallucination. The system retrieves from actual historical documents — about 1973, about the Vietnam era, about Dylan's Nobel Prize lecture, about the counterculture — and grounds the monologue in real texture. The voice is generated, but the history behind it is real."

---

## Step 5 — Match Mode: Your Door (≈ 1 min)

**What to do:** Click **Match** in the SideNav. Paste this text into the input:

> *"I have been carrying something for years that I can no longer hold. I am ready to set it down and walk through whatever comes next."*

Press Enter. **Wait for the result.**

**What to say — while waiting:**
> "The same sentence embedding model that built the galaxy now reads what you wrote and finds the cover whose emotional fingerprint is closest to yours."

**After the result appears:**
> "That cover is your cover. Not because the algorithm decided — because the emotional space you described maps closest to the emotional space that artist stood in when they recorded their version. The galaxy is a map of how fifty people knocked on the same door. This is where you would stand among them."

---

## Anticipated Questions

**Q: Are the emotion scores subjective?**
> "Yes, and intentionally so. The LLM is given a specific prompt asking it to score emotional dimensions as a musicologist would — with context about the era, the genre, the production choices. The scores are consistent for a given model, but a different model or prompt would produce different results. That variability is part of the artwork's argument: emotional interpretation is never neutral."

**Q: Why 50 covers specifically?**
> "Fifty felt like the threshold between a playlist and a dataset — enough to reveal meaningful structure, small enough that every cover was curated deliberately. Each one was chosen because it said something different about what 'knocking on heaven's door' means in its decade."

**Q: What if the API key runs out during the demo?**
> "Every LLM-backed endpoint has a local fallback. The artwork degrades gracefully — the galaxy, the emotional profiles, and the match remain fully functional. Only the LLM-generated text switches to pre-written local content. The demo continues."

**Q: What does this have to do with AI?**
> "Three techniques: an LLM that reads emotion into music, a sentence embedding model that turns language into geometry, and a RAG system that retrieves real history. None of them alone could produce this. Together, they let us see structure in fifty years of human grief that no single listener could hold in their head."

---

## Fallback Plan

If the LLM fails mid-demo:

1. The galaxy and all emotional profiles still work (data is pre-computed)
2. Match mode still works (embedding is local, no API needed)
3. Era Voice and Compare will show fallback text — pivot: *"This is the local fallback mode. The artwork is designed to be fully explorable without credentials — this is intentional, not a bug."*

If the frontend fails to load:

- Open `http://localhost:8000/docs` to show the live API documentation as a fallback demonstration
- Explain the architecture using the diagram in README.md
