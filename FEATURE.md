# SLM — Feature Ecosystem & Product Roadmap (`FEATURE.md`)

This document outlines the essential and extended feature ecosystem for **SLM (Sound & Language Mapper)**. SLM empowers language learners to consume authentic foreign texts by mapping meaning, script, and phonetics down to character-level units.

---

## Architecture & Product Vision

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE SLM ENGINE                                 │
│  Interactive Reader · Word Breakdown · Phonetic & Script Mapper        │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
    ┌───────────────┴───────────────┐┌───────────────┴───────────────┐
    │     ESSENTIAL PLATFORM        ││    DISCOVERY & ENGAGEMENT     │
    │  History · Stats · SRS Quiz   ││  Daily Poem · Story · Audio   │
    └───────────────┬───────────────┘└───────────────┬───────────────┘
                    │                                │
    ┌───────────────┴───────────────┐┌───────────────┴───────────────┐
    │    COMMUNITY & COLLAB         ││    EXPORT & ECOSYSTEM        │
    │  Shared Library · Leaderboard ││  Anki Sync · CSV · PWA        │
    └───────────────────────────────┘└───────────────────────────────┘
```

---

## 1. Essential Platform Features (Core Foundations)

### 1.1 Reading History & Session Persistence
* **Category**: Essential / Infrastructure
* **What It Entails**:
  - Automatically saves every translated text, uploaded document, or custom reading session to the user's account.
  - Allows users to re-open previous readings with full interactive character hover/click popovers without re-running expensive LLM translations.
  - Searchable and taggable history (filter by language, date, difficulty, or custom tags like "Song Lyrics", "News", "Literature").
* **Dependencies & Requirements**:
  - **Database**: Supabase / PostgreSQL schema for `reading_sessions` (`session_id`, `user_id`, `source_text`, `target_language`, `full_translation`, `token_metadata`, `created_at`).
  - **Storage**: JSONB column storing tokenized character maps and pre-computed translations.
  - **API Endpoints**: `GET /api/history`, `GET /api/history/:session_id`, `DELETE /api/history/:session_id`.
* **Implementation & Design Notes**:
  - Store tokenized outputs as compressed JSONB to minimize database footprint.
  - Provide a quick "Resume Reading" shortcut on the home screen.

---

### 1.2 Learning Analytics & Vocabulary Statistics
* **Category**: Essential / Retention
* **What It Entails**:
  - Dashboard displaying user progress: Total words read, unique vocabulary encountered, daily reading streak, and mastery levels per language.
  - **Vocabulary Density Index**: Shows ratio of known vs. unknown words in any loaded document before reading.
  - Visual charts showing reading time, weekly progress, and character/kanji/hanzi coverage.
* **Dependencies & Requirements**:
  - **Data Engine**: User vocabulary state store (`user_vocab` table tracking `word`, `language`, `exposure_count`, `mastery_score`, `last_seen`).
  - **Frontend Charts**: Lightweight SVG/HTML5 charts or Canvas-based visualizers.
  - **API Endpoints**: `GET /api/stats/summary`, `GET /api/stats/vocabulary`.
* **Implementation & Design Notes**:
  - Update stats asynchronously after every reading session to prevent UI blocking.
  - Highlight "milestone words" (e.g. "You've mastered 500 French verbs!").

---

### 1.3 Adaptive Quiz & Spaced Repetition (SRS) Review Engine
* **Category**: Essential / Learning Outcomes
* **What It Entails**:
  - Turns saved vocabulary and annotated character clusters into interactive quizzes (Multiple Choice, Fill-in-the-Blank, Character-to-Pinyin, Listening Recall).
  - Uses an SM-2 / Leitner Spaced Repetition algorithm so words due for review surface automatically every day.
  - Immediate audio feedback and visual stroke/meaning confirmation.
* **Dependencies & Requirements**:
  - **Algorithm**: SM-2 Spaced Repetition Scheduler (`easiness_factor`, `interval_days`, `repetition_count`, `next_review_date`).
  - **Database**: `flashcards` and `review_logs` tables.
  - **API Endpoints**: `GET /api/quiz/due`, `POST /api/quiz/review`.
* **Implementation & Design Notes**:
  - Enable 60-second "Quick Fire Reviews" for mobile users on the go.
  - Include contextual sentences from the user's original reading history inside flashcard prompts.

---

### 1.4 Native Audio & Pronunciation Playback (TTS)
* **Category**: Essential / Multi-Sensory UX
* **What It Entails**:
  - One-tap audio playback for full sentences as well as individual character tokens/words inside the popover tooltip.
  - Adjustable speed control (0.75x, 1.0x, 1.25x) for listening practice.
* **Dependencies & Requirements**:
  - **Web Speech API**: Browser native `window.speechSynthesis` for offline zero-cost playback.
  - **Fallback TTS API**: ElevenLabs, OpenAI TTS, or Google Cloud TTS for authentic accent fallback when native synthesis is unavailable for rare languages.
* **Implementation & Design Notes**:
  - Cache generated audio clips in browser IndexedDB for instant re-play.

---

### 1.5 Lex-Elo Adaptive Language Rating System
* **Category**: Essential / Algorithmic Core (See full spec in `LEX_ELO_SYSTEM.md`)
* **What It Entails**:
  - A dual-calibrating Elo rating engine (400–2400+ Elo) that dynamically assesses both **Learner Skill ($R$)** and **Text/Word Difficulty ($D$)**.
  - Automatically matches learners to content in their **Optimal Acquisition Zone ($i+1$ Comprehensible Input)** where expected fluency is 75%–85%.
  - Maps seamlessly to international CEFR (A1–C2) and HSK (1–6) standards.
* **Dependencies & Requirements**:
  - **Match Algorithm**: Logistic Elo curve $E(S) = \frac{1}{1 + 10^{(D - R)/400}}$ with dynamic $K$-factor scaling.
  - **Database**: `user_elo_profiles`, `text_difficulty_ratings`, and `elo_match_logs` tables.
  - **API Endpoints**: `GET /api/elo/profile`, `GET /api/recommendations/next-read`.
* **Implementation & Design Notes**:
  - Sub-ratings track Lexical Elo ($R_{\text{lex}}$), Grammar Elo ($R_{\text{gram}}$), and Fluency Speed Elo ($R_{\text{speed}}$).

---

## 2. Daily Content & Discovery (Engagement & Habit Loops)

### 2.1 Poem of the Day / Week
* **Category**: Content Discovery / Daily Hook
* **What It Entails**:
  - A curated daily/weekly poem formatted in SLM's reading mode (e.g. classic Chinese Tang Poetry, French Romanticism, Spanish Sonnets).
  - Includes cultural context notes, historical background, poetic structure explanation, and rhythmic pronunciation guide.
* **Dependencies & Requirements**:
  - **Content CMS / Pipeline**: Curated JSON feed or automated LLM generation with human oversight.
  - **LLM Prompt**: Custom prompt instructing `fikra-pro-120b` / `DeepSeek` to extract poetic themes and line-by-line literal vs. figurative translations.
  - **Database**: `daily_poems` table (`publish_date`, `language`, `title`, `author`, `original_text`, `analysis`).
* **Implementation & Design Notes**:
  - Tang poetry and classical literature benefit immensely from SLM's character-by-character mapping because classical grammar differs from modern speech.

---

### 2.2 Story of the Day / Week (Graded Readers)
* **Category**: Content Discovery / Immersive Reading
* **What It Entails**:
  - Short stories tiered by HSK / CEFR levels (A1, A2, B1, B2, C1, C2).
  - Genres ranging from folklore and modern slice-of-life to mystery and sci-fi.
  - Interactive comprehension check at the end of each chapter.
* **Dependencies & Requirements**:
  - **Level Assessor**: Vocabulary frequency list filter ensuring story texts match target CEFR/HSK difficulty tiers.
  - **LLM Generation Pipeline**: Automated daily story generator prompt tuned for specific target vocabulary lists.
  - **API Endpoints**: `GET /api/stories/daily`, `GET /api/stories/:story_id`.
* **Implementation & Design Notes**:
  - Allow users to "Request Next Chapter" based on their performance in the comprehension quiz.

---

## 3. Community & Social Features

### 3.1 Community Shared Library & Annotated Public Feed
* **Category**: Social / Content Network
* **What It Entails**:
  - Users can publish their annotated song lyrics, news articles, or short stories to a public community feed.
  - Upvoting, bookmarking, and community annotations (users can submit alternative translations or cultural explanations for idioms).
* **Dependencies & Requirements**:
  - **Social Database**: `public_posts`, `likes`, `bookmarks`, `comments` tables.
  - **Content Moderation**: Automated filter for inappropriate content using moderation API endpoint.
  - **API Endpoints**: `GET /api/community/feed`, `POST /api/community/share`, `POST /api/community/like`.
* **Implementation & Design Notes**:
  - Include tags like `#JapaneseCityPop`, `#AnimeDialogue`, `#FrenchLiterature`, `#NewsBrief`.

