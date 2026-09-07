# AUREVIA — Brand Guide

**Version:** 1.0
**Date:** 2026-09-07

---

## 1. The brand in one line

> **AUREVIA — Intelligence. Packaged for Growth.**

AUREVIA turns artificial intelligence into practical, ready-to-use systems that businesses can run on Monday morning.

## 2. Positioning statement

> For small agencies and independent consultants who are capped by hours rather than demand, AUREVIA is the operating method for AI — the workflows, standards, and review gates that turn the tools they already pay for into consistent client work. Unlike prompt packs, which are fragments, and AI consultancies, which cost thousands a month, AUREVIA is a complete system you own and run yourself.

## 3. Name

**AUREVIA** — evoking *aurum* (gold; value, refinement) and *via* (way; a road, a method). Read together: **the refined way**. This is fortunate, because "method, not tools" is precisely the brand's central claim.

Usage rules:

- Written **AUREVIA** in wordmark and headings; **Aurevia** in body copy and sentence-case prose.
- Never *AurEvia*, *Aur Evia*, *AUREVIA.AI*, or possessive forms of the divisions.
- Divisions are written as **Aurevia Products**, **Aurevia AI**, **Aurevia Labs**, **Aurevia Pro**, **Aurevia OS**. These are divisions of one company, never separate companies.
- Pronunciation, for voiceover and video: *aw-REV-ee-ah*.

## 4. Brand personality

| Trait | Expressed as | Never |
|---|---|---|
| Intelligent | Precision, specific numbers, real mechanism | Jargon, complexity for its own sake |
| Premium | Space, restraint, quality of detail | Gold gradients, luxury clichés |
| Modern | Clean type, current craft | Trend-chasing, neon AI aesthetics |
| Practical | Concrete outcomes, working artefacts | Abstraction, "possibilities" |
| Trustworthy | Plain claims, honest limits | Hype, unverifiable numbers |
| Ambitious | A visible long-term roadmap | Grandiosity, world-changing language |
| Simple | One clear action per screen | Clutter, competing calls to action |

## 5. Colour palette

Built around a deep near-black ground with a single warm accent. The warmth carries the *aurum* in the name without ever becoming literal gold.

### Core

| Token | Hex | Role |
|---|---|---|
| `--aurevia-ink` | `#0B0D10` | Primary dark ground, headings on light |
| `--aurevia-slate` | `#161A20` | Elevated dark surfaces, cards |
| `--aurevia-graphite` | `#2A313B` | Borders and dividers on dark |
| `--aurevia-mist` | `#F7F8FA` | Primary light ground |
| `--aurevia-cloud` | `#EDEFF3` | Secondary light surface |
| `--aurevia-paper` | `#FFFFFF` | Cards on light |

### Accent

| Token | Hex | Role |
|---|---|---|
| `--aurevia-aurum` | `#C9A227` | Primary accent — CTAs, marks, emphasis |
| `--aurevia-aurum-lift` | `#E3BE45` | Hover, accent on dark grounds |
| `--aurevia-aurum-deep` | `#8F7318` | Pressed states, accent text on light |

### Text

| Token | Hex | Role |
|---|---|---|
| `--aurevia-text` | `#0B0D10` | Body on light |
| `--aurevia-text-muted` | `#5A6472` | Secondary on light |
| `--aurevia-text-invert` | `#F7F8FA` | Body on dark |
| `--aurevia-text-invert-muted` | `#9AA5B4` | Secondary on dark |

### Functional

| Token | Hex | Role |
|---|---|---|
| `--aurevia-success` | `#1F9D6B` | Payment confirmed, access granted |
| `--aurevia-warning` | `#D08700` | Pending, action needed |
| `--aurevia-danger` | `#C4453B` | Failed payment, destructive actions |
| `--aurevia-info` | `#3B6FC4` | Neutral system messages |

### Rules

1. **Aurum is punctuation, not paint.** Target under 10% of any screen. Its scarcity is what makes it read as premium.
2. Body text is never aurum on white — it fails contrast. Use `--aurevia-aurum-deep` for accent text on light grounds.
3. No gradients on the accent. No gold-foil or metallic effects.
4. All text must meet WCAG AA (4.5:1 body, 3:1 large). `--aurevia-aurum` on `--aurevia-ink` passes; verify every new pairing rather than assuming.
5. Never use colour as the only carrier of meaning — pair with an icon or label.

## 6. Typography

| Role | Typeface | Fallback stack |
|---|---|---|
| Display & headings | **Fraunces** (variable serif, optical sizing) | `Georgia, 'Times New Roman', serif` |
| Body & UI | **Inter** | `system-ui, -apple-system, 'Segoe UI', sans-serif` |
| Code & data | **JetBrains Mono** | `ui-monospace, 'Cascadia Code', Menlo, monospace` |

A serif display face against a neutral sans is the fastest way to read as considered rather than generic — most AI brands use a sans for everything, so this is differentiating at zero cost.

### Scale

| Token | Size / line-height | Use |
|---|---|---|
| `display` | 60px / 1.05, -0.02em | Hero headline |
| `h1` | 44px / 1.1, -0.015em | Page titles |
| `h2` | 32px / 1.2 | Section headings |
| `h3` | 24px / 1.3 | Subsections |
| `body-lg` | 18px / 1.6 | Lead paragraphs |
| `body` | 16px / 1.6 | Default |
| `small` | 14px / 1.5 | Secondary, captions |
| `micro` | 12px / 1.4, 0.06em, uppercase | Eyebrows, labels |

