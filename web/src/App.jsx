import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import RestaurantMarkers from "./components/RestaurantMarkers";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const libraries = ["places"];

function App() {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [map, setMap] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); // Prevent multiple API calls
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

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
      
      const service = new window.google.maps.places.PlacesService(map);
      const allResults = [];
      
      const request = {
        location: currentPosition,
        radius: 10000, // 10km radius to get more restaurants
        type: "restaurant",
      };

      console.log("Making Places API request:", request);

      const handleResults = (results, status, pagination) => {
        console.log("Places API Status:", status);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          allResults.push(...results);
          console.log(`Found ${results.length} restaurants (Total: ${allResults.length})`);
          
          // Get more results if available (up to 60 total - 3 pages)
          if (pagination && pagination.hasNextPage && allResults.length < 60) {
            setTimeout(() => {
              pagination.nextPage();
            }, 2000); // Required delay between pagination requests
          } else {
            // Done fetching all results
            console.log(`Final total: ${allResults.length} restaurants`);
            setRestaurants(allResults);
            // Cache the results (convert to plain objects)
            const cacheData = allResults.map(r => ({
              place_id: r.place_id,
              name: r.name,
              vicinity: r.vicinity,
              geometry: {
                location: {
                  lat: r.geometry.location.lat(),
                  lng: r.geometry.location.lng()
                }
              }
            }));
            sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
            setHasSearched(true);
          }
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          console.log("No restaurants found in this area");
          setHasSearched(true);
        } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          console.error("REQUEST_DENIED - Check if Places API is enabled in Google Cloud Console");
          setHasSearched(true);
        } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          console.error("OVER_QUERY_LIMIT - API quota exceeded");
          setHasSearched(true);
        } else {
          console.error("Places search failed with status:", status);
          setHasSearched(true);
        }
      };

      service.nearbySearch(request, handleResults);
    }
  }, [map, currentPosition, hasSearched]);

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  if (!isLoaded || !currentPosition) return <div>Loading...</div>;

  return (
    <>
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
          disableDefaultUI: false,
          styles: [
            {
              featureType: "poi.business",
              elementType: "all",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
      {/* User location marker - small blue dot */}
      <Marker 
        position={currentPosition}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        }}
        zIndex={1000}
      />
      
      {/* Restaurant markers component */}
      <RestaurantMarkers 
        restaurants={restaurants} 
        selectedRestaurant={selectedRestaurant}
        setSelectedRestaurant={setSelectedRestaurant}
      />
    </GoogleMap>
    </>
  );
}

export default App;