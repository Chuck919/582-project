import { Marker, InfoWindow, OverlayView } from "@react-google-maps/api";

function RestaurantMarkers({ restaurants, selectedRestaurant, setSelectedRestaurant }) {
  return (
    <>
      {/* Restaurant markers - red pinpoint markers with labels */}
      {restaurants.map((restaurant) => {
        const location = restaurant.geometry.location;
        const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
        const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
        
        return (
          <div key={restaurant.place_id}>
            <Marker
              position={{ lat, lng }}
              title={restaurant.name}
              onClick={() => setSelectedRestaurant(restaurant)}
              zIndex={500}
            />
            <OverlayView
              position={{ lat, lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'black',
                  textShadow: '1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white',
                  transform: 'translate(-50%, -35px)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  textAlign: 'center',
                }}
              >
                {restaurant.name}
              </div>
            </OverlayView>
          </div>
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