---

### 3.2 Reading Clubs & Leaderboards
* **Category**: Social / Gamification
* **What It Entails**:
  - Weekly reading challenges (e.g., "Read 5,000 Chinese characters this week").
  - Friend leaderboards based on reading volume and review streaks.
  - Group reading rooms where members read the same story together.
* **Dependencies & Requirements**:
  - **Gamification Engine**: Daily streak tracker, XP counter, badge achievements.
  - **Real-time WebSockets / SSE**: Real-time room activity or periodic leaderboard sync.

---

## 4. Advanced Utilities & Ecosystem Integration

### 4.1 Export Engine (Anki, CSV, PDF Cheat Sheet)
* **Category**: Utility / Power User Feature
* **What It Entails**:
  - Export saved vocabulary lists or reading session cards directly into:
    - **Anki (.apkg)** deck files with pre-formatted fields (Front: Symbol, Back: Pronunciation + Meaning + Context Sentence).
    - **CSV / Excel** spreadsheet.
    - **Printable PDF** vocabulary cheat sheet with character grid layout.
* **Dependencies & Requirements**:
  - **Anki Deck Generator**: `genanki` or JS equivalent (`ankisync` / `sql.js`).
  - **PDF Generator**: `pdfkit` or `html2pdf.js` with unicode font support for CJK/Arabic scripts.

