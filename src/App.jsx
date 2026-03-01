import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState, useRef, useCallback } from "react";
import RestaurantMarkers from "./components/RestaurantMarkers";
import SearchBar from "./components/SearchBar";

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

function App() {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [map, setMap] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); // Prevent multiple API calls
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const userMarkerRef = useRef(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  }, []);

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
    if (map && currentPosition && !hasSearched) {
      // Check cache first
      const cacheKey = `restaurants_${currentPosition.lat.toFixed(3)}_${currentPosition.lng.toFixed(3)}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        console.log("Using cached restaurant data");
        setRestaurants(JSON.parse(cached));
        setHasSearched(true);
        return;
      }

      console.log("Searching for restaurants near:", currentPosition);
      console.log("API Key exists:", !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
      
      // Using new Place API instead of deprecated PlacesService
      const request = {
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'types', 'rating'],
        locationRestriction: {
          center: currentPosition,
          radius: 10000, // 10km radius
        },
        includedTypes: ["restaurant"],
        maxResultCount: 20,
      };

      console.log("Making Places API request:", request);

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
              types: place.types
            }));
            
            setRestaurants(formattedResults);
            sessionStorage.setItem(cacheKey, JSON.stringify(formattedResults));
          } else {
            console.log("No restaurants found in this area");
          }
          setHasSearched(true);
        })
        .catch(error => {
          console.error("Places search failed:", error);
          setHasSearched(true);
        });
    }
  }, [map, currentPosition, hasSearched]);

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
      const filtered = restaurants.filter((r) => fuzzyMatch(query, r.name));
      setSearchResults(filtered);
    },
    [restaurants]
  );

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

  if (!isLoaded || !currentPosition) return <div>Loading...</div>;

  return (
    <>
      {/* Search bar — centred at the top of the map */}
      <SearchBar
        onSearch={handleSearch}
        results={searchResults}
        isSearching={isSearching}
        onResultSelect={handleResultSelect}
        currentPosition={currentPosition}
        nearbyRestaurants={restaurants}
      />

      <div style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 1000,
        background: "white",
        padding: "10px",
        borderRadius: "5px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        color: "black"
      }}>
        Restaurants found: {restaurants.length}
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentPosition}
        zoom={14}
        onLoad={onMapLoad}
        onClick={() => setSelectedRestaurant(null)}
        options={{
          mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
          disableDefaultUI: false,
        }}
      >
      {/* User location marker now handled by AdvancedMarkerElement in useEffect */}
      
      {/* Restaurant markers component */}
      <RestaurantMarkers 
        restaurants={restaurants} 
        selectedRestaurant={selectedRestaurant}
        setSelectedRestaurant={setSelectedRestaurant}
        map={map}
      />
    </GoogleMap>
    </>
  );
}

export default App;