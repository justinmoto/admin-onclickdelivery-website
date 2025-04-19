import { RowDataPacket } from "mysql2";

export interface Store {
  id: number;
  name: string;
  category: string;
  logo_url: string;
  location: string;
}

export interface MenuItem extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  image_url: string;
  store_id: number;
}

