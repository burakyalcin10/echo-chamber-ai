# Echo Chamber: An Artist's Manifesto

**Burak Yalçın**  
CSE 358 Introduction to Artificial Intelligence  
Spring 2025–2026

---

## I. The Question That Started Everything

I did not choose this song. It chose me, the way certain songs do — quietly, without announcement, and then all at once you realize it has been with you for years.

"Knockin' on Heaven's Door" was written in 1973 for a dying sheriff in a Sam Peckinpah Western. It is four chords and eight lines. A man who can no longer hold his badge gives it to someone else. That is the whole story. And yet: more than six hundred artists have covered it. Clapton stripped it down to a whisper. Guns N' Roses turned it into an arena cry. Avril Lavigne sang it to a generation that had never heard of Pat Garrett or Billy the Kid. Roger Waters stretched it into an anti-war elegy that ran for eleven minutes.

Why does a song about a dying sheriff follow humanity across half a century?

That question became this project.

---

## II. Why This Medium

When I began thinking about how to respond to the assignment, I had the instinct most computer science students have: I reached for the technically impressive first. Text-to-image. Music generation. A chatbot. But I kept returning to the covers — the sheer proliferation of them, the fact that every decade since 1973 has produced new attempts at the same door.

The covers were the data. And the question was what to do with that data that no human ear could do alone.

A single listener can compare two or three covers in one sitting. They can feel which version makes them sad, which one makes them want to fight, which one sounds like surrender. But nobody can hold fifty covers in their head simultaneously and map the emotional terrain between them. Nobody can look at the whole galaxy at once.

That is what a machine can do. And that is what this medium is: not a visualization of a song, but a visualization of what fifty people did when they stood at the same door.

I chose an interactive 3D galaxy because the metaphor felt honest. Stars are individual lights. They burn for their own reasons, in their own time, at their own temperature. But from a distance, they form shapes — constellations we use to navigate. The fifty covers of this song are like that. Each one burns for its own reasons. But together they form a shape, and that shape tells us something about what human beings do when they are losing something.

The web medium meant anyone could walk into this space without downloading anything, without credentials, without expertise in music theory or history. You click on a node. You read the emotional profile. You find the cover that rhymes with your own grief. That accessibility mattered to me. The song was never meant only for people who knew what a sheriff's badge was. It was for anyone who had ever had to hand something over and walk away.

---

## III. What Caught Me

The year 1973 is not ancient history. It is the year the Paris Peace Accords were signed and the Vietnam War ended for America — on paper. In reality, more than fifty thousand American soldiers were already dead, and hundreds of thousands more were coming home to a country that did not know what to do with them. The counterculture that had promised a new world had frayed. Nixon was unraveling. The optimism of the 1960s, the belief that young people could change everything if they just believed hard enough, was exhausted.

Dylan wrote "Knockin' on Heaven's Door" in the middle of that exhaustion.

He did not write a protest song. He did not write an anthem. He wrote eight lines about a man who is done. *Mama, put my guns in the ground. I can't shoot them anymore.* The sheriff does not rage. He does not fight. He lets go. That act of letting go — not as defeat, but as a kind of grace — is what makes the song survive every era. Because every era produces people who are done with something they used to believe in.

What caught me most was reading about the soldiers returning from Vietnam. Historians describe a generation that came back with a particular kind of silence — not the silence of peace, but the silence of people who have seen something that cannot be named in ordinary language. Many of them described the experience as arriving at a threshold and not knowing which side they were on. Were they home? Were they still in the war? Were they the person who left, or someone new?

That threshold is the door in the song's title.

And I realized, working on this project, that the door is not Heaven. The door is the moment between what you were and what you are becoming. Dylan's sheriff stands at that door. So did every soldier who came home in 1973. So does every person who has ever had to give back a badge — a role, an identity, a belief — because they can no longer use it.

---

## IV. AI as What

I have spent enough time with artificial intelligence to know that it is fashionable to call it a collaborator, a partner, a co-creator. I want to be honest: AI in this project was not a collaborator in the way another human being would be. It did not have opinions. It did not feel moved by the music.

But it was not merely a tool, either.

The LLM scoring process — using Gemini to analyze each cover against six emotional dimensions: surrender, defiance, grief, hope, exhaustion, transcendence — did something I could not have done alone. I could have listened to fifty covers and formed impressions. But impressions are inconsistent. My mood on a Tuesday afternoon would have colored how I heard Eric Clapton differently from how I heard him on a Friday morning. The model is consistent in a way I am not. It hears the same way every time.

That consistency is a kind of precision instrument. Like a spectroscope that reveals which elements are burning inside a star. I cannot see those elements with my eyes. The model can.

