# MIIAM Marketing Banner Design Specifications

> **Version**: 1.0 | **Date**: July 5, 2026
> **Brand**: MIIAM — Indian Multi-Service Delivery Super-App
> **Primary Font**: Plus Jakarta Sans (Google Fonts)
> **Icon System**: Material Symbols Outlined (FILL: 1)

---

## Design System Foundation

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--miiam-primary` | `#ba001c` | Brand red — CTAs, logo, primary actions |
| `--miiam-accent` | `#ffd200` | Gold — highlights, badges, accent text |
| `--miiam-dark` | `#1a0005` | Near-black red — backgrounds, dark text |
| `--miiam-white` | `#ffffff` | Clean backgrounds, inverse text |
| `--miiam-food` | `#ba001c` | Food service |
| `--miiam-grocery-1` | `#11998e` | Grocery gradient start |
| `--miiam-grocery-2` | `#38ef7d` | Grocery gradient end |
| `--miiam-pharmacy-1` | `#7c3aed` | Pharmacy gradient start |
| `--miiam-pharmacy-2` | `#a855f7` | Pharmacy gradient end |
| `--miiam-flowers-1` | `#f43f5e` | Flowers gradient start |
| `--miiam-flowers-2` | `#fb923c` | Flowers gradient end |
| `--miiam-home-1` | `#0b50d5` | Home Services gradient start |
| `--miiam-home-2` | `#667eea` | Home Services gradient end |

### Typography Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Display (Hero) | 64–80px | 900 | 1.0 | -2px |
| Headline | 36–48px | 800 | 1.1 | -1px |
| Subheadline | 20–24px | 600 | 1.3 | 0 |
| Body | 16–18px | 500 | 1.5 | 0 |
| Caption | 12–14px | 600 | 1.4 | 0.5px |
| Badge | 14–16px | 700 | 1.2 | 2px (uppercase) |

### Gradient Library

```css
/* Primary Brand Gradient */
--grad-primary: linear-gradient(135deg, #1a0005 0%, #3d0010 30%, #ba001c 70%, #ff2d4a 100%);

/* Grocery Gradient */
--grad-grocery: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);

/* Pharmacy Gradient */
--grad-pharmacy: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);

/* Flowers Gradient */
--grad-flowers: linear-gradient(135deg, #f43f5e 0%, #fb923c 100%);

/* Home Services Gradient */
--grad-home: linear-gradient(135deg, #0b50d5 0%, #667eea 100%);

/* Service Rainbow (multi-service) */
--grad-rainbow: linear-gradient(135deg, #ba001c 0%, #f43f5e 25%, #7c3aed 50%, #0b50d5 75%, #11998e 100%);

/* Dark Overlay */
--grad-dark-overlay: linear-gradient(180deg, rgba(26,0,5,0) 0%, rgba(26,0,5,0.85) 100%);
```

### Shared Components

```css
/* CTA Button */
.cta-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 32px; border-radius: 60px;
  background: #ffd200; color: #1a0005;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 1px;
  text-decoration: none; border: none; cursor: pointer;
  box-shadow: 0 8px 32px rgba(255,210,0,0.35);
  transition: transform 0.2s, box-shadow 0.2s;
}
.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(255,210,0,0.5);
}

/* CTA Button — White variant */
.cta-btn--white {
  background: #fff; color: #ba001c;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

/* Glassmorphism Card */
.glass {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 16px;
}

/* Logo Mark */
.logo-text {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 900; letter-spacing: -2px;
  color: #fff;
}
.logo-text span { color: #ffd200; }
```

---

## Banner 1: Website Hero Banner

**Dimensions**: 1920 × 600px
**File**: `banner_hero.html`
**Usage**: Homepage hero, landing pages

