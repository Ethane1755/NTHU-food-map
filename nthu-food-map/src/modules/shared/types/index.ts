export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  category?: string;
}

export interface Store {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  rating?: number;
  price_range?: number; // 1-4
  image_url?: string;
  description?: string;
  created_at?: string;
  menu_items?: MenuItem[];
  hours?: string;
}

export interface Comment {
  id: string;
  store_id: string;
  user_id: string;
  text: string;
  rating: number;
  created_at: string;
  user?: {
    email?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
  };
}

export interface Promotion {
  id: string;
  store_id: string;
  title: string;
  description: string;
  expires_at?: string;
  badge?: string;
}

export interface SpendingRecord {
  id: string;
  user_id: string;
  store_id: string;
  amount: number;
  visited_at: string;
  store?: Store;
}

export type Category =
  | "中式"
  | "早餐"
  | "飲料"
  | "速食"
  | "日式"
  | "便當"
  | "小吃"
  | "其他";
