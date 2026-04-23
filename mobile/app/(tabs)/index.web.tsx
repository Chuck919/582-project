import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';

const DEFAULT_LATLNG = { lat: 49.2827, lng: -123.1207 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

export default function MapScreen() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Location access was denied. Showing default location.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const center = position ?? DEFAULT_LATLNG;

  if (loadError) return (
    <View style={styles.container}>
      <Text style={styles.text}>Failed to load Google Maps.</Text>
    </View>
  );

  if (!isLoaded) return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading map...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      )}
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={14}
      >
        {position && <Marker position={position} title="You are here" />}
      </GoogleMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  text: { fontSize: 16, color: '#666', margin: 'auto' },
  banner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
  },
  bannerText: { color: '#856404', fontSize: 14 },
});