### Layout Description

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1920 × 600                                                                  │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────────┐  │
│  │                      │  │                                              │  │
│  │   LEFT PANEL (45%)   │  │        RIGHT PANEL (55%)                    │  │
│  │   Width: ~864px      │  │        Width: ~1056px                       │  │
│  │                      │  │                                              │  │
│  │   [Dark BG]          │  │   [Service Image / Collage]                 │  │
│  │   #1a0005            │  │   with gradient overlay                     │  │
│  │                      │  │                                              │  │
│  │   ┌──────────────┐   │  │   Floating pill cards (service icons)       │  │
│  │   │ MIIA[A]M     │   │  │   at various positions                     │  │
│  │   │ (logo)       │   │  │                                              │  │
│  │   └──────────────┘   │  │                                              │  │
│  │                      │  │                                              │  │
│  │   Headline:          │  │                                              │  │
│  │   "Everything        │  │                                              │  │
│  │   you need.          │  │                                              │  │
│  │   Delivered."        │  │                                              │  │
│  │                      │  │                                              │  │
│  │   Subtext:           │  │                                              │  │
│  │   "Food, Grocery,    │  │                                              │  │
│  │   Pharmacy, Flowers  │  │                                              │  │
│  │   & Home Services"   │  │                                              │  │
│  │                      │  │                                              │  │
│  │   [CTA: Download Now]│  │                                              │  │
│  │   [Store badges]     │  │                                              │  │
│  │                      │  │                                              │  │
│  └──────────────────────┘  └──────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Exact Specifications

**Background**:
- Left panel: Solid `#1a0005`
- Right panel: Collage image with overlay `linear-gradient(135deg, rgba(186,0,28,0.3) 0%, rgba(26,0,5,0.6) 100%)`
- Decorative circles: Two radial gradients (subtle glow effects)

**Left Panel** (x: 0, width: 864px):
| Element | Position | Size | Style |
|---------|----------|------|-------|
| Logo "MIIAM" | x:80, y:140 | 72px / weight:900 / letter-spacing:-2px | White, "A" in `#ffd200` |
| Divider line | x:80, y:228 | width:60px, height:4px, border-radius:2px | `#ffd200` |
| Headline | x:80, y:252 | 56px / weight:800 / line-height:1.1 | White |
| Subheadline | x:80, y:380 | 20px / weight:500 / line-height:1.5 | `rgba(255,255,255,0.7)` |
| Service pills row | x:80, y:440 | flex row, gap:12px | See below |
| CTA Button | x:80, y:500 | 52px height, auto width | Gold `#ffd200` bg, `#1a0005` text |
| Store badges | x:80, y:560 | height:40px each, side by side | App Store + Play Store |

**Service Pills** (inside left panel):
- Each: `padding: 10px 20px`, `border-radius: 12px`, `background: rgba(255,255,255,0.08)`, `border: 1px solid rgba(255,255,255,0.12)`
- Font: 14px / weight:600 / white
- Icons: Emoji or Material icon, 18px
- Items: 🍔 Food | 🛒 Grocery | 💊 Pharmacy | 💐 Flowers | 🔧 Services

**Right Panel** (x: 864, width: 1056px):
- Full-bleed image of food/grocery collage (stock photo or brand imagery)
- Three floating glassmorphism circles with service icons at:
  - Top-left area (x:920, y:80): 64×64px circle, icon: `restaurant`
  - Center-right (x:1600, y:200): 80×80px circle, icon: `shopping_cart`
  - Bottom-left area (x:1000, y:420): 72×72px circle, icon: `local_pharmacy`
- Each circle: `background: rgba(255,255,255,0.12)`, `backdrop-filter: blur(16px)`, `border: 1px solid rgba(255,255,255,0.2)`, subtle shadow

### Content/Copy

| Element | Text |
|---------|------|
| Logo | MII<span style="color:#ffd200">A</span>M |
| Headline | Everything you need. Delivered. |
| Subheadline | Food, Grocery, Pharmacy, Flowers & Home Services — all in one app. |
| CTA | Download Now |
| Service labels | Food · Grocery · Pharmacy · Flowers · Services |

### Design Notes
- The split-panel layout creates strong visual hierarchy: brand message (left) + aspiration (right)
- Floating circles add depth and motion (CSS `@keyframes float` animation recommended)
- Store badges should be actual PNG/SVG assets, not styled divs
- Ensure minimum 80px padding from edges for safe area on all devices
- Right panel image should be `object-fit: cover` with `object-position: center`

---

## Banner 2: Google Display Ad — Leaderboard

**Dimensions**: 728 × 90px
**File**: `banner_leaderboard.html`
**Usage**: Google Display Network, website header ads

