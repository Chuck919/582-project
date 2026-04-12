import { OverlayView } from "@react-google-maps/api";
import { useEffect, useRef } from "react";
import "./RestaurantMarkers.css";

function RestaurantMarkers({
  restaurants,
  map,
  hasActiveDealsByPlaceId,
  selectedRestaurant,
  setSelectedRestaurant,
}) {
  const markersRef = useRef([]);

  useEffect(() => {
    markersRef.current.forEach((marker) => {
      if (marker.map) marker.map = null;
    });
    markersRef.current = [];

    if (map && window.google && window.google.maps && window.google.maps.marker) {
      const { AdvancedMarkerElement, PinElement } = window.google.maps.marker;

      restaurants.forEach((restaurant) => {
        try {
          const location = restaurant.geometry.location;
          const lat = typeof location.lat === "function" ? location.lat() : location.lat;
          const lng = typeof location.lng === "function" ? location.lng() : location.lng;
          const hasActiveDeals = !!hasActiveDealsByPlaceId?.[restaurant.place_id];

          const markerOptions = {
            map,
            position: { lat, lng },
            title: restaurant.name,
          };
          if (hasActiveDeals) {
            markerOptions.content = new PinElement({
              background: "#00509D",
              borderColor: "#002a5c",
              glyphColor: "#FFD500",
            }).element;
          }

          const marker = new AdvancedMarkerElement(markerOptions);
          marker.addListener("gmp-click", () => {
            setSelectedRestaurant(restaurant);
          });
          markersRef.current.push(marker);
        } catch (err) {
          console.error("Failed to create marker for restaurant:", restaurant?.name, err);
        }
      });
    }

    return () => {
      markersRef.current.forEach((marker) => {
        if (marker.map) marker.map = null;
      });
    };
  }, [restaurants, map, hasActiveDealsByPlaceId, setSelectedRestaurant]);

  return (
    <>
      {restaurants.map((restaurant) => {
        const location = restaurant.geometry?.location;
        if (!location) return null;
        const lat = typeof location.lat === "function" ? location.lat() : location.lat;
        const lng = typeof location.lng === "function" ? location.lng() : location.lng;
        if (!lat || !lng) return null;

        return (
          <OverlayView
            key={restaurant.place_id}
            position={{ lat, lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="restaurant-label">{restaurant.name}</div>
          </OverlayView>
        );
      })}
    </>
  );
}

export default RestaurantMarkers;
