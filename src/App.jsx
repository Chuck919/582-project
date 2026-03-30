import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "./lib/supabase";
import { useAuth } from "./contexts/useAuth";
import { fetchDeals } from "./utils/deals";
import { useFavorites } from "./hooks/useFavorites";
import RestaurantMarkers from "./components/RestaurantMarkers";
import AuthHeader from "./components/AuthHeader";
import ErrorScreen from "./components/ErrorScreen";
import LoadingScreen from "./components/LoadingScreen";
import UserProfile from "./components/UserProfile";
import "./App.css";
import SearchBar from "./components/SearchBar";
import Sidebar from "./components/Sidebar";
import {
  readSessionRestaurantFilters,
  SESSION_RESTAURANT_FILTERS_KEY,
} from "./utils/sessionRestaurantFilters";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const libraries = ["places", "marker"];

/**
 * Sanitize helper — strips HTML and characters that could be used for
 * XSS or injection before sending input to the Google Places API.
 */
function sanitize(input) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"'`;]/g, "")
    .trim();
}

/** Levenshtein edit distance between two strings. */
function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Fuzzy-matches a query against a restaurant name.
 * Each word in the query must either be a substring of some word in the name
 * or be within an edit-distance threshold of it (1 typo for words ≥4 chars,
 * 2 typos for words ≥7 chars).
 */
function fuzzyMatch(query, name) {
  const queryWords = query.toLowerCase().split(/\s+/);
  const nameWords = name.toLowerCase().split(/\s+/);
  return queryWords.every((qw) =>
    nameWords.some((nw) => {
      if (nw.includes(qw) || qw.includes(nw)) return true;
      const maxDist = qw.length <= 3 ? 0 : qw.length <= 6 ? 1 : 2;
      return levenshtein(qw, nw) <= maxDist;
    })
  );
}

const getInitialSessionFilters = (() => {
  let cached;
  return () => {
    if (cached === undefined) {
      cached = readSessionRestaurantFilters() ?? {
        minRating: 0,
        priceFilter: "",
        distanceFilter: "",
        cuisineFilter: "",
      };
    }
    return cached;
  };
})();

