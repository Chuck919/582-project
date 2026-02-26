import { InfoWindow, OverlayView } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";
import RestaurantInfoModal from "./RestaurantInfoModal";

function RestaurantMarkers({ restaurants, map }) {
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Clean up existing markers
    markersRef.current.forEach(marker => {
      if (marker.map) {
        marker.map = null;
      }
    });
    markersRef.current = [];

    // Create new AdvancedMarkerElements
    if (map && window.google && window.google.maps && window.google.maps.marker) {
      restaurants.forEach((restaurant) => {
        try {
          const location = restaurant.geometry.location;
          const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
          const lng = typeof location.lng === 'function' ? location.lng() : location.lng;

          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: { lat, lng },
            title: restaurant.name,
          });

          // Add click listener using gmp-click for AdvancedMarkerElement
          marker.addListener('gmp-click', () => {
            setSelectedRestaurant(restaurant);
          });

          markersRef.current.push(marker);
        } catch (err) {
          console.error("Failed to create marker for restaurant:", restaurant?.name, err);
        }
      });
    }

    return () => {
      // Cleanup on unmount
      markersRef.current.forEach(marker => {
        if (marker.map) {
          marker.map = null;
        }
      });
    };
  }, [restaurants, map]);

  const handleCloseModal = () => {
    setSelectedRestaurant(null);
  };

  return (
    <>
      {/* Restaurant name labels */}
      {restaurants.map((restaurant) => {
        try {
          const location = restaurant.geometry.location;
          const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
          const lng = typeof location.lng === 'function' ? location.lng() : location.lng;

          return (
            <OverlayView
              key={restaurant.place_id}
              position={{ lat, lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: 'black',
                  textShadow: '1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white',
                  transform: 'translate(-70%, -50px)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  textAlign: 'left',
                }}
              >
                {restaurant.name}
              </div>
            </OverlayView>
          );
        } catch (err) {
          console.error("Failed to render label for restaurant:", restaurant?.name, err);
          return null;
        }
      })}
      
      {/* Restaurant Info Modal */}
      <RestaurantInfoModal 
        restaurant={selectedRestaurant} 
        onClose={handleCloseModal} 
      />
    </>
  );
}

export default RestaurantMarkers;
