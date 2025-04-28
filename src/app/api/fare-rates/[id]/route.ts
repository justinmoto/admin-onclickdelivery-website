import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { executeQuery, getDatabaseMode } from "../../../lib/queryConverter";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface FareRate extends RowDataPacket {
  id: number;
  base_fare: number;
  rate_per_km: number;
  other_charges: number;
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

    const [rows] = await executeQuery<FareRate>(
      pool,
      'SELECT id, base_fare, rate_per_km, other_charges, created_at, updated_at FROM fare_rates WHERE id = ?',
      [id]
    );

    if (rows.length > 0) {
      return NextResponse.json(
        { fareRate: rows[0] },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Fare rate not found' },
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
    const { base_fare, rate_per_km, other_charges } = await request.json();

    // Validate required fields
    if (base_fare === undefined || rate_per_km === undefined || other_charges === undefined) {
      return NextResponse.json(
        { error: "All fields are required: base_fare, rate_per_km, other_charges" },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // First check if the fare rate exists
    const [existingRate] = await executeQuery<FareRate>(
      pool,
      'SELECT id FROM fare_rates WHERE id = ?',
      [id]
    );

    if (existingRate.length === 0) {
      return NextResponse.json(
        { error: 'Fare rate not found' },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Update the fare rate with updated_at field for PostgreSQL
    const databaseMode = getDatabaseMode();
    let updateQuery;
    
    if (databaseMode === 'postgresql') {
      updateQuery = 'UPDATE fare_rates SET base_fare = ?, rate_per_km = ?, other_charges = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    } else {
      updateQuery = 'UPDATE fare_rates SET base_fare = ?, rate_per_km = ?, other_charges = ? WHERE id = ?';
    }

    await executeQuery<RowDataPacket & ResultSetHeader>(
      pool,
      updateQuery,
      [base_fare, rate_per_km, other_charges, id]
    );

    // Get the updated fare rate
    const [updatedRate] = await executeQuery<FareRate>(
      pool,
      'SELECT id, base_fare, rate_per_km, other_charges, created_at, updated_at FROM fare_rates WHERE id = ?',
      [id]
    );

    return NextResponse.json(
      { 
        message: "Fare rate updated successfully",
        fareRate: updatedRate[0]
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

