import { NextResponse, NextRequest } from "next/server";
import { pool } from "../../lib/db";
import { executeQuery, executeInsert } from "../../lib/queryConverter";
import { RowDataPacket } from "mysql2";

interface MenuPhoto extends RowDataPacket {
  id: number;
  photo_url: string;
  store_id: number;
  created_at: Date;
  updated_at: Date;
}

// Helper function to add CORS headers to the response
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
    try {
        if (!pool) {
          throw new Error("Database connection not configured");
        }

        const query = request.nextUrl.searchParams;
        const store_id = query.get("store_id");

        if (!store_id) {
            return NextResponse.json(
              { error: "Store ID is required" }, 
              { 
                status: 400,
                headers: corsHeaders
              }
            );
        }

        const [rows] = await executeQuery<MenuPhoto>(
          pool,
          "SELECT * FROM menu_photos WHERE store_id = ?",
          [store_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
              { message: "No menu photos found for this store" }, 
              { 
                status: 404,
                headers: corsHeaders
              }
            );
        }
        return NextResponse.json(
          { message: "Menu photos fetched successfully", menuPhotos: rows }, 
          { 
            status: 200,
            headers: corsHeaders
          }
        );
    } catch (error) {
        console.error("Error in GET request:", error);
        return NextResponse.json(
          { error: "Internal server error" }, 
          { 
            status: 500,
            headers: corsHeaders
          }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!pool) {
          throw new Error("Database connection not configured");
        }

        const { photo_url, store_id } = await request.json();

        // Validate required fields
        if (!photo_url || !store_id) {
            return NextResponse.json(
              { error: "All fields are required: photo_url, store_id" }, 
              { 
                status: 400,
                headers: corsHeaders
              }
            );
        }

        const result = await executeInsert(
          pool,
          "INSERT INTO menu_photos (photo_url, store_id) VALUES (?, ?)",
          [photo_url, store_id]
        );

        return NextResponse.json(
          { message: "Menu photo created successfully", menuPhoto: result }, 
          { 
            status: 201,
            headers: corsHeaders
          }
        );
    } catch (error) {
        console.error("Error in POST request:", error);
        return NextResponse.json(
          { error: "Internal server error" }, 
          { 
            status: 500,
            headers: corsHeaders
          }
        );
    }
}
