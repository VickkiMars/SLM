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
    │   Lex-Elo Rating Engine       ││                               │
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

### 1.5 Lex-Elo Adaptive Language Rating System (Deep Technical Specification)
* **Category**: Essential / Core Algorithmic Engine
* **What It Entails**:
  **Lex-Elo** is a dual-calibrating Elo rating system designed specifically for language acquisition in SLM. Inspired by competitive matchmaking in chess and Item Response Theory (IRT), Lex-Elo dynamically rates **both the Learner's Proficiency ($R$) and the Text/Word Difficulty ($D$)** on a unified numerical scale (400–2400+ Elo).

#### A. The Dual-Calibrating Concept
```
                  ┌─────────────────────────────────────┐
                  │          LEX-ELO MATCHMAKER         │
                  │ Target expected outcome E(S) ≈ 0.80 │
                  └──────────────────┬──────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────┐                               ┌───────────────────┐
│ Learner Rating (R)  │  ◄────── Dual Update ────────►│ Text/Word Rating  │
│ e.g. 1350 Elo (B1)  │         Outcome (S)           │  (D) 1420 Elo     │
└─────────────────────┘                               └───────────────────┘
```
- **Match Setup**: A Learner ($R$) "plays" a Text or Character Cluster ($D$).
- **Learner Win ($S = 1.0$)**: Fluent reading without lookups, fast processing time, correct quiz answers.
- **Learner Loss / Struggle ($S < 0.5$)**: Frequent tooltip lookups, slow reading speed, missed quiz recall.
- **Dual Adjustment**:
  - If a beginner ($R = 900$) easily reads a text ($D = 1300$), the user's rating $R$ jumps **UP**, and the text's difficulty $D$ adjusts **DOWN**.
  - Over thousands of reads across the user base, every text automatically calibrates to its exact true difficulty without requiring manual human labeling.

#### B. Mathematical Formulation

1. **Expected Outcome Calculation $E(S)$**:
   The expected reading fluency score $E(S) \in (0, 1)$ of a learner with rating $R$ encountering a text/item of difficulty $D$:
   $$E(S) = \frac{1}{1 + 10^{\frac{D - R}{400}}}$$

2. **Observed Performance Score $S$**:
   The actual outcome score $S \in [0.0, 1.0]$ per reading session:
   $$S = \text{Clamp}\left(1.0 - \left( 0.60 \cdot \frac{N_{\text{lookups}}}{N_{\text{tokens}}} + 0.20 \cdot T_{\text{penalty}} + 0.20 \cdot M_{\text{quiz}} \right), 0.0, 1.0\right)$$

3. **Dual Rating Update Rules**:
   $$R_{\text{new}} = R_{\text{old}} + K_{\text{user}} \cdot (S - E(S))$$
   $$D_{\text{new}} = D_{\text{old}} + K_{\text{text}} \cdot (E(S) - S)$$

4. **Dynamic $K$-Factor Scaling**:
   - **Provisional Users / Unrated Texts** ($< 10$ sessions): $K = 64$
   - **Intermediate Calibration** (10–30 sessions): $K = 32$
   - **Established Mastery** ($> 30$ sessions): $K = 16$

#### C. Sub-Domain Elo Breakdown
Lex-Elo tracks a **Global Elo** alongside three specialized sub-ratings:
```
                          ┌────────────────────────┐
                          │    GLOBAL ELO (R)      │
                          └───────────┬────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│  LEXICAL ELO  │             │ GRAMMAR ELO   │             │ FLUENCY ELO   │
│ R_lex (Vocab) │             │ R_gram (Syn)  │             │ R_speed (WPM) │
└───────────────┘             └───────────────┘             └───────────────┘
```
- **Lexical Elo ($R_{\text{lex}}$)**: Tracks vocabulary breadth and character cluster recognition.
- **Grammar & Syntax Elo ($R_{\text{gram}}$)**: Tracks ability to parse complex clause structures and idioms.
- **Fluency Speed Elo ($R_{\text{speed}}$)**: Tracks raw processing speed (Words Per Minute relative to text difficulty).

#### D. CEFR & HSK Mapping Scale

