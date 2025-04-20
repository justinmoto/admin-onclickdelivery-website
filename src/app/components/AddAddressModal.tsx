"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { GoogleMap, Marker } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { Store } from "../lib/types";
import { uploadFile } from "../lib/cloudinary";

// Define libraries array as a static constant
const libraries: ("places")[] = ["places"];

interface FormState {
  id: number;
  name: string;
  category: string;
  logo_url: string;
  location: string;
  logoPreview?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  logo: File | null;
  longitude?: number;
  latitude?: number;
}

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

export const AddAddressModal = ({
  isOpen,
  onClose,
  onSave,
}: AddAddressModalProps) => {
  const [form, setForm] = useState<FormState>({
    id: 0,
    name: "",
    category: "",
    logo_url: "",
    location: "",
    address: "",
    logo: null,
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
      componentRestrictions: { country: "PH" },
    },
    debounce: 300,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setForm((prev) => ({
        ...prev,
        address,
        coordinates: { lat, lng },
        longitude: lng,
        latitude: lat
      }));
    } catch (error) {
      console.error("Error:", error);
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
          setForm((prev) => ({
            ...prev,
            address,
            coordinates: { lat, lng },
            longitude: lng,
            latitude: lat
          }));
          setValue(address, false);
        }
      } catch (error) {
        console.error("Error getting address:", error);
      }
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
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
            setForm((prev) => ({
              ...prev,
              address,
              coordinates: { lat, lng },
              longitude: lng,
              latitude: lat
            }));
            setValue(address, false);
          }
        } catch (error) {
          console.error("Error getting address:", error);
          alert("Error getting your current location address");
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(
          "Error getting your current location. Please make sure you have granted location permissions."
        );
      }
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('File size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (result && typeof result === 'string') {
          console.log('Preview URL created');
          setForm((prev) => ({
            ...prev,
            logo: file,
            logoPreview: result
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let logo_url = '';
      
      // Upload logo to Cloudinary if exists
      if (form.logo instanceof File) {
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

      // Make API call to create store
      const apiUrl = process.env.MYSQL_API_URL;
      console.log('Making API call to:', `${apiUrl}/api/stores`);
      
      const response = await fetch(`${apiUrl}/api/stores`, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          logo_url: logo_url,
          location: form.address,
          longitude: form.longitude,
          latitude: form.latitude
        }),
      });

      if (!response.ok && response.status !== 0) {
        // With no-cors, we might get a status of 0 even for successful requests
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to create store: ${response.status} ${response.statusText}`);
      }

      // With no-cors mode, we can't read the response body
      // So we'll just assume success if we get here
      console.log('Store creation request sent');
      
      // Call the onSave prop with the store data
      onSave({
        tradeName: form.name,
        category: form.category,
        address: form.address || "",
        coordinates: form.coordinates,
        logo: form.logo instanceof File ? form.logo : undefined,
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Failed to create store. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] z-50">
      <div className="flex flex-col h-full bg-white/90 backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Add New Address
            </h2>
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
                    {form.logoPreview ? (
                      <>
                        <img
                          src={form.logoPreview}
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
                {form.logo && (
                  <p className="text-sm text-gray-500 truncate max-w-[200px]">
                    {form.logo.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
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
                Address
              </label>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={!ready}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-gray-900"
                  placeholder={
                    !ready ? "Loading..." : "Search for address"
                  }
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
                  center={form.coordinates || { lat: 7.4478, lng: 125.8037 }} // Default to Tagum City
                  zoom={15}
                  mapContainerStyle={{ width: "100%", height: "100%" }}
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
                            latLng: e.latLng,
                          } as google.maps.MapMouseEvent);
                        }
                      }}
                    />
                  )}
                </GoogleMap>
              </div>

              {/* Selected Address Display */}
              {form.address && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    Selected Address: {form.address}
                  </p>
                </div>
              )}

              {/* Coordinates Display */}
              {form.coordinates && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={form.longitude?.toFixed(6) || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={form.latitude?.toFixed(6) || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                    />
                  </div>
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
