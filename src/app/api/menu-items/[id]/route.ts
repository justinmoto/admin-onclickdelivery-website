import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { executeQuery, getDatabaseMode } from "../../../lib/queryConverter";
import { MenuItem } from "../../../lib/types";
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

    const [rows] = await executeQuery<MenuItem>(
      pool,
      'SELECT id, name, price, store_id, created_at, updated_at FROM menu_items WHERE id = ?',
      [id]
    );

    if (rows.length > 0) {
      const menuItem = {
        ...rows[0],
        price: parseFloat(String(rows[0].price))
      };
      return NextResponse.json(
        { menuItem },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Menu item not found' },
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

    // First check if the menu item exists
    const [existingItem] = await executeQuery<MenuItem>(
      pool,
      'SELECT id FROM menu_items WHERE id = ?',
      [id]
    );

    if (existingItem.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Delete the menu item
    await executeQuery<RowDataPacket & ResultSetHeader>(
      pool,
      'DELETE FROM menu_items WHERE id = ?',
      [id]
    );

    return NextResponse.json(
      { message: 'Menu item deleted successfully' },
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

    // First check if the menu item exists
    const [existingItem] = await executeQuery<MenuItem>(
      pool,
      'SELECT id FROM menu_items WHERE id = ?',
      [id]
    );

    if (existingItem.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Update the menu item with updated_at field for PostgreSQL
    const databaseMode = getDatabaseMode();
    let updateQuery;
    
    if (databaseMode === 'postgresql') {
      updateQuery = 'UPDATE menu_items SET name = ?, price = ?, store_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    } else {
      updateQuery = 'UPDATE menu_items SET name = ?, price = ?, store_id = ? WHERE id = ?';
    }

    await executeQuery<RowDataPacket & ResultSetHeader>(
      pool,
      updateQuery,
      [name, price, store_id, id]
    );

    // Get the updated menu item
    const [updatedItem] = await executeQuery<MenuItem>(
      pool,
      'SELECT id, name, price, store_id, created_at, updated_at FROM menu_items WHERE id = ?',
      [id]
    );

    const formattedItem = {
      ...updatedItem[0],
      price: parseFloat(String(updatedItem[0].price))
    };

    return NextResponse.json(
      { 
        message: 'Menu item updated successfully',
        menuItem: formattedItem
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