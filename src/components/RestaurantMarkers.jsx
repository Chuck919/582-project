import { InfoWindow, OverlayView } from "@react-google-maps/api";
import { useEffect, useRef } from "react";

function RestaurantMarkers({ restaurants, selectedRestaurant, setSelectedRestaurant, map }) {
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
  }, [restaurants, setSelectedRestaurant, map]);

  return (
    <>
      {/* Restaurant name labels */}
      {restaurants.map((restaurant) => {
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
      })}
      
      {/* InfoWindow for selected restaurant */}
      {selectedRestaurant && (
        <InfoWindow
          position={{
            lat: typeof selectedRestaurant.geometry.location.lat === 'function' 
              ? selectedRestaurant.geometry.location.lat() 
              : selectedRestaurant.geometry.location.lat,
            lng: typeof selectedRestaurant.geometry.location.lng === 'function' 
              ? selectedRestaurant.geometry.location.lng() 
              : selectedRestaurant.geometry.location.lng,
          }}
          options={{ closeButton: false }}
        >
          <div style={{ maxWidth: '250px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'black' }}>{selectedRestaurant.name}</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'black' }}>
              {selectedRestaurant.vicinity || 'Address not available'}
            </p>
            <a 
              href={`https://www.google.com/maps/place/?q=place_id:${selectedRestaurant.place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1a73e8', textDecoration: 'none', fontSize: '14px' }}
            >
              View on Google Maps →
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default RestaurantMarkers;
