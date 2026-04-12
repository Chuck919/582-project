import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "./lib/supabase";
import { useAuth } from "./contexts/useAuth";
import { fetchDeals } from "./utils/deals";
import { useFavorites } from "./hooks/useFavorites";
import RestaurantMarkers from "./components/RestaurantMarkers";
import RestaurantInfoModal from "./components/RestaurantInfoModal";
import AuthHeader from "./components/AuthHeader";
import ErrorScreen from "./components/ErrorScreen";
import LoadingScreen from "./components/LoadingScreen";
import UserProfile from "./components/UserProfile";
import "./App.css";
import SearchBar from "./components/SearchBar";
import Sidebar from "./components/Sidebar";
import { useRestaurantFilters } from "./hooks/useRestaurantFilters";
import { useRestaurantSearch } from "./hooks/useRestaurantSearch";
import { sanitizeInput } from "./utils/validation";
import { fuzzyMatch } from "./utils/search";
import { calculateDistance } from "./utils/geo";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const libraries = ["places", "marker"];


function App() {
  const { user, profile, loading } = useAuth();
  const { isFavorite, isFavoriteLoading, toggleFavorite, favoriteRestaurants, favoritesError, dismissFavoritesError } = useFavorites();
  const [currentPosition, setCurrentPosition] = useState(null);
  const [deals, setDeals] = useState({});
  const [dealsError, setDealsError] = useState(null);
  const [map, setMap] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationWarning, setLocationWarning] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapType, setMapType] = useState("roadmap");
  const [isFetchingDeals, setIsFetchingDeals] = useState(false);
  const [isSearchingSearchbar, setIsSearchingSearchbar] = useState(false);
  const userMarkerRef = useRef(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const searchRadius = profile.searchRadius;

  const {
    restaurants,
    hasActiveDealsByPlaceId,
    syncActiveDealFlags,
    isFetchingRestaurants,
    placesError,
    resetSearch,
    dismissPlacesError,
  } = useRestaurantSearch({ map, currentPosition, searchRadius, isAuthLoading: loading });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocationWarning(null);
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error(`Geolocation error (code ${error.code}):`, error);
        if (error.code === 1) {
          // Permission denied — permanent failure, show fatal screen
          setLocationError("Location access was denied. Please enable location permissions in your browser settings and refresh the page.");
        } else {
          // Codes 2 & 3 are transient — show a dismissible warning, keep the app alive
          const messages = {
            2: "Your location could not be determined due to a network or hardware error. Retrying...",
            3: "Location request timed out. Retrying...",
          };
          const message = messages[error.code] || "An unknown error occurred while retrieving your location. Retrying...";
          setLocationWarning(message);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 20000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch deals from Supabase and update state.
  // Also refreshes has_active_deals from DB so markers stay in sync (e.g. after adding a deal).
  const refreshDeals = useCallback(async () => {
    setIsFetchingDeals(true);
    try {
      const dealsByRestaurant = await fetchDeals();
      setDeals(dealsByRestaurant);
      const placeIds = restaurants.map((r) => r.place_id);
      if (placeIds.length) {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, has_active_deals')
          .in('id', placeIds);
        if (!error && data) {
          const next = {};
          data.forEach((row) => { next[row.id] = !!row.has_active_deals; });
          syncActiveDealFlags(next);
        }
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
      setDealsError('Failed to load deals. Please try again later.');
    } finally {
      setIsFetchingDeals(false);
    }
  }, [restaurants, syncActiveDealFlags]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshDeals();
    });
  }, [refreshDeals]);

  // Create user location marker with AdvancedMarkerElement
  useEffect(() => {
    if (map && currentPosition && window.google && window.google.maps && window.google.maps.marker) {
      // Clean up existing marker
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
      }

      // Create custom blue dot element
      const pinElement = document.createElement('div');
      pinElement.style.width = '16px';
      pinElement.style.height = '16px';
      pinElement.style.backgroundColor = '#4285F4';
      pinElement.style.border = '2px solid white';
      pinElement.style.borderRadius = '50%';
      pinElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: currentPosition,
        content: pinElement,
        title: 'Your Location',
      });
    }

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
      }
    };
  }, [map, currentPosition]);

  const restaurantsWithDistance = useMemo(() => {
    if (!currentPosition) return restaurants;
    return restaurants.map((restaurant) => {
      const location = restaurant.geometry?.location;
      const lat = typeof location?.lat === "function" ? location.lat() : location?.lat;
      const lng = typeof location?.lng === "function" ? location.lng() : location?.lng;
      if (typeof lat !== "number" || typeof lng !== "number") {
        console.warn(
          `[restaurantsWithDistance] Missing or invalid coordinates for "${restaurant.name}" (id: ${restaurant.place_id}). location was:`,
          location
        );
        return { ...restaurant, distanceMeters: Number.POSITIVE_INFINITY, distanceMiles: null };
      }
      const { distanceMeters, distanceMiles } = calculateDistance(currentPosition, { lat, lng });
      return { ...restaurant, distanceMeters, distanceMiles };
    });
  }, [restaurants, currentPosition]);

  const { filters, setFilter, clearFilters, filteredRestaurants, cuisineOptions } = useRestaurantFilters(restaurantsWithDistance);

  useEffect(() => {
    resetSearch();
    clearFilters();
  }, [searchRadius, resetSearch, clearFilters]);

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  /**
   * Search restaurants by filtering the already-fetched nearby list.
   * Only restaurants surfaced by the initial proximity heuristic are returned.
   */
  const handleSearch = useCallback(
    (rawQuery) => {
      const query = sanitizeInput(rawQuery);
      if (!query) return;

      setIsSearchingSearchbar(true);

      // Simulate slight delay to show search state
      setTimeout(() => {
        const filtered = restaurants.filter((r) => fuzzyMatch(query, r.name));
        setSearchResults(filtered);
        setIsSearchingSearchbar(false);
      }, 300);
    },
    [restaurants]
  );

  const handleSidebarToggle = useCallback(() => setSidebarOpen((prev) => !prev), []);

  /** Pan map to selected result and open the info modal. */
  const handleResultSelect = useCallback(
    (restaurant) => {
      if (map) {
        map.panTo(restaurant.geometry.location);
        map.setZoom(16);
      }
      setSelectedRestaurant(restaurant);
      setSearchResults([]);
    },
    [map]
  );

  if (loadError) return (
    <ErrorScreen
      title="Map Unavailable"
      message="The Google Maps service could not be loaded. Please check your internet connection and try again."
    />
  );
  if (loading) return <LoadingScreen message="Starting up..." />;
  if (!isLoaded) return <LoadingScreen message="Loading map..." />;
  if (locationError) return <ErrorScreen title="Location Unavailable" message={locationError} />;
  if (!currentPosition) return <LoadingScreen message="Getting your location..." />;

  return (
    <>
      {/* Search bar — positioned relative to sidebar state */}
      <SearchBar
        onSearch={handleSearch}
        results={searchResults}
        isSearching={isSearchingSearchbar}
        onResultSelect={handleResultSelect}
        currentPosition={currentPosition}
        nearbyRestaurants={restaurants}
        sidebarOpen={sidebarOpen}
      />

      <Sidebar
        restaurants={filteredRestaurants}
        onRestaurantSelect={handleResultSelect}
        deals={deals}
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        isFavorite={isFavorite}
        isFavoriteLoading={isFavoriteLoading}
        favoriteRestaurants={favoriteRestaurants}
        user={user}
        filters={filters}
        setFilter={setFilter}
        cuisineOptions={cuisineOptions}
        onClearFilters={clearFilters}
      />
      
      <div className="app-top-right">
        <AuthHeader onOpenProfile={() => setShowProfile(true)} />
        <div className="app-count-badge">
          Restaurants found: {restaurants.length}
          {(isFetchingRestaurants || isFetchingDeals) && (
            <div className="data-spinner" aria-label="Updating data..." title="Updating data..."></div>
          )}
        </div>
      </div>

      {locationWarning && (
        <div className="places-error-banner">
          {locationWarning}
          <button onClick={() => setLocationWarning(null)} aria-label="Dismiss">x</button>
        </div>
      )}
      {placesError && (
        <div className="places-error-banner">
          {placesError}
          <button onClick={dismissPlacesError} aria-label="Dismiss">x</button>
        </div>
      )}
      {dealsError && (
        <div className="places-error-banner">
          {dealsError}
          <button onClick={() => setDealsError(null)} aria-label="Dismiss">x</button>
        </div>
      )}
      {favoritesError && (
        <div className="places-error-banner">
          {favoritesError}
          <button onClick={dismissFavoritesError} aria-label="Dismiss">x</button>
        </div>
      )}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentPosition}
        zoom={14}
        onLoad={onMapLoad}
        onClick={() => setSelectedRestaurant(null)}
        options={{
          mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
          disableDefaultUI: false,
          mapTypeControl: false,
          fullscreenControl: false,
          mapTypeId: mapType,
        }}
      >
      {/* User location marker now handled by AdvancedMarkerElement in useEffect */}
      
      {/* Restaurant markers component */}
      <RestaurantMarkers
        restaurants={filteredRestaurants}
        selectedRestaurant={selectedRestaurant}
        setSelectedRestaurant={setSelectedRestaurant}
        map={map}
        hasActiveDealsByPlaceId={hasActiveDealsByPlaceId}
      />
    </GoogleMap>

    <RestaurantInfoModal
      restaurant={selectedRestaurant}
      onClose={() => setSelectedRestaurant(null)}
      deals={selectedRestaurant ? deals[selectedRestaurant.place_id] || [] : []}
      onDealAdded={() => refreshDeals?.()}
      isFavorite={isFavorite}
      isFavoriteLoading={isFavoriteLoading}
      toggleFavorite={toggleFavorite}
    />

      <div className="foodly-logo" aria-label="Foodly logo">
        <img
          src="/src/assets/main logo black.svg"
          alt="Foodly"
          className="foodly-logo-image"
        />
      </div>
    {showProfile && user && (
      <UserProfile
        onClose={() => setShowProfile(false)}
      />
    )}
    </>
  );
}

export default App;
