# Echo Chamber: An Artist's Manifesto

**Burak Yalçın**  - **20220808069**
**Alperen Ulukaya** - **20220808006**      
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

A single listener can compare two or three covers in one sitting. They can feel which version makes them sad, which one makes them want to fight, which one sounds like surrender. But nobody can hold 32 verified covers in their head simultaneously and map the emotional terrain between them. Nobody can look at the whole galaxy at once.

That is what a machine can do. And that is what this medium is: not a visualization of a song, but a visualization of what 32 curated voices did when they stood at the same door.

I chose an interactive 3D galaxy because the metaphor felt honest. Stars are individual lights. They burn for their own reasons, in their own time, at their own temperature. But from a distance, they form shapes — constellations we use to navigate. The 32 verified covers in this archive are like that. Each one burns for its own reasons. But together they form a shape, and that shape tells us something about what human beings do when they are losing something.

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

The LLM scoring process — using Gemini to analyze the verified covers against six emotional dimensions: surrender, defiance, grief, hope, exhaustion, transcendence — did something I could not have done alone. I could have listened to 32 verified covers and formed impressions. But impressions are inconsistent. My mood on a Tuesday afternoon would have colored how I heard Eric Clapton differently from how I heard him on a Friday morning. The model is consistent in a way I am not. It hears the same way every time.

That consistency is a kind of precision instrument. Like a spectroscope that reveals which elements are burning inside a star. I cannot see those elements with my eyes. The model can.

But the model did not decide what the six dimensions were. I did. It did not choose to look for surrender and transcendence rather than, say, tempo and vocal range. I chose that because I had spent weeks thinking about what the song is about. The model was precise about the questions I told it to ask.

The embedding space was something different. When the sentence model placed the verified covers in a high-dimensional vector space and UMAP collapsed that space into three dimensions, the resulting galaxy was not something I designed. I did not decide that Guns N' Roses would cluster near one pole while the sparse folk covers clustered near another. The model found that structure. I only built the room to display it.

In that sense, AI was a kind of mirror. It reflected back a structure that was latent in the music all along, a structure I could feel but could not see. The embedding space did not create meaning. It revealed it.

And then there is the RAG voice — the historical monologue that speaks when you ask a cover to tell you about its era. I built that system to pull from documents about Vietnam, about 1973, about the counterculture, about Dylan's own Nobel Prize lecture where he spoke about songs as literature. When a 1973 cover speaks, it speaks with the texture of that year behind it: the weight of the war's end, the smell of campfires at Woodstock still in the air but fading, the first stirrings of a decade that would look very different from the one before.

I did not write those words. I gathered them from history, and the model assembled them into a voice. I was the curator. The model was the throat.

---

## V. My Door

There was a night, somewhere in the middle of building this project, when I put on Warren Zevon's cover and let it play while the data pipeline ran. I had been debugging the UMAP coordinates for hours — the galaxy kept collapsing into a flat plane — and I was tired in a way that had nothing to do with the hour.

Zevon recorded his version of this song in 2003 while dying of inoperable mesothelioma. He chose not to undergo chemotherapy because he wanted to finish his final album. When David Letterman asked him what he had learned from facing death, he said: *Enjoy every sandwich.* His version of this song — surrender 90%, grief 88%, defiance still at 34% — does not sound like a man who has given up. It sounds like a man who has decided what matters and is very calm about it.

Sitting there at 2 a.m. with the galaxy finally spinning correctly on my screen, I realized what unsettled me about this project. It was not the technical difficulty. It was that I kept recognizing something in the covers I was analyzing. The exhaustion in Jeff Buckley's version. The strange peace in the original Dylan. The way Antony and the Johnsons sound like someone releasing a breath they have been holding for years.

I am a computer science student in 2026, which means I am completing my education at the exact moment when artificial intelligence has begun to do a significant portion of what I spent four years learning to do. Not the thinking — the *doing*. The writing of code, the debugging of functions. I used AI tools to build this project, which means I used AI tools to build a project about what it feels like to hand something over.

That is not lost on me.

The badge I have been carrying is the belief that knowing how to build systems — really build them, from first principles, line by line — is what makes me valuable. That identity held up for most of my degree. But working on this project, letting an LLM score emotional dimensions while I focused on what those dimensions should *mean*, I kept noticing that the most irreplaceable thing I brought was not the code. It was the weeks I had spent listening to the song. Reading about 1973. Deciding that the six emotions should be surrender, defiance, grief, hope, exhaustion, and transcendence rather than happy, sad, angry, and calm. The model was precise about the questions I told it to ask. The questions were mine.

I am Turkish, which adds a particular texture to all of this. I grew up between two languages, which means I grew up knowing that the same thing can mean different things depending on which side of the door you are standing on. *Elveda* and *goodbye* are not the same word even when they translate to each other. There is a specific weight in Turkish farewells — we say *Allah'a ısmarladık,* which means something like *I entrust you to God* — that assumes the person leaving is going somewhere you cannot follow. I heard that weight in Dylan's sheriff. I heard it in the soldiers coming home from Vietnam who found that home had moved without them. I heard it in Zevon choosing which sandwich to enjoy.

My door, right now, is the threshold between the student I have been and whoever comes after. I do not know what that person will need to know. I know that he will have to be comfortable asking the right questions and trusting machines to answer them precisely. I know that he will have to hold the reasons behind the questions himself, because machines cannot hold those yet.

I do not know what is behind the door. But I know that building this galaxy — spending months with 32 strangers' grief, mapping the emotional terrain of 32 voices who stood at the same threshold and each found a different word for it — has changed what the song means to me.

That is what the best projects do. The assignment said so, and it was right.

---

## VI. Technical Transparency

In accordance with the project's academic integrity requirements, the following AI tools and techniques were used:

**AI Techniques:**
- **LLM Emotion Scoring and Generation** — Google Gemini by default, with optional OpenAI support, prompting for six emotional dimensions per cover and generating Compare / Era Voice / Match bridge text. Falls back to local text when a provider is unavailable or quota is exceeded.
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
