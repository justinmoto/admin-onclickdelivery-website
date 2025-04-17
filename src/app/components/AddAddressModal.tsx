'use client'

import { useState } from 'react';
import Image from 'next/image';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: { 
    tradeName: string; 
    category: string; 
    address: string; 
    coordinates?: { lat: number; lng: number };
    logo?: File;
  }) => void;
}

interface AddressForm {
  tradeName: string;
  category: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  logo: File | null;
  logoPreview: string | null;
}

const STORE_CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Fast Food",
  "Bakery",
  "Grocery Store",
  "Convenience Store",
  "Pharmacy",
  "Electronics Store",
  "Clothing Store",
  "Hardware Store",
  "Bookstore",
  "Pet Shop",
  "Flower Shop",
  "Jewelry Store",
  "Sports Store",
  "Toy Store",
  "Other"
];

export const AddAddressModal = ({ isOpen, onClose, onSave }: AddAddressModalProps) => {
  const [form, setForm] = useState<AddressForm>({
    tradeName: '',
    category: '',
    address: '',
    coordinates: null,
    logo: null,
    logoPreview: null
  });

  // Load Google Maps script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places']
  });

  // Places Autocomplete setup
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'PH' }
    },
    debounce: 300,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setForm(prev => ({
        ...prev,
        address,
        coordinates: { lat, lng }
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data.results[0]) {
          const address = data.results[0].formatted_address;
          setForm(prev => ({
            ...prev,
            address,
            coordinates: { lat, lng }
          }));
          setValue(address, false);
        }
      } catch (error) {
        console.error('Error getting address:', error);
      }
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          
          if (data.results[0]) {
            const address = data.results[0].formatted_address;
            setForm(prev => ({
              ...prev,
              address,
              coordinates: { lat, lng }
            }));
            setValue(address, false);
          }
        } catch (error) {
          console.error('Error getting address:', error);
          alert('Error getting your current location address');
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Error getting your current location. Please make sure you have granted location permissions.');
      }
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        logo: file,
        logoPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      tradeName: form.tradeName,
      category: form.category,
      address: form.address,
      coordinates: form.coordinates || undefined,
      logo: form.logo || undefined
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] z-50">
      <div className="flex flex-col h-full bg-white/90 backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Add New Address</h2>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Logo
              </label>
              <div 
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="relative cursor-pointer group"
              >
                <div className={`w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${form.logoPreview ? 'border-none' : ''}`}>
                  {form.logoPreview ? (
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                      <Image
                        src={form.logoPreview}
                        alt="Store logo preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                        <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <p className="mt-1 text-xs text-gray-500 text-center">
                  {form.logo ? form.logo.name : 'Click to upload logo'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade Name
              </label>
              <input
                type="text"
                value={form.tradeName}
                onChange={(e) => setForm(prev => ({ ...prev, tradeName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
                placeholder="Enter trade name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
              >
                <option value="">Select a category</option>
                {STORE_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={!isLoaded || !ready}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
                  placeholder={!isLoaded || !ready ? "Loading..." : "Search for address"}
                />

                {/* Suggestions */}
                {status === 'OK' && (
                  <ul className="absolute left-0 right-0 z-50 mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base border border-gray-200 overflow-auto focus:outline-none sm:text-sm">
                    {data.map(({ place_id, description }) => (
                      <li
                        key={place_id}
                        onClick={() => handleSelect(description)}
                        className="cursor-pointer select-none relative py-2 px-3 hover:bg-gray-50 text-gray-900"
                      >
                        {description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Current Location Button */}
              <button
                type="button"
                onClick={getCurrentLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use Current Location
              </button>

              {/* Map */}
              <div className="h-[200px] rounded-lg overflow-hidden border border-gray-200">
                {isLoaded && (
                  <GoogleMap
                    center={form.coordinates || { lat: 7.4478, lng: 125.8037 }} // Default to Tagum City
                    zoom={15}
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    onClick={handleMapClick}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                    }}
                  >
                    {form.coordinates && (
                      <Marker 
                        position={form.coordinates}
                        draggable={true}
                        onDragEnd={(e) => {
                          if (e.latLng) {
                            handleMapClick({
                              latLng: e.latLng
                            } as google.maps.MapMouseEvent);
                          }
                        }}
                      />
                    )}
                  </GoogleMap>
                )}
              </div>

              {/* Selected Address Display */}
              {form.address && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    Selected Address: {form.address}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 