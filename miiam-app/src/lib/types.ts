export type UserRole = "customer" | "admin" | "rider";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  loyalty_points: number;
  created_at: string;
  location: string | null;
  city: string | null;
  dietary_preference: "veg" | "non_veg" | "both" | null;
  is_profile_complete: boolean;
}

export interface Address {
  id: string;
  user_id: string;
  label: string; // "Home", "Office", etc.
  street: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  rating: number;
  review_count: number;
  delivery_time_min: number;
  delivery_time_max: number;
  min_order_amount: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  is_available: boolean;
  is_featured: boolean;
  is_veg: boolean | null;
  created_at: string;
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "picking_up"
  | "on_the_way"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface Order {
  id: string;
  user_id: string;
  vendor_id: string;
  rider_id: string | null;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  discount_amount: number;
  delivery_address_id: string | null;
  delivery_address: string | null;
  payment_method: string;
  special_instructions: string | null;
  placed_at: string;
  delivered_at: string | null;
  vendor?: Vendor;
  items?: OrderItem[];
  address?: Address;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  special_notes: string | null;
  menu_item?: MenuItem;
}

export interface Rider {
  id: string;
  user_id: string;
  name?: string;
  phone?: string;
  vehicle_type: string;
  vehicle_number?: string;
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  total_deliveries: number;
  rating: number;
  balance?: number;
  total_earned?: number;
  total_earnings?: number;
  tips?: number;
  id_proof_type?: string;
  id_proof_image?: string;
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: "order" | "promo" | "system" | "rider";
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  vendor_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Flower {
  id: string;
  name: string;
  price: number;
  original?: number;
  image: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  original?: number;
  image: string;
  description?: string;
  category?: string;
}

export type TabType = "vendors" | "users" | "riders" | "orders" | "overview" | "reports";
