# MIIAM - Super App

A comprehensive food delivery and lifestyle services super-app inspired by Zomato and Swiggy. MIIAM offers a complete ecosystem for food delivery, grocery delivery, table reservations, and more - all in one unified platform.

---

## About MIIAM

MIIAM is a feature-rich super-app that combines the best of food delivery, quick commerce, and lifestyle services. With a unique "Kinetic Bipolarity" design system featuring a visceral red for food/consumption and a deep blue for trust/services, MIIAM delivers a premium concierge experience.

### Key Differentiators
- **Dual Experience**: Food (Red) + Services (Blue) unified in one app
- **10-Minute Delivery**: Quick commerce via MIIAM Instamart
- **Gold Loyalty**: Tiered rewards program with exclusive benefits
- **Train Delivery**: Food delivery to your train seat
- **Table Reservations**: Dineout with up to 50% discount

---

## Complete Feature List

### 1. Search & Discovery (search_discovery/code.html)

The main discovery page with multiple filtering and recommendation systems.

**Features:**
- **Veg Mode Toggle**: One-click filter for vegetarian-only restaurants/foods with green icon indicator
- **Dietary Filters**: Dropdown with options for Vegan, Gluten-Free, Nut-Free, Halal, Jain, Keto, High Protein
- **Cuisine Filters**: Horizontal scrollable pills for North Indian, South Indian, Chinese, Pizza, Burgers, Biryani, Desserts, Street Food
- **Price Filters**: $ (Budget), $$ (Medium), $$$ (Premium) toggle buttons
- **Active Filter Tags**: Dynamic tags showing active filters with remove option
- **AI Recommendations**: Personalized "Based on your taste" section showing restaurants similar to previous orders
- **Trending This Week**: AI-powered trending items section
- **Category Chips**: Glassmorphism-style floating category selectors (Momos, Chai, Snacks, Noodles, Desserts, Burgers)
- **Location-based search**: Distance, Rating, Price filters in header
- **Vendor Cards**: Bento grid with vendor images, ratings, delivery time, distance

### 2. Order Scheduling / Pre-order (checkout/code.html)

Schedule orders for future delivery - perfect for planning meals in advance.

**Features:**
- **Deliver Now / Schedule Later Toggle**: Switch between immediate delivery and scheduled
- **Date Selection**: Today, Tomorrow, Custom date picker
- **Time Slots**: ASAP (30 min), 1 Hour, 2 Hours, Lunch (12-2 PM), Dinner (7-9 PM), Custom Time
- **Custom DateTime Picker**: Native date-time input for specific scheduling
- **Schedule Summary Display**: Shows selected delivery time in real-time

### 3. Loyalty Program - MIIAM Gold (miiam_gold/code.html)

A comprehensive tiered loyalty program similar to Swiggy One / Zomato Gold.

**Features:**
- **Points Balance Display**: Shows current points (2,450) and tier status
- **Membership Tiers**: Silver (0-1,000 pts), Gold (1,000-5,000 pts), Platinum (5,000+ pts)
- **Current Tier Highlight**: Gold tier highlighted with "CURRENT" badge
- **Tier Benefits**:
  - Silver: 5% off, Free delivery (3km), Birthday rewards
  - Gold: 15% off, Free delivery (7km), Priority support, Exclusive deals, Early access
  - Platinum: 30% off, Unlimited free delivery, Personal concierge, Free reservations, Event access
- **Benefits Grid**: Visual icons for Free Delivery, 15% Off, Priority Support, Exclusive Deals
- **Points History**: Transaction log showing earned/redeemed points
- **Earn More Section**: Ways to earn points (Referral: 500pts, Reviews: 50pts, Birthday: 2x)
- **Exclusive Offers**: Gold-only deals like 50% off at premium restaurants, free delivery (10km)

### 4. Quick Commerce - MIIAM Instamart (miiam_instamart/code.html)

Grocery and essential delivery in 10 minutes - similar to Swiggy Instamart / Blinkit.

**Features:**
- **Delivery Promise Banner**: "Delivery in 10 minutes" with green branding
- **Search with Popular Searches**: Milk, Bread, Eggs, Chips, Coffee, Water
- **Category Pills**: Vegetables, Fruits, Dairy, Bread, Snacks, Beverages, Personal Care, Rice & Dal
- **Products Grid**: Each product shows image, 10-min badge, name, weight, price, ADD button
- **Section Categories**: Essential Groceries, Fresh Fruits & Vegetables, Snacks & Beverages, Personal Care
- **Floating Cart**: Bottom-right cart button showing item count and total
- **10-Min Delivery Badge**: Green "10 min" tag on all products