Rules: headings never below 1.05 line-height or above 1.3. Body copy caps at ~70 characters per line. Display sizes step down roughly 30% at mobile breakpoints.

## 7. Logo direction

**Wordmark-led.** `AUREVIA` set in Fraunces, medium weight, letter-spaced `0.08em`, uppercase.

**Mark:** a minimal `A` formed from two ascending strokes with the crossbar removed — reading simultaneously as an *A* and as an upward path. It ties the wordmark to *via* (the way) and to growth, without resorting to the circuit-board and neural-network clichés that make AI logos interchangeable.

Rules: clear space of one cap-height on all sides. Minimum wordmark width 120px, mark 24px. Monochrome versions must exist and must be the default; the aurum version is for the primary lockup only. Never stretch, rotate, outline, add effects to, or place the wordmark on a busy image.

## 8. UI style

- **Grid:** 12 columns, 1200px max content width, 8px spacing base.
- **Radius:** 10px standard, 14px cards, 999px pills. Consistent — never mixed arbitrarily.
- **Elevation:** shadows are soft, low-opacity, and rare. Prefer borders and surface changes to drop shadows.
- **Borders:** 1px, `--aurevia-cloud` on light, `--aurevia-graphite` on dark.
- **Density:** generous. Whitespace is the primary signal of premium; when a section feels crowded, remove content rather than shrinking type.
- **Motion:** 150–250ms, `cubic-bezier(0.4, 0, 0.2, 1)`. Motion clarifies state changes only. No parallax, no scroll-jacking, no decorative animation. Everything respects `prefers-reduced-motion`.
- **Dark mode:** required, not optional. Every colour is defined as a token so both themes derive from one source.
- **Buttons:** one primary action per view, aurum-filled. Secondary is outlined. Tertiary is a text link.

## 9. Image and illustration style

**Preferred, in order:**

1. **Real product screenshots and screen recordings.** This buyer trusts demonstration over decoration, and AUREVIA has no track record to trade on — showing the thing working is the single most persuasive asset available.
2. **Diagrams of the method** — clean flow diagrams of workflows, in brand colours. These *are* the product; showing them is showing the value.
3. **Restrained founder photography** — a real human face builds trust for an unknown brand.

**Forbidden:** stock photos of people pointing at screens; glowing brains, robots, humanoid AI; blue circuit boards; neural-network mesh backgrounds; abstract AI-generated art with no informational content; anything implying capability the product does not have.

## 10. Brand voice

**Direct. Specific. Unhurried. Never salesy.**

The buyer is a business owner who has been marketed at relentlessly by this category. Restraint is a competitive advantage.

### Principles

1. **Show the arithmetic.** "Ten hours a month at your rate" beats "save massive time."
2. **Name the thing.** "Proposal, onboarding, client reporting" beats "your workflows."
3. **Own the limits.** Saying what AUREVIA does *not* do buys credibility for what it does.
4. **Never manufacture urgency.** If a deadline or price rise is real, state it plainly. If it is not real, there is no deadline.
5. **Verbs over adjectives.** Describe what happens, not how impressive it is.
6. **Short sentences.** Then a longer one when the idea genuinely needs the room.

### Voice comparison

| Say | Not |
|---|---|
| "Turn a messy brief into a scoped proposal in 30 minutes." | "Revolutionise your proposal process with cutting-edge AI!" |
| "Your team produces the same quality whoever does the work." | "Unlock unprecedented team synergy." |
| "We are new. Here is the system — judge it yourself." | "Trusted by thousands of agencies worldwide." |
| "Full refund within 30 days. Email us; no questions." | "100% RISK-FREE IRONCLAD GUARANTEE!!!" |
| "Works with ChatGPT, Claude, or Gemini — whichever you already pay for." | "Powered by next-generation AI technology." |

### Banned vocabulary

*Revolutionary, game-changing, unlock, supercharge, 10x, hustle, secret, hack, guru, ninja, limited spots (unless literally true), act now, insane results, passive income, this one trick.*

### On the absence of social proof

AUREVIA has no customers. The brand does not hide this and does not fake it. Until real testimonials are earned in validation Stage 5, trust is built through demonstration, specificity, a genuine free resource, a visible founder, and a plainly honoured refund policy. Placeholder testimonial slots must never be filled with invented content — not even in staging, where they leak.

## 11. Design principles

1. **Clarity over cleverness.** If a visitor cannot say what AUREVIA does after five seconds, the design has failed regardless of how it looks.
2. **One idea per section.** Competing messages cancel out.
3. **Proof over promise.** Every claim sits next to something that demonstrates it.
4. **Restraint reads as expensive.** Removing is usually the improvement.
5. **Accessible by default.** AA contrast, keyboard navigation, focus states, semantic HTML, reduced-motion support. Not a later pass.
6. **Fast is part of the brand.** A premium brand that loads slowly is not premium. Performance budgets are a design constraint.

## 12. Applying this

These tokens are implemented as CSS custom properties and mapped into the Tailwind theme so the palette has exactly one source of truth. Any colour, size, or radius appearing in a component as a raw value rather than a token is a bug.
