import Constants from 'expo-constants';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View, Text } from 'react-native';
import { useUserLocation, DEFAULT_CENTER } from '../../hooks/useUserLocation';
import { useRestaurantSearch } from '../../hooks/useRestaurantSearch';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

export default function MapScreen() {
  const { coords, error: locationError } = useUserLocation();
  const center = coords ?? DEFAULT_CENTER;

  const currentPosition = coords
    ? { lat: coords.latitude, lng: coords.longitude }
    : null;

  const { restaurants, placesError } = useRestaurantSearch({ currentPosition });

  return (
    <View style={styles.container}>
      {locationError && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{locationError}</Text>
        </View>
      )}
      {placesError && (
        <View style={[styles.banner, locationError ? styles.bannerSecond : null]}>
          <Text style={styles.bannerText}>{placesError}</Text>
        </View>
      )}
      <MapView
        style={styles.map}
        provider={isExpoGo ? undefined : PROVIDER_GOOGLE}
        initialRegion={{
          ...center,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        region={{
          ...center,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={coords !== null}
      >
        {coords && <Marker coordinate={coords} title="You are here" />}
        {restaurants.map((r) => (
          <Marker
            key={r.place_id}
            coordinate={{
              latitude: r.geometry.location.lat,
              longitude: r.geometry.location.lng,
            }}
            title={r.name ?? undefined}
            description={r.vicinity ?? undefined}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
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
  bannerSecond: {
    top: 116,
  },
  bannerText: { color: '#856404', fontSize: 14 },
});
