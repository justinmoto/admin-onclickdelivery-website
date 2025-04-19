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
import { EditStoreModal } from '../components/EditStoreModal';
import { DeleteStoreModal } from '../components/DeleteStoreModal';
import { toast } from 'react-hot-toast';

interface Store {
  id: number;
  name: string;
  location: string;
  logo_url?: string;
  isPhotoMenu: boolean;
  products: Product[];
  menuPhotos?: MenuPhoto[];
  category: string;
  longitude: number;
  latitude: number;
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
  const [isDeletingPhoto, setIsDeletingPhoto] = useState<number | null>(null);
  const [openStoreMenuId, setOpenStoreMenuId] = useState<number | null>(null);
  const [isDeletingStore, setIsDeletingStore] = useState<number | null>(null);
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<Store | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);

  const apiUrl = process.env.MYSQL_API_URL || 'http://localhost:3001';

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch menu items when a store is selected
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!selectedStore?.id) return;

      try {
        setError(null); // Clear any previous errors
        const apiUrl = process.env.MYSQL_API_URL || 'http://localhost:3001';
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

    const fetchMenuPhotos = async () => {
      if (!selectedStore?.id) return;

      try {
        const apiUrl = process.env.MYSQL_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/menu-photos?store_id=${selectedStore.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // If no photos found, set empty array
            setSelectedStore(prevStore => {
              if (!prevStore) return null;
              return {
                ...prevStore,
                menuPhotos: []
              };
            });
            return;
          }
          throw new Error(`Failed to fetch menu photos: ${response.status}`);
        }

        const data = await response.json();
        console.log('Menu Photos Response:', data);

        // Ensure menuPhotos is an array
        const menuPhotos = data.menuPhotos || [];

        // Update the selected store's menu photos
        setSelectedStore(prevStore => {
          if (!prevStore) return null;
          return {
            ...prevStore,
            menuPhotos: menuPhotos.map((photo: any) => ({
              id: photo.id,
              url: photo.photo_url,
              thumbnail: photo.photo_url
            }))
          };
        });

        // Update the store in the stores array
        setStores(prevStores => 
          prevStores.map(store => 
            store.id === selectedStore.id 
              ? { 
                  ...store, 
                  menuPhotos: menuPhotos.map((photo: any) => ({
                    id: photo.id,
                    url: photo.photo_url,
                    thumbnail: photo.photo_url
                  }))
                }
              : store
          )
        );
      } catch (err) {
        console.error('Error fetching menu photos:', err);
        // Don't set error state for photos, just log it
      }
    };

    fetchMenuItems();
    fetchMenuPhotos(); // Call the new function
  }, [selectedStore?.id]); // Re-fetch when selected store changes

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const apiUrl = process.env.MYSQL_API_URL || 'http://localhost:3001';
        
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

  const handleAddProduct = async (product: { name: string; price: number }) => {
    if (!selectedStore) return;

    // Get the highest existing product ID
    const highestId = selectedStore.products.reduce((max, product) => 
      Math.max(max, product.id), 0);

    const newProduct: Product = {
      id: highestId + 1,
      name: product.name,
      price: product.price
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
      const apiUrl = process.env.MYSQL_API_URL || 'http://localhost:3001';
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
        price: item.price
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

  const handleRemovePhoto = async (photoId: number) => {
    if (!selectedStore) return;

    try {
      setIsDeletingPhoto(photoId); // Set loading state
      const apiUrl = process.env.MYSQL_API_URL || 'http://localhost:3001';
      const nextApiUrl = process.env.CLOUDINARY_API_URL || 'http://localhost:3002';
      console.log('Deleting photo with ID:', photoId);

      // Get photo URL from local state
      const photo = selectedStore.menuPhotos?.find(p => p.id === photoId);
      if (!photo) {
        throw new Error('Photo not found in local state');
      }

      // Extract public ID from Cloudinary URL
      const matches = photo.url.match(/\/upload\/v\d+\/(.+)$/);
      if (!matches) {
        throw new Error('Invalid Cloudinary URL format');
      }
      const publicId = matches[1].replace(/\.[^/.]+$/, ""); // Remove file extension

      // Delete from Cloudinary first using this project's API
      const cloudinaryResponse = await fetch(`${nextApiUrl}/api/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ publicId })
      });

      if (!cloudinaryResponse.ok) {
        throw new Error('Failed to delete photo from Cloudinary');
      }

      // Then delete from database using the other API
      const deleteResponse = await fetch(`${apiUrl}/api/menu-photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete menu photo from database: ${deleteResponse.status}`);
      }

      // Update local state after successful deletion
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
      
      showToast('Menu photo deleted successfully!');
    } catch (err) {
      console.error('Error deleting menu photo:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete menu photo. Please try again.');
    } finally {
      setIsDeletingPhoto(null); // Clear loading state
    }
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
      id: highestId + 1,
      name: address.tradeName,
      location: address.address,
      category: address.category,
      logo_url: address.logo ? URL.createObjectURL(address.logo) : undefined,
      isPhotoMenu: false,
      products: [],
      menuPhotos: [],
      longitude: address.coordinates?.lng || 0,
      latitude: address.coordinates?.lat || 0
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

  const handleSaveEditedProduct = (editedProduct: { name: string; price: number }) => {
    if (!selectedStore || !selectedProduct) return;

    const updatedProduct: Product = {
      id: selectedProduct.product.id,
      name: editedProduct.name,
      price: editedProduct.price
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

  const handleDeleteClick = (store: Store) => {
    setStoreToDelete(store);
    setIsDeleteModalOpen(true);
    setOpenStoreMenuId(null);
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;

    try {
      setIsDeletingStore(storeToDelete.id);

      // First, delete the logo from Cloudinary if it exists
      if (storeToDelete.logo_url) {
        const matches = storeToDelete.logo_url.match(/\/upload\/v\d+\/(.+)$/);
        if (matches && matches[1]) {
          const publicId = matches[1].replace(/\.[^/.]+$/, "");
          const cloudinaryApiUrl = process.env.CLOUDINARY_API_URL;
          
          try {
            const deleteResponse = await fetch(`${cloudinaryApiUrl}/api/delete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ publicId }),
            });

            if (!deleteResponse.ok) {
              console.error('Failed to delete store logo from Cloudinary:', await deleteResponse.text());
            }
          } catch (deleteError) {
            console.error('Error deleting store logo from Cloudinary:', deleteError);
          }
        }
      }
      
      // Then delete the store from the database
      const apiUrl = process.env.MYSQL_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/stores/${storeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete store: ${response.status}`);
      }

      // Remove store from state
      setStores(prevStores => prevStores.filter(store => store.id !== storeToDelete.id));
      if (selectedStore?.id === storeToDelete.id) {
        setSelectedStore(null);
      }
      showToast('Store deleted successfully!');
    } catch (err) {
      console.error('Error deleting store:', err);
      showToast(err instanceof Error ? err.message : 'Failed to delete store');
    } finally {
      setIsDeletingStore(null);
      setIsDeleteModalOpen(false);
      setStoreToDelete(null);
    }
  };

  const handleEditStore = (store: Store) => {
    setStoreToEdit(store);
    setIsEditStoreModalOpen(true);
    setOpenStoreMenuId(null);
  };

  const handleSaveEditedStore = async (updatedStore: Store) => {
    try {
      // Only update the UI after successful API response from EditStoreModal
      setStores(prevStores =>
        prevStores.map(store =>
          store.id === updatedStore.id ? updatedStore : store
        )
      );
      if (selectedStore?.id === updatedStore.id) {
        setSelectedStore(updatedStore);
      }
      setIsEditStoreModalOpen(false);
      showToast('Store updated successfully!');
    } catch (err) {
      console.error('Error updating store:', err);
      showToast(err instanceof Error ? err.message : 'Failed to update store');
    }
  };

  const handleImportProducts = async (products: Array<{ name: string; price: number }>) => {
    try {
      if (!selectedStore) {
        toast.error('Please select a store first');
        return;
      }

      const apiUrl = process.env.MYSQL_API_URL || 'http://localhost:3001';
      const importedProducts: Array<Product> = [];

      // Add products one at a time
      for (const product of products) {
        try {
          // Ensure price is a valid number
          const price = Number(product.price);
          if (isNaN(price)) {
            toast.error(`Invalid price for product: ${product.name}`);
            continue;
          }

          const response = await fetch(`${apiUrl}/api/menu-items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: product.name,
              price: price,
              store_id: selectedStore.id
            }),
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error('Error response:', errorData);
            throw new Error(`Failed to import product: ${product.name}`);
          }

          const result = await response.json();
          if (result.menuItem) {
            // Ensure the imported product has a valid price
            const importedProduct: Product = {
              id: result.menuItem.id,
              name: result.menuItem.name,
              price: Number(result.menuItem.price) || 0
            };
            importedProducts.push(importedProduct);
          }
        } catch (productError) {
          console.error('Error importing product:', productError);
          toast.error(`Failed to import: ${product.name}`);
          // Continue with next product
          continue;
        }
      }

      if (importedProducts.length > 0) {
        // Fetch the updated menu items from the server
        const menuItemsResponse = await fetch(`${apiUrl}/api/menu-items?store_id=${selectedStore.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (!menuItemsResponse.ok) {
          throw new Error('Failed to fetch updated menu items');
        }

        const menuItemsData = await menuItemsResponse.json();
        const updatedMenuItems = menuItemsData.menuItems || [];

        // Update the UI with the fresh data from the server
        setStores(prevStores =>
          prevStores.map(store =>
            store.id === selectedStore.id
              ? {
                  ...store,
                  products: updatedMenuItems
                }
              : store
          )
        );

        setSelectedStore(prevStore => 
          prevStore ? {
            ...prevStore,
            products: updatedMenuItems
          } : null
        );

        toast.success(`Successfully imported ${importedProducts.length} products`);
      } else {
        toast.error('No products were imported successfully');
      }
      
      setIsImportExcelModalOpen(false);
    } catch (error) {
      console.error('Error importing products:', error);
      toast.error('Failed to import products. Please try again.');
    }
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
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
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
                  <div className="relative flex-shrink-0 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenStoreMenuId(openStoreMenuId === store.id ? null : store.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full"
                      disabled={isDeletingStore === store.id}
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                    {openStoreMenuId === store.id && (
                      <div 
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStore(store);
                          }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Edit Store
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(store);
                          }}
                          className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left border-t border-gray-100"
                        >
                          Delete Store
                        </button>
                      </div>
                    )}
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
                    <>
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
                      <button
                        onClick={() => {
                          if (!selectedStore) {
                            toast.error('Please select a store first');
                            return;
                          }
                          setIsImportExcelModalOpen(true);
                        }}
                        className="ml-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                      >
                        Import Excel
                      </button>
                    </>
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
                            <div 
                              className="w-32 h-40 relative cursor-pointer"
                              onClick={() => setSelectedImage({ url: photo.url, alt: `Menu page ${photo.id}` })}
                            >
                              <Image
                                src={photo.thumbnail}
                                alt={`Menu page ${photo.id}`}
                                layout="fill"
                                objectFit="cover"
                                className="rounded border border-gray-200"
                                unoptimized
                              />
                              {isDeletingPhoto === photo.id && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemovePhoto(photo.id)}
                            className={`absolute top-4 right-4 text-gray-400 hover:text-gray-600 ${isDeletingPhoto === photo.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isDeletingPhoto === photo.id}
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
                    selectedStore.products.map((product, index) => (
                      <div
                        key={`product-${product.id}-${index}`}
                        className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100 items-center hover:bg-gray-50"
                      >
                        <div className="col-span-8 flex items-center">
                          <span className="text-sm text-gray-900">
                            {product.name}
                          </span>
                        </div>
                        <div className="col-span-3 text-sm text-gray-900">
                          ₱{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                        </div>
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
                                key={`menu-${product.id}`}
                                id={`product-menu-${product.id}`}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                              >
                                <button
                                  onClick={() => {
                                    handleEditProduct(index, product);
                                    setOpenMenuIndex(null);
                                  }}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  Edit Product
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteProduct(index);
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
              storeId={selectedStore?.id || 0}
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

        {/* Edit Store Modal */}
        {isEditStoreModalOpen && storeToEdit && (
          <>
            <div 
              className="fixed inset-0 bg-black/5 z-40"
              onClick={() => setIsEditStoreModalOpen(false)}
            />
            <EditStoreModal
              isOpen={isEditStoreModalOpen}
              onClose={() => setIsEditStoreModalOpen(false)}
              onSave={handleSaveEditedStore}
              store={storeToEdit}
            />
          </>
        )}

        {/* Toast */}
        <Toast
          message={successMessage}
          isVisible={isToastVisible}
          onClose={() => setIsToastVisible(false)}
          type="success"
        />

        {/* Image Modal */}
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage?.url || ''}
          altText={selectedImage?.alt || ''}
        />

        {/* Delete Store Modal */}
        <DeleteStoreModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setStoreToDelete(null);
          }}
          onConfirm={handleDeleteStore}
          storeName={storeToDelete?.name || ''}
          isLoading={isDeletingStore === storeToDelete?.id}
        />

        {/* Import Excel Modal */}
        {isImportExcelModalOpen && selectedStore?.id && (
          <>
            <div 
              className="fixed inset-0 bg-black/5 z-40"
              onClick={() => setIsImportExcelModalOpen(false)}
            />
            <ImportExcelModal
              isOpen={isImportExcelModalOpen}
              onClose={() => setIsImportExcelModalOpen(false)}
              onImport={handleImportProducts}
              storeId={selectedStore.id}
            />
          </>
        )}
      </div>
    </>
  );
} 