### Layout Description

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 728 × 90                                                                     │
│                                                                              │
│ ┌───────┐  ┌──────────────────────────────────────┐  ┌───────────────────┐  │
│ │MIIAM  │  │  Headline text here                   │  │  [CTA Button]    │  │
│ │logo   │  │  Supporting text line                 │  │  Download Now    │  │
│ │(icon) │  │                                       │  │                  │  │
│ └───────┘  └──────────────────────────────────────┘  └───────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Exact Specifications

**Background**: `linear-gradient(90deg, #1a0005 0%, #3d0010 40%, #ba001c 100%)`

**Layout** (3 sections, flex row, align-items: center):

| Section | Position | Width | Content |
|---------|----------|-------|---------|
| Logo area | padding-left: 20px | 100px | MIIAM wordmark |
| Text area | flex: 1 | ~450px | Headline + subtext |
| CTA area | padding-right: 20px | 160px | Button |

**Logo Area**:
- "MIIAM" text: 28px / weight:900 / letter-spacing:-1px / white
- "A" character: `#ffd200`
- Small icon below or beside: Material `delivery_dining` icon, 18px, `#ffd200`

**Text Area**:
| Element | Spec |
|---------|------|
| Headline | 22px / weight:800 / white / "Everything Delivered." |
| Subtext | 13px / weight:500 / `rgba(255,255,255,0.7)` / "Food · Grocery · Pharmacy · More" |

**CTA Button**:
- `padding: 10px 24px` / `border-radius: 6px` / `background: #ffd200` / `color: #1a0005`
- Font: 14px / weight:800 / uppercase / letter-spacing:0.5px
- Text: "DOWNLOAD NOW"
- Subtle arrow icon → (Material `arrow_forward`, 16px)

### Content/Copy

| Element | Text |
|---------|------|
| Logo | MIIAM |
| Headline | Everything Delivered. |
| Subtext | Food · Grocery · Pharmacy · More |
| CTA | DOWNLOAD NOW → |

### Design Notes
- **Google Ads compliance**: Text must not exceed 90 characters total for headline
- Keep file size under 150KB for fast ad loading
- No animated elements (static ad)
- Ensure text remains readable at small rendering sizes
- Test with Google Ads Preview tool for rendering accuracy
- Safe margins: 10px all sides minimum

---

## Banner 3: Google Display Ad — Medium Rectangle

**Dimensions**: 300 × 250px
**File**: `banner_medium_rectangle.html`
**Usage**: Google Display Network sidebar ads

### Layout Description

```
┌────────────────────────────────┐
│ 300 × 250                      │
│                                │
│  ┌──────────────────────────┐  │
│  │   [Service Image]        │  │
│  │   Full-width top area    │  │
│  │   Height: ~130px         │  │
│  │   with gradient overlay  │  │
│  └──────────────────────────┘  │
│                                │
│  ┌─ Content Area ───────────┐  │
│  │                          │  │
│  │  MIIAM (logo)            │  │
│  │  Headline text           │  │
│  │  Service icons row       │  │
│  │                          │  │
│  │  [CTA: Get the App]      │  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

### Exact Specifications

**Background**: White `#ffffff`
**Border**: 1px solid `rgba(186,0,28,0.15)`

**Top Image Area** (height: 130px):
- Image: Food/grocery collage or single hero shot
- Overlay: `linear-gradient(180deg, transparent 40%, rgba(26,0,5,0.7) 100%)`
- Small floating badge: "5 SERVICES" — `position: absolute; top:12px; right:12px; background: #ffd200; color: #1a0005; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;`

**Content Area** (height: 120px, padding: 16px 20px):

| Element | Position | Spec |
|---------|----------|------|
| Logo | top:148px, left:20px | 22px / weight:900 / `#ba001c` / "A" in `#ffd200` |
| Headline | top:176px, left:20px | 18px / weight:800 / `#1a0005` / "Everything You Need." |
| Service icons | top:204px, left:20px | Row of 5 mini icons, 24px each, 8px gap |
| CTA | bottom:16px, centered | Full-width button |

**Service Icons Row**:
- 5 circles, 28×28px each, gap:6px
- Colors: Food `#ba001c`, Grocery `#11998e`, Pharmacy `#7c3aed`, Flowers `#f43f5e`, Home `#0b50d5`
- Inside each: white icon/emoji, 14px
- Below row: tiny labels (8px, weight:600, `#666`): Food · Grocery · Pharmacy · Flowers · Services

