---
name: MIIAM Editorial Food-First
colors:
  surface: '#fff8f7'
  surface-dim: '#f2d3d0'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ef'
  surface-container: '#ffe9e7'
  surface-container-high: '#ffe2df'
  surface-container-highest: '#fbdbd8'
  on-surface: '#281716'
  on-surface-variant: '#5c403d'
  inverse-surface: '#3f2c2a'
  inverse-on-surface: '#ffedeb'
  outline: '#916f6c'
  outline-variant: '#e5bdba'
  surface-tint: '#bf071f'
  primary: '#8d0013'
  on-primary: '#ffffff'
  primary-container: '#ba001c'
  on-primary-container: '#ffc6c2'
  inverse-primary: '#ffb3ae'
  secondary: '#0c50d5'
  on-secondary: '#ffffff'
  secondary-container: '#386bef'
  on-secondary-container: '#fefcff'
  tertiary: '#004678'
  on-tertiary: '#ffffff'
  tertiary-container: '#005e9f'
  on-tertiary-container: '#b7d6ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ae'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930014'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b5c4ff'
  on-secondary-fixed: '#00174c'
  on-secondary-fixed-variant: '#003dab'
  tertiary-fixed: '#d1e4ff'
  tertiary-fixed-dim: '#9fcaff'
  on-tertiary-fixed: '#001d36'
  on-tertiary-fixed-variant: '#00497d'
  background: '#fff8f7'
  on-background: '#281716'
  surface-variant: '#fbdbd8'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 4.5rem
    fontWeight: '800'
    lineHeight: '0.9'
    letterSpacing: -0.05em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 3rem
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '900'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '500'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '900'
    lineHeight: '1.0'
    letterSpacing: 0.3em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container-max: 80rem
  section-gap: 6rem
  element-gap: 2rem
  card-padding: 2rem
  safe-margin: 2rem
---

## Brand & Style
MIIAM is a high-energy, "food-first" super-app designed to evoke immediate cravings and a sense of hyper-local urgency. The brand personality is bold, optimistic, and premium, targeting urban dwellers who value both speed and quality.

The design style is **Editorial Modern with Glassmorphism**. It combines the massive, high-contrast typography of a lifestyle magazine with functional digital layers. It utilizes heavy background blurs (backdrop-filter), vibrant color blocking, and "text-glow" effects to create a cinematic atmosphere. The UI feels alive through the use of subtle animations (pulse, bounce) and deep, tinted shadows that suggest physical objects resting on a soft surface.

## Colors
The palette is dominated by a "Vibrant Crimson" (#BA001C) which stimulates appetite and urgency. This is balanced against a warm, tinted neutral "Warm Bone" (#FFF4F4) for surfaces, rather than pure white, to maintain a premium, organic feel. 

Dark modes are not used as a global toggle here; instead, high-contrast dark sections (Slate 900/950) are used as functional "zones" for services or secondary information to provide visual rest from the intense primary red. Named tokens like `primary-container` are used for celebratory or promotional states.

## Typography
The system uses **Plus Jakarta Sans** exclusively to maintain a friendly yet professional geometric look. The hierarchy is extremely aggressive: Display styles use tight line-heights (0.9) and negative letter-spacing to create a "wall of text" impact common in editorial design. 

A specific "Label Caps" style is used for micro-copy and tags to provide a sophisticated, metadata-like feel. Text shadows (text-glow) are applied to light text over busy photographic backgrounds to ensure legibility without heavy overlays.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The main content is capped at a 1280px (80rem) max-width, but sections (like the Hero) utilize split-screen layouts that bleed to the edges of the viewport to create an immersive experience.

A 4px baseline grid is used, with a preference for large, "airy" spacing between major sections (96px+) to emphasize the premium nature of the brand. Feature strips and promotional blocks use negative margins (e.g., -48px) to overlap sections, creating a sense of layered depth.

## Elevation & Depth
Hierarchy is established through **Layered Glassmorphism** and **Tinted Ambient Shadows**. 

1.  **Floating Elements:** Use a backdrop-filter of 20px blur and a 10% white opacity fill with a thin 1px white border.
2.  **Editorial Shadows:** Instead of neutral gray shadows, use a deep, low-opacity shadow tinted with the `on-surface` color (`rgba(77, 33, 42, 0.06)`). These should have a high blur radius (40px+) and a significant vertical offset (20px+) to simulate natural lighting.
3.  **Active Depth:** Elements should scale (95%) when interacted with, rather than just changing color, to provide tactile feedback.

## Shapes
The shape language is **Ultra-Rounded (Pill-Style)**. 
- Standard buttons and cards use a 1rem (16px) radius.
- Large containers and promotional "Hero" cards use a 2rem (32px) or 3rem (48px) radius.
- Decorative tags and action buttons for "View More" often use fully rounded (9999px) pill shapes.
This extreme roundness softens the aggressive typography and makes the app feel approachable and "organic."

## Components
- **Buttons:** Primary buttons are large, using high-saturation backgrounds and bold white text. Secondary buttons over photographic backgrounds must use backdrop-blur and semi-transparent fills.
- **Cards (Editorial):** Cards should prioritize imagery. Text is placed in high-contrast padding areas below the image. Use "Editor's Choice" tags (Label Caps) positioned in the top-left or overlapping the image-to-text transition.
- **Chips/Tags:** Tiny, high-contrast badges with heavy letter-spacing. Use `primary-container` for value-based tags (e.g., "50% OFF") and `on-surface` for functional tags.
- **Iconography:** Use Material Symbols (Outlined) with a custom weight of 400. Important icons should use a "Fill" state of 1 to create a focal point.
- **Service Blocks:** Use dark-themed blocks (Slate 900) with thin white-border buttons to distinguish non-food services from the primary food flow.