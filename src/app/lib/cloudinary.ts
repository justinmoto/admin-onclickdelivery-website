export interface UploadResponse {
    secure_url: string;
    public_id: string;
    format: string;
    width: number;
    height: number;
  }
  
  /**
   * Uploads a file to Cloudinary
   * @param file - File to upload (must be a string URL or base64 data)
   * @param folder - Optional folder name to organize uploads
   * @returns Promise with upload response
   */
  export async function uploadFile(
    file: string,
    folder?: string
  ): Promise<UploadResponse> {
    try {
      const uploadResult = await fetch(`/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file,
          folder,
        }),
      }).then(r => r.json());
  
      return {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file to Cloudinary');
    }
  }
  
  /**
   * Deletes a file from Cloudinary
   * @param publicId - Public ID of the file to delete
   * @returns Promise with deletion status
   */
  export async function deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await fetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId }),
      }).then(r => r.json());
  
      return result.success;
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      throw new Error('Failed to delete file from Cloudinary');
    }
  }
  
  /**
   * Generates a transformed image URL using Cloudinary
   * @param publicId - Public ID of the image
   * @param options - Transformation options
   * @returns Transformed image URL
   */
  export function generateImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'scale' | 'fit' | 'thumb';
      quality?: number;
      format?: 'auto' | 'webp' | 'jpg' | 'png';
    } = {}
  ): string {
    const params = new URLSearchParams();
    
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.crop) params.append('c', options.crop);
    if (options.quality) params.append('q', options.quality.toString());
    if (options.format) params.append('f', options.format);
  
    const transformations = params.toString();
    const baseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_URL || 'https://res.cloudinary.com';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
    return `${baseUrl}/${cloudName}/image/upload${transformations ? '?' + transformations : ''}/${publicId}`;
  } 