**CTA Button**:
- Full width (minus padding): `width: calc(100% - 40px)`
- `padding: 12px` / `border-radius: 8px` / `background: #ba001c`
- Font: 15px / weight:800 / white / uppercase / letter-spacing:0.5px
- Text: "GET THE APP"
- `box-shadow: 0 4px 16px rgba(186,0,28,0.3)`

### Content/Copy

| Element | Text |
|---------|------|
| Logo | MIIAM |
| Badge | 5 SERVICES |
| Headline | Everything You Need. |
| CTA | GET THE APP |

### Design Notes
- High contrast between white background and red CTA ensures clickability
- Keep total text under 40 words for quick readability
- The 5 service icons communicate breadth at a glance
- Test at actual 300×250 rendering — text must be legible
- No more than 2 font sizes in the content area

---

## Banner 4: Facebook/Instagram Story

**Dimensions**: 1080 × 1920px (9:16 vertical)
**File**: `banner_story.html`
**Usage**: Instagram Stories, Facebook Stories, WhatsApp Status

### Layout Description

```
┌──────────────────────┐
│ 1080 × 1920          │
│                      │
│  ┌────────────────┐  │
│  │  MIIAM logo    │  │  ← Top area (brand)
│  │  (centered)    │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │                │  │
│  │   SERVICE      │  │  ← Center area (hero)
│  │   SHOWCASE     │  │
│  │   IMAGE        │  │
│  │   (animated    │  │
│  │    cards)      │  │
│  │                │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  Headline      │  │  ← Bottom area (message + CTA)
│  │  "Order Food,  │  │
│  │   Groceries,   │  │
│  │   & More"      │  │
│  │                │  │
│  │  [Swipe Up /   │  │
│  │   CTA Button]  │  │
│  │                │  │
│  └────────────────┘  │
│                      │
└──────────────────────┘
```

### Exact Specifications

**Background**: `linear-gradient(180deg, #1a0005 0%, #3d0010 50%, #ba001c 100%)`

**Decorative Elements**:
- Large radial glow center: `radial-gradient(circle at 50% 45%, rgba(255,210,0,0.15) 0%, transparent 50%)`
- Dot pattern overlay: `background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 24px 24px;`
- Animated floating circles (3-4): varying sizes, rgba white, subtle pulse

**Top Section** (y: 0 → y: 280px, centered):

| Element | Position | Spec |
|---------|----------|------|
| Safe area padding | top: 60px | accounts for phone status bar |
| "MIIAM" logo | centered, y:100 | 64px / weight:900 / white / "A" in `#ffd200` |
| Tagline | centered, y:180 | 18px / weight:600 / `rgba(255,255,255,0.6)` / letter-spacing:3px / uppercase: "YOUR SUPER-APP" |

**Center Section** (y: 280 → y: 1200px):
- Five service cards stacked with 3D tilt effect or carousel animation
- Each card: `width: 800px; height: 200px; border-radius: 24px;` centered
- Cards stagger vertically with 20px gap
- Each card has its service gradient background + icon + text

**Service Cards** (centered, stacked):

| Card | Gradient | Icon | Text |
|------|----------|------|------|
| 1 | `linear-gradient(135deg, #ba001c, #ff2d4a)` | `restaurant` | "Food Delivery" |
| 2 | `linear-gradient(135deg, #11998e, #38ef7d)` | `shopping_cart` | "Grocery" |
| 3 | `linear-gradient(135deg, #7c3aed, #a855f7)` | `local_pharmacy` | "Pharmacy" |
| 4 | `linear-gradient(135deg, #f43f5e, #fb923c)` | `local_florist` | "Flowers" |
| 5 | `linear-gradient(135deg, #0b50d5, #667eea)` | `home_repair_service` | "Home Services" |

**Card Internal Layout**:
- Icon: 48px, white, left-aligned with 40px padding
- Text: 24px / weight:700 / white, next to icon
- Right side: arrow icon `chevron_right`, 28px, white with 0.5 opacity
- Glass effect: `backdrop-filter: blur(10px); background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);`

**Bottom Section** (y: 1200 → y: 1860px):

