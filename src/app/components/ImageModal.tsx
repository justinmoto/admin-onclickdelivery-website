'use client'

import Image from 'next/image';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

export const ImageModal = ({ isOpen, onClose, imageUrl, altText }: ImageModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        </button>
        <div className="relative w-full h-[80vh] rounded-lg overflow-hidden bg-white">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            className="object-contain"
            unoptimized
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
          />
        </div>
      </div>
    </div>
  );
}; 