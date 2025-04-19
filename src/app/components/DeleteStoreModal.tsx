'use client'

import { useState } from 'react';

interface DeleteStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  storeName: string;
  isLoading: boolean;
}

export const DeleteStoreModal = ({ isOpen, onClose, onConfirm, storeName, isLoading }: DeleteStoreModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-[400px] max-w-full mx-4">
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
              Delete Store
            </h3>
            
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete <span className="font-medium text-gray-900">{storeName}</span>? This action cannot be undone and will permanently delete all associated data.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Store'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 