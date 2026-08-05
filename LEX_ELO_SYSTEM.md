# Lex-Elo: Adaptive Language Rating System (`LEX_ELO_SYSTEM.md`)

## Executive Summary

**Lex-Elo** is a dual-calibrating Elo rating system designed specifically for language acquisition in SLM. Inspired by competitive matchmaking in chess and Item Response Theory (IRT), Lex-Elo dynamically rates **both the Learner's Proficiency ($R$) and the Text/Word Difficulty ($D$)** on a unified numerical scale (400–2400+ Elo).

---

## 1. Theoretical Architecture

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

### The Dual-Calibrating Concept
In traditional chess, Player A plays Player B. In Lex-Elo:
- **Match Setup**: A Learner ($R$) "plays" a Text or Character Cluster ($D$).
- **Learner Win ($S = 1.0$)**: Fluent reading without lookups, fast processing time, correct quiz answers.
- **Learner Loss / Struggle ($S < 0.5$)**: Frequent tooltip lookups, slow reading speed, missed quiz recall.
- **Dual Adjustment**:
  - If a beginner ($R = 900$) easily reads a text ($D = 1300$), the user's rating $R$ jumps **UP**, and the text's difficulty $D$ adjusts **DOWN**.
  - Over thousands of reads across the user base, every text automatically calibrates to its exact true difficulty.

---

## 2. Mathematical Formulation

### 2.1 Expected Outcome Calculation $E(S)$
The expected reading fluency score $E(S) \in (0, 1)$ of a learner with rating $R$ encountering a text/item of difficulty $D$ is given by the standard logistic curve:

\[
E(S) = \frac{1}{1 + 10^{\frac{D - R}{K_{\text{scale}}}}}
\]

*Where:*
- $K_{\text{scale}} = 400$ (Standard Elo scaling factor).
- $E(S) = 0.50$ when Learner Rating $R$ equals Text Difficulty $D$.
- $E(S) = 0.75$ when Learner Rating $R$ is ~100 points higher than Text Difficulty $D$.

---

### 2.2 Observed Performance Score $S$
The actual outcome score $S \in [0.0, 1.0]$ is calculated dynamically per reading session:

\[
S = \text{Clamp}\left(1.0 - \left( w_1 \cdot \frac{N_{\text{lookups}}}{N_{\text{tokens}}} + w_2 \cdot T_{\text{penalty}} + w_3 \cdot M_{\text{quiz}} \right), 0.0, 1.0\right)
\]

Where:
- $N_{\text{lookups}}$: Number of times the learner clicked or hovered a tooltip.
- $N_{\text{tokens}}$: Total words/character clusters in the text.
- $T_{\text{penalty}}$: Reading speed penalty factor relative to expected Words-Per-Minute (WPM).
- $M_{\text{quiz}}$: Quiz error rate (if post-reading comprehension quiz is taken).
- Default weights: $w_1 = 0.60$, $w_2 = 0.20$, $w_3 = 0.20$.

---

### 2.3 Rating Update Rule
After each reading session or word interaction:

\[
R_{\text{new}} = R_{\text{old}} + K_{\text{user}} \cdot (S - E(S))
\]

\[
D_{\text{new}} = D_{\text{old}} + K_{\text{text}} \cdot (E(S) - S)
\]

#### Dynamic $K$-Factor Scaling:
To ensure fast calibration for new users/texts and stability for established ones:
- **Provisional Users / Unrated Texts** ($< 10$ sessions): $K = 64$
- **Intermediate Calibration** (10–30 sessions): $K = 32$
- **Established Mastery** ($> 30$ sessions): $K = 16$

---

## 3. Sub-Domain Elo Breakdown

A single scalar rating is insufficient for nuanced language skills. Lex-Elo tracks a **Global Elo** alongside three specialized sub-ratings:

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

1. **Lexical Elo ($R_{\text{lex}}$)**: Tracks vocabulary breadth. Derived from user interaction with individual words and character clusters.
2. **Grammar & Syntax Elo ($R_{\text{gram}}$)**: Tracks ability to parse complex clause structures, inversions, and idiom density.
3. **Fluency & Speed Elo ($R_{\text{speed}}$)**: Tracks raw processing speed (Words Per Minute relative to text difficulty).

---

## 4. CEFR & HSK Mapping Scale

Lex-Elo ratings map directly to international standards (CEFR & HSK):

| Lex-Elo Rating | CEFR Tier | HSK Level (Chinese) | Proficiency Description |
| :--- | :--- | :--- | :--- |
| **< 600** | **Pre-A1** | Below HSK 1 | Novice / Absolute Beginner |
| **600 – 900** | **A1** | HSK 1 | Basic survival phrases & single characters |
| **900 – 1200** | **A2** | HSK 2 | Simple sentences & everyday topics |
| **1200 – 1500** | **B1** | HSK 3 | Independent reader, short stories, basic news |
| **1500 – 1800** | **B2** | HSK 4 | Fluent reader, authentic prose, pop culture |
| **1800 – 2100** | **C1** | HSK 5 | Advanced reader, complex essays & literature |
| **2100+** | **C2** | HSK 6 | Near-native / Mastery level, classical poetry |

---

## 5. Intelligent Matchmaking ("Comprehensible Input Engine")

The core application of Lex-Elo in SLM is **Automated Optimal Content Recommendation**:

### Stephen Krashen's $i+1$ Rule in Elo Terms:
- **Too Easy ($E(S) > 0.95$)**: Learner is bored; no new acquisition occurs.
- **Too Hard ($E(S) < 0.60$)**: Learner is overwhelmed; cognitive overload.
- **Goldilocks Zone ($E(S) \approx 0.75 - 0.85$)**: **Optimal Acquisition Zone**. The text contains 80-85% known vocabulary and 15-20% challenging new vocabulary.

When a user requests a recommended story, article, or poem, the **Lex-Elo Matchmaker** queries the content library for items where:
\[
D_{\text{text}} \approx R_{\text{user}} + 80 \text{ Elo}
\]

---

## 6. Database Schema Implementation (PostgreSQL / Supabase)

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

---

## 7. Anti-Gaming & Edge Case Safeguards

1. **Copy-Paste Overriding**: If a user pastes a massive text and immediately clicks "Clear" or leaves in < 3 seconds, the session is discarded from Elo calculations.
2. **Repeated Reads**: Rereading the exact same text reduces $K_{\text{user}}$ exponentially so users cannot inflate their Elo by grinding the same passage.
3. **Decay Factor**: If a user does not read in a language for over 30 days, their $K_{\text{user}}$ increases back to provisional status ($K=40$), allowing quick re-calibration upon return.
