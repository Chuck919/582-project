import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type Coords = { latitude: number; longitude: number };

type UseUserLocationResult = {
  coords: Coords | null;
  permissionStatus: Location.PermissionStatus | null;
  error: string | null;
};

export const DEFAULT_CENTER: Coords = { latitude: 49.2827, longitude: -123.1207 };

export function useUserLocation(): UseUserLocationResult {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== 'granted') {
        setError('Location access was denied. Showing default location.');
        return;
      }
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch {
        setError('Unable to get your location. Showing default location.');
      }
    })().catch(() => {
      // Do not log the error object — accessing err.stack crashes Hermes 0.12.0
      setError('Unable to get your location. Showing default location.');
    });
  }, []);

  return { coords, permissionStatus, error };
}
