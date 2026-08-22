# SalarX — Visual Design System & UI Plan

**Brand:** SalarX  
**Type:** Clothing Shop — Dark Luxury · Editorial · Streetwear  
**Based on:** Client logo + 3 design inspirations + defined color palette  
**Date:** 2026-08-22

---

## Design Identity in One Sentence

> **SalarX is bold, dark, and unapologetic — a raw streetwear edge wrapped in editorial luxury.**

The logo says it all: a massive red brushstroke X slashing through clean white letters on jet black. The website should feel exactly like that. Confident. High contrast. Every section should feel like a page in a premium fashion magazine — but with the grit of a street brand.

---

## 1. Color System

### Brand Palette (from client-provided swatch)

| Token Name | Value | Use |
|-----------|-------|-----|
| `--color-black` | `#0B0B0B` | Primary background, sections, cards |
| `--color-red` | `#8B0D1A` | Brand accent, CTAs, highlights, badges |
| `--color-offwhite` | `#F5F2ED` | Primary text, headings on dark bg |
| `--color-white` | `#FFFFFF` | Pure white for contrast moments |

### Extended Palette (derived from the 3 core colors)

| Token Name | Value | Use |
|-----------|-------|-----|
| `--color-surface` | `#141414` | Card backgrounds (slightly lighter than bg) |
| `--color-surface-hover` | `#1C1C1C` | Hover state for cards |
| `--color-border` | `#2A2A2A` | Subtle dividers, card outlines |
| `--color-red-muted` | `#5C0D15` | Softer red for backgrounds, section accents |
| `--color-red-glow` | `rgba(139, 13, 26, 0.3)` | Box shadows, glow effects |
| `--color-text-muted` | `#9A9A8E` | Secondary/caption text on dark bg |
| `--color-text-primary` | `#F5F2ED` | Main readable text |
| `--color-text-accent` | `#8B0D1A` | Red text for labels and highlights |

### Color Usage Rules

1. **Background is always dark.** Sections should alternate between `#0B0B0B` and `#141414` — never white or grey background.
2. **Crimson Red is for ACTION and ACCENT only.** CTAs, badges, labels, underlines, hover borders. Don't overuse it — when everything is red, nothing is.
3. **Off-White is the primary reading color.** All body text, headings, and UI text on dark background uses `#F5F2ED`, never pure white (too harsh on the eyes).
4. **One "reverse" section allowed.** The Delivery & Payment section (Section 11) can use Off-White `#F5F2ED` as its background with dark text — it creates a visual breath between the dark sections and improves scanability.

---

## 2. Typography System

### Font Families

Based on the logo's bold sans-serif wordmark and the editorial inspiration images, the ideal pairing is:

| Role | Font | Why |
|------|------|-----|
| **Display / Hero Headlines** | `Playfair Display` | High-contrast editorial serif — elegant, dramatic, fashion-magazine authority. Free on Google Fonts. |
| **Section Headings (H2, H3)** | `Montserrat` | Geometric sans-serif, bold weight. Matches the logo's block-letter style. Wide tracked uppercase feels premium. |
| **Body Text / UI / Cards** | `Inter` | Neutral, highly legible, standard for all readable text. Perfect on dark backgrounds. |

**Google Fonts import (one line):**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

### Typography Scale

| Token | Element | Font | Size (desktop) | Size (mobile) | Weight | Case |
|-------|---------|------|---------------|--------------|--------|------|
| `--text-display` | Hero H1 | Playfair Display | `clamp(48px, 8vw, 96px)` | `40px` | 900 | Mixed |
| `--text-h2` | Section titles | Montserrat | `clamp(32px, 4vw, 56px)` | `28px` | 800 | UPPERCASE |
| `--text-h3` | Sub-section titles | Montserrat | `28px` | `22px` | 700 | Mixed |
| `--text-label` | Section labels (small) | Montserrat | `11px` | `11px` | 600 | UPPERCASE + tracked |
| `--text-body` | Body paragraphs | Inter | `16px` | `15px` | 400 | Normal |
| `--text-body-sm` | Captions, fine print | Inter | `13px` | `12px` | 300 | Normal |
| `--text-ui` | Buttons, nav, badges | Montserrat | `13px` | `13px` | 600 | UPPERCASE + tracked |