---

### 4.2 Progressive Web App (PWA) & Offline Mode
* **Category**: Mobile Excellence / Accessibility
* **What It Entails**:
  - Add to Home Screen (A2HS) support with native app feel on iOS and Android.
  - Offline reading capability for previously saved reading history sessions using Service Workers and Cache Storage API.
* **Dependencies & Requirements**:
  - **Service Worker**: Cache static app shell assets and API GET responses.
  - **Manifest File**: `manifest.webmanifest` with icons, theme colors, and display configuration.

---

## 5. Feature Priority Matrix & Implementation Roadmap

| Priority | Feature Name | User Impact | Tech Complexity | Key Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **Reading History & Persistence** | 🔴 High | 🟢 Low | Supabase / Postgres DB |
| **Phase 1** | **Audio Playback (TTS)** | 🔴 High | 🟢 Low | Web Speech API |
| **Phase 2** | **Learning Analytics & Stats** | 🟡 Medium | 🟡 Medium | Vocab state store |
| **Phase 2** | **Poem & Story of the Day** | 🔴 High | 🟡 Medium | LLM Content Pipeline |
| **Phase 3** | **SRS Quiz & Flashcard Engine** | 🔴 High | 🔴 High | SM-2 Algorithm & DB |
| **Phase 3** | **Anki / CSV Export Engine** | 🟡 Medium | 🟡 Medium | `genanki` / PDF exporter |
| **Phase 4** | **Community Feed & Shared Library** | 🟢 Value-Add | 🔴 High | Social DB & Moderation |
| **Phase 4** | **PWA Offline Support** | 🟢 Value-Add | 🟡 Medium | Service Workers & Cache |

---

## Conclusion & Next Steps

This feature roadmap transforms SLM from an interactive translation tool into a complete, habit-forming language acquisition platform. By combining **personalized reading persistence**, **daily content discovery**, and **spaced repetition**, SLM creates a complete loop: **Read → Map → Understand → Review → Master**.
