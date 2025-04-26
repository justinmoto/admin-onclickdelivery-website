import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

interface CloudinaryDeleteResult {
  result: string;
}

interface CloudinaryError {
  http_code?: number; 
  message: string;
}

type CloudinaryCallback = (error: CloudinaryError | null, result: CloudinaryDeleteResult | undefined) => void;

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

    console.log('Attempting to delete file with public_id:', publicId);

    // Delete the file from Cloudinary
    const result = await new Promise<CloudinaryDeleteResult>((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        ((error, result) => {
          if (error) {
            console.error('Cloudinary deletion error details:', error);
            // Check if the error is because the asset doesn't exist
            if (error.http_code === 404) {
              resolve({ result: 'not_found' });
            } else {
              reject(error);
            }
          } else if (result) {
            console.log('Cloudinary deletion result:', result);
            resolve(result as CloudinaryDeleteResult);
          } else {
            reject(new Error('No result from Cloudinary'));
          }
        }) as CloudinaryCallback
      );
    });

    // Accept both 'ok' and 'not_found' as successful results
    // 'not_found' means the file was already deleted or didn't exist
    if (result.result === 'ok' || result.result === 'not_found') {
      return NextResponse.json({ 
        success: true, 
        message: result.result === 'ok' ? 'File deleted successfully' : 'File was already deleted or does not exist',
        result: result.result
      }, { headers });
    } else {
      console.error('Unexpected Cloudinary result:', result);
      throw new Error(`Unexpected Cloudinary response: ${result.result}`);
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