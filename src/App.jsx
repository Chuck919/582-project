import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { useEffect, useState, useRef } from "react";
import RestaurantMarkers from "./components/RestaurantMarkers";
import ErrorScreen from "./components/ErrorScreen";
import AuthHeader from "./components/AuthHeader";
import { useAuth } from "./contexts/AuthContext";
import { supabase } from "./lib/supabase";
import "./App.css";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const libraries = ["places", "marker"];

function App() {
  const { user } = useAuth();
  const [currentPosition, setCurrentPosition] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [map, setMap] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); // Prevent multiple API calls
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [placesError, setPlacesError] = useState(null);
  const userMarkerRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
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
        const messages = {
          1: "Location access was denied. Please enable location permissions in your browser settings and refresh the page.",
          2: "Your location could not be determined due to a network or hardware error.",
          3: "Location request timed out. Please refresh the page and try again.",
        };
        const message = messages[error.code] || "An unknown error occurred while retrieving your location.";
        console.error(`Geolocation error (code ${error.code}):`, message, error);
        setLocationError(message);
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
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'types', 'rating', 'priceRange'],
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
              cuisine: (() => {
                const types = place.types
                  ?.filter((type) => type.includes("_restaurant"))
                  .map((type) =>
                    type
                      .replace(/_/g, " ")
                      .split(" ")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")
                  );
                return types?.length ? types : null;
              })(),
              price_range: place.priceRange
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
        });
    }
  }, [map, currentPosition, hasSearched]);

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

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  if (loadError) return (
    <ErrorScreen
      title="Map Unavailable"
      message="The Google Maps service could not be loaded. Please check your internet connection and try again."
    />
  );
  if (!isLoaded) return <ErrorScreen message="Loading map..." />;
  if (locationError) return <ErrorScreen title="Location Unavailable" message={locationError} />;
  if (!currentPosition) return <ErrorScreen message="Getting your location..." />;

  return (
    <>
      <div style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <AuthHeader />
        <div style={{
          background: "white",
          padding: "10px 14px",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          color: "#1e293b",
          fontSize: "14px",
        }}>
          Restaurants found: {restaurants.length}
        </div>
      </div>
      {placesError && (
        <div className="places-error-banner">
          {placesError}
          <button onClick={() => setPlacesError(null)} aria-label="Dismiss">x</button>
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