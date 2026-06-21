export const SERVICES_VENDOR_ID = "5e700000-0000-4000-8000-000000000000";
export const PRINTING_VENDOR_ID = "f1111111-1111-4000-8000-000000000000";
export const PRINT_MENU_ITEM_ID = "a1111111-1111-4000-8000-000000000001";

export const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse?format=json";
export const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search?format=json";

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

// Rate limiting
export const LOGIN_RATE_LIMIT_MAX = 5;
export const LOGIN_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const API_RATE_LIMIT_MAX = 30;
export const API_RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const PAYMENT_RATE_LIMIT_MAX = 10;
export const PAYMENT_RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Cart
export const MAX_CART_ITEM_QTY = 99;
export const MIN_CART_ITEM_QTY = 1;

// Orders
export const ORDER_EXPIRY_HOURS = 24;
export const DELIVERY_FEE_DEFAULT = 0;
export const SERVICE_CHARGE_DEFAULT = 8;
export const TIP_OPTIONS = [0, 20, 30, 50, 100];

// Notifications
export const NOTIFICATION_RETENTION_DAYS = 90;

// OTP
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
