# Design System Document: The Kinetic Dual-Experience

## 1. Overview & Creative North Star
### Creative North Star: "The Dynamic Bipolarity"
This design system rejects the "one-size-fits-all" utility of standard super-apps. Instead, it embraces an editorial, split-personality aesthetic that shifts tone based on user intent. We move away from the rigid, boxed-in templates of the past toward a **Kinetic Bipolarity**—where the UI is divided into two energetic halves: a visceral, warm red for appetite and consumption, and a deep, structural blue for trust and service. 

The system utilizes high-contrast typography, floating glassmorphism, and intentional asymmetry to create a sense of constant motion. It feels less like a utility and more like a premium concierge.

---

## 2. Colors
Our palette is a dialogue between two dominant forces. Balance is achieved through a sophisticated "warm-neutral" base that prevents the high-contrast primaries from feeling overwhelming.

### The Core Palette
- **Primary (Food):** `#ba001c` (Primary) / `#ff7670` (Container). This is our "Appetite Red." Use it to drive urgency and desire.
- **Secondary (Services):** `#0b50d5` (Secondary) / `#c4d0ff` (Container). This is our "Trust Blue." Use it for professional interactions and long-term utility.
- **Surface Base:** `#fff4f4` (Surface). A slightly tinted off-white that feels softer and more premium than pure hex `#ffffff`.

### The "No-Line" Rule
**Borders are forbidden for sectioning.** We do not use 1px lines to separate content. Boundaries must be defined through:
1.  **Background Shifts:** Transitioning from `surface` to `surface-container-low`.
2.  **Negative Space:** Using the spacing scale to create clear mental models of separation.
3.  **Tonal Blocking:** Large blocks of `primary` or `secondary` colors meeting the neutral background.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack.
- **Background:** `surface` (#fff4f4).
- **Secondary Grouping:** `surface-container` (#ffe1e4).
- **Individual Cards:** `surface-container-lowest` (#ffffff).
This "Nesting" creates a natural, soft depth that feels architectural rather than flat.

### The "Glass & Gradient" Rule
To elevate the "Super-App" beyond a generic portal, use **Glassmorphism** for floating elements. 
- Use semi-transparent versions of `surface_container` with a `backdrop-blur` of 20px–40px.
- Use subtle linear gradients (e.g., `primary` to `primary_container`) on hero CTAs to add a "liquid" soul to the interface.

---

## 3. Typography
We use **Plus Jakarta Sans** as our signature typeface. It provides a modern, geometric clarity with a friendly, open-curved personality.

| Role | Font Size | Weight | Intent |
| :--- | :--- | :--- | :--- |
| **Display-LG** | 3.5rem | 800 (Bold) | Hero headlines, high-impact branding. |
| **Headline-MD** | 1.75rem | 700 (Bold) | Section starters, "Popular Near You." |
| **Title-MD** | 1.125rem | 600 (Semi-bold) | Card titles, prominent labels. |
| **Body-LG** | 1.0rem | 400 (Regular) | Primary reading text, descriptions. |
| **Label-MD** | 0.75rem | 500 (Medium) | Navigation tabs, small metadata. |

**Editorial Note:** Use tight letter-spacing (-0.02em) for Display and Headline styles to create a "locked-in," professional editorial feel.

---

## 4. Elevation & Depth
We reject the standard Material Design shadow. Depth is an atmosphere, not a drop-shadow.

- **Tonal Layering:** 90% of depth should be achieved by placing a `surface-container-lowest` card on a `surface-container-low` background.
- **Ambient Shadows:** When an object must "float" (like the glass bubbles), use a diffused shadow: `0px 20px 40px rgba(77, 33, 42, 0.06)`. Note the shadow is a tinted version of `on-surface`, not pure black.
- **The "Ghost Border":** For high-density areas where containment is strictly required, use `outline-variant` (#dd9ca6) at 20% opacity. 
- **Glassmorphism:** Floating emoji bubbles must use a `backdrop-filter: blur(12px)` and a thin, 1px white border at 10% opacity to catch the "light" at the edges.

---

## 5. Components

### Buttons
- **Primary:** `ROUND_XL` (3rem) corner radius. Use the Red-to-Red_Container gradient. White text. Large padding (1.5rem horizontal).
- **Secondary:** `ROUND_XL`. White background, `secondary` (Blue) text, and a ghost border.
- **Glass Floating:** For category selectors, use a glass-morphic background with an emoji and `label-md` text.

### Feature Cards
- **Construction:** No borders. `ROUND_LG` (2rem) corners. 
- **Header:** Large, vibrant icons or emojis centered in a `surface-container-highest` circular background.
- **Separation:** Forbid dividers. Use 24px–32px of vertical white space to separate the header from the card content.

### Inputs
- **Style:** `ROUND_MD` (1.5rem). Use `surface-container-lowest` as the fill. 
- **States:** On focus, the background remains, but a 2px `primary` or `secondary` ghost border appears at 40% opacity.

---

## 6. Do's and Don'ts

### Do:
- **Do use "Split-Screen" Layouts:** Visually divide the landing experience down the center to represent the two core verticals (Food vs. Service).
- **Do use Floating Emojis:** Use them as "kinetic debris"—floating around hero sections to add playfulness.
- **Do use Massive Whitespace:** High-end design breathes. Give your headers room to "own" the screen.

### Don't:
- **Don't use 1px Solid Lines:** They make the app look like a legacy spreadsheet. Use color blocks instead.
- **Don't use Pure Black (#000):** Use `on-surface` (#4d212a) for text to maintain the sophisticated, warm tonal palette.
- **Don't use Small Corner Radii:** Avoid `sm` or `none` unless for tiny technical details. The brand is "friendly and energetic"—use `lg` and `xl`.
- **Don't Over-shadow:** If everything has a shadow, nothing is important. Reserve shadows for floating action items and the top-most layer of glassmorphism.