### Typography Rules

1. **Section labels** always use `Montserrat`, uppercase, `letter-spacing: 0.2em`, in `--color-red` or muted color — this is the small overline above a big headline (e.g., "OUR STORY" before the H2).
2. **Hero headline** uses `Playfair Display` at maximum size — this is where the editorial drama happens.
3. **Section titles (H2)** use `Montserrat` all-caps, bold. No decoration — just weight and size.
4. **Body text** uses `Inter` at comfortable size. Line height `1.7` for paragraphs on dark backgrounds.
5. **Never mix Playfair and Montserrat in the same heading.** Playfair is for the hero and Brand Story only. Everything else is Montserrat.

### Typography Inspiration from Reference Images

- **EVERYDAY FASHION** hero (Inspiration 1): Massive uppercase sans-serif bleeding edge to edge, split across two lines with image layered behind — this is the model for Section 3.
- **Mariana Studio** (Inspiration 2): Small uppercase tracked label → massive serif headline → short body text. Use this 3-level hierarchy for Section 8 (Brand Story) and Section 12 (CTA).
- **LUMORITY** (Inspiration 3): Bold wide-set serif for full-bleed text. Use this approach for Section 7 (Best Sellers) mid-section banner.

---

## 3. Spacing & Layout System

### Base Unit: 8px

All spacing values are multiples of 8px.

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | `8px` | Inline gaps, icon padding |
| `--space-2` | `16px` | Component internal padding |
| `--space-3` | `24px` | Card padding, small gaps |
| `--space-4` | `32px` | Section internal spacing |
| `--space-6` | `48px` | Large gaps within sections |
| `--space-8` | `64px` | Section top/bottom padding (mobile) |
| `--space-12` | `96px` | Section top/bottom padding (desktop) |
| `--space-20` | `160px` | Hero section vertical padding |

### Grid

- **12-column grid** with `24px` gutters (desktop)
- **Max content width:** `1280px` centered
- **Mobile:** Single column, `16px` horizontal margin
- **Cards:** Never stretch to fill — keep deliberate white space between them

---

## 4. Component Design Specs

### 4.1 — Buttons

Two button types only. No rounded-full pills — that looks casual, not luxury.

**Primary Button (CTA):**
```
Background:    #8B0D1A  (Crimson Red)
Text:          #F5F2ED  (Off-White)
Font:          Montserrat, 600, 12px, UPPERCASE, letter-spacing: 0.15em
Padding:       14px 32px
Border-radius: 0px  (sharp corners — matches the logo's hard edges)
Border:        none
Hover:         Background → #A01020  (slightly lighter red)
               Add subtle box-shadow: 0 0 20px rgba(139, 13, 26, 0.4)
Transition:    all 0.25s ease
```

**Secondary Button (Ghost/Outline):**
```
Background:    transparent
Text:          #F5F2ED
Font:          Montserrat, 600, 12px, UPPERCASE, letter-spacing: 0.15em
Padding:       12px 30px
Border:        1.5px solid #F5F2ED
Border-radius: 0px
Hover:         Border → #8B0D1A
               Text  → #8B0D1A
Transition:    all 0.25s ease
```

**WhatsApp Button (special):**
```
Background:    #25D366  (WhatsApp green — universally recognized)
Text:          #FFFFFF
Icon:          WhatsApp SVG icon (left of text)
Font:          Montserrat, 600, 13px
Padding:       14px 28px
Border-radius: 0px
```

---

### 4.2 — Product Cards

```
Card Background:  #141414  (--color-surface)
Border:           1px solid #2A2A2A  (visible only, no heavy outline)
Border-radius:    0px  (sharp — luxury fashion brands avoid pill corners)

Image area:
  Aspect ratio:   3:4 (portrait — shows full outfit)
  Object-fit:     cover
  Hover effect:   Swap to second product image (smooth 0.4s crossfade)
                  + Slight scale: 1.03

Badge ("NEW" or "BEST SELLER"):
  Position:       top-left, 12px from edges
  Background:     #8B0D1A
  Text:           #F5F2ED, Montserrat, 600, 10px, UPPERCASE
  Padding:        4px 10px
  Border-radius:  0px

Card Body (below image):
  Padding:        16px
  Product name:   Inter, 500, 14px, #F5F2ED
  Price:          Montserrat, 700, 16px, #F5F2ED
  Compare price:  Inter, 400, 13px, #9A9A8E, text-decoration: line-through
  "View" button:  Appears on hover — slides up from bottom of card
                  Full-width, red background, "VIEW DETAILS" text

Hover state (card level):
  Border color → #8B0D1A  (red border glow on hover)
  Transition:   all 0.3s ease
```

