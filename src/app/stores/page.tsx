'use client'
import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { AddProductModal } from '../components/AddProductModal';
import { AddAddressModal } from '../components/AddAddressModal';
import { ImportExcelModal } from '../components/ImportExcelModal';
import { AddMenuPhotosModal } from '../components/AddMenuPhotosModal';
import { DeliverySettingsModal } from '../components/DeliverySettingsModal';

interface Store {
  id: string;
  name: string;
  location: string;
  logo?: string;
  isPhotoMenu: boolean;
  products: Product[];
  menuPhotos?: MenuPhoto[];
}

interface DeliveryFare {
  baseFare: number;
  ratePerKm: number;
  otherCharges: number;
}

interface Product {
  name: string;
  price: number;
  size?: string;
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
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
  const [isAddMenuPhotosModalOpen, setIsAddMenuPhotosModalOpen] = useState(false);
  const [isDeliverySettingsModalOpen, setIsDeliverySettingsModalOpen] = useState(false);
  const [stores] = useState<Store[]>([
    {
      id: '1',
      name: "11:11 Cafe",
      location: "Apokon",
      isPhotoMenu: true,
      products: [],
      menuPhotos: [
        { id: 1, url: '/menu-photos/menu1.jpg', thumbnail: '/menu-photos/menu1-thumb.jpg' },
        { id: 2, url: '/menu-photos/menu2.jpg', thumbnail: '/menu-photos/menu2-thumb.jpg' }
      ]
    },
    {
      id: '2',
      name: "8's Yummy",
      location: "Tagum City",
      isPhotoMenu: false,
      products: []
    },
    {
      id: '3',
      name: "Alberto's Pizza",
      location: "Tagum City",
      logo: "/store-logos/albertos.png",
      isPhotoMenu: false,
      products: [
        { name: "All Meat", size: "11\"", price: 260.00 },
        { name: "All Meat", size: "9\"", price: 190.00 },
        { name: "Anchovy Pizza", size: "11\"", price: 270.00 },
        { name: "Anchovy Pizza", size: "9\"", price: 230.00 },
        { name: "Bacon Cheeseburger", size: "11\"", price: 270.00 }
      ]
    },
    // ... other stores remain the same
  ]);

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportExcel = (file: File) => {
    console.log('Importing Excel file:', file);
    // Implementation for importing Excel file
  };

  const handleTogglePhotoMenu = (store: Store) => {
    const updatedStore = { ...store, isPhotoMenu: !store.isPhotoMenu };
    // Update store in stores array
    setSelectedStore(updatedStore);
  };

  const handleAddMorePhotos = () => {
    console.log('Add more photos clicked');
  };

  const handleAddProduct = (product: { name: string; price: number; photo?: File }) => {
    console.log('Adding product:', product);
    // Implementation for adding product
  };

  const handleAddAddress = (address: { tradeName: string; category: string; address: string }) => {
    console.log('Adding address:', address);
    // Implementation for adding address
  };

  const handleAddMenuPhotos = (photos: File[]) => {
    console.log('Adding menu photos:', photos);
    // Implementation for adding menu photos
  };

  const handleSaveDeliverySettings = (settings: DeliveryFare) => {
    console.log('Saving delivery settings:', settings);
    // Implementation for saving delivery settings
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
                onClick={() => setIsImportExcelModalOpen(true)}
                className="px-4 py-2 bg-gray-100 rounded text-sm font-medium text-gray-700 hover:bg-gray-200 mr-3"
              >
                Import Excel
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
            {filteredStores.map((store) => (
              <div
                key={store.id}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                  selectedStore?.id === store.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => setSelectedStore(store)}
              >
                <div className="flex items-center">
                  <span className="text-sm text-gray-900">{store.name}</span>
                  <span className="ml-2 text-xs text-gray-500">📍</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Store Details */}
        <div className="flex-1">
          {selectedStore ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  {selectedStore.logo && (
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border border-gray-200">
                      <Image
                        src={selectedStore.logo}
                        alt={selectedStore.name}
                        width={48}
                        height={48}
                      />
                    </div>
                  )}
                  <h2 className="text-xl font-medium text-gray-900">{selectedStore.name}</h2>
                </div>
                <div className="flex items-center space-x-3">
                  {!selectedStore.isPhotoMenu && (
                    <button
                      onClick={() => setIsAddProductModalOpen(true)}
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
                              {photo.id}
                            </div>
                            <div className="w-32 h-40 relative">
                              <Image
                                src={photo.thumbnail}
                                alt={`Menu page ${photo.id}`}
                                layout="fill"
                                objectFit="cover"
                                className="rounded border border-gray-200"
                              />
                            </div>
                          </div>
                          <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
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
                /* Products Table */
                <div>
                  <div className="grid grid-cols-12 gap-4 py-2 border-b border-gray-200">
                    <div className="col-span-8 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</div>
                    <div className="col-span-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</div>
                    <div className="col-span-1"></div>
                  </div>
                  {selectedStore.products.map((product, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100 items-center hover:bg-gray-50"
                    >
                      <div className="col-span-8 text-sm text-gray-900">
                        {product.name} {product.size && `- ${product.size}`}
                      </div>
                      <div className="col-span-3 text-sm text-gray-900">₱{product.price.toFixed(2)}</div>
                      <div className="col-span-1 text-right">
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
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
        {isAddProductModalOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/5 z-40"
              onClick={() => setIsAddProductModalOpen(false)}
            />
            <AddProductModal
              isOpen={isAddProductModalOpen}
              onClose={() => setIsAddProductModalOpen(false)}
              onSave={handleAddProduct}
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

        {/* Import Excel Panel */}
        {isImportExcelModalOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/5 z-40"
              onClick={() => setIsImportExcelModalOpen(false)}
            />
            <ImportExcelModal
              isOpen={isImportExcelModalOpen}
              onClose={() => setIsImportExcelModalOpen(false)}
              onImport={handleImportExcel}
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
      </div>
    </>
  );
} 