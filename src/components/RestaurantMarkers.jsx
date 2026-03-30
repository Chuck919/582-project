import { OverlayView } from "@react-google-maps/api";
import { useEffect, useRef } from "react";
import RestaurantInfoModal from "./RestaurantInfoModal";

  function RestaurantMarkers({
    restaurants,
    map,
    deals,
    hasActiveDealsByPlaceId,
    refreshDeals,
    selectedRestaurant,
    setSelectedRestaurant,
    isFavorite,
    isFavoriteLoading,
    toggleFavorite
  }) {
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
      const { AdvancedMarkerElement, PinElement } = window.google.maps.marker;

      restaurants.forEach((restaurant) => {
        try {
          const location = restaurant.geometry.location;
          const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
          const lng = typeof location.lng === 'function' ? location.lng() : location.lng;

          const hasActiveDeals = !!hasActiveDealsByPlaceId?.[restaurant.place_id];

          const markerOptions = {
            map,
            position: { lat, lng },
            title: restaurant.name,
          };
          if (hasActiveDeals) {
            markerOptions.content = new PinElement({
              background: '#00509D',
              borderColor: '#002a5c',
              glyphColor: '#FFD500',
            }).element;
          }

          const marker = new AdvancedMarkerElement(markerOptions);

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
  }, [restaurants, map, hasActiveDealsByPlaceId, setSelectedRestaurant]);

  const handleCloseModal = () => {
    setSelectedRestaurant(null);
  };

  return (
    <>
      {/* Restaurant name labels */}
      {restaurants.map((restaurant) => {
        const location = restaurant.geometry?.location;
        if (!location) return null;
        const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
        const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
        if (!lat || !lng) return null;

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
      
      {/* Restaurant Info Modal */}
      <RestaurantInfoModal
        restaurant={selectedRestaurant}
        onClose={handleCloseModal}
        deals={selectedRestaurant ? deals[selectedRestaurant.place_id] || [] : []}
        onDealAdded={() => refreshDeals?.()}
        isFavorite={isFavorite}
        isFavoriteLoading={isFavoriteLoading}
        toggleFavorite={toggleFavorite}
      />
    </>
  );
}

export default RestaurantMarkers;