---

### 4.3 — Section Labels (Overlines)

Small pre-title label that appears before every major section heading.

```
Font:             Montserrat, 600, 11px
Color:            #8B0D1A  (Crimson Red)
Case:             UPPERCASE
Letter-spacing:   0.25em
Display:          flex, align-items: center, gap: 12px

With line:
  [—————] SECTION LABEL
  A thin 40px line (1px, red) to the left of the label text.
  This mimics the editorial style from the Mariana/Lumority references.
```

---

### 4.4 — Navbar

```
Position:        Fixed, sticky top
Height:          64px (desktop) / 56px (mobile)
Background:      Transparent when at hero top → transitions to #0B0B0B/95%
                 with backdrop-filter: blur(12px) on scroll
Transition:      background 0.3s ease

Logo:            SalarX logo image (SVG or PNG with transparency)
                 Height: 36px

Nav Links:       Montserrat, 500, 12px, UPPERCASE, letter-spacing: 0.12em
                 Color: #F5F2ED
                 Hover: Color → #8B0D1A  (red)
                 Active: Color → #8B0D1A + thin underline (1px red)

Icons:           Search (Lucide), Cart (Lucide with badge)
                 Color: #F5F2ED
                 Hover: #8B0D1A

Cart Badge:      Small circle, #8B0D1A background, #F5F2ED text
                 Size: 16px diameter

Mobile:
  Show: Logo (left) + Cart icon + Hamburger (right)
  Drawer: Slides from left. Full height. #0B0B0B background.
  Drawer links: 24px Montserrat, one per row, with red hover.
```

---

### 4.5 — Announcement Bar

```
Height:          40px
Background:      #8B0D1A  (Crimson Red bar — matches brand accent)
Text:            #F5F2ED, Montserrat, 500, 11px, UPPERCASE, letter-spacing: 0.15em
Text-align:      Center
Animation:       Fade/slide through 3 messages, 4 second interval
Close button:    Small × on right, color #F5F2ED, opacity 0.6
```

---

### 4.6 — Category Cards

```
Shape:           Portrait rectangle (2:3 ratio)
Background:      Dark image with a gradient overlay:
                 linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)
Border-radius:   0px

Category Name:   Montserrat, 700, 18px, UPPERCASE, #F5F2ED
                 Position: bottom-left, 20px from edges
Bangla subtitle: Inter, 400, 13px, #9A9A8E, below category name

Hover effect:    Image zooms to 1.05 (overflow hidden)
                 Bottom gradient darkens
                 A thin red line (2px) animates in at the bottom of the card
Transition:      all 0.4s ease
```

---

### 4.7 — Trust Bar

```
Background:      #141414  (slightly lighter than page bg)
Padding:         32px 0
Border-top:      1px solid #2A2A2A
Border-bottom:   1px solid #2A2A2A

Each trust item:
  Layout:        flex column, center-aligned
  Icon:          SVG, 28px, color: #8B0D1A (red)
  Label:         Montserrat, 700, 14px, #F5F2ED, UPPERCASE
  Sublabel:      Inter, 400, 12px, #9A9A8E

Separator between items:
  1px vertical line, #2A2A2A, height 40px
  Hidden on mobile (items stack in 2×3 grid)
```

---

### 4.8 — Testimonial / Review Cards

```
Card Background:  #141414
Border:           1px solid #2A2A2A
Border-radius:    0px
Padding:          28px

Stars:            SVG star icons, #8B0D1A, 16px each

Quote text:       Inter, 400, 15px, #F5F2ED, line-height: 1.7
                  Open with a large " character in #8B0D1A, 60px Playfair Display

Customer name:    Montserrat, 600, 13px, #F5F2ED
Location:         Inter, 400, 12px, #9A9A8E

Avatar:           40px circle. Red border (1.5px #8B0D1A). Monogram if no photo.

Carousel:         3 visible (desktop) / 1 visible (mobile)
                  Navigation: Prev/Next arrow buttons (outline style, red)
                  Auto-advances every 5 seconds
```

