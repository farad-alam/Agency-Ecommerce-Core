# SalarX — Homepage Plan, Content Spec & Copywriting

**Brand:** SalarX  
**Type:** Clothing Shop  
**Location:** New Market, Chapainawabganj, Rajshahi, Bangladesh  
**Target Market:** Local + Regional (Bangladesh) online shoppers  
**Primary Goal:** Build trust → browse products → place an order  
**Last Updated:** 2026-08-22

---

## The Problem to Solve

Bangladeshi online shoppers are naturally skeptical of smaller/local online shops. Our homepage must answer three unspoken questions a visitor has the moment they land:

1. **"Is this real?"** — Prove you're a legitimate, physical business.
2. **"Is this good quality?"** — Show the product in the best possible light.
3. **"What if something goes wrong?"** — Make policies clear and reassuring.

---

## Section-by-Section: Content Type + Generated Copy

---

### SECTION 1 — Announcement Bar

**Content Type:** `TEXT ONLY` — Rotating text ticker (no images needed)  
**Layout:** Thin full-width bar above navbar. 3 messages rotate every 4 seconds.  
**Design:** Dark background (#111), white text, small arrow/chevron separators.

**Generated Copy (3 rotating messages):**

```
Message 1:  🚚  Free Delivery on orders above ৳999  |  Cash on Delivery Available
Message 2:  🆕  New Arrivals Just Dropped — Shop the Latest Collection Now
Message 3:  💬  Order via WhatsApp: +8801700000000  (clickable link)
```

**Notes for developer:**
- Make the WhatsApp number in Message 3 a `tel:` or `https://wa.me/` hyperlink.
- Auto-rotate with a smooth fade or slide transition.
- Add a small `×` button on the right to let users dismiss the bar (saves space on mobile).

---

### SECTION 2 — Navbar

**Content Type:** `LOGO + TEXT LINKS + ICONS` — No images.  
**Layout:** Fixed sticky navbar. Transparent on hero, solid background on scroll.

**Generated Copy (nav links):**

```
Logo:   SalarX   (left side)
Links:  Home  |  Products  |  Collections  |  About Us  |  Contact
Icons:  🔍 Search    🛒 Cart (with badge count)    ☰ Menu (mobile only)
```

**Mobile nav drawer links:**
```
Home
Men's Wear
Women's Wear
Collections
New Arrivals
About Us
Contact Us
💬 WhatsApp Us
```

**Notes for developer:**
- On mobile, hide the text nav links behind a hamburger menu.
- Cart icon should always be visible on mobile (not inside the drawer).
- Navbar transitions from `transparent` to `solid white/dark` after scrolling 80px.

---

### SECTION 3 — Hero Section

**Content Type:** `SINGLE LARGE IMAGE (or looping video) + TEXT OVERLAY`  
**Layout:** Full viewport height (100vh). Single lifestyle image (portrait on mobile, landscape on desktop). Text positioned center or left-aligned.

**Visual Guidance:**
- **Best option:** A single model wearing your best outfit, full-body shot, clean/natural background (outdoor or studio).
- **Alternative:** A styled flat-lay of 2–3 outfit combinations.
- **Optional upgrade:** A short (8–15 second) looping silent video of a model walking/posing — autoplay muted. Massive engagement boost on desktop.
- Use a **semi-transparent dark overlay (opacity 40–50%)** over the image so text is readable.

**Generated Copy:**

```
HEADLINE (H1):
Style That Speaks for You.

SUBHEADLINE:
Premium clothing for men and women — crafted for everyday comfort,
made to turn heads. Delivered anywhere in Bangladesh.

PRIMARY CTA BUTTON:
→ Shop New Arrivals

SECONDARY CTA BUTTON (outlined/ghost):
Browse Collections
```

**Mobile adaptation:**
- Stack the two buttons vertically on mobile.
- Use a portrait image (4:5 ratio) instead of landscape.
- Reduce headline font size: desktop ~56px → mobile ~32px.

---

### SECTION 4 — Trust Bar

**Content Type:** `ICONS + SHORT TEXT` — No product images. Pure information.  
**Layout:** Horizontal row of 5 items (desktop) | 2×3 grid or horizontal scroll (mobile).  
**Design:** Light grey or off-white background. SVG icons in brand color.

**Generated Copy (5 trust items):**

```
Icon: Store/Building
Label: Real Physical Store
Sub:   New Market, Chapainawabganj

Icon: Delivery truck
Label: Fast Delivery
Sub:   Across All of Bangladesh

Icon: Money/Wallet
Label: Cash on Delivery
Sub:   Pay When You Receive

Icon: Refresh/Exchange arrows
Label: 7-Day Exchange
Sub:   Easy, No Questions Asked

Icon: Star / Heart
Label: 500+ Happy Customers
Sub:   And Growing Every Day
```

**Notes:**
- No images. Use clean SVG or Lucide icons.
- Keep each label short — max 3 words in the main label, 4–5 words in the sub-label.
- This section is about credibility, not aesthetics. Keep it clean and readable.

---

### SECTION 5 — Category / Collection Shortcuts

**Content Type:** `MULTIPLE IMAGES (category cards)` — 4 to 6 cards.  
**Layout:** 4-column grid (desktop) | 2-column grid (mobile).  
**Each card:** Square or slightly portrait image with a dark gradient overlay + category name.

**Visual Guidance:**
- Each card needs **1 high-quality photo** representing that clothing category.
- Use a real product photo from that category as the card background.
- Avoid generic stock photos — real product images build more trust.

**Generated Copy (category names + subtitles):**

```
Card 1:
  Image:    A men's kurta or shirt product photo
  Label:    Men's Wear
  Subtitle: পুরুষদের পোশাক

Card 2:
  Image:    A women's clothing product photo
  Label:    Women's Wear
  Subtitle: মহিলাদের পোশাক

Card 3:
  Image:    Casual outfit photo
  Label:    Casual & Daily Wear
  Subtitle: আরামদায়ক পোশাক

Card 4:
  Image:    Formal/Eid/occasion wear photo
  Label:    Festive & Formal
  Subtitle: উৎসবের পোশাক

Card 5:
  Image:    New product collage or single product
  Label:    New Arrivals
  Subtitle: নতুন কালেকশন

Card 6:
  Image:    Discounted product(s)
  Label:    Sale
  Subtitle: বিশেষ ছাড়
```

**Section heading copy:**
```
SECTION TITLE:  Shop by Category
SECTION SUBTITLE: Find exactly what you're looking for — fast.
```

**Notes for developer:**
- On mobile, make these cards horizontally scrollable (snap scroll) so they don't stack too tall.
- A hover effect: slight zoom on the image + darken the overlay.

---

### SECTION 6 — New Arrivals Showcase

**Content Type:** `MULTIPLE PRODUCT CARDS (grid)` — 8 products shown.  
**Layout:** 4-column grid (desktop) | 2-column grid (mobile).  
**Each card:** Product thumbnail image + product name + price + optional CTA.

**Visual Guidance:**
- Use clean, consistent product photography for every card.
- Each product needs at least 2 photos: (1) product alone, (2) product on model or styled.
- Hover effect (desktop): smoothly swap to the second image.
- Apply a small **"NEW"** badge (pill shape, brand color) on the top-left of each card.

**Generated Section Copy:**

```
SECTION LABEL (small text above title):  Fresh Off the Rack
SECTION TITLE (H2):                       Just Dropped ✨
SECTION SUBTITLE:                         Our newest styles — added this week.

VIEW ALL LINK (below grid):               See All New Arrivals →
```

**Product card copy structure (to repeat for each product from DB):**
```
[NEW badge]           ← top-left corner of image
[Product Image]
[Product Name]        ← pulled from DB, e.g., "Men's Cotton Panjabi"
[Price]               ← e.g., ৳ 750
[Compare-at Price]    ← struck out if on sale, e.g., ৳ 950
[View Details]        ← button, links to product page
```

---

### SECTION 7 — Best Sellers

**Content Type:** `MULTIPLE PRODUCT CARDS (grid)` — 4 to 8 products.  
**Layout:** 4-column grid (desktop) | 2-column grid (mobile). Same card style as New Arrivals.

**Visual Guidance:**
- Same card style as Section 6 but badge changes to **"⭐ BEST SELLER"** (gold/amber color).
- Optionally add a **"X+ Sold"** counter below the product name — e.g., "240+ Sold".
- This section doesn't need a different layout — just different badge + products.

**Generated Section Copy:**

```
SECTION LABEL:    Customer Favourites
SECTION TITLE:    Our Best Sellers 🏆
SECTION SUBTITLE: The pieces our customers love most — and keep coming back for.

VIEW ALL LINK:    Shop All Best Sellers →
```

**Optional urgency copy on individual cards:**
```
"Only 3 left!"     ← shown when inventoryQty <= 3
"120+ Sold"        ← shown when sold count is high
```

---

### SECTION 8 — Brand Story Snippet

**Content Type:** `1 SINGLE IMAGE (shop/owner photo) + TEXT CONTENT` — Two-column layout.  
**Layout:** Left half = image. Right half = text content. On mobile: image on top, text below.

**Visual Guidance:**
- **Ideal image:** The shop owner standing in the store, or the shop front with signage visible.
- **Alternative:** A behind-the-scenes photo — products being packed, a nicely arranged rack of clothes.
- Size: Square or portrait (1:1 or 3:4 ratio). High quality.
- Don't use a stock photo. **Real = trustworthy.**

**Generated Copy (full brand story section text):**

```
SECTION LABEL:    Our Story

HEADLINE (H2):    Born in Chapainawabganj. Built for Bangladesh.

BODY TEXT (3 paragraphs):

  Paragraph 1:
  SalarX started as a small clothing shop in the heart of New Market,
  Chapainawabganj — a single rack of handpicked styles and a belief that
  everyone deserves to dress well, without compromise.

  Paragraph 2:
  We personally select every piece in our collection based on three things:
  quality of fabric, accuracy of fit, and value for money. No shortcuts,
  no overpriced labels — just clothes that look great and feel even better.

  Paragraph 3:
  Today, we serve customers across Bangladesh — from our physical store
  in Chapainawabganj to doorsteps in Dhaka, Chittagong, and beyond.
  We're proud of every order, and we stand behind every product we sell.

CTA BUTTON:   Read Our Full Story →   (links to /about page)
```

**Supporting stat pills (optional, displayed below the text):**
```
🏬  1 Physical Store
📦  500+ Orders Delivered
⭐  4.9 / 5 Average Rating
🇧🇩  Serving All of Bangladesh
```

---

### SECTION 9 — Customer Reviews / Testimonials

**Content Type:** `TEXT CARDS + SMALL AVATAR IMAGE (optional)` — Carousel of 6 reviews.  
**Layout:** Horizontal carousel/slider. Shows 3 cards on desktop, 1 card on mobile.  
**Design:** Soft off-white or light grey background for the whole section. Cards with white background, subtle shadow.

**Visual Guidance:**
- **Best case:** Small circular avatar photo of the customer (50×50px). If customer photo is not available, use a generic avatar icon with first letter of their name.
- Do **NOT** use stock photos for customer avatars — it looks fake instantly.
- Star rating displayed as filled ⭐ icons (SVG).

**Generated Section Copy:**

```
SECTION LABEL:    What They Say
SECTION TITLE:    Loved by Our Customers ❤️
SECTION SUBTITLE: Real orders. Real people. Real opinions.
```

**6 Generated Review Cards (ready-to-use placeholder reviews — replace with real ones as you collect them):**

```
Review 1:
  Name:     Rakib H.
  Location: Dhaka
  Rating:   ⭐⭐⭐⭐⭐
  Text:     "আমি অনলাইনে অর্ডার করতে সাধারণত ভয় পাই, কিন্তু SalarX থেকে
             প্রথমবার অর্ডার করেই মুগ্ধ হয়ে গেছি। পোশাকের কোয়ালিটি দেখে
             মনে হলো আরও বেশি দাম দিয়ে কিনেছি!"
  English:  "I'm usually scared to order online, but SalarX impressed me
             from my very first order. The fabric quality felt more premium
             than what I paid for!"

Review 2:
  Name:     Nasrin A.
  Location: Rajshahi
  Rating:   ⭐⭐⭐⭐⭐
  Text:     "Delivery was super fast — only 2 days to Rajshahi. The kurta
             fits perfectly and the colour is exactly as shown in the photo.
             No surprises, just a great experience."

Review 3:
  Name:     Tanvir M.
  Location: Chapainawabganj
  Rating:   ⭐⭐⭐⭐⭐
  Text:     "স্থানীয় দোকান থেকে অনলাইনে আসতে একটু সন্দেহ ছিল, কিন্তু
             SalarX সব সন্দেহ দূর করে দিয়েছে। পণ্যের মান অসাধারণ।"
  English:  "I was a little doubtful going from a local shop to online,
             but SalarX erased every doubt. The product quality is
             outstanding."

Review 4:
  Name:     Sumaiya K.
  Location: Chittagong
  Rating:   ⭐⭐⭐⭐⭐
  Text:     "I bought the women's linen set for Eid and got so many
             compliments. The packaging was neat and the product looked
             exactly like the pictures. Will definitely order again!"

Review 5:
  Name:     Arman R.
  Location: Sylhet
  Rating:   ⭐⭐⭐⭐⭐
  Text:     "Cash on delivery made me feel safe placing my first order.
             When the package arrived, I was shocked at how well-packed
             it was. The shirt quality is excellent. 100% recommend."

Review 6:
  Name:     Fatema B.
  Location: Bogura
  Rating:   ⭐⭐⭐⭐⭐
  Text:     "সাইজ চার্ট একদম সঠিক ছিল। ঠিক সাইজ অর্ডার করেছিলাম, একদম
             ফিট হয়েছে। আবার অর্ডার করবো, ইনশাআল্লাহ।"
  English:  "The size chart was perfectly accurate. I ordered the right
             size and it fit exactly. Will order again, InshAllah."
```

**Bottom of section:**
```
LINK:   📝 Read All Reviews on Facebook →   (links to FB page reviews)
```

---

### SECTION 10 — Social Media Feed

**Content Type:** `GRID OF SOCIAL MEDIA IMAGES (6–8 images)` — Manually curated or auto-synced.  
**Layout:** 3-column or 4-column image grid (same size squares). No text overlay on images.

**Visual Guidance:**
- Pull your 6–8 most recent Facebook/Instagram product photos.
- Images should look natural and real — avoid heavy filters.
- Each image links to the original post on clicking.
- On mobile: 3-column grid of square images.

**Generated Section Copy:**

```
SECTION LABEL:    Follow Along
SECTION TITLE:    @SalarX on Facebook & Instagram

SUBTITLE:
  See how our customers style their SalarX pieces.
  Tag us for a chance to be featured! 🤍

FOLLOW BUTTON:    📱 Follow Us on Facebook
SECOND BUTTON:    📸 Follow on Instagram
```

---

### SECTION 11 — Delivery & Payment Info

**Content Type:** `ICONS + TEXT` — 3 or 4 info columns. No product images.  
**Layout:** 3-column horizontal row (desktop) | Stacked vertically (mobile).  
**Design:** Clean section with a subtle separator line above and below.

**Visual Guidance:**
- Use large, clean SVG icons (truck, payment card, exchange arrows, shield).
- Each column: icon on top, bold heading, 2–3 lines of explanation text.
- Background: white or very light grey.

**Generated Copy (4 info columns):**

```
Column 1 — Delivery
  Icon:     Delivery truck SVG
  Heading:  Fast Delivery Nationwide
  Body:     We deliver to all districts across Bangladesh.
            Estimated delivery: 2–5 working days.
            Shipped via Steadfast / Pathao Courier.

Column 2 — Payment
  Icon:     Wallet / Payment card SVG
  Heading:  Flexible Payment Options
  Body:     Pay with bKash, Nagad, or Rocket.
            Cash on Delivery (COD) also available.
            100% safe and secure transactions.

Column 3 — Exchange
  Icon:     Refresh / Exchange arrows SVG
  Heading:  7-Day Easy Exchange
  Body:     Not happy with the fit? No worries.
            Exchange your item within 7 days of delivery.
            Just WhatsApp us and we'll sort it out.

Column 4 — Quality Promise
  Icon:     Shield / Tick SVG
  Heading:  Quality Guaranteed
  Body:     Every product is personally checked before shipping.
            What you see in the photo is what you receive.
            No compromises on quality.
```

---

### SECTION 12 — WhatsApp / Newsletter CTA

**Content Type:** `TEXT + INPUT FIELD + BUTTON` — Full-width banner section.  
**Layout:** Split into two halves: Left = Newsletter sign-up. Right = WhatsApp CTA.  
**On mobile:** Stack vertically. WhatsApp CTA first (higher priority in BD market).

**Visual Guidance:**
- Use a brand-color or dark gradient background for this entire section.
- White text on dark background.
- WhatsApp icon (green) on the button is instantly recognizable.
- No product images needed here — it's a CTA section.

**Generated Copy:**

```
LEFT SIDE — Email Newsletter:
  LABEL:      Stay in the Loop
  HEADING:    Get Exclusive Deals & New Arrivals First
  SUBTEXT:    Join 500+ shoppers who get early access to sales,
              new drops, and special discount codes. No spam — ever.
  INPUT:      Your email address...
  BUTTON:     Subscribe →
  FINE PRINT: 🔒 We respect your privacy. Unsubscribe anytime.

RIGHT SIDE — WhatsApp CTA:
  LABEL:      Need Help?
  HEADING:    Chat with Us on WhatsApp
  SUBTEXT:    Ask about sizing, delivery timelines, or anything else.
              Our team replies within 1 hour during business hours.
  BUTTON:     💬 Chat on WhatsApp   (links to wa.me/+8801700000000)
  HOURS:      Mon–Sat, 9 AM – 9 PM (Bangladesh Standard Time)
```

---

### SECTION 13 — Footer

**Content Type:** `LOGO + TEXT LINKS + CONTACT INFO + ICONS`  
**Layout:** 4-column grid (desktop) | Stacked accordion (mobile).

**Generated Copy (all footer text):**

```
COLUMN 1 — Brand
  Logo:     SalarX (with brand logo/wordmark)
  Tagline:  Dress the Way You Feel.
  Social:   [Facebook icon]  [Instagram icon]  [WhatsApp icon]
  Text:     © 2025 SalarX. All rights reserved.

COLUMN 2 — Shop
  Heading:  Shop
  Links:
    - New Arrivals
    - Men's Wear
    - Women's Wear
    - Casual Wear
    - Festive & Formal
    - Sale

COLUMN 3 — Help
  Heading:  Help & Info
  Links:
    - About Us
    - Contact Us
    - FAQs
    - Size Guide
    - Delivery & Shipping
    - Returns & Exchange Policy

COLUMN 4 — Contact Us
  Heading:   Contact Us
  Address:   📍 New Market, Chapainawabganj,
                Rajshahi, Bangladesh
  Phone:     📞 +8801700000000
  WhatsApp:  💬 WhatsApp Us
  Email:     📧 hello@salarx.com
  Hours:     🕐 Mon–Sat: 9 AM – 9 PM

BOTTOM BAR (below all columns):
  Left:   © 2025 SalarX. All rights reserved.
  Center: Privacy Policy  |  Return Policy  |  Terms of Service
  Right:  [bKash logo]  [Nagad logo]  [COD badge]
```

---

## Master Content Inventory

> This is a checklist of every piece of content needed before building. Items marked **[GENERATED]** have copy ready above. Items marked **[NEEDED]** require you to provide the asset.

### Text Content (Copywriting) — Status: ✅ Done

| Section | Status |
|---------|--------|
| Announcement Bar (3 messages) | ✅ GENERATED |
| Navbar links & mobile drawer | ✅ GENERATED |
| Hero headline, subheadline, CTAs | ✅ GENERATED |
| Trust Bar (5 items with labels) | ✅ GENERATED |
| Category cards (6 names + Bangla) | ✅ GENERATED |
| New Arrivals section heading | ✅ GENERATED |
| Best Sellers section heading + urgency copy | ✅ GENERATED |
| Brand Story (3 paragraphs + stat pills) | ✅ GENERATED |
| 6 Customer Review cards (bilingual) | ✅ GENERATED |
| Social Media section copy | ✅ GENERATED |
| Delivery & Payment (4 columns) | ✅ GENERATED |
| WhatsApp + Newsletter CTA | ✅ GENERATED |
| Full Footer (all 4 columns + bottom bar) | ✅ GENERATED |

### Visual Content — Status: ⏳ Needs Your Input

| Asset | Type | Where Used |
|-------|------|------------|
| Hero lifestyle photo (landscape + portrait version) | 1 Large Image / Video | Section 3 |
| Men's Wear category photo | 1 Image | Section 5, Card 1 |
| Women's Wear category photo | 1 Image | Section 5, Card 2 |
| Casual Wear category photo | 1 Image | Section 5, Card 3 |
| Festive & Formal category photo | 1 Image | Section 5, Card 4 |
| New Arrivals category photo | 1 Image | Section 5, Card 5 |
| Sale category photo | 1 Image | Section 5, Card 6 |
| 8 product photos for New Arrivals grid | Multiple (2 per product) | Section 6 |
| 4–8 product photos for Best Sellers grid | Multiple (2 per product) | Section 7 |
| Shop / owner photo (real, not stock) | 1 Image | Section 8 |
| 6–8 social media post images | Multiple | Section 10 |
| Customer avatar photos (optional) | 6 small portraits | Section 9 |
| SalarX logo (SVG preferred) | Logo file | Navbar + Footer |

---

## Visual Content Type Summary (Quick Reference)

| Section | Content Type | # of Visuals |
|---------|-------------|--------------|
| 1. Announcement Bar | Text only | 0 |
| 2. Navbar | Logo only | 1 |
| 3. Hero | 1 large image OR looping video | 1 |
| 4. Trust Bar | Icons (SVG) only | 0 photos |
| 5. Category Cards | Multiple images (1 per card) | 4–6 |
| 6. New Arrivals | Product grid (2 images per product) | 16 |
| 7. Best Sellers | Product grid (2 images per product) | 8–16 |
| 8. Brand Story | 1 single real photo (shop/owner) | 1 |
| 9. Reviews | Avatar photos (optional) | 0–6 small |
| 10. Social Feed | Grid of social post images | 6–8 |
| 11. Delivery Info | SVG icons only | 0 photos |
| 12. WhatsApp CTA | No images | 0 |
| 13. Footer | Logo only | 1 |

---

## Key Design Principles

1. **Mobile-first** — 85%+ of Bangladesh traffic is on mobile. Every section must look perfect at 375px width first.
2. **No filler stock photos** — Any real photo of the actual shop/products/owner is 10× more effective than a stock image.
3. **Bangla is a trust builder** — Use Bangla subtitles in category cards and bilingual reviews to reach a broader local audience.
4. **Speed over decoration** — Every image should be compressed and served in WebP format. Slow site = lost customers on 4G.
5. **WhatsApp over everything** — The WhatsApp button should float (fixed bottom-right) on mobile throughout the entire page, not just in Section 12.

---

*Prepared for: SalarX · Agency Ecommerce Core Project*  
*Date: 2026-08-22*
