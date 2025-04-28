import { NextResponse, NextRequest } from "next/server";
import { pool } from "../../../lib/db";
import { executeQuery } from "../../../lib/queryConverter";
import { RowDataPacket, ResultSetHeader } from "mysql2";

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

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!pool) {
          throw new Error("Database connection not configured");
        }

        // Correctly handle params by making a copy
        const { id } = await Promise.resolve(params);

        if (!id) {
            return NextResponse.json(
              { error: "Photo ID is required" }, 
              { 
                status: 400,
                headers: corsHeaders
              }
            );
        }

        const [rows] = await executeQuery<MenuPhoto>(
          pool,
          "SELECT * FROM menu_photos WHERE id = ?",
          [id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
              { error: "Menu photo not found" }, 
              { 
                status: 404,
                headers: corsHeaders
              }
            );
        }

        return NextResponse.json(
          { message: "Menu photo fetched successfully", menuPhoto: rows[0] }, 
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!pool) {
          throw new Error("Database connection not configured");
        }

        // Correctly handle params by making a copy
        const { id } = await Promise.resolve(params);

        if (!id) {
            return NextResponse.json(
              { error: "Photo ID is required" }, 
              { 
                status: 400,
                headers: corsHeaders
              }
            );
        }

        // Delete the photo
        const [result] = await executeQuery<RowDataPacket & ResultSetHeader>(
          pool,
          "DELETE FROM menu_photos WHERE id = ?",
          [id]
        );

        // In PostgreSQL, a successful DELETE returns an empty array
        // In MySQL, it returns a ResultSetHeader with affectedRows
        // We just need to ensure result exists
        if (!result) {
            return NextResponse.json(
              { error: "Menu photo not found" }, 
              { 
                status: 404,
                headers: corsHeaders
              }
            );
        }

        return NextResponse.json(
          { message: "Menu photo deleted successfully" }, 
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