---

## 5. Section-by-Section Design Direction

### Section 1 — Announcement Bar
```
Style:  Solid crimson red (#8B0D1A) full-width bar.
        Off-white text. Stark and bold — immediately says "this brand has color."
```

### Section 2 — Navbar
```
Style:  Glass morphism navbar on scroll.
        Transparent at top of hero (text readable against hero image).
        On scroll: #0B0B0B + blur(12px) background.
        Red hover on links.
```

### Section 3 — Hero Section
```
Style:  FULL VIEWPORT. Black background. Single lifestyle image.

Layout Option A (Inspired by "EVERYDAY FASHION" reference):
  - Giant H1 text at the top ("STYLE THAT") — Playfair, white, very large
  - Product image occupies center of screen
  - Second H1 line ("SPEAKS FOR YOU") behind or overlapping the image
  - CTA buttons bottom-left
  - Creates a fragmented, collage-editorial feel

Layout Option B (Simpler, safe):
  - Full-bleed background image with dark overlay
  - Text left-aligned (white headline, muted subtext, two CTA buttons)

RECOMMENDATION: Use Layout A — it matches the inspiration images and the
bold X logo. Safe layouts work for generic brands. SalarX is NOT generic.

Animated element:
  - A thin red horizontal line (1px, full width) animates in below the headline
  - Text fades up on page load (staggered 0.1s delay per element)
```

### Section 4 — Trust Bar
```
Style:  Dark surface (#141414) band. 5 items separated by subtle vertical lines.
        Red SVG icons + Off-white bold labels. Clean and information-dense.
```

### Section 5 — Category Cards
```
Style:  Dark-image cards in a 4-column grid.
        Cards feel like editorial fashion magazine spreads.
        Hover: image zooms + red bottom border appears.
        Section label "SHOP BY CATEGORY" in small red Montserrat above the grid.
```

### Section 6 — New Arrivals
```
Style:  4-column product grid on #0B0B0B background.
        Section overline: small red "FRESH OFF THE RACK" label.
        Section title: "JUST DROPPED" — Montserrat, 800, UPPERCASE, off-white.
        Product cards: portrait 3:4 ratio, hover swaps image + shows red "View" button.
        "See All →" link bottom right, in red with arrow.
```

### Section 7 — Best Sellers
```
Style:  Same product grid as Section 6 but with a twist:
        Add a full-width dark-red mid-section banner between the grid and heading.
        
        The banner (inspired by Lumority "A STYLE THAT INSPIRES"):
          Background: #141414
          Large text overlaid: "WHAT EVERYONE'S BUYING" in giant Montserrat
          Red partial underline on "BUYING"
          This banner acts as a bold visual break before the product grid below.

        Products use gold/amber "⭐ BEST SELLER" badge instead of "NEW".
```

### Section 8 — Brand Story
```
Style:  Two-column split layout (50/50).
        LEFT:  Real shop/owner photo — full height, no border.
               A thin red vertical line (3px) on the right edge of the photo.
        RIGHT: Dark bg (#0B0B0B). Padded content.
               - Small red overline label: "— OUR STORY"
               - Large Playfair Display serif headline: "Born in Chapainawabganj."
               - Body text in Inter.
               - 4 stat pills in a row (store, orders, rating, reach)
               - Red CTA button.

On mobile: Image on top (full width), text below.
```

### Section 9 — Reviews
```
Style:  Background: #141414 (subtle contrast from adjacent sections).
        Large opening quote marks in Playfair Display, crimson red, 80px — very editorial.
        3-wide carousel on desktop, 1-wide on mobile.
        Red navigation arrows (outline style) for slider.
        Section title: "LOVED BY OUR CUSTOMERS" in Montserrat, white.
```

### Section 10 — Social Feed
```
Style:  Black background (#0B0B0B).
        3×2 grid of square images — no borders, no gap (flush edge-to-edge grid).
        On hover: an overlay fades in with the Instagram icon + "View Post".
        Below the grid: "FOLLOW @SALARX" in large Montserrat + Follow buttons.
```

