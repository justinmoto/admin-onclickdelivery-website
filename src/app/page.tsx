'use client'
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { AddProductModal } from './components/AddProductModal';
import { AddAddressModal } from './components/AddAddressModal';
import { ImportExcelModal } from './components/ImportExcelModal';
import { AddMenuPhotosModal } from './components/AddMenuPhotosModal';
import { DeliverySettingsModal } from './components/DeliverySettingsModal';
import { EditProductModal } from './components/EditProductModal';
import { Toast } from './components/Toast';
import { ImageModal } from './components/ImageModal';
import { EditStoreModal } from './components/EditStoreModal';
import { DeleteStoreModal } from './components/DeleteStoreModal';
import { toast } from 'react-hot-toast';
import { DeleteProductModal } from './components/DeleteProductModal';
import { BulkDeleteModal } from './components/BulkDeleteModal';

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
  email?: string;
  phone_number?: string;
}

interface DeliveryFare {
  base_fare: number;
  rate_per_km: number;
  other_charges: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  size?: string;
  image_url?: string;
  store_id: number;
  created_at?: string;
  updated_at?: string;
}

interface MenuPhoto {
  id: number;
  url: string;
  thumbnail: string;
}

interface ApiMenuItem {
  id: number;
  name: string;
  price: number;
  size?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface ApiMenuPhoto {
  id: number;
  photo_url: string;
}

interface ApiStore {
  id: number;
  name: string;
  location: string;
  logo_url?: string;
  category: string;
  longitude: number;
  latitude: number;
  email?: string;
  phone_number?: string;
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
  const [isMenuItemsLoading, setIsMenuItemsLoading] = useState(false);
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
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ index: number; product: Product } | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch menu items when a store is selected
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!selectedStore?.id) return;

      try {
        setIsMenuItemsLoading(true);
        setError(null); // Clear any previous errors
        const response = await fetch(`/api/menu-items?store_id=${selectedStore.id}`, {
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
        // If menuItems is null/undefined or empty array, set empty array
        const menuItems = data.menuItems || [];
        
        // Ensure all required fields are present and photo URLs are properly formatted
        const validatedMenuItems = menuItems.map((item: ApiMenuItem) => ({
          id: item.id,
          name: item.name,
          price: parseFloat(String(item.price)),
          size: item.size || undefined,
          photo: item.image_url,
          image_url: item.image_url,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));

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
      } finally {
        setIsMenuItemsLoading(false);
      }
    };

    const fetchMenuPhotos = async () => {
      if (!selectedStore?.id) return;

      try {
        const response = await fetch(`/api/menu-photos?store_id=${selectedStore.id}`, {
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
        // console.log('Menu Photos Response:', data);

        // Ensure menuPhotos is an array
        const menuPhotos = data.menuPhotos || [];

        // Update the selected store's menu photos
        setSelectedStore(prevStore => {
          if (!prevStore) return null;
          return {
            ...prevStore,
            menuPhotos: menuPhotos.map((photo: ApiMenuPhoto) => ({
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
                  menuPhotos: menuPhotos.map((photo: ApiMenuPhoto) => ({
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
        
        const url = `/api/stores`;
        // console.log('Fetching stores from:', url);
        
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
        // console.log('Received stores data:', data);
        
        if (!data.stores || !Array.isArray(data.stores)) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format: stores array not found');
        }

        const formattedStores = data.stores.map((store: ApiStore) => ({
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
      price: product.price,
      store_id: selectedStore.id
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
      const response = await fetch(`/api/menu-items?store_id=${selectedStore.id}`, {
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
      const validatedMenuItems = (data.menuItems || []).map((item: ApiMenuItem) => ({
        id: item.id,
        name: item.name,
        price: parseFloat(String(item.price))
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

      // Get photo URL from local state
      const photo = selectedStore.menuPhotos?.find(p => p.id === photoId);
      if (!photo) {
        throw new Error('Photo not found in local state');
      }

      // Only try to delete from Cloudinary if it's a Cloudinary URL
      if (photo.url.includes('cloudinary.com')) {
        try {
          // Extract public ID from Cloudinary URL
          const matches = photo.url.match(/\/upload\/v\d+\/(.+)$/);
          if (matches) {
            const publicId = matches[1].replace(/\.[^/.]+$/, ""); // Remove file extension

            // Delete from Cloudinary
            const cloudinaryResponse = await fetch(`/api/delete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ publicId })
            });

            if (!cloudinaryResponse.ok) {
              console.error('Failed to delete photo from Cloudinary, continuing with database deletion');
            }
          }
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError);
          // Continue with database deletion even if Cloudinary deletion fails
        }
      }

      // Delete from database
      const deleteResponse = await fetch(`/api/menu-photos/${photoId}`, {
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
    email?: string;
    phone_number?: string;
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
      latitude: address.coordinates?.lat || 0,
      email: address.email,
      phone_number: address.phone_number
    };

    setStores(prevStores => [...prevStores, newStore]);
    setIsAddAddressModalOpen(false);
    showToast('Store added successfully!');
  };

  const handleSaveDeliverySettings = async (settings: DeliveryFare) => {
    try {
      const response = await fetch('/api/fare-rates/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) throw new Error('Failed to save delivery settings');
      showToast('Delivery settings updated successfully');
      setIsDeliverySettingsModalOpen(false);
    } catch (error) {
      console.error('Error saving delivery settings:', error);
      toast.error('Failed to save delivery settings');
    }
  };

  const handleEditProduct = (index: number, product: Product) => {
    if (!selectedStore) return;
    
    // Ensure store_id is included in the product data
    const productWithStoreId = {
      ...product,
      store_id: selectedStore.id
    };
    
    setSelectedProduct({ index, product: productWithStoreId });
    setIsEditProductModalOpen(true);
  };

  const showToast = (message: string) => {
    setSuccessMessage(message);
    setIsToastVisible(true);
  };

  const handleSaveEditedProduct = async (editedProduct: { name: string; price: number }) => {
    if (!selectedStore || !selectedProduct) return;

    try {
      const response = await fetch(`/api/menu-items/${selectedProduct.product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedProduct.name,
          price: editedProduct.price,
          store_id: selectedStore.id
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.status}`);
      }

      const updatedProduct = await response.json();

      // Update local state with the response from the server
      const productToUpdate: Product = {
        id: updatedProduct.menuItem.id,
        name: updatedProduct.menuItem.name,
        price: parseFloat(String(updatedProduct.menuItem.price)),
        store_id: selectedStore.id
      };

      setStores(prevStores =>
        prevStores.map(store =>
          store.id === selectedStore.id
            ? {
                ...store,
                products: store.products.map((p, i) =>
                  i === selectedProduct.index ? productToUpdate : p
                ),
              }
            : store
        )
      );

      setSelectedStore(prevStore => {
        if (!prevStore) return null;
        return {
          ...prevStore,
          products: prevStore.products.map((p, i) =>
            i === selectedProduct.index ? productToUpdate : p
          ),
        };
      });

      setIsEditProductModalOpen(false);
      setSelectedProduct(null);
      showToast('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update product');
    }
  };

  const handleDeleteClick = (index: number, product: Product) => {
    setProductToDelete({ index, product });
    setIsDeleteProductModalOpen(true);
    setOpenMenuIndex(null);
  };

  const handleDeleteProduct = async () => {
    if (!selectedStore || !productToDelete) return;
    
    try {
      setIsDeletingProduct(productToDelete.product.id);
      const response = await fetch(`/api/menu-items/${productToDelete.product.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }

      // Update local state after successful deletion
      setStores(prevStores =>
        prevStores.map(store =>
          store.id === selectedStore.id
            ? {
                ...store,
                products: store.products.filter((_, i) => i !== productToDelete.index)
              }
            : store
        )
      );

      setSelectedStore(prevStore => 
        prevStore ? {
          ...prevStore,
          products: prevStore.products.filter((_, i) => i !== productToDelete.index)
        } : null
      );

      showToast('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete product');
    } finally {
      setIsDeletingProduct(null);
      setIsDeleteProductModalOpen(false);
      setProductToDelete(null);
    }
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
          
          try {
            const deleteResponse = await fetch(`/api/delete`, {
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
      const response = await fetch(`/api/stores/${storeToDelete.id}`, {
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

  const handleSaveEditedStore = (updatedStore: Store) => {
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
  };

  const handleImportProducts = async (products: Array<{ name: string; price: number; store_id?: number }>): Promise<boolean> => {
    try {
      if (!selectedStore) {
        toast.error('Please select a store first');
        return false;
      }

      // Validate all products before attempting to import
      const invalidProducts = products.filter(product => {
        const price = parseFloat(String(product.price));
        return !product.name || isNaN(price) || price <= 0;
      });

      if (invalidProducts.length > 0) {
        toast.error(`Found ${invalidProducts.length} invalid products. Please check your data.`);
        return false;
      }

      // Store all products that need to be created
      const productsToCreate = products.map(product => ({
        name: product.name,
        price: parseFloat(String(product.price)),
        store_id: selectedStore.id
      }));

      // Create all products in a single request to ensure atomic operation
      const response = await fetch('/api/menu-items/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productsToCreate,
          store_id: selectedStore.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        toast.error('Failed to import products. Please try again.');
        return false;
      }

      const result = await response.json();
      
      if (!result.success) {
        toast.error(result.message || 'Failed to import products');
        return false;
      }

      // Fetch the updated menu items from the server
      const menuItemsResponse = await fetch(`/api/menu-items?store_id=${selectedStore.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!menuItemsResponse.ok) {
        toast.error('Products were imported but failed to refresh the display');
        return true; // Still return true as import succeeded
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

      toast.success(`Successfully imported ${result.importedCount || productsToCreate.length} products`);
      return true;
    } catch (error) {
      console.error('Error importing products:', error);
      toast.error('Failed to import products. Please try again.');
      return false;
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAllProducts = (checked: boolean) => {
    if (checked && selectedStore) {
      setSelectedProducts(new Set(selectedStore.products.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedStore || selectedProducts.size === 0) return;
    
    try {
      setIsDeletingBulk(true);
      
      // Delete each selected product
      const deletePromises = Array.from(selectedProducts).map(productId =>
        fetch(`/api/menu-items/${productId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      const results = await Promise.all(deletePromises);
      const failedDeletions = results.filter(r => !r.ok).length;

      if (failedDeletions > 0) {
        throw new Error(`Failed to delete ${failedDeletions} products`);
      }

      // Update local state after successful deletion
      setStores(prevStores =>
        prevStores.map(store =>
          store.id === selectedStore.id
            ? {
                ...store,
                products: store.products.filter(product => !selectedProducts.has(product.id))
              }
            : store
        )
      );

      setSelectedStore(prevStore => 
        prevStore ? {
          ...prevStore,
          products: prevStore.products.filter(product => !selectedProducts.has(product.id))
        } : null
      );

      showToast(`Successfully deleted ${selectedProducts.size} products`);
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error deleting products:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete products');
    } finally {
      setIsDeletingBulk(false);
      setIsBulkDeleteModalOpen(false);
    }
  };

  return (
    <>
      <Head>
        <title>Addresses - OneClick Delivery Admin</title>
      </Head>
      <div className="min-h-screen flex bg-white relative">
        {/* Left Side - Store List */}
        <div className="w-96 border-r border-gray-200 flex flex-col">
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
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search Addresses"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 text-gray-900 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stores
            </div>
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                Loading...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No stores available.
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                {searchTerm ? 'No results found.' : 'No stores.'}
              </div>
            ) : (
              filteredStores.map((store) => (
                <div
                  key={store.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between border-l-4 relative ${
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
                        key={`menu-${store.id}`}
                        id={`store-menu-${store.id}`}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                        style={{ top: '100%' }}
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
                            setStoreToDelete(store);
                            setIsDeleteModalOpen(true);
                            setOpenStoreMenuId(null);
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                        checked={selectedStore.products.length > 0 && selectedProducts.size === selectedStore.products.length}
                        onChange={(e) => handleSelectAllProducts(e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-500">
                        {selectedProducts.size} selected
                      </span>
                    </div>
                    {selectedProducts.size > 0 && (
                      <button
                        onClick={() => setIsBulkDeleteModalOpen(true)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Delete Selected
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-12 gap-4 py-2 border-b border-gray-200">
                    <div className="col-span-1"></div>
                    <div className="col-span-7 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</div>
                    <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</div>
                    <div className="col-span-1"></div>
                  </div>

                  {isMenuItemsLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                      <p className="text-sm text-gray-500">Loading menu items...</p>
                    </div>
                  ) : selectedStore.products.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-500 text-sm">No products available</p>
                    </div>
                  ) : (
                    selectedStore.products.map((product, index) => (
                      <div
                        key={`product-${product.id}-${index}`}
                        className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100 items-center hover:bg-gray-50"
                      >
                        <div className="col-span-1">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                          />
                        </div>
                        <div className="col-span-7 flex items-center">
                          <span className="text-sm text-gray-900">
                            {product.name}
                          </span>
                        </div>
                        <div className="col-span-3 text-sm text-gray-900">
                          ₱ {typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
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
                                  onClick={() => handleDeleteClick(index, product)}
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
              className="fixed inset-0 bg-black/20 z-40"
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

        {/* Delete Product Modal */}
        <DeleteProductModal
          isOpen={isDeleteProductModalOpen}
          onClose={() => {
            setIsDeleteProductModalOpen(false);
            setProductToDelete(null);
          }}
          onConfirm={handleDeleteProduct}
          productName={productToDelete?.product.name || ''}
          isLoading={isDeletingProduct === productToDelete?.product.id}
        />

        {/* Bulk Delete Modal */}
        <BulkDeleteModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDelete}
          isLoading={isDeletingBulk}
          itemCount={selectedProducts.size}
        />
    </div>
    </>
  );
}