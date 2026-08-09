<div align="center">

<img src="./public/logo.svg" alt="Tasalli logo" width="88" />

# Tasalli
### تسلی

**An AI companion for emotional support**

*"No one here will judge you."*

[![Live Demo](https://img.shields.io/badge/Live_Demo-tasalli.nativelyai.app-6E8F76?style=flat-square)](https://tasalli.nativelyai.app/)
[![Built with native.builder](https://img.shields.io/badge/Built_with-native.builder-3F7C77?style=flat-square)](https://builder.nativelyai.com/)
[![AI Factory Hackathon 2026](https://img.shields.io/badge/AI_Factory-Hackathon_2026-C97B3C?style=flat-square)](https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/)

</div>

---

## About

Tasalli (تسلی - "solace" / "comfort" in Urdu) is a web app where someone can talk to an
emotionally intelligent AI companion, and receive responses shaped by the
emotional tone and specifics of what they shared. The companion feels like a mature, well-read, and emotionally grounded friend. It is warm, calm, and genuinely attentive, offering thoughtful wisdom naturally without sounding preachy or overly sympathetic.

`Tasalli is a supportive companion, **not a licensed therapist**.`

## The problem

Millions of people carry loneliness or quiet depression with nowhere safe to put it. According to the [WHO](https://www.who.int/teams/social-determinants-of-health/demographic-change-and-healthy-ageing/social-isolation-and-loneliness), 1 in 6 people worldwide experience loneliness. Friends are not always available, therapy is often expensive, inaccessible, or intimidating to start, and generic chatbots feel hollow, scripted, or clinical rather than genuinely present.

Tasalli fills the gap: a warm, unhurried, emotionally intelligent companion, available
anytime, for free, with zero signup friction.


## Features
 
- ❤️ **Emotion-aware responses**: Tone and content adapt to what you are actually going through, not a one-size-fits-all reply
- 📖 **Wisdom, woven — not lectured**: Occasional, paraphrased insight from thinkers like Marcus Aurelius, Seneca, Rumi, and Iqbal, only when it genuinely fits
- 🔒 **Anonymous by default**: No signup required to start; accounts are optional, only for remembering you across sessions
- 🌐 **Bilingual (English & Urdu)** Automatic script detection with full right-to-left layout
- 🛡️ **Crisis-aware safety layer** When language suggests real risk, replies surface genuine crisis resources alongside a warm response
- 🎨 **A calm, minimal interface**: Soft colors, no gamification, no streaks or notifications


## How it's built

![Tasalli Architecture](/public/tasalli_architecture.png)

 
## Tech stack
 
| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| UI framework | React 18 |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Backend | Supabase (Postgres, Auth, Edge Functions, Secret Manager) |
| AI inference | Groq - `llama-3.3-70b-versatile` |
| Built with | [native.builder](https://builder.nativelyai.com/) |
 

## Getting started
 
```bash
git clone https://github.com/ImranNawar/tasalli.git
cd tasalli
npm install
npm run dev
```
 
### Configuration
 
The frontend needs your Supabase project URL and anon key (safe for client-side use):
 
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
 
The following are used **server-side only**, stored as Supabase Edge Function secrets, never placed in a `.env` file or client code:
 
- `GROQ_API_KEY`
```bash
npm run build   # production build
```

## Disclaimer
`Tasalli is a supportive AI companion, not a licensed therapist. If you are in crisis, please reach out to local emergency services. This disclaimer is shown in the product itself on every page.`


## About the hackathon

This project was built for **AI Factory** hackathon. The official native.builder hackathon, hosted by NativelyAI and lablab.ai.

[lablab.ai/ai-hackathons/nativebuilder-build-without-limits](https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/)

📅 August 3–10, 2026