### 5. Reorder Quick Action (order_history_details/code.html)

Quick reorder from previous orders with quantity adjustment.

**Features:**
- **Quick Reorder Section**: List of items from last order with quantity +/- buttons
- **Item Images**: Product thumbnails with names and prices
- **Dynamic Price Update**: Total updates as quantities change
- **Buy Again Suggestions**: Horizontal scroll of items from other previous orders
- **One-Click Add**: Add buttons for quick reorder

### 6. Delivery Instructions (checkout/code.html)

Specific instructions for delivery partners - leave at door, ring bell, etc.

**Features:**
- **Delivery Options Grid**: 4 clickable options with icons
  - Leave at Door (default selected)
  - Ring Bell
  - Call Before Delivery
  - Leave with Security
- **Custom Notes**: Text area for additional instructions
- **Visual Selection State**: Selected option highlighted with primary color

### 7. AI Recommendations (search_discovery/code.html)

Personalized recommendations powered by AI.

**Features:**
- **"Based on your taste" Section**: Shows restaurants matching user preferences
- **"Trending this week" Section**: Popular items with fire emoji indicators
- **Contextual Suggestions**: "You loved momos last week", "Similar to your order"

### 8. Wallet / Credits (miiam_wallet/code.html)

Digital wallet system for storing money and payments.

**Features:**
- **Balance Display**: Large balance amount with wallet icon
- **Quick Actions**: Add Money, Send buttons
- **Quick Action Icons**: Scan QR, UPI ID, Gift Card, History
- **Transaction History**: List of transactions with icons (+ for credit, - for debit)
- **Transaction Types**: Added via UPI, Restaurant orders, Cashback rewards
- **Saved Payment Methods**: Credit card (default), UPI with edit options
- **Add Payment Method**: Button to add new payment options

### 9. Food on Train (food_on_train/code.html)

Order food delivery to your train seat - similar to Zomato/Swiggy's train service.

**Features:**
- **Hero Banner**: "Food on Train" with train icon and station count (130+)
- **PNR Input**: 10-digit PNR number input field
- **Train Number Input**: Alternative train number entry
- **Search Button**: Search orders by PNR/Train number
- **Recent Journeys**: Previous train trips with PNR numbers
- **Popular Stations**: Quick-select station buttons (Delhi, Mumbai, Kolkata, Chennai, Bangalore, Hyderabad)
- **How It Works**: 3-step visual (Enter PNR → Choose Food → Get at Seat)
- **Popular Train Food**: Grid of biryani, thali, paratha with prices and delivery time

### 10. Gift Cards (gift_cards/code.html)

Buy and send gift cards for food.

**Features:**
- **Gift Card Designs**: Birthday, Celebration, Thank You, Love themed cards
- **Pre-set Amounts**: ₹500, ₹1,000, ₹2,000 with ₹1,000 as default
- **Custom Amount**: Input field for custom value (₹100 - ₹10,000)
- **Recipient Details**: Name and custom message input
- **My Gift Cards**: List of owned gift cards with balance and redeem option

### 11. Table Reservation / Dineout (table_reservation/code.html)

Reserve tables at restaurants with discounts - similar to Swiggy Dineout.

**Features:**
- **Dineout Hero**: "Get up to 50% OFF" banner with restaurant icon
- **Restaurant Search**: Search input with category filters (Fine Dining, Casual, Cafe, Bar)
- **Restaurant Cards**: List with images, deal badge (40%, 30%, 25% OFF), name, cuisine, rating
- **Quick Booking Form**: Date, Time, Number of Guests selectors
- **Booking Button**: "Book Table" CTA on each restaurant
- **Upcoming Reservations**: Empty state showing no current reservations

### 12. Restaurant Photo Gallery (restaurant_photo_gallery/code.html)

View all restaurant photos in different categories.

**Features:**
- **Category Tabs**: All (48), Food (24), Ambience (12), Reviews (12)
- **Photo Grid**: 3-column masonry layout with images
- **View All Button**: Navigate to full gallery
- **Category-based Filtering**: Filter by food, ambience, or reviews

### 13. Live Support Chat (live_support/code.html)

24/7 customer support chat interface.

**Features:**
- **Chat Header**: MIIAM Support title with "Online" green indicator
- **Message Bubbles**: AI support messages with avatar, user messages aligned right
- **Quick Reply Options**: Track Order, Cancel Order, Refund Status, Talk to Agent buttons
- **Message Input**: Text input with add attachment button
- **Send Button**: Primary colored send icon
- **Quick Help Categories**: Icons for Orders, Payments, Wallet, General support

