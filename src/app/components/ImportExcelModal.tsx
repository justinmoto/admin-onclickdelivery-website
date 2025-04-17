'use client'
import { useState } from 'react';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
}

export const ImportExcelModal = ({ isOpen, onClose, onImport }: ImportExcelModalProps) => {
  const [excelFile, setExcelFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (excelFile) {
      onImport(excelFile);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] z-50">
      <div className="flex flex-col h-full bg-white/90 backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Import Excel</h2>
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Excel File
              </label>
              <div 
                className="border border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-gray-400 bg-white"
                onClick={() => document.getElementById('excel-file')?.click()}
              >
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 mb-1">
                    Click to upload Excel file
                  </span>
                  <span className="text-xs text-gray-400">
                    Supports .xlsx, .xls formats
                  </span>
                </div>
                <input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                />
              </div>
              {excelFile && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Selected: {excelFile.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="space-y-2">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!excelFile}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                excelFile 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Import File
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 