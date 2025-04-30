import { RowDataPacket } from "mysql2";

export interface Store extends RowDataPacket {
  id: number;
  name: string;
  category: string;
  email: string | null;
  logo_url: string;
  location: string;
  longitude: number;
  latitude: number;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItem extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  store_id: number;
  created_at: Date;
  updated_at: Date;
}