### 14. Digital Receipt (order_history_details/code.html)

Download, share, or email order receipts.

**Features:**
- **Receipt Card**: Shows Order ID, Date, Amount, Paid status
- **Download PDF Button**: Downloads receipt as PDF file
- **Share Button**: Uses Web Share API or fallback alert to share
- **Email Receipt Button**: Sends receipt to registered email
- **Payment Status Badge**: "Paid" green badge indicator

### 15. Sound Notifications (settings/code.html)

Configure app sounds and notification alerts.

**Features:**
- **Sound & Noise Toggle**: Master sound on/off switch
- **Order Status Alerts Toggle**: Separate toggle for order update sounds
- **Visual Indicators**: Gold (tertiary) toggle colors
- **Description Text**: Explains what each setting controls

### 16. Additional Settings Features

**Push Notifications** (settings/code.html)
- Toggle for order updates, promotions, alerts

**Location Services** (settings/code.html)
- Toggle for location access

**Dark Mode** (settings/code.html)
- Dark/light theme toggle with "system" fallback

---

## Rider App Features

### 17. Rider Earnings Dashboard (rider_earnings/code.html)

Complete earnings overview for delivery partners.

**Features:**
- **Total Earnings Display**: Large amount with gradient background
- **Withdraw & History Buttons**: Quick actions
- **Quick Stats**: Today (₹450), This Week (₹2,100), This Month (₹8,450)
- **Delivery Stats Grid**: Total deliveries (156), Average time (22 min)
- **Earnings History List**: Individual deliveries with location, amount earned
- **Active Incentives**: Peak Hour Bonus showing extra earnings
- **Bottom Nav**: Home, Orders, Earnings, Profile

### 18. Rider Login (rider_login/code.html)
- Login form with phone/email and password
- Forgot password link

### 19. Rider App Interface (rider_app_interface/code.html)
- Accept/Decline order buttons
- Delivery details with customer address
- Customer contact options

### 20. Rider Dashboard (rider app dash/code.html)
- Order statistics
- Today's earnings summary

---

## Admin Features

### 21. Analytics & Reports (admin_analytics/code.html)

Comprehensive admin dashboard with key metrics.

**Features:**
- **Stats Cards Grid**: Revenue (₹12.5L), Orders (1,234), Active Users (5,678), Vendors (89)
- **Growth Indicators**: Percentage changes with up/down arrows
- **Revenue Chart**: 7-day bar chart visualization
- **Top Vendors List**: Ranked by orders and revenue
- **Recent Orders Feed**: Live order status updates with color-coded badges

### 22. Menu Management (admin_menu_management/code.html)

Restaurant menu item management.

**Features:**
- **Category Tabs**: All, Burgers, Pizza, Beverages, Sides with counts
- **Menu Item Cards**: Image, name, description, price, Edit/Delete actions
- **Add Item Button**: Create new menu item

### 23. POS Integration (admin_pos_integration/code.html)

Connect with restaurant POS systems.

**Features:**
- **POS Options Grid**: PetPooja, UrbanPiper, Restroworks with logos
- **Connect Buttons**: Integration action for each POS
- **Connected Status**: Shows currently connected POS with branch info

### 24. Multi-outlet Support (admin_multioutlet/code.html)

Manage multiple restaurant branches.

**Features:**
- **Outlet Cards**: Each branch with name, address, status
- **Status Badges**: Active (green), Paused (yellow)
- **Metrics Display**: Orders count and rating per outlet
- **Add Outlet Button**: Create new branch

### 25. Coupon Management (admin_coupons/code.html)

Create and manage promotional coupons.

**Features:**
- **Coupon Cards**: Code, description, usage stats
- **Status Badges**: Active (green), Expiring Soon (red), Scheduled (gray)
- **Usage Tracking**: Used vs Remaining count
- **Create Coupon Button**: New coupon creation

### 26. Vendor Management (admin_vendor_management/code.html)
- Vendor listing with search/filter
- Vendor details, status toggle

---

## User Profile & Account Features

### 27. User Profile (user_profile/code.html)
- Profile information display
- Account settings

### 28. Order History (order_history_details/code.html)
- Past orders list
- Order details view
- Reorder functionality

### 29. Order Tracking (order_tracking/code.html, order_tracking_detailed/code.html)
- Real-time delivery status
- Map-based tracking view
- Rider location

---

## Additional Features