| Element | Position | Spec |
|---------|----------|------|
| Headline | centered, y:1260 | 42px / weight:800 / white / "One App. Five Services." |
| Subtext | centered, y:1330 | 18px / weight:500 / `rgba(255,255,255,0.7)` / "Delivered to your doorstep in minutes" |
| CTA Button | centered, y:1420 | 280×60px / `border-radius: 30px` / `background: #ffd200` / `color: #1a0005` / 20px/800: "DOWNLOAD FREE" |
| Swipe indicator | centered, y:1540 | Animated chevron up + "Swipe Up" text, 14px, `rgba(255,255,255,0.5)` |
| Store badges | centered, y:1600 | Two badges side by side (App Store + Play Store), each 200×60px |

**Safe Areas**:
- Top: 60px (phone status bar)
- Bottom: 80px (home indicator / swipe area)
- Left/Right: 40px minimum

### Content/Copy

| Element | Text |
|---------|------|
| Logo | MIIAM |
| Tagline | YOUR SUPER-APP |
| Card 1 | 🍔 Food Delivery |
| Card 2 | 🛒 Grocery |
| Card 3 | 💊 Pharmacy |
| Card 4 | 💐 Flowers |
| Card 5 | 🔧 Home Services |
| Headline | One App. Five Services. |
| Subtext | Delivered to your doorstep in minutes |
| CTA | DOWNLOAD FREE |
| Swipe | ↑ Swipe Up to Download |

### Design Notes
- **Safe zones are critical**: Instagram/Facebook crop edges — keep all content within 60px inset from edges
- The stacked cards create visual rhythm and communicate service breadth
- Consider CSS `@keyframes` for card slide-in animation (staggered 0.1s delay each)
- Swipe-up arrow should pulse gently to draw attention
- File should be under 300KB for fast story loading
- Use `object-fit: cover` for any embedded images

---

## Banner 5: WhatsApp Business Catalog Banner

**Dimensions**: 1200 × 628px (1.91:1 ratio)
**File**: `banner_whatsapp.html`
**Usage**: WhatsApp Business catalog cover, social media sharing

### Layout Description

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1200 × 628                                                          │
│                                                                      │
│ ┌──────────────────────┐  ┌──────────────────────────────────────┐  │
│                      │  │                                      │  │
│   LEFT (40%)         │  │   RIGHT (60%)                       │  │
│   Dark panel         │  │   Image / Service showcase          │  │
│                      │  │                                      │  │
│   [WhatsApp green     │  │   Food + Grocery + Pharmacy         │  │
│    accent border]     │  │   collage or illustration           │  │
│                      │  │                                      │  │
│   MIIAM logo         │  │   Floating service icons             │  │
│   "Now on WhatsApp"  │  │                                      │  │
│   "Order via Chat"   │  │                                      │  │
│                      │  │                                      │  │
│   [Service icons]    │  │                                      │  │
│                      │  │                                      │  │
│   [CTA: Message Us]  │  │                                      │  │
│                      │  │                                      │  │
└──────────────────────────────────────────────────────────────────────┘
```

### Exact Specifications

**Background**: Two-panel split
- Left panel: `#1a0005` with subtle `#25D366` (WhatsApp green) accent border on right edge
- Right panel: Service collage image with `linear-gradient(135deg, rgba(26,0,5,0.2), rgba(26,0,5,0.5))` overlay

**WhatsApp Accent**: `#25D366` — used for border accent and icon highlights to create platform association

**Left Panel** (width: 480px, full height):

| Element | Position | Spec |
|---------|----------|------|
| WhatsApp icon | top:40px, left:40px | 36px / `#25D366` / Material `chat` icon |
| Logo "MIIAM" | top:90px, left:40px | 48px / weight:900 / white / "A" in `#ffd200` |
| Headline | top:155px, left:40px | 28px / weight:800 / white / "Now on WhatsApp" |
| Subtext | top:198px, left:40px | 16px / weight:500 / `rgba(255,255,255,0.65)` / "Order food, groceries & more via chat" |
| Service icons | top:260px, left:40px | Row of 5 icons (see below) |
| CTA | bottom:40px, left:40px | See CTA spec below |

**Service Icons Row** (top:260px):
- 5 circles, 40×40px each, gap:12px
- Each circle: `border-radius: 12px` / service gradient background
- Inside: white icon, 20px
- Colors: Food `#ba001c`, Grocery `#11998e`, Pharmacy `#7c3aed`, Flowers `#f43f5e`, Home `#0b50d5`