### Section 11 — Delivery & Payment Info
```
Style:  THIS IS THE ONE LIGHT SECTION — Off-White (#F5F2ED) background.
        Dark text (#0B0B0B) for maximum contrast.
        Red icons.
        4 columns with thin dark vertical dividers.
        This light section creates visual relief and signals "important information."
        Visitors will notice the color change and read more carefully.
```

### Section 12 — WhatsApp / Newsletter CTA
```
Style:  Dark split-section.
        LEFT half: #141414 background. Email newsletter copy + input field.
        RIGHT half: #8B0D1A (solid red) background. WhatsApp CTA in white text.
        The red right half is a bold visual — it draws the eye to the WhatsApp CTA,
        which is the higher-priority action for the Bangladesh market.

        Button on red half: White background, dark text, WhatsApp icon.
        This reverses the button contrast intentionally.
```

### Section 13 — Footer
```
Style:  #0B0B0B background with a thin red top border (2px #8B0D1A).
        4 columns. Off-white text, muted grey for secondary links.
        Logo at top-left of footer.
        Bottom bar: #141414 background, smaller text, payment logos.
        Social media icons: outline circle style, hover fills red.
```

---

## 6. Motion & Animation Guidelines

### Scroll-Triggered Animations (Framer Motion or CSS IntersectionObserver)

| Element | Animation | Duration | Delay |
|---------|-----------|----------|-------|
| Section overline labels | Fade in + slide right 20px | 0.4s | 0s |
| Section headings | Fade in + slide up 30px | 0.6s | 0.1s |
| Product cards | Fade in + slide up 20px (staggered) | 0.5s | 0.05s per card |
| Trust bar items | Fade in (left to right, staggered) | 0.4s | 0.08s each |
| Category cards | Fade in + slight scale from 0.97→1 | 0.5s | 0.1s each |
| Brand story image | Slide in from left | 0.7s | 0s |
| Brand story text | Fade in from right | 0.7s | 0.15s |

### Persistent Micro-interactions

| Interaction | Effect |
|-------------|--------|
| Nav link hover | Color transition to red (0.2s) |
| Button hover | Background shift + subtle glow shadow |
| Product card hover | Image swap + scale + red border + view button slides up |
| Category card hover | Image zoom + red bottom border slides in |
| Social image hover | Dark overlay + Instagram icon appears |
| Footer social icons | Border fills red on hover |

### Page Load Animation (Hero)
```
1. Background image fades in (0.5s)
2. Top H1 text slides down from above (0.6s, ease-out)
3. Bottom H1 text slides up from below (0.6s, ease-out, 0.1s delay)
4. Subheadline fades in (0.5s, 0.4s delay)
5. CTA buttons fade in (0.5s, 0.6s delay)
6. Thin red divider line draws left-to-right (0.8s, 0.8s delay)
```

---

## 7. Mobile-Specific Design Notes

- **Announcement bar:** Single message visible at a time (no marquee, just fade rotate)
- **Navbar:** Logo (center or left) + Cart icon (right, always visible) + Hamburger (right)
- **Hero:** Portrait image (4:5 ratio). Headline text is 40px. Stacked buttons.
- **Category cards:** 2-column grid OR horizontal snap scroll (1.5 cards visible)
- **Product grids:** Strictly 2 columns. Card portrait ratio preserved.
- **Brand story:** Image full width on top. Text below. Stat pills wrap to 2×2 grid.
- **Reviews:** 1 card per view. Full-width. Arrows below card.
- **Social feed:** 3-column grid (smaller squares)
- **Delivery info:** Stack vertically. Each info block full width.
- **WhatsApp CTA:** Red section on top, newsletter below (reverse order from desktop — WhatsApp is priority on mobile)
- **Floating WhatsApp button:** Fixed bottom-right corner on ALL pages. Green circle with WhatsApp icon. Bounces subtly on page load.

---

## 8. Design "Do Not" Rules

