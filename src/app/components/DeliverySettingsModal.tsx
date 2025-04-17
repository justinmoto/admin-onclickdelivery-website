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
    <div className="fixed inset-y-0 right-0 w-[400px] z-50">
      <div className="flex flex-col h-full bg-white/90 backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Delivery Settings</h2>
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

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Base Fare (₱)
                  </label>
                  <input
                    type="number"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                    value={deliveryFare.baseFare}
                    onChange={(e) => setDeliveryFare({
                      ...deliveryFare,
                      baseFare: parseFloat(e.target.value)
                    })}
                    min="0"
                    step="1"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Fixed base fare for all deliveries
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rate per Kilometer (₱)
                  </label>
                  <input
                    type="number"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                    value={deliveryFare.ratePerKm}
                    onChange={(e) => setDeliveryFare({
                      ...deliveryFare,
                      ratePerKm: parseFloat(e.target.value)
                    })}
                    min="0"
                    step="1"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Additional charge per kilometer
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Other Charges (₱)
                  </label>
                  <input
                    type="number"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                    value={deliveryFare.otherCharges}
                    onChange={(e) => setDeliveryFare({
                      ...deliveryFare,
                      otherCharges: parseFloat(e.target.value)
                    })}
                    min="0"
                    step="1"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Additional fees or charges (if any)
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Example Calculation</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
                      value={exampleDistance}
                      onChange={(e) => setExampleDistance(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Base Fare: ₱{deliveryFare.baseFare}</p>
                    <p>Distance Charge: ₱{deliveryFare.ratePerKm} × {exampleDistance}km = ₱{(deliveryFare.ratePerKm * exampleDistance).toFixed(2)}</p>
                    <p>Other Charges: ₱{deliveryFare.otherCharges}</p>
                    <p className="text-black font-medium">Total Fare: ₱{exampleTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 