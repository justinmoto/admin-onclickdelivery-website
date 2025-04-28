import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { executeQuery, getDatabaseMode } from "../../../lib/queryConverter";
import { Store } from "../../../lib/types";
import { RowDataPacket, ResultSetHeader } from "mysql2";

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!pool) {
      throw new Error("Database connection not configured");
    }

    // Correctly handle params by making a copy
    const { id } = await Promise.resolve(params);

    const [rows] = await executeQuery<Store>(
      pool,
      'SELECT id, name, logo_url, location, category, latitude, longitude, email, phone_number, created_at, updated_at FROM stores WHERE id = ?',
      [id]
    );

    if (rows.length > 0) {
      return NextResponse.json(
        { store: rows[0] },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Store not found' },
      { 
        status: 404,
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!pool) {
      throw new Error("Database connection not configured");
    }

    // Correctly handle params by making a copy
    const { id } = await Promise.resolve(params);

    // First check if the store exists
    const [existingStore] = await executeQuery<Store>(
      pool,
      'SELECT id FROM stores WHERE id = ?',
      [id]
    );

    if (existingStore.length === 0) {
      return NextResponse.json(
        { error: 'Store not found' },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Delete the store
    await executeQuery<RowDataPacket & ResultSetHeader>(
      pool,
      'DELETE FROM stores WHERE id = ?',
      [id]
    );

    return NextResponse.json(
      { message: 'Store deleted successfully' },
      { 
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error in DELETE request:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!pool) {
      throw new Error("Database connection not configured");
    }

    // Correctly handle params by making a copy
    const { id } = await Promise.resolve(params);
    const { name, category, logo_url, location, longitude, latitude, email, phone_number } = await request.json();

    // Validate required fields
    if (!name || !category || !logo_url || !location || longitude === undefined || latitude === undefined) {
      return NextResponse.json(
        { error: "All fields are required: name, category, logo_url, location, longitude, latitude" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // First check if the store exists
    const [existingStore] = await executeQuery<Store>(
      pool,
      'SELECT id FROM stores WHERE id = ?',
      [id]
    );

    if (existingStore.length === 0) {
      return NextResponse.json(
        { error: 'Store not found' },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Update the store with updated_at field for PostgreSQL
    const databaseMode = getDatabaseMode();
    let updateQuery;
    
    if (databaseMode === 'postgresql') {
      updateQuery = 'UPDATE stores SET name = ?, category = ?, logo_url = ?, location = ?, longitude = ?, latitude = ?, email = ?, phone_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    } else {
      updateQuery = 'UPDATE stores SET name = ?, category = ?, logo_url = ?, location = ?, longitude = ?, latitude = ?, email = ?, phone_number = ? WHERE id = ?';
    }

    await executeQuery<RowDataPacket & ResultSetHeader>(
      pool,
      updateQuery,
      [name, category, logo_url, location, longitude, latitude, email, phone_number, id]
    );

    // Get the updated store
    const [updatedStore] = await executeQuery<Store>(
      pool,
      'SELECT id, name, logo_url, location, category, latitude, longitude, email, phone_number, created_at, updated_at FROM stores WHERE id = ?',
      [id]
    );

    return NextResponse.json(
      { 
        message: 'Store updated successfully',
        store: updatedStore[0]
      },
      { 
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error in PUT request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}