But the model did not decide what the six dimensions were. I did. It did not choose to look for surrender and transcendence rather than, say, tempo and vocal range. I chose that because I had spent weeks thinking about what the song is about. The model was precise about the questions I told it to ask.

The embedding space was something different. When the sentence model placed fifty covers in a high-dimensional vector space and UMAP collapsed that space into three dimensions, the resulting galaxy was not something I designed. I did not decide that Guns N' Roses would cluster near one pole while the sparse folk covers clustered near another. The model found that structure. I only built the room to display it.

In that sense, AI was a kind of mirror. It reflected back a structure that was latent in the music all along, a structure I could feel but could not see. The embedding space did not create meaning. It revealed it.

And then there is the RAG voice — the historical monologue that speaks when you ask a cover to tell you about its era. I built that system to pull from documents about Vietnam, about 1973, about the counterculture, about Dylan's own Nobel Prize lecture where he spoke about songs as literature. When a 1973 cover speaks, it speaks with the texture of that year behind it: the weight of the war's end, the smell of campfires at Woodstock still in the air but fading, the first stirrings of a decade that would look very different from the one before.

I did not write those words. I gathered them from history, and the model assembled them into a voice. I was the curator. The model was the throat.

---

## V. My Door

I am a computer science student in 2026, which means I am completing my education at a moment when artificial intelligence has made a significant portion of what I have learned potentially obsolete. Not the logic of it, not the problem-solving mind that studying algorithms builds, but the specific craft — the writing of code, the debugging of functions — is increasingly something a machine will handle.

I do not know what this means for me yet.

I have spent four years learning to think in a particular way: precisely, sequentially, with careful attention to edge cases and failure modes. That thinking has felt like a badge. A credential. A thing I could hold up and say: *this is what I am.*

But what I am discovering, building this project, is that the most interesting work happens not in the writing of the code but in the asking of the right question. The model can write code. The model cannot decide what the six dimensions of emotional experience should be when analyzing fifty covers of a song about a dying sheriff. The model cannot feel that the word "surrender" is more honest than "sadness," that "transcendence" is more accurate than "happiness," that what Dylan's sheriff was experiencing was not grief exactly but something closer to relief.

That choosing — that is mine.

So my door, in 2026, is this threshold: the moment when I must decide what I am carrying and what I can no longer use. The specific technical skills I learned, some of them. The way of thinking that learning them built — that, I am keeping.

There is also something more personal.

I am Turkish, which means I grew up in a country with its own complicated relationship to farewells: to empires that ended, to migrations that never fully ended, to the ongoing negotiation between what was and what is becoming. The image of a man handing over his badge and walking toward a door he cannot see past — that image is not foreign to me. My grandparents' generation handed over things they could not use anymore. My parents' generation did too.

Dylan wrote this song about an American sheriff in a fictitious Western. But I heard it as something older and more widespread than that. The badge is anything you have held so long that you thought it was you. The door is what comes after you let it go.

This project is my version of standing at that door. I do not know what is on the other side — for the sheriff, for the soldiers who came home in 1973, for me as a student at the edge of whatever comes next. But I know that building this galaxy, mapping the emotional terrain of fifty people's farewells, has changed how I hear the song.

That is what the best projects do. The assignment said so, and it was right.

---

## VI. Technical Transparency

In accordance with the project's academic integrity requirements, the following AI tools and techniques were used:

**AI Techniques:**
- **LLM Emotion Scoring** — Google Gemini (`gemini-2.5-flash`) with structured JSON output, prompting for six emotional dimensions per cover. Falls back to pre-scored data when API quota is exceeded.
- **Sentence Embeddings** — `all-MiniLM-L6-v2` (HuggingFace / SentenceTransformers) to embed cover metadata and user text for semantic similarity search.
- **UMAP Dimensionality Reduction** — `umap-learn` to reduce high-dimensional embeddings to 3D galaxy coordinates, computed offline.
- **RAG Pipeline** — LlamaIndex with ChromaDB for retrieval-augmented generation, using five historical documents about 1973, Vietnam, the counterculture, and Dylan's worldview.

**Frameworks & Libraries:**
- FastAPI (backend API), Next.js 16 + React Three Fiber (frontend), Tailwind CSS
- SentenceTransformers, UMAP, LlamaIndex, ChromaDB, Pydantic

All creative direction, architectural decisions, data curation, and this manifesto are my own work. The AI systems generated, retrieved, and organized material that I had already defined the frame for.

---

*"Everyone knocks on heaven's door in their own way. What matters is not what you find behind it, but who you discover yourself to be while knocking."*

— Project Assignment, CSE 358

---

*Word count: approximately 1,750 words*
