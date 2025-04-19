import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

type CloudinaryCallback = (error: any, result: CloudinaryResponse | undefined) => void;

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
    const { file, folder } = await request.json();

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload the file to Cloudinary
    const uploadResponse = await new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        file,
        {
          folder: folder || 'uploads',
          resource_type: 'auto',
        },
        ((error, result) => {
          if (error) {
            console.error('Cloudinary upload error details:', error);
            reject(error);
          } else if (result) {
            console.log('Cloudinary upload success:', {
              public_id: result.public_id,
              format: result.format,
            });
            resolve(result as CloudinaryResponse);
          } else {
            reject(new Error('No result from Cloudinary'));
          }
        }) as CloudinaryCallback
      );
    });

    return NextResponse.json({
      secure_url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      format: uploadResponse.format,
      width: uploadResponse.width,
      height: uploadResponse.height,
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 