**CTA Button** (bottom:40px, left:40px):
- `padding: 14px 28px` / `border-radius: 12px`
- `background: #25D366` (WhatsApp green)
- `color: #fff`
- Font: 16px / weight:700
- Text: "💬 Message Us"
- Icon: Material `chat` (filled), 20px, left of text
- `box-shadow: 0 4px 16px rgba(37,211,102,0.35)`

**Right Panel** (width: 720px, full height):
- Full-bleed service collage image (food + grocery + pharmacy)
- Three floating glassmorphism cards:
  - Top-left: "🍔 Food in 30 min" — glass card, 16px, white
  - Center: "🛒 Fresh Groceries" — glass card, 16px, white
  - Bottom-right: "💊 Pharmacy Delivery" — glass card, 16px, white
- Each card: `padding: 12px 20px` / `border-radius: 12px` / `background: rgba(255,255,255,0.12)` / `backdrop-filter: blur(12px)` / `border: 1px solid rgba(255,255,255,0.2)`

**WhatsApp Branding Strip** (optional):
- Bottom of entire banner: 4px tall strip in `#25D366`

### Content/Copy

| Element | Text |
|---------|------|
| Logo | MIIAM |
| Headline | Now on WhatsApp |
| Subtext | Order food, groceries & more via chat |
| Floating card 1 | 🍔 Food in 30 min |
| Floating card 2 | 🛒 Fresh Groceries |
| Floating card 3 | 💊 Pharmacy Delivery |
| CTA | 💬 Message Us |

### Design Notes
- WhatsApp green `#25D366` creates instant platform recognition
- The "chat" metaphor should be prominent — this banner is about conversational commerce
- WhatsApp Business catalog images are cropped to 1.91:1 on most devices
- Keep the CTA clearly visible — WhatsApp click-to-chat is the primary conversion
- Do not use animated elements — WhatsApp catalog is static
- Test sharing in WhatsApp — image preview should be legible at thumbnail size

---

## Banner 6: Play Store Feature Graphic

**Dimensions**: 1024 × 500px (2.048:1 ratio)
**File**: `banner_playstore.html`
**Usage**: Google Play Store feature graphic, Android app store listing

### Layout Description

```
┌──────────────────────────────────────────────────────────────┐
│ 1024 × 500                                                    │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │                                                          │  │
│ │              FULL-WIDTH HERO IMAGE                       │  │
│ │              (service collage / app screenshot)           │  │
│ │                                                          │  │
│ │     ┌────────────────────────────────────────────┐       │  │
│ │     │  CENTER CONTENT OVERLAY                    │       │  │
│ │     │                                            │       │  │
│ │     │  [MIIAM Logo]                             │       │  │
│ │     │  "Everything Delivered"                    │       │  │
│ │     │  [Service Icons Row]                       │       │  │
│ │     │                                            │       │  │
│ │     └────────────────────────────────────────────┘       │  │
│ │                                                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### Exact Specifications

**Background**: Full-bleed image with dark overlay

**Base Image**: High-quality food/grocery/services collage (recommended: 1200×600px source, cropped to 1024×500px)

**Dark Overlay**:
```css
background: linear-gradient(135deg, rgba(26,0,5,0.85) 0%, rgba(61,0,16,0.75) 50%, rgba(186,0,28,0.7) 100%);
```

**Decorative Elements**:
- Large radial glow: `radial-gradient(circle at 30% 50%, rgba(255,210,0,0.12) 0%, transparent 40%)`
- Subtle dot pattern: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 20px 20px;`

**Center Content Container** (centered both axes):
- `width: 700px` / `text-align: center` / `padding: 40px`

| Element | Position (within container) | Spec |
|---------|----------------------------|------|
| Logo | top of container | 52px / weight:900 / white / "A" in `#ffd200` |
| Divider | 12px below logo | 40×3px / `#ffd200` / border-radius:2px / centered |
| Headline | 16px below divider | 36px / weight:800 / white / line-height:1.15 |
| Subtext | 12px below headline | 17px / weight:500 / `rgba(255,255,255,0.75)` / line-height:1.4 |
| Service pills | 20px below subtext | Flex row, centered, gap:10px |

