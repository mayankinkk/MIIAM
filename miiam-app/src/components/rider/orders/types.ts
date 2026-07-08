export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  special_notes: string | null;
  status: "pending" | "available" | "unavailable" | "different_brand";
  picked: boolean;
  actual_price: number | null;
  name?: string;
  menu_item?: {
    name: string;
    category: string;
  };
}

export interface Order {
  id: string;
  user_id?: string;
  rider_id?: string;
  vendor_id?: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  special_instructions: string | null;
  placed_at: string;
  delivered_at?: string;
  customer_collected?: number;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  vendor?: {
    shop_name: string;
    name?: string;
    address: string;
    phone: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
  address?: {
    street: string;
    city: string;
  };
  items?: OrderItem[];
}
