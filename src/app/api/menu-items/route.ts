import { NextResponse, NextRequest } from "next/server";
import { pool } from "../../lib/db";
import { executeQuery, executeInsert } from "../../lib/queryConverter";
import { MenuItem } from "../../lib/types";

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
        
        const [rows] = await executeQuery<MenuItem>(
          pool,
          "SELECT * FROM menu_items WHERE store_id = ?", 
          [store_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
              { message: "No menu items found" }, 
              { 
                status: 404,
                headers: corsHeaders
              }
            );
        }

        // Format the menu items to ensure proper price handling
        const formattedMenuItems = rows.map(item => ({
          ...item,
          price: parseFloat(String(item.price))
        }));

        return NextResponse.json(
          { message: "Menu items fetched successfully", menuItems: formattedMenuItems }, 
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

        const { name, price, store_id } = await request.json();

        // Validate required fields
        if (!name || price === undefined || !store_id) {
            return NextResponse.json(
              { error: "All fields are required: name, price, store_id" }, 
              { 
                status: 400,
                headers: corsHeaders
              }
            );
        }

        // Validate price is a positive number
        if (price <= 0) {
            return NextResponse.json(
              { error: "Price must be greater than 0" }, 
              { 
                status: 400,
                headers: corsHeaders
              }
            );
        }

        const result = await executeInsert(
          pool,
          "INSERT INTO menu_items (name, price, store_id) VALUES (?, ?, ?)",
          [name, price, store_id]
        );

        return NextResponse.json(
          { message: "Menu item created successfully", menuItem: result }, 
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



