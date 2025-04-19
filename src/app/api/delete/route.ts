import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

interface CloudinaryDeleteResult {
  result: string;
}

type CloudinaryCallback = (error: any, result: CloudinaryDeleteResult | undefined) => void;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Cloudinary credentials not configured');
    return NextResponse.json(
      { error: 'Cloudinary configuration missing' },
      { status: 500, headers }
    );
  }

  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'No public_id provided' },
        { status: 400, headers }
      );
    }

    // Delete the file from Cloudinary
    const result = await new Promise<CloudinaryDeleteResult>((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        ((error, result) => {
          if (error) {
            console.error('Cloudinary deletion error details:', error);
            reject(error);
          } else if (result) {
            resolve(result as CloudinaryDeleteResult);
          } else {
            reject(new Error('No result from Cloudinary'));
          }
        }) as CloudinaryCallback
      );
    });

    if (result.result === 'ok') {
      return NextResponse.json({ success: true, message: 'File deleted successfully' }, { headers });
    } else {
      throw new Error('Failed to delete file from Cloudinary');
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500, headers }
    );
  }
} 