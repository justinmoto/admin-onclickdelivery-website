'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { uploadFile } from '../lib/cloudinary';
import { GoogleMap, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

// Define libraries array as a static constant
const libraries: ("places")[] = ["places"];

interface Store {
  id: number;
  name: string;
  category: string;
  logo_url?: string;
  location: string;
  longitude: number;
  latitude: number;
  isPhotoMenu: boolean;
  products: Product[];
  menuPhotos?: MenuPhoto[];
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface MenuPhoto {
  id: number;
  url: string;
  thumbnail: string;
}

interface EditStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (store: Store) => void;
  store: Store;
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
  "Other",
];

export const EditStoreModal = ({ isOpen, onClose, onSave, store }: EditStoreModalProps) => {
  const [form, setForm] = useState<Store & { logo?: File | null }>({
    ...store,
    logo: null
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logo_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Places Autocomplete setup
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "PH" },
    },
    debounce: 300,
    defaultValue: store.location,
  });

  useEffect(() => {
    setForm({ ...store, logo: null });
    setLogoPreview(store.logo_url || null);
    setValue(store.location, false);
  }, [store, setValue]);

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setForm(prev => ({
        ...prev,
        location: address,
        longitude: lng,
        latitude: lat
      }));
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to get coordinates for the selected address");
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
            location: address,
            longitude: lng,
            latitude: lat
          }));
          setValue(address, false);
        }
      } catch (error) {
        console.error("Error getting address:", error);
        setError("Failed to get address for the selected location");
      }
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
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
              location: address,
              longitude: lng,
              latitude: lat
            }));
            setValue(address, false);
          }
        } catch (error) {
          console.error("Error getting address:", error);
          setError("Failed to get your current location address");
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setError("Error getting your current location. Please make sure you have granted location permissions.");
      }
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (result && typeof result === 'string') {
          setLogoPreview(result);
          setForm(prev => ({
            ...prev,
            logo: file
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let logo_url = form.logo_url;

      // If there's a new logo to upload
      if (form.logo && form.logo instanceof File) {
        // First delete the old logo from Cloudinary if it exists
        if (store.logo_url) {
          const matches = store.logo_url.match(/\/upload\/v\d+\/(.+)$/);
          if (matches && matches[1]) {
            const publicId = matches[1].replace(/\.[^/.]+$/, "");
            const cloudinaryApiUrl = process.env.NEXT_PUBLIC_CLOUDINARY_API_URL;
            
            try {
              const deleteResponse = await fetch(`${cloudinaryApiUrl}/api/cloudinary/delete`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ publicId }),
              });

              if (!deleteResponse.ok) {
                console.error('Failed to delete old logo:', await deleteResponse.text());
              }
            } catch (deleteError) {
              console.error('Error deleting old logo:', deleteError);
            }
          }
        }

        // Upload new logo using NEXT_PUBLIC_CLOUDINARY_API_URL
        const reader = new FileReader();
        const fileDataPromise = new Promise<string | ArrayBuffer | null>((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(form.logo as File);
        });
        
        const fileData = await fileDataPromise;
        if (typeof fileData === 'string') {
          const uploadResult = await uploadFile(fileData, "stores");
          logo_url = uploadResult.secure_url;
        }
      }

      // Make API call to update store using NEXT_PUBLIC_MYSQL_API_URL
      const apiUrl = process.env.NEXT_PUBLIC_MYSQL_API_URL;
      const requestBody = {
        name: form.name,
        category: form.category,
        logo_url: logo_url,
        location: form.location,
        longitude: form.longitude,
        latitude: form.latitude
      };

      console.log('Sending update request with body:', requestBody);
      
      const response = await fetch(`${apiUrl}/api/stores/${store.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Failed to update store: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} - ${errorText || 'No error details available'}`);
        }
      }

      let data;
      try {
        const responseText = await response.text();
        console.log('Raw server response:', responseText);
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse server response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      // Only call onSave if we have a valid response with store data
      if (!data || !data.store) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from server: missing store data');
      }

      // Update the store with the response data to ensure we have the latest state
      const updatedStore = {
        ...store,
        ...data.store,
        isPhotoMenu: store.isPhotoMenu,
        products: store.products,
        menuPhotos: store.menuPhotos
      };

      onSave(updatedStore);
      onClose();
    } catch (err) {
      console.error('Error updating store:', err);
      setError(err instanceof Error ? err.message : 'Failed to update store');
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
            <h2 className="text-lg font-medium text-gray-900">Edit Store</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Logo
              </label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => document.getElementById("logo-upload")?.click()}
                  className="relative cursor-pointer group"
                >
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
                    {logoPreview ? (
                      <>
                        <img
                          src={logoPreview}
                          alt="Store logo preview"
                          className="absolute inset-0 w-full h-full object-cover rounded-full"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center rounded-full">
                          <svg
                            className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
                placeholder="Enter store name"
                required
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
                required
              >
                <option value="">Select a category</option>
                {STORE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={!ready}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
                  placeholder={!ready ? "Loading..." : "Search for location"}
                  required
                />

                {/* Suggestions */}
                {status === "OK" && (
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
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Use Current Location
              </button>

              {/* Map */}
              <div className="h-[200px] rounded-lg overflow-hidden border border-gray-200">
                <GoogleMap
                  center={{ lat: form.latitude || 7.4478, lng: form.longitude || 125.8037 }}
                  zoom={15}
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  onClick={handleMapClick}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                >
                  <Marker
                    position={{ lat: form.latitude, lng: form.longitude }}
                    draggable={true}
                    onDragEnd={(e) => {
                      if (e.latLng) {
                        handleMapClick({
                          latLng: e.latLng,
                        } as google.maps.MapMouseEvent);
                      }
                    }}
                  />
                </GoogleMap>
              </div>

              {/* Selected Location Display */}
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  Selected Location: {form.location}
                </p>
              </div>

              {/* Coordinates Display */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    value={form.longitude}
                    onChange={(e) => setForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
                    placeholder="Enter longitude"
                    step="any"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    value={form.latitude}
                    onChange={(e) => setForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
                    placeholder="Enter latitude"
                    step="any"
                    required
                  />
                </div>
              </div>
            </div>

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
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 