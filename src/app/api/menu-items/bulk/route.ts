/**
 * Content Outline:
 * - Import dependencies
 * - Define type for bulk product request
 * - Define CORS headers
 * - Implement OPTIONS method for CORS preflight
 * - Implement POST method for bulk product creation
 * 
 * Call Graph:
 * - OPTIONS → Return CORS headers
 * - POST → validateInput → executeTransaction → Return response
 */

import { NextResponse, NextRequest } from "next/server";
import { pool } from "../../../lib/db";
import { executeTransaction } from "../../../lib/queryConverter";

/**
 * Type definition for bulk product import request
 */
type BulkProductRequest = {
  products: Array<{
    name: string;
    price: number;
    store_id: number;
  }>;
  store_id: number;
};

/**
 * CORS headers for cross-origin requests
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handles OPTIONS requests for CORS preflight
 * 
 * @returns Empty response with CORS headers
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Handles bulk creation of menu items in a transaction
 * 
 * @param request - The incoming HTTP request
 * @returns JSON response with success/error information
 */
export async function POST(request: NextRequest) {
  try {
    if (!pool) {
      throw new Error("Database connection not configured");
    }

    const data: BulkProductRequest = await request.json();
    const { products, store_id } = data;

    // Validate request data
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, message: "No products provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!store_id) {
      return NextResponse.json(
        { success: false, message: "Store ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate all products before transaction
    const invalidProducts = products.filter(
      product => !product.name || typeof product.price !== 'number' || product.price <= 0
    );

    if (invalidProducts.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `${invalidProducts.length} invalid products found` 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Execute all inserts in a transaction
    const insertQueries = products.map(product => ({
      query: "INSERT INTO menu_items (name, price, store_id) VALUES (?, ?, ?)",
      values: [product.name, product.price, store_id]
    }));

    const results = await executeTransaction(pool, insertQueries);

    return NextResponse.json(
      { 
        success: true, 
        message: "Products imported successfully", 
        importedCount: products.length,
        results 
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error in bulk POST request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
} 