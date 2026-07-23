# Combo Meals Menu Images

Professional menu card designs for combo meals with clean white background aesthetic.

## Design System

| Element | Value |
|---------|-------|
| Background | `#ffffff` (Pure White) |
| Primary Color | `#ff6b35` (Orange) |
| Success Color | `#16a34a` (Green) |
| Font Primary | Playfair Display (Headings) |
| Font Secondary | DM Sans (Body) |
| Border Radius | 20px |
| Card Size | 820 x 520px |

## Files

| File | Description |
|------|-------------|
| `veg-steamed-momo-masala-coke.html` | Source HTML template |
| `veg-steamed-momo-masala-coke.png` | Generated PNG image |
| `capture.js` | Playwright screenshot script |
| `convert-to-png.sh` | Shell wrapper for batch conversion |

## Current Combos

| Combo | Items | Price |
|-------|-------|-------|
| Veg Steamed Momos + Masala Coke | 10 pcs momos + Regular masala coke | ₹149 |

## How to Add New Combos

1. Duplicate `veg-steamed-momo-masala-coke.html`
2. Rename to `[combo-name].html`
3. Update SVG illustrations, names, quantities, and prices
4. Run: `google-chrome --headless --screenshot="[combo-name].png" --window-size=900,600 --default-background-color=FFFFFFFF "file://$(pwd)/[combo-name].html"`

## SVG Illustrations

The combo cards use inline SVGs for crisp rendering at any size:
- **Momos**: Steamed dumpling with pleats, steam lines, and garnish
- **Masala Coke**: Glass with brown liquid, ice cubes, striped straw, and bubbles

To replace with actual product photos, swap the `<svg>` elements with `<img>` tags pointing to your product photography.
