'use client'
import { useState } from 'react';

interface DeliveryFare {
  baseFare: number;
  ratePerKm: number;
  otherCharges: number;
}

interface DeliverySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: DeliveryFare) => void;
}

export const DeliverySettingsModal = ({ isOpen, onClose, onSave }: DeliverySettingsModalProps) => {
  const [deliveryFare, setDeliveryFare] = useState<DeliveryFare>({
    baseFare: 40,
    ratePerKm: 10,
    otherCharges: 0
  });
  const [exampleDistance, setExampleDistance] = useState(1);

  const calculateTotalFare = (distance: number) => {
    const { baseFare, ratePerKm, otherCharges } = deliveryFare;
    return baseFare + (ratePerKm * distance) + otherCharges;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(deliveryFare);
    onClose();
  };

  const exampleTotal = calculateTotalFare(exampleDistance);

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

        <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Fare (₱)
            </label>
            <input
              type="number"
              value={deliveryFare.baseFare}
              onChange={(e) => setDeliveryFare({
                ...deliveryFare,
                baseFare: parseFloat(e.target.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 text-gray-900"
            />
            <p className="mt-1 text-sm text-gray-500">Fixed base fare for all deliveries</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate per Kilometer (₱)
            </label>
            <input
              type="number"
              value={deliveryFare.ratePerKm}
              onChange={(e) => setDeliveryFare({
                ...deliveryFare,
                ratePerKm: parseFloat(e.target.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 text-gray-900"
            />
            <p className="mt-1 text-sm text-gray-500">Additional charge per kilometer</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Charges (₱)
            </label>
            <input
              type="number"
              value={deliveryFare.otherCharges}
              onChange={(e) => setDeliveryFare({
                ...deliveryFare,
                otherCharges: parseFloat(e.target.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 text-gray-900"
            />
            <p className="mt-1 text-sm text-gray-500">Additional fees or charges (if any)</p>
          </div>

          <div className="bg-gray-50 p-4 rounded mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Example Calculation</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance (km)
              </label>
              <input
                type="number"
                value={exampleDistance}
                onChange={(e) => setExampleDistance(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 text-gray-900 bg-white"
              />
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm text-gray-600">Base Fare: ₱{deliveryFare.baseFare}</p>
              <p className="text-sm text-gray-600">Distance Charge: ₱{deliveryFare.ratePerKm} × {exampleDistance}km = ₱{(deliveryFare.ratePerKm * exampleDistance).toFixed(2)}</p>
              <p className="text-sm text-gray-600">Other Charges: ₱{deliveryFare.otherCharges}</p>
              <p className="text-sm font-medium text-gray-900 mt-2">Total Fare: ₱{exampleTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 