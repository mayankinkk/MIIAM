# MIIAM - Super App

A feature-rich food delivery and services super-app inspired by Zomato/Swiggy.

## Features

### User App Features
- **Search & Discovery** - Veg Mode, Dietary Filters, Cuisine/Price Filters, AI Recommendations
- **Restaurant Details** - Menu viewing, Photo Gallery, Ratings & Reviews
- **Shopping Cart & Checkout** - Order Scheduling (Pre-order), Delivery Instructions, Multiple Payment Methods
- **Order Tracking** - Real-time tracking, Detailed status updates
- **Quick Commerce** - MIIAM Instamart (Grocery 10-min delivery)
- **Loyalty Program** - MIIAM Gold (Points, Tiers, Rewards)
- **Wallet** - MIIAM Wallet with credits, transaction history
- **Food on Train** - IRCTC delivery to train seats
- **Gift Cards** - Buy & redeem gift cards
- **Table Reservation** - Dineout with up to 50% off
- **Live Support** - 24/7 customer chat
- **Reorder** - Quick reorder with quantity adjustment
- **Digital Receipt** - Download PDF, Share, Email receipt
- **Settings** - Sound notifications, Push notifications, Location services

### Rider App Features
- Rider Login & Dashboard
- Order Acceptance
- Earnings Dashboard (Daily/Weekly/Monthly)
- Delivery History

### Admin Features
- Vendor Management
- Menu Management
- POS Integration (PetPooja, UrbanPiper, Restroworks)
- Multi-outlet Support
- Coupon Management
- Analytics & Reports

## Project Structure

```
MIIAM Final UI/
├── checkout/              # Checkout page with scheduling, delivery instructions
├── search_discovery/     # Search with veg mode, filters, AI recommendations
├── order_tracking/       # Order tracking UI
├── miiam_instamart/      # Quick commerce (grocery delivery)
├── miiam_gold/           # Loyalty program
├── miiam_wallet/         # Wallet & payments
├── food_on_train/        # IRCTC train delivery
├── gift_cards/           # Gift card system
├── table_reservation/   # Dineout reservations
├── live_support/         # Customer support chat
├── rider_earnings/       # Rider earnings dashboard
├── admin_analytics/      # Admin analytics
├── admin_menu_management/ # Menu management
├── admin_coupons/        # Coupon management
├── settings/             # App settings
└── *.html                # Various UI screens
```

## Design System

- **Colors**: Primary Red (#ba001c), Secondary Blue (#0b50d5), Tertiary Gold (#ffd709)
- **Typography**: Plus Jakarta Sans
- **Style**: Kinetic Bipolarity - Red for food, Blue for services

## Deployment

Deploy to any static hosting:

### GitHub Pages
```bash
# Push to GitHub and enable Pages in settings
```

### Netlify
1. Connect repo to Netlify
2. Deploy folder: `Final` or root
3. Auto-detects static HTML

### Vercel
```bash
npm i -g vercel
vercel
```

## Tech Stack

- HTML5, CSS3, Tailwind CSS
- Vanilla JavaScript
- Material Symbols Icons
- Google Fonts (Plus Jakarta Sans)

## Getting Started

Simply open any `.html` file in a browser to view the UI.

## License

MIT