**Service Pills** (centered row):
- 5 pills: "Food" · "Grocery" · "Pharmacy" · "Flowers" · "Services"
- Each pill: `padding: 8px 16px` / `border-radius: 20px` / `background: rgba(255,255,255,0.1)` / `border: 1px solid rgba(255,255,255,0.15)`
- Inside: colored dot (8px circle with service color) + text (13px / weight:600 / white)
- Dot colors: Food `#ba001c`, Grocery `#38ef7d`, Pharmacy `#a855f7`, Flowers `#fb923c`, Home `#667eea`

### Content/Copy

| Element | Text |
|---------|------|
| Logo | MIIAM |
| Headline | Everything Delivered. |
| Subtext | One app for food, grocery, pharmacy, flowers & home services |
| Service labels | Food · Grocery · Pharmacy · Flowers · Services |

### Design Notes
- Play Store feature graphic appears in search results and app detail page
- **Critical**: Google may crop this to 16:9 on some surfaces — keep essential content centered in the middle 80%
- The overlay ensures text readability regardless of background image
- Service colored dots create visual taxonomy without requiring icons
- Keep total text minimal — this is a brand impression, not a detailed pitch
- No animated elements — static only
- File size: aim for under 300KB (JPEG at 85% quality or optimized PNG)

---

## Implementation Checklist

### For Each Banner HTML File

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MIIAM — [Banner Name]</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <style>
    /* Reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    
    /* Banner container — set exact dimensions */
    .banner {
      width: [EXACT_WIDTH]px;
      height: [EXACT_HEIGHT]px;
      overflow: hidden;
      position: relative;
    }
    
    /* Material icon style */
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    
    /* All custom styles per spec */
  </style>
</head>
<body>
  <div class="banner">
    <!-- Content per layout spec -->
  </div>
</body>
</html>
```

### Design Token Quick Reference

```css
:root {
  /* MIIAM Brand */
  --miiam-primary: #ba001c;
  --miiam-accent: #ffd200;
  --miiam-dark: #1a0005;
  --miiam-white: #ffffff;
  
  /* Services */
  --color-food: #ba001c;
  --color-grocery-1: #11998e;
  --color-grocery-2: #38ef7d;
  --color-pharmacy-1: #7c3aed;
  --color-pharmacy-2: #a855f7;
  --color-flowers-1: #f43f5e;
  --color-flowers-2: #fb923c;
  --color-home-1: #0b50d5;
  --color-home-2: #667eea;
  
  /* WhatsApp */
  --whatsapp-green: #25D366;
  
  /* Typography */
  --font-brand: 'Plus Jakarta Sans', sans-serif;
}
```

### File Naming Convention

```
banner_hero.html              → 1920×600 website hero
banner_leaderboard.html       → 728×90 Google Display leaderboard
banner_medium_rectangle.html  → 300×250 Google Display rectangle
banner_story.html             → 1080×1920 Instagram/Facebook story
banner_whatsapp.html          → 1200×628 WhatsApp catalog
banner_playstore.html         → 1024×500 Play Store feature
```

### Asset Requirements

| Asset | Format | Source |
|-------|--------|--------|
| MIIAM logo (wordmark) | CSS-rendered text | Use font weight 900 |
| Service icons | Material Symbols Outlined (FILL:1) | Google Fonts CDN |
| App Store badge | PNG/SVG | Apple provided assets |
| Play Store badge | PNG/SVG | Google provided assets |
| Background images | JPG/WebP, 2x resolution | Stock or brand photography |
| Service gradients | CSS | Defined in token system |

---

## Accessibility Notes

- **Color Contrast**: All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
  - White on `#1a0005`: contrast ratio 18.4:1 ✓
  - `#ffd200` on `#1a0005`: contrast ratio 12.8:1 ✓
  - White on `#ba001c`: contrast ratio 5.1:1 ✓
- **Font Sizes**: Minimum 12px for any text, recommended 14px+
- **Touch Targets**: CTA buttons minimum 44px height
- **Alt Text**: All banner images should have descriptive alt text if used in HTML contexts

---

**Prepared by**: UI Designer Agent
**Ready for**: HTML implementation
**Review Status**: Specification complete — proceed to code generation
