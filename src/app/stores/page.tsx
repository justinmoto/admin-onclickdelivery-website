'use client'
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { AddProductModal } from '../components/AddProductModal';
import { AddAddressModal } from '../components/AddAddressModal';
import { ImportExcelModal } from '../components/ImportExcelModal';
import { AddMenuPhotosModal } from '../components/AddMenuPhotosModal';
import { DeliverySettingsModal } from '../components/DeliverySettingsModal';
import { EditProductModal } from '../components/EditProductModal';
import { Toast } from '../components/Toast';
import { ImageModal } from '../components/ImageModal';

interface Store {
  id: number;
  name: string;
  location: string;
  logo_url?: string;
  isPhotoMenu: boolean;
  products: Product[];
  menuPhotos?: MenuPhoto[];
  category?: string;
}

interface DeliveryFare {
  baseFare: number;
  ratePerKm: number;
  otherCharges: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  size?: string;
  photo?: string;
  image_url?: string;
}

interface MenuPhoto {
  id: number;
  url: string;
  thumbnail: string;
}

export default function Addresses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [isAddMenuPhotosModalOpen, setIsAddMenuPhotosModalOpen] = useState(false);
  const [isDeliverySettingsModalOpen, setIsDeliverySettingsModalOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<{ index: number; product: Product } | null>(null);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch menu items when a store is selected
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!selectedStore?.id) return;

      try {
        setError(null); // Clear any previous errors
        const apiUrl = process.env.API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/menu-items?store_id=${selectedStore.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // If no products found, set empty array instead of showing error
            setSelectedStore(prevStore => {
              if (!prevStore) return null;
              return {
                ...prevStore,
                products: []
              };
            });
            setStores(prevStores => 
              prevStores.map(store => 
                store.id === selectedStore.id 
                  ? { ...store, products: [] }
                  : store
              )
            );
            return;
          }
          throw new Error(`Failed to fetch menu items: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw API Response:', data);
        console.log('Menu Items Structure:', data.menuItems ? data.menuItems[0] : 'No items');

        // If menuItems is null/undefined or empty array, set empty array
        const menuItems = data.menuItems || [];
        
        // Debug log to check product data
        console.log('Menu items with photos:', menuItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          photo: item.image_url,
          photoUrl: item.image_url ? `Complete photo URL: ${item.image_url}` : 'No photo'
        })));

        // Ensure all required fields are present and photo URLs are properly formatted
        const validatedMenuItems = menuItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          size: item.size || undefined,
          photo: item.image_url,
          image_url: item.image_url
        }));

        console.log('Validated menu items:', validatedMenuItems);

        // Update the selected store's products
        setSelectedStore(prevStore => {
          if (!prevStore) return null;
          return {
            ...prevStore,
            products: validatedMenuItems
          };
        });

        // Update the store in the stores array
        setStores(prevStores => 
          prevStores.map(store => 
            store.id === selectedStore.id 
              ? { ...store, products: validatedMenuItems }
              : store
          )
        );
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('No products available');
      }
    };

    fetchMenuItems();
  }, [selectedStore?.id]); // Re-fetch when selected store changes

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const apiUrl = process.env.API_URL || 'http://localhost:3001';
        
        // Log the API URL for debugging
        console.log('API URL from env:', apiUrl);
        
        if (!apiUrl) {
          console.error('API URL is not configured in environment variables');
          throw new Error('API URL is not configured');
        }

        const url = `${apiUrl}/api/stores`;
        console.log('Fetching stores from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          throw new Error(`Failed to fetch stores: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received stores data:', data);
        
        if (!data.stores || !Array.isArray(data.stores)) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format: stores array not found');
        }

        const formattedStores = data.stores.map((store: any) => ({
          ...store,
          isPhotoMenu: false,
          products: [],
          menuPhotos: []
        }));
        
        setStores(formattedStores);
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stores');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuIndex !== null) {
        const menu = document.getElementById(`product-menu-${openMenuIndex}`);
        if (menu && !menu.contains(event.target as Node)) {
          setOpenMenuIndex(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuIndex]);

  const handleTogglePhotoMenu = (store: Store) => {
    const updatedStores = stores.map(s => {
      if (s.id === store.id) {
        return { ...s, isPhotoMenu: !s.isPhotoMenu };
      }
      return s;
    });
    setStores(updatedStores);
    setSelectedStore(prevStore => 
      prevStore ? { ...prevStore, isPhotoMenu: !prevStore.isPhotoMenu } : null
    );
  };

  const handleAddProduct = async (product: { name: string; price: number; photo?: File }) => {
    if (!selectedStore) return;

    // Get the highest existing product ID
    const highestId = selectedStore.products.reduce((max, product) => 
      Math.max(max, product.id), 0);

    const newProduct: Product = {
      id: highestId + 1,
      name: product.name,
      price: product.price,
      photo: product.photo ? URL.createObjectURL(product.photo) : undefined,
      image_url: product.photo ? URL.createObjectURL(product.photo) : undefined
    };

    // Optimistically update the UI
    setStores(prevStores =>
      prevStores.map(store =>
        store.id === selectedStore.id
          ? {
              ...store,
              products: [...store.products, newProduct],
            }
          : store
      )
    );

    setSelectedStore(prevStore => 
      prevStore ? {
        ...prevStore,
        products: [...prevStore.products, newProduct]
      } : null
    );

    setIsAddProductModalOpen(false);
    showToast('Product added successfully!');

    // Refetch menu items to get the updated list from the server
    try {
      const apiUrl = process.env.API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/menu-items?store_id=${selectedStore.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch updated menu items: ${response.status}`);
      }

      const data = await response.json();
      
      // Update with the fresh data from the server
      const validatedMenuItems = (data.menuItems || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        size: item.size || undefined,
        photo: item.image_url,
        image_url: item.image_url
      }));

      setStores(prevStores => 
        prevStores.map(store => 
          store.id === selectedStore.id 
            ? { ...store, products: validatedMenuItems }
            : store
        )
      );

      setSelectedStore(prevStore => {
        if (!prevStore) return null;
        return {
          ...prevStore,
          products: validatedMenuItems
        };
      });
    } catch (err) {
      console.error('Error fetching updated menu items:', err);
      // Don't show error to user since this is just a refresh operation
    }
  };

  const handleAddMenuPhotos = (photos: File[]) => {
    if (!selectedStore) return;

    // Get the current highest photo ID or start from 0
    const currentHighestId = selectedStore.menuPhotos?.length ?? 0;

    // Create temporary URLs for the uploaded photos with sequential IDs
    const newPhotos = photos.map((photo, index) => ({
      id: currentHighestId + index + 1, // Start from next number
      url: URL.createObjectURL(photo),
      thumbnail: URL.createObjectURL(photo)
    }));

    const updatedStores = stores.map(store => {
      if (store.id === selectedStore.id) {
        return {
          ...store,
          menuPhotos: [...(store.menuPhotos || []), ...newPhotos]
        };
      }
      return store;
    });

    setStores(updatedStores);
    setSelectedStore(prevStore => 
      prevStore ? {
        ...prevStore,
        menuPhotos: [...(prevStore.menuPhotos || []), ...newPhotos]
      } : null
    );
    setIsAddMenuPhotosModalOpen(false);
    showToast(`${photos.length} menu photo${photos.length > 1 ? 's' : ''} added successfully!`);
  };

  const handleRemovePhoto = (photoId: number) => {
    if (!selectedStore) return;

    const updatedStores = stores.map(store => {
      if (store.id === selectedStore.id) {
        return {
          ...store,
          menuPhotos: store.menuPhotos?.filter(photo => photo.id !== photoId)
        };
      }
      return store;
    });

    setStores(updatedStores);
    setSelectedStore(prevStore => 
      prevStore ? {
        ...prevStore,
        menuPhotos: prevStore.menuPhotos?.filter(photo => photo.id !== photoId)
      } : null
    );
  };

  const handleAddAddress = (address: { 
    tradeName: string; 
    category: string; 
    address: string; 
    coordinates?: { lat: number; lng: number };
    logo?: File;
  }) => {
    // Find the highest existing ID in the stores array
    const highestId = stores.reduce((max, store) => Math.max(max, store.id), 0);
    
    const newStore: Store = {
      id: highestId + 1, // Use highest existing ID + 1
      name: address.tradeName,
      location: address.address,
      category: address.category,
      logo_url: address.logo ? URL.createObjectURL(address.logo) : undefined,
      isPhotoMenu: false,
      products: [],
      menuPhotos: []
    };

    setStores(prevStores => [...prevStores, newStore]);
    setIsAddAddressModalOpen(false);
    showToast('Store added successfully!');
  };

  const handleSaveDeliverySettings = (settings: DeliveryFare) => {
    console.log('Saving delivery settings:', settings);
    // Implementation for saving delivery settings
  };

  const handleEditProduct = (index: number, product: Product) => {
    setSelectedProduct({ index, product });
    setIsEditProductModalOpen(true);
  };

  const showToast = (message: string) => {
    setSuccessMessage(message);
    setIsToastVisible(true);
  };

  const handleSaveEditedProduct = (editedProduct: { name: string; price: number; photo?: File }) => {
    if (!selectedStore || !selectedProduct) return;

    const updatedProduct: Product = {
      id: selectedProduct.product.id,
      name: editedProduct.name,
      price: editedProduct.price,
      photo: editedProduct.photo ? URL.createObjectURL(editedProduct.photo) : selectedProduct.product.photo,
    };

    setStores(prevStores =>
      prevStores.map(store =>
        store.id === selectedStore.id
          ? {
              ...store,
              products: store.products.map((p, i) =>
                i === selectedProduct.index ? updatedProduct : p
              ),
            }
          : store
      )
    );

    setIsEditProductModalOpen(false);
    setSelectedProduct(null);
    showToast('Product updated successfully!');
  };

  const handleDeleteProduct = (index: number) => {
    if (!selectedStore) return;

    const updatedStores = stores.map(store => {
      if (store.id === selectedStore.id) {
        const updatedProducts = store.products.filter((_, i) => i !== index);
        return {
          ...store,
          products: updatedProducts
        };
      }
      return store;
    });

    setStores(updatedStores);
    setSelectedStore(prevStore => 
      prevStore ? {
        ...prevStore,
        products: prevStore.products.filter((_, i) => i !== index)
      } : null
    );
    showToast('Product deleted successfully!');
  };

  return (
    <>
      <Head>
        <title>Addresses - OneClick Delivery Admin</title>
      </Head>
      <div className="min-h-screen flex bg-white relative">
        {/* Left Side - Store List */}
        <div className="w-96 border-r border-gray-200">
          <div className="border-b border-gray-200">
            <div className="px-4 pt-4 pb-2">
              <h1 className="text-xl font-medium text-gray-900">Stores</h1>
            </div>
            <div className="px-4 pb-4 flex items-center">
              <button 
                onClick={() => setIsDeliverySettingsModalOpen(true)}
                className="px-4 py-2 bg-gray-100 rounded text-sm font-medium text-gray-700 hover:bg-gray-200 mr-3"
              >
                Options
              </button>
              <button 
                onClick={() => setIsAddAddressModalOpen(true)}
                className="px-4 py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-800"
              >
                + Add Address
              </button>
            </div>
          </div>
          <div className="p-4">
            <input
              type="text"
              placeholder="Search Addresses"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </div>
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-600">Loading stores...</div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-600">{error}</div>
            ) : filteredStores.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-600">No stores found</div>
            ) : (
              filteredStores.map((store) => (
                <div
                  key={store.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between border-l-4 ${
                    selectedStore?.id === store.id 
                      ? 'bg-gray-100 border-black' 
                      : 'border-transparent hover:border-gray-200'
                  }`}
                  onClick={() => {
                    if (selectedStore?.id === store.id) {
                      setSelectedStore(null);
                    } else {
                      setSelectedStore(store);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {store.logo_url ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                        <Image
                          src={store.logo_url}
                          alt={store.name}
                          width={32}
                          height={32}
                          unoptimized
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                        <span className="text-sm text-gray-500">
                          {store.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-900 truncate">{store.name}</span>
                        <span className="text-xs text-gray-500">📍</span>
                      </div>
                      {store.category && (
                        <span className="text-xs text-gray-500 truncate block">{store.category}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Store Details */}
        <div className="flex-1">
          {selectedStore ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  {selectedStore.logo_url && (
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border border-gray-200">
                      <Image
                        src={selectedStore.logo_url}
                        alt={selectedStore.name}
                        width={48}
                        height={48}
                        unoptimized
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">{selectedStore.name}</h2>
                    <p className="text-sm text-gray-500">{selectedStore.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {!selectedStore.isPhotoMenu && (
                    <button
                      onClick={() => {
                        if (selectedStore?.id) {
                          setIsAddProductModalOpen(true);
                        } else {
                          showToast('Please select a store first');
                        }
                      }}
                      className="px-3 py-1.5 bg-black text-white rounded text-sm font-medium hover:bg-gray-800"
                    >
                      + Add Product
                    </button>
                  )}
                </div>
              </div>

              {/* Photo Menu Switch */}
              <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Switch to photo menus</h3>
                    <p className="text-sm text-gray-600">
                      Use menu images instead of a list of products. Switching will not delete saved products.{' '}
                      <a href="#" className="text-gray-900 hover:text-black underline">
                        Learn more
                      </a>
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={selectedStore.isPhotoMenu}
                      onChange={() => handleTogglePhotoMenu(selectedStore)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
              </div>

              {/* Content Area */}
              {selectedStore.isPhotoMenu ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Menu Photos</h3>
                    <button
                      onClick={() => setIsAddMenuPhotosModalOpen(true)}
                      className="text-gray-700 hover:text-black text-sm font-medium"
                    >
                      + Add more photos
                    </button>
                  </div>
                  <div className="space-y-4">
                    {selectedStore.menuPhotos?.map((photo) => (
                      <div key={photo.id} className="relative bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full text-sm font-medium">
                              {photo.id.toString().padStart(2, '0')}
                            </div>
                            <div className="w-32 h-40 relative">
                              <Image
                                src={photo.thumbnail}
                                alt={`Menu page ${photo.id}`}
                                layout="fill"
                                objectFit="cover"
                                className="rounded border border-gray-200"
                                unoptimized
                              />
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-12 gap-4 py-2 border-b border-gray-200">
                    <div className="col-span-8 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</div>
                    <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</div>
                    <div className="col-span-1"></div>
                  </div>
                  {selectedStore.products.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-500 text-sm">No products available</p>
                    </div>
                  ) : (
                    selectedStore.products.map((product) => (
                      <div
                        key={product.id}
                        className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100 items-center hover:bg-gray-50"
                      >
                        <div className="col-span-8 flex items-center space-x-3">
                          {product.photo && (
                            <div 
                              className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedImage({ url: product.photo!, alt: product.name })}
                            >
                              <Image
                                src={product.photo}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                                sizes="(max-width: 768px) 64px, 64px"
                                priority
                              />
                            </div>
                          )}
                          <span className="text-sm text-gray-900">
                            {product.name} {product.size && `- ${product.size}`}
                          </span>
                        </div>
                        <div className="col-span-3 text-sm text-gray-900">₱{product.price.toFixed(2)}</div>
                        <div className="col-span-1 text-right">
                          <div className="relative">
                            <button 
                              onClick={() => setOpenMenuIndex(openMenuIndex === product.id ? null : product.id)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                              </svg>
                            </button>
                            {openMenuIndex === product.id && (
                              <div 
                                id={`product-menu-${product.id}`}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                              >
                                <button
                                  onClick={() => {
                                    handleEditProduct(selectedStore.products.findIndex(p => p.id === product.id), product);
                                    setOpenMenuIndex(null);
                                  }}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  Edit Product
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteProduct(selectedStore.products.findIndex(p => p.id === product.id));
                                    setOpenMenuIndex(null);
                                  }}
                                  className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left border-t border-gray-100"
                                >
                                  Delete Product
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="text-sm">Select a store to view details</p>
            </div>
          )}
        </div>

        {/* Add Product Panel */}
        {isAddProductModalOpen && selectedStore?.id && (
          <>
            <div 
              className="fixed inset-0 bg-black/5 z-40"
              onClick={() => setIsAddProductModalOpen(false)}
            />
            <AddProductModal
              isOpen={isAddProductModalOpen}
              onClose={() => setIsAddProductModalOpen(false)}
              onSave={handleAddProduct}
              storeId={selectedStore.id}
            />
          </>
        )}

        {/* Add Address Panel */}
        {isAddAddressModalOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/5 z-40"
              onClick={() => setIsAddAddressModalOpen(false)}
            />
            <AddAddressModal
              isOpen={isAddAddressModalOpen}
              onClose={() => setIsAddAddressModalOpen(false)}
              onSave={handleAddAddress}
            />
          </>
        )}

        {/* Add Menu Photos Panel */}
        {isAddMenuPhotosModalOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/5 z-40"
              onClick={() => setIsAddMenuPhotosModalOpen(false)}
            />
            <AddMenuPhotosModal
              isOpen={isAddMenuPhotosModalOpen}
              onClose={() => setIsAddMenuPhotosModalOpen(false)}
              onSave={handleAddMenuPhotos}
            />
          </>
        )}

        {/* Delivery Settings Modal */}
        {isDeliverySettingsModalOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/5 z-40"
              onClick={() => setIsDeliverySettingsModalOpen(false)}
            />
            <DeliverySettingsModal
              isOpen={isDeliverySettingsModalOpen}
              onClose={() => setIsDeliverySettingsModalOpen(false)}
              onSave={handleSaveDeliverySettings}
            />
          </>
        )}

        {/* Edit Product Modal */}
        {isEditProductModalOpen && selectedProduct && (
          <>
            <div 
              className="fixed inset-0 bg-black/5 z-40"
              onClick={() => setIsEditProductModalOpen(false)}
            />
            <EditProductModal
              isOpen={isEditProductModalOpen}
              onClose={() => setIsEditProductModalOpen(false)}
              onSave={handleSaveEditedProduct}
              product={selectedProduct.product}
            />
          </>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <ImageModal
            isOpen={!!selectedImage}
            onClose={() => setSelectedImage(null)}
            imageUrl={selectedImage.url}
            altText={selectedImage.alt}
          />
        )}

        {/* Toast */}
        <Toast
          message={successMessage}
          isVisible={isToastVisible}
          onClose={() => setIsToastVisible(false)}
          type="success"
        />
      </div>
    </>
  );
} 