| Lex-Elo Rating | CEFR Tier | HSK Level (Chinese) | Proficiency Description |
| :--- | :--- | :--- | :--- |
| **< 600** | **Pre-A1** | Below HSK 1 | Novice / Absolute Beginner |
| **600 – 900** | **A1** | HSK 1 | Basic survival phrases & single characters |
| **900 – 1200** | **A2** | HSK 2 | Simple sentences & everyday topics |
| **1200 – 1500** | **B1** | HSK 3 | Independent reader, short stories, basic news |
| **1500 – 1800** | **B2** | HSK 4 | Fluent reader, authentic prose, pop culture |
| **1800 – 2100** | **C1** | HSK 5 | Advanced reader, complex essays & literature |
| **2100+** | **C2** | HSK 6 | Near-native / Mastery level, classical poetry |

#### E. Intelligent Matchmaking ("Comprehensible Input Engine")
According to Stephen Krashen's $i+1$ language acquisition principle, optimal learning occurs in the **Goldilocks Zone ($E(S) \approx 0.75 - 0.85$)** where texts contain 80–85% known vocabulary and 15–20% new challenge.
The Matchmaker automatically queries content for:
$$D_{\text{text}} \approx R_{\text{user}} + 80 \text{ Elo}$$

#### F. Database Schema (PostgreSQL / Supabase DDL)
```sql
-- User Elo Profile
CREATE TABLE user_elo_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    language VARCHAR(10) NOT NULL,
    global_elo INT DEFAULT 800,
    lexical_elo INT DEFAULT 800,
    grammar_elo INT DEFAULT 800,
    fluency_elo INT DEFAULT 800,
    confidence_k INT DEFAULT 64,
    total_sessions INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Item / Text Difficulty Rating
CREATE TABLE text_difficulty_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    title TEXT,
    language VARCHAR(10) NOT NULL,
    difficulty_elo INT DEFAULT 1000,
    total_reads INT DEFAULT 0,
    confidence_k INT DEFAULT 64,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Elo Match History Log
CREATE TABLE elo_match_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    text_id UUID REFERENCES text_difficulty_ratings(id),
    user_elo_before INT NOT NULL,
    user_elo_after INT NOT NULL,
    text_elo_before INT NOT NULL,
    text_elo_after INT NOT NULL,
    observed_score FLOAT NOT NULL,
    expected_score FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### G. Safeguards & Anti-Gaming Controls
1. **Copy-Paste Overriding**: Sessions lasting $< 3$ seconds or immediately cleared are discarded from Elo calculations.
2. **Anti-Grinding Penalty**: Rereading the exact same text reduces $K_{\text{user}}$ exponentially to prevent artificial inflation.
3. **Decay & Recalibration**: Inactivity $>30$ days restores $K_{\text{user}}$ to provisional status ($K=40$) for quick re-calibration upon return.

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
  - Short stories tiered by HSK / CEFR levels (A1, A2, B1, B2, C1, C2) matched via the Lex-Elo engine.
  - Genres ranging from folklore and modern slice-of-life to mystery and sci-fi.
  - Interactive comprehension check at the end of each chapter.
* **Dependencies & Requirements**:
  - **Level Assessor**: Lex-Elo rating filter ensuring story texts match target CEFR/HSK difficulty tiers.
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
  - Friend leaderboards based on Lex-Elo gains, reading volume, and review streaks.
  - Group reading rooms where members read the same story together.
* **Dependencies & Requirements**:
  - **Gamification Engine**: Daily streak tracker, XP counter, Elo rating badge achievements.
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
| **Phase 2** | **Lex-Elo Adaptive Rating Engine** | 🔴 High | 🔴 High | Dual Elo Logistic Algorithm |
| **Phase 2** | **Learning Analytics & Stats** | 🟡 Medium | 🟡 Medium | Vocab state store |
| **Phase 2** | **Poem & Story of the Day** | 🔴 High | 🟡 Medium | LLM Content Pipeline |
| **Phase 3** | **SRS Quiz & Flashcard Engine** | 🔴 High | 🔴 High | SM-2 Algorithm & DB |
| **Phase 3** | **Anki / CSV Export Engine** | 🟡 Medium | 🟡 Medium | `genanki` / PDF exporter |
| **Phase 4** | **Community Feed & Shared Library** | 🟢 Value-Add | 🔴 High | Social DB & Moderation |
| **Phase 4** | **PWA Offline Support** | 🟢 Value-Add | 🟡 Medium | Service Workers & Cache |

---

## Conclusion & Next Steps

This feature roadmap transforms SLM from an interactive translation tool into a complete, habit-forming language acquisition platform. By combining **personalized reading persistence**, **Lex-Elo adaptive difficulty matching**, **daily content discovery**, and **spaced repetition**, SLM creates a complete loop: **Read → Map → Rate → Understand → Review → Master**.
