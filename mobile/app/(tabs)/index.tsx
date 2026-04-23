import Constants from 'expo-constants';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View, Text } from 'react-native';
import { useUserLocation, DEFAULT_CENTER } from '../../hooks/useUserLocation';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

export default function MapScreen() {
  const { coords, error } = useUserLocation();
  const center = coords ?? DEFAULT_CENTER;

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
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
  bannerText: { color: '#856404', fontSize: 14 },
});