function App() {
  const { user, profile, loading } = useAuth();
  const { isFavorite, isFavoriteLoading, toggleFavorite, favoriteRestaurants, favoritesError, dismissFavoritesError } = useFavorites();
  const [currentPosition, setCurrentPosition] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [deals, setDeals] = useState({});
  const [dealsError, setDealsError] = useState(null);
  const [hasActiveDealsByPlaceId, setHasActiveDealsByPlaceId] = useState({});
  const [map, setMap] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationWarning, setLocationWarning] = useState(null);
  const [placesError, setPlacesError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapType, setMapType] = useState("roadmap");
  const [isFetchingRestaurants, setIsFetchingRestaurants] = useState(false);
  const [isFetchingDeals, setIsFetchingDeals] = useState(false);
  const [isSearchingSearchbar, setIsSearchingSearchbar] = useState(false);
  const [minRating, setMinRating] = useState(() => getInitialSessionFilters().minRating);
  const [priceFilter, setPriceFilter] = useState(() => getInitialSessionFilters().priceFilter);
  const [distanceFilter, setDistanceFilter] = useState(() => getInitialSessionFilters().distanceFilter);
  const [cuisineFilter, setCuisineFilter] = useState(() => getInitialSessionFilters().cuisineFilter);
  const userMarkerRef = useRef(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const searchRadius = profile.searchRadius;

  useEffect(() => {
    const isDefault =
      minRating === 0 && priceFilter === "" && distanceFilter === "" && cuisineFilter === "";
    if (isDefault) {
      sessionStorage.removeItem(SESSION_RESTAURANT_FILTERS_KEY);
    } else {
      sessionStorage.setItem(
        SESSION_RESTAURANT_FILTERS_KEY,
        JSON.stringify({ minRating, priceFilter, distanceFilter, cuisineFilter })
      );
    }
  }, [minRating, priceFilter, distanceFilter, cuisineFilter]);

  const clearRestaurantFilters = useCallback(() => {
    setMinRating(0);
    setPriceFilter("");
    setDistanceFilter("");
    setCuisineFilter("");
  }, []);

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
          data.forEach((row) => {
            next[row.id] = !!row.has_active_deals;
          });
          setHasActiveDealsByPlaceId((prev) => ({ ...prev, ...next }));
        }
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
      setDealsError('Failed to load deals. Please try again later.');
    } finally {
      setIsFetchingDeals(false);
    }
  }, [restaurants]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshDeals();
    });
  }, [refreshDeals]);

  // Load has_active_deals from DB when restaurant list is first set (e.g. from cache before refreshDeals runs).
  useEffect(() => {
    if (!restaurants.length) return;
    const placeIds = restaurants.map((r) => r.place_id);
    supabase
      .from('restaurants')
      .select('id, has_active_deals')
      .in('id', placeIds)
      .then(({ data, error }) => {
        if (error) return;
        const next = {};
        (data || []).forEach((row) => {
          next[row.id] = !!row.has_active_deals;
        });
        setHasActiveDealsByPlaceId((prev) => ({ ...prev, ...next }));
      });
  }, [restaurants]);

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

  useEffect(() => {
    if (loading) return;
    if (map && currentPosition && !hasSearched) {
      // Check cache first
      const cacheKey = `restaurants_${currentPosition.lat.toFixed(3)}_${currentPosition.lng.toFixed(3)}_${searchRadius}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        console.log("Using cached restaurant data");
        const cachedRestaurants = JSON.parse(cached);
        queueMicrotask(() => {
          setRestaurants(cachedRestaurants);
          setHasSearched(true);
        });
        return;
      }

      console.log("Searching for restaurants near:", currentPosition);
      console.log("API Key exists:", !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
      
      // Using new Place API instead of deprecated PlacesService
      const request = {
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'types', 'rating', 'priceRange'],
        locationRestriction: {
          center: currentPosition,
          radius: Math.round(searchRadius * 1609.34),
        },
        includedTypes: ["restaurant"],
        maxResultCount: 20,
      };

      console.log("Making Places API request:", request);

      setIsFetchingRestaurants(true);
      // Use the new searchNearby method
      window.google.maps.places.Place.searchNearby(request)
        .then(response => {
          console.log("Places API response:", response);
          const { places } = response;
          
          if (places && places.length > 0) {
            console.log(`Found ${places.length} restaurants`);
            
            // Convert new Place objects to format compatible with existing code
            const formattedResults = places.map(place => ({
              place_id: place.id,
              name: place.displayName,
              vicinity: place.formattedAddress,
              geometry: {
                location: {
                  lat: place.location.lat(),
                  lng: place.location.lng()
                }
              },
              rating: place.rating,
              cuisine: place.types?.filter(t => t.includes("_restaurant"))
                .map(t => t.replace(/_/g, " ").split(" ")
                  .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")) || null,
              price_range: place.priceRange?.startPrice && place.priceRange?.endPrice
                ? [
                    place.priceRange.startPrice.units + place.priceRange.startPrice.nanos / 1e9,
                    place.priceRange.endPrice.units + place.priceRange.endPrice.nanos / 1e9,
                  ]
                : null
            }));
            
            setRestaurants(formattedResults);
            sessionStorage.setItem(cacheKey, JSON.stringify(formattedResults));
          } else {
            console.log("No restaurants found in this area");
          }
          setHasSearched(true);
        })
        .catch(error => {
          console.error("Places API search failed:", error);
          const message = navigator.onLine
            ? "Could not load nearby restaurants. The map is still available."
            : "No internet connection. Restaurant data could not be loaded.";
          setPlacesError(message);
          setHasSearched(true);
        })
        .finally(() => {
          setIsFetchingRestaurants(false);
        });
    }
  }, [map, currentPosition, hasSearched, loading, searchRadius]);

  useEffect(() => {
    queueMicrotask(() => {
      setHasSearched(false);
      setPriceFilter("");
      setMinRating(0);
    });
  }, [searchRadius]);

  useEffect(() => {
    if (!user || !restaurants.length) return;
    const rows = restaurants.map(r => ({
      id: r.place_id,
      name: r.name,
      cuisine: r.cuisine,
      rating: r.rating ?? 0,
      price_range: r.price_range,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
    }));
    supabase
      .from("restaurants")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
      .then(({ error }) => {
        if (error) console.error("Supabase upsert failed:", error);
      });
  }, [user, restaurants]);

  const restaurantsWithDistance = useMemo(() => {
    if (!currentPosition) return restaurants;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const earthRadiusMeters = 6371000;
    return restaurants.map((restaurant) => {
      const location = restaurant.geometry?.location;
      const lat = typeof location?.lat === "function" ? location.lat() : location?.lat;
      const lng = typeof location?.lng === "function" ? location.lng() : location?.lng;
      if (typeof lat !== "number" || typeof lng !== "number") {
        console.warn(`[restaurantsWithDistance] Missing or invalid coordinates for "${restaurant.name}" (id: ${restaurant.place_id}). location was:`, location);
        return { ...restaurant, distanceMeters: Number.POSITIVE_INFINITY, distanceMiles: null };
      }
      const dLat = toRad(lat - currentPosition.lat);
      const dLng = toRad(lng - currentPosition.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(currentPosition.lat)) *
          Math.cos(toRad(lat)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = earthRadiusMeters * c;
      return {
        ...restaurant,
        distanceMeters,
        distanceMiles: distanceMeters / 1609.344,
      };
    });
  }, [restaurants, currentPosition]);

  const cuisineOptions = useMemo(() => {
    const set = new Set();
    restaurants.forEach((r) => {
      if (Array.isArray(r.cuisine)) {
        r.cuisine.forEach((c) => set.add(c));
      }
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [restaurants]);

  useEffect(() => {
    if (!cuisineFilter) return;
    if (cuisineOptions.length > 0 && !cuisineOptions.includes(cuisineFilter)) {
      setCuisineFilter("");
    }
  }, [cuisineOptions, cuisineFilter]);

  const filteredRestaurants = useMemo(() => {
    const priceCeilings = { "$": 15, "$$": 30, "$$$": 60, "$$$$": Infinity };
    const priceFloors   = { "$": 0,  "$$": 15, "$$$": 30, "$$$$": 60 };
    return restaurantsWithDistance.filter(r => {
      if (minRating > 0 && !(r.rating && r.rating >= minRating)) return false;
      if (priceFilter && priceCeilings[priceFilter] !== undefined) {
        if (!r.price_range) return false;
        const maxPrice = r.price_range[1];
        const ceiling = priceCeilings[priceFilter];
        const floor = priceFloors[priceFilter];
        if (maxPrice > ceiling || maxPrice <= floor) return false;
      }
      if (distanceFilter && r.distanceMiles != null) {
        if (r.distanceMiles > Number(distanceFilter)) return false;
      }
      if (cuisineFilter && !(Array.isArray(r.cuisine) && r.cuisine.includes(cuisineFilter))) return false;
      return true;
    });
  }, [restaurantsWithDistance, minRating, priceFilter, distanceFilter, cuisineFilter]);

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  /**
   * Search restaurants by filtering the already-fetched nearby list.
   * Only restaurants surfaced by the initial proximity heuristic are returned.
   */
  const handleSearch = useCallback(
    (rawQuery) => {
      const query = sanitize(rawQuery);
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
      {/* Search bar — centred at the top of the map */}
      <SearchBar
        onSearch={handleSearch}
        results={searchResults}
        isSearching={isSearchingSearchbar}
        onResultSelect={handleResultSelect}
        currentPosition={currentPosition}
        nearbyRestaurants={restaurants}
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
        minRating={minRating}
        onMinRatingChange={setMinRating}
        priceFilter={priceFilter}
        onPriceFilterChange={setPriceFilter}
        distanceFilter={distanceFilter}
        onDistanceFilterChange={setDistanceFilter}
        cuisineFilter={cuisineFilter}
        onCuisineFilterChange={setCuisineFilter}
        cuisineOptions={cuisineOptions}
        onClearFilters={clearRestaurantFilters}
      />

      {/* Map/Satellite toggle — slides right when sidebar opens */}
      <div
        className="map-type-toggle"
        style={{ "--map-toggle-left": sidebarOpen ? "400px" : "42px" }}
      >
        {["roadmap", "satellite"].map((type) => (
          <button
            key={type}
            onClick={() => setMapType(type)}
            style={{
              padding: "6px 12px",
              background: mapType === type ? "#e8e8e8" : "#fff",
              border: "none",
              borderLeft: type === "satellite" ? "1px solid #ddd" : "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: mapType === type ? "600" : "400",
              color: "#333",
            }}
          >
            {type === "roadmap" ? "Map" : "Satellite"}
          </button>
        ))}
      </div>

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
          <button onClick={() => setPlacesError(null)} aria-label="Dismiss">x</button>
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
        deals={deals}
        hasActiveDealsByPlaceId={hasActiveDealsByPlaceId}
        refreshDeals={refreshDeals}
        isFavorite={isFavorite}
        isFavoriteLoading={isFavoriteLoading}
        toggleFavorite={toggleFavorite}
      />
    </GoogleMap>

    {showProfile && user && (
      <UserProfile
        onClose={() => setShowProfile(false)}
      />
    )}
    </>
  );
}

export default App;
