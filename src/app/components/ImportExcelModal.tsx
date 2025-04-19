'use client'
import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (products: Array<{ name: string; price: number }>) => void;
  storeId: number;
}

interface ExcelProduct {
  Name: string;  // Changed to match Excel column header
  Price: string | number;  // Changed to match Excel column header
}

export function ImportExcelModal({ isOpen, onClose, onImport, storeId }: ImportExcelModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ExcelProduct[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);
      setSelectedFile(file);

      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert the worksheet to JSON, using the actual headers from the file
      const jsonData = XLSX.utils.sheet_to_json<ExcelProduct>(worksheet);

      // Validate the data
      const invalidRows = jsonData.filter(row => !row.Name || !row.Price || isNaN(Number(row.Price)));
      if (invalidRows.length > 0) {
        throw new Error('Invalid data format. Please ensure all rows have a Name and valid Price.');
      }

      setParsedData(jsonData);
      setError(null);
    } catch (err) {
      console.error('Error processing Excel file:', err);
      setError(err instanceof Error ? err.message : 'Failed to process Excel file');
      setParsedData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!parsedData.length) {
      setError('Please upload a valid Excel file first');
      return;
    }

    if (!storeId) {
      setError('Store ID is required');
      return;
    }

    try {
      // Format the data to match the expected structure
      const formattedData = parsedData.map(row => ({
        name: row.Name,
        price: Number(row.Price),
        store_id: storeId
      }));

      // Pass the formatted data to the parent component
      onImport(formattedData);
      onClose();
    } catch (err) {
      console.error('Error submitting data:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit data');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[480px] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Products from Excel</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Upload an Excel file (.xlsx or .csv) with the following format:
            </p>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Expected format:</p>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-1 px-2 bg-gray-100">Name</th>
                    <th className="text-left py-1 px-2 bg-gray-100">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 px-2 text-gray-500">Product Name</td>
                    <td className="py-1 px-2 text-gray-500">Product Price</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block w-full">
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                disabled={isLoading}
              />
            </label>
          </div>

          {parsedData.length > 0 && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
              Successfully parsed {parsedData.length} products
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !parsedData.length}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                isLoading || !parsedData.length
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black hover:bg-gray-800'
              }`}
            >
              Import Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 