| ❌ Avoid | ✅ Instead |
|---------|----------|
| Rounded pill buttons | Sharp 0px border-radius buttons |
| Blue or green as accent colors | Crimson Red `#8B0D1A` only |
| White or light grey section backgrounds | Dark backgrounds only (except Section 11) |
| Generic stock photography | Real product/shop photos |
| Comic Sans, Roboto, or Open Sans | Playfair Display + Montserrat + Inter |
| Cluttered layouts with many competing elements | One focal point per section |
| Heavy drop shadows | Subtle red glow shadows only |
| Centered text for body paragraphs | Left-aligned body text |
| Carousel auto-play with no pause control | Pause on hover, manual arrows visible |

---

## 9. CSS Design Tokens (Ready to Implement)

```css
:root {
  /* === COLORS === */
  --color-black:        #0B0B0B;
  --color-surface:      #141414;
  --color-surface-2:    #1C1C1C;
  --color-border:       #2A2A2A;
  --color-red:          #8B0D1A;
  --color-red-hover:    #A01020;
  --color-red-muted:    #5C0D15;
  --color-red-glow:     rgba(139, 13, 26, 0.3);
  --color-offwhite:     #F5F2ED;
  --color-white:        #FFFFFF;
  --color-text-primary: #F5F2ED;
  --color-text-muted:   #9A9A8E;
  --color-text-accent:  #8B0D1A;

  /* === TYPOGRAPHY === */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-heading: 'Montserrat', Arial, sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;

  /* === FONT SIZES (fluid) === */
  --text-display: clamp(40px, 8vw, 96px);
  --text-h2:      clamp(28px, 4vw, 56px);
  --text-h3:      clamp(20px, 2.5vw, 28px);
  --text-label:   11px;
  --text-body:    16px;
  --text-body-sm: 13px;
  --text-ui:      13px;

  /* === LETTER SPACING === */
  --tracking-label:   0.25em;
  --tracking-button:  0.15em;
  --tracking-nav:     0.12em;

  /* === SPACING (8px base) === */
  --space-1:  8px;
  --space-2:  16px;
  --space-3:  24px;
  --space-4:  32px;
  --space-6:  48px;
  --space-8:  64px;
  --space-12: 96px;
  --space-20: 160px;

  /* === BORDERS === */
  --radius: 0px;  /* Sharp corners — brand identity */
  --border-thin:  1px solid #2A2A2A;
  --border-red:   1.5px solid #8B0D1A;

  /* === SHADOWS === */
  --shadow-red: 0 0 24px rgba(139, 13, 26, 0.35);
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);

  /* === TRANSITIONS === */
  --transition-fast:   0.2s ease;
  --transition-base:   0.3s ease;
  --transition-slow:   0.5s ease;
  --transition-image:  0.4s ease;
}
```

---

## 10. Visual Summary — Section Background Map

```
┌──────────────────────────────────────────┐
│  Announcement Bar     bg: #8B0D1A (RED)  │
├──────────────────────────────────────────┤
│  Navbar               bg: transparent → #0B0B0B/95  │
├──────────────────────────────────────────┤
│  Hero                 bg: #0B0B0B + photo │
├──────────────────────────────────────────┤
│  Trust Bar            bg: #141414        │
├──────────────────────────────────────────┤
│  Category Cards       bg: #0B0B0B        │
├──────────────────────────────────────────┤
│  New Arrivals         bg: #0B0B0B        │
├──────────────────────────────────────────┤
│  Best Sellers Banner  bg: #141414        │
│  Best Sellers Grid    bg: #0B0B0B        │
├──────────────────────────────────────────┤
│  Brand Story          bg: #0B0B0B        │
├──────────────────────────────────────────┤
│  Reviews              bg: #141414        │
├──────────────────────────────────────────┤
│  Social Feed          bg: #0B0B0B        │
├──────────────────────────────────────────┤
│  Delivery Info        bg: #F5F2ED (LIGHT)│  ← Only light section
├──────────────────────────────────────────┤
│  CTA Left             bg: #141414        │
│  CTA Right (WhatsApp) bg: #8B0D1A (RED)  │
├──────────────────────────────────────────┤
│  Footer               bg: #0B0B0B        │
│  Footer Bottom Bar    bg: #141414        │
└──────────────────────────────────────────┘
```

---

*Prepared for: SalarX · Agency Ecommerce Core Project*  
*Date: 2026-08-22*