### 30. Onboarding (onboarding/code.html)
- Welcome screens
- Feature introduction

### 31. Sign In/Sign Up (sign in or sign up/)
- Login with email/phone
- Registration flow

### 32. Address Location Picker (address_location_picker/code.html)
- Interactive map for location selection
- Save multiple addresses

### 33. Notification System (notification_system_ui/code.html)
- In-app notification center
- Notification categories

### 34. Rating & Reviews (rating_review_screen/code.html)
- Rate completed orders
- Write reviews with photos
- View restaurant ratings

### 35. Chat with Rider (chat_with_rider/code.html)
- In-app messaging with delivery partner
- Real-time chat interface

### 36. Payment Status (payment_status/code.html)
- Payment success/failure screens
- Transaction confirmation

---

## Project Structure

```
MIIAM Final UI/
├── README.md                         # This file
├── checkout/                        # Checkout with scheduling, delivery instructions
├── search_discovery/                # Main search with all filters and AI
├── order_tracking/                  # Basic order tracking
├── order_tracking_detailed/         # Detailed tracking with map
├── order_history_details/           # Order history with reorder, receipt
├── miiam_instamart/                 # Quick commerce grocery
├── miiam_gold/                      # Loyalty program
├── miiam_wallet/                    # Wallet & transactions
├── food_on_train/                   # Train food delivery
├── gift_cards/                      # Gift card purchase
├── table_reservation/               # Dineout reservations
├── live_support/                   # Customer support chat
├── restaurant_photo_gallery/        # Restaurant photos
├── rider_earnings/                 # Rider earnings dashboard
├── rider_login/                    # Rider login
├── rider_app_interface/            # Rider order interface
├── rider app dash/                 # Rider main dashboard
├── admin_analytics/               # Admin dashboard
├── admin_menu_management/         # Menu management
├── admin_coupons/                 # Coupon management
├── admin_multioutlet/             # Multi-branch support
├── admin_pos_integration/         # POS connections
├── admin_vendor_management/       # Vendor management
├── settings/                      # App settings with sound
├── user_profile/                  # User profile
├── notification_system_ui/        # Notifications
├── rating_review_screen/          # Ratings & reviews
├── chat_with_rider/               # Chat with rider
├── payment_status/                # Payment screens
├── onboarding/                     # Onboarding flow
├── sign in or sign up/            # Auth pages
├── address_location_picker/      # Location picker
├── delivery form/                 # Delivery details
├── vendor_details_the_burger_alchemist/ # Restaurant detail example
└── velocity_superapp/             # Design system docs
```

---

## Design System

### Color Palette
- **Primary (Food)**: #ba001c (Appetite Red) / #ff7670 (Container)
- **Secondary (Services)**: #0b50d5 (Trust Blue) / #c4d0ff (Container)
- **Tertiary (Gold)**: #ffd709 (Rewards/Highlights)
- **Surface**: #fff4f4 (Background)
- **Surface Container**: #ffe1e4 (Cards)
- **Surface Container Lowest**: #ffffff (Elevated cards)

### Typography
- **Font Family**: Plus Jakarta Sans
- **Display-LG**: 3.5rem, 800 weight (Hero headlines)
- **Headline-MD**: 1.75rem, 700 weight (Section starters)
- **Title-MD**: 1.125rem, 600 weight (Card titles)
- **Body-LG**: 1rem, 400 weight (Primary reading)
- **Label-MD**: 0.75rem, 500 weight (Navigation)

### Design Principles
- **No Lines**: Use background color shifts instead of borders
- **Glassmorphism**: Floating elements with blur and transparency
- **Kinetic Debris**: Floating emojis for playfulness
- **Editorial Typography**: Tight letter-spacing on headlines

---

## Tech Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom properties and animations
- **Tailwind CSS**: Utility-first styling
- **JavaScript**: Vanilla JS for interactivity
- **Material Symbols**: Icon library (Google Fonts)
- **Plus Jakarta Sans**: Typography (Google Fonts)

---

## Deployment

### GitHub Pages
1. Go to Repository → Settings → Pages
2. Select main branch, folder /root
3. Save and access at `https://yourusername.github.io/MIIAM/`

### Netlify
1. Connect repo to Netlify
2. Set publish directory to `/`
3. Auto-deploys on push

### Vercel
```bash
npm i -g vercel
vercel
```

---

## Getting Started

1. Clone the repository
2. Open any `.html` file in a browser
3. Or deploy to any static hosting

---

## License

MIT License

---

## Version

Current Version: 2.0.0

Last Updated: May 2026