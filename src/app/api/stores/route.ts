import { NextResponse, NextRequest } from "next/server";
import { pool } from "../../lib/db";
import { Store } from "../../lib/types";
import { executeQuery, executeInsert } from "../../lib/queryConverter";

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

export async function GET() {
  try {
    if (!pool) {
      throw new Error("Database connection not configured");
    }

    const [rows] = await executeQuery<Store>(
      pool,
      "SELECT id, name, category, email, phone_number, logo_url, location, longitude, latitude, created_at, updated_at FROM stores ORDER BY name ASC"
    );

    return NextResponse.json(
      { stores: rows },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!pool) {
      throw new Error("Database connection not configured");
    }

    const { name, category, logo_url, location, longitude, latitude, email, phone_number } = await request.json();

    // Validate required fields
    if (!name || !category || !logo_url || !location || longitude === undefined || latitude === undefined) {
      return NextResponse.json(
        { error: "All fields are required: name, category, logo_url, location, longitude, latitude" },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await executeInsert(
      pool,
      "INSERT INTO stores (name, category, logo_url, location, longitude, latitude, email, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, category, logo_url, location, longitude, latitude, email, phone_number]
    );

    return NextResponse.json(
      { message: "Store created successfully", store: result },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}


