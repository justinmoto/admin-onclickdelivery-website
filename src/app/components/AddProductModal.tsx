'use client'
import { useState } from 'react';
import Image from 'next/image';
import { uploadFile } from '../lib/cloudinary';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: { name: string; price: number; photo?: File }) => void;
  storeId: number; // Add store ID prop
}

export const AddProductModal = ({ isOpen, onClose, onSave, storeId }: AddProductModalProps) => {
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [imageAspectRatio, setImageAspectRatio] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('File size should be less than 5MB');
        return;
      }

      setProductPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      
      // Get image dimensions to calculate aspect ratio
      const img = document.createElement('img');
      img.onload = () => {
        setImageAspectRatio(img.width / img.height);
        URL.revokeObjectURL(previewUrl); // Clean up the object URL
      };
      img.src = previewUrl;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!storeId) {
        throw new Error('No store selected');
      }

      let imageUrl = '';
      
      // Upload photo to Cloudinary if exists
      if (productPhoto) {
        const reader = new FileReader();
        const fileDataPromise = new Promise<string | ArrayBuffer | null>((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(productPhoto);
        });
        
        const fileData = await fileDataPromise;
        if (typeof fileData === 'string') {
          const uploadResult = await uploadFile(fileData, "menu-items");
          imageUrl = uploadResult.secure_url;
        }
      }

      // Make API call to create menu item
      const apiUrl = process.env.API_URL || 'http://localhost:3001';
      console.log('Making API call to:', `${apiUrl}/api/menu-items`, {
        name: productName,
        price: parseFloat(productPrice),
        image_url: imageUrl,
        store_id: storeId
      });
      
      const response = await fetch(`${apiUrl}/api/menu-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productName,
          price: parseFloat(productPrice),
          image_url: imageUrl,
          store_id: storeId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create menu item');
      }

      const data = await response.json();
      console.log('Menu item created:', data);
      
      onSave({
        name: productName,
        price: parseFloat(productPrice) || 0,
        photo: productPhoto || undefined,
      });
      
      onClose();
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate container dimensions
  const containerStyle = photoPreview ? {
    aspectRatio: imageAspectRatio,
    maxHeight: '400px', // Maximum height constraint
    width: '100%',
  } : {
    height: '200px', // Default height when no image
    width: '100%',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] z-50">
      <div className="flex flex-col h-full bg-white/90 backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Add a Product</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                placeholder="Enter product name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 bg-white"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₱</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 bg-white"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload product photo
              </label>
              <div 
                onClick={() => document.getElementById('product-photo')?.click()}
                className="relative cursor-pointer group"
              >
                <div 
                  className={`border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 transition-colors ${photoPreview ? 'border-none' : ''}`}
                  style={containerStyle}
                >
                  {photoPreview ? (
                    <div className="relative w-full h-full rounded-lg overflow-hidden">
                      <Image
                        src={photoPreview}
                        alt="Product preview"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-opacity flex items-center justify-center">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">Click to upload product photo</p>
                      <p className="mt-1 text-xs text-gray-400">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="product-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="space-y-2">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                isLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isLoading ? 'Saving...' : 'Save Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 