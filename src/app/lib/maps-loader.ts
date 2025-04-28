import { Loader } from '@googlemaps/js-api-loader';

let loader: Loader | null = null;
let placesLibraryLoaded = false;

export const initGoogleMapsLoader = () => {
  if (!loader) {
    loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places'],
      language: 'en',
    });
  }
  return loader;
};

export const loadGoogleMapsScript = async () => {
  const loader = initGoogleMapsLoader();
  try {
    const google = await loader.load();
    
    // Make sure Places library is loaded and initialized
    if (!placesLibraryLoaded) {
      // Wait for the places library to be fully loaded
      if (!google.maps.places) {
        return new Promise((resolve) => {
          const checkPlaces = setInterval(() => {
            if (google.maps.places) {
              clearInterval(checkPlaces);
              placesLibraryLoaded = true;
              resolve(google);
            }
          }, 100);
        });
      } else {
        placesLibraryLoaded = true;
      }
    }
    
    return google;
  } catch (error) {
    console.error('Failed to load Google Maps script:', error);
    throw error;
  }
}; 