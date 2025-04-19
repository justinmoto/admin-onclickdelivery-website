'use client'
import { useState } from 'react';
import Image from 'next/image';
import { uploadFile } from '../lib/cloudinary';

interface AddMenuPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (photos: File[]) => void;
  storeId: number;
}

export const AddMenuPhotosModal = ({ isOpen, onClose, onSave, storeId }: AddMenuPhotosModalProps) => {
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedPhotos(prev => [...prev, ...files]);
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPhotos.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Upload photos to Cloudinary and get URLs
      const uploadPromises = selectedPhotos.map(async (photo) => {
        const reader = new FileReader();
        const fileDataPromise = new Promise<string | ArrayBuffer | null>((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(photo);
        });
        
        const fileData = await fileDataPromise;
        if (typeof fileData === 'string') {
          const uploadResult = await uploadFile(fileData, "menu-photos");
          return uploadResult.secure_url;
        }
        return null;
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter((url): url is string => url !== null);

      // Make API calls to save each photo URL
      const apiUrl = process.env.MYSQL_API_URL || 'http://localhost:3001';
      const apiPromises = uploadedUrls.map(async (photo_url) => {
        const response = await fetch(`${apiUrl}/api/menu-photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            photo_url,
            store_id: storeId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save menu photo');
        }

        return response.json();
      });

      await Promise.all(apiPromises);

      onSave(selectedPhotos);
      onClose();
    } catch (err) {
      console.error('Error saving menu photos:', err);
      setError(err instanceof Error ? err.message : 'Failed to save menu photos');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] z-50">
      <div className="flex flex-col h-full bg-white/90 backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Add Menu Photos</h2>
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Menu Photos
                </label>
                <span className="text-xs text-gray-500">
                  {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div 
                className="border border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-gray-400 bg-white"
                onClick={() => document.getElementById('menu-photos')?.click()}
              >
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 mb-1">
                    Click to upload menu photos
                  </span>
                  <span className="text-xs text-gray-400">
                    Supports JPG, PNG formats
                  </span>
                </div>
                <input
                  id="menu-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            {selectedPhotos.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Selected Photos</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-[3/4] relative rounded-lg overflow-hidden border border-gray-200">
                        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                          {URL.createObjectURL(photo) && (
                            <Image
                              src={URL.createObjectURL(photo)}
                              alt={`Menu photo ${index + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="mt-1 text-xs text-gray-500 truncate">
                        {photo.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="space-y-2">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={selectedPhotos.length === 0 || isLoading}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                selectedPhotos.length > 0 && !isLoading
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Saving...' : 'Save Photos'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 