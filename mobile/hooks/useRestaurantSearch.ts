import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

const SEARCH_RADIUS_KM = 10;

interface PlaceLocation {
  latitude: number;
  longitude: number;
}

interface PlaceDisplayName {
  text: string;
  languageCode: string;
}

interface PriceAmount {
  units: number;
  nanos: number;
}

interface PriceRange {
  startPrice?: PriceAmount;
  endPrice?: PriceAmount;
}

interface RawPlace {
  id: string;
  displayName?: PlaceDisplayName;
  formattedAddress?: string;
  location?: PlaceLocation;
  types?: string[];
  rating?: number;
  priceRange?: PriceRange;
}

export interface Restaurant {
  place_id: string;
  name: string | null;
  vicinity: string | null;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating: number | null;
  cuisine: string[] | null;
  price_range: [number, number] | null;
}

function normalizePlace(place: RawPlace): Restaurant {
  return {
    place_id: place.id,
    name: place.displayName?.text ?? null,
    vicinity: place.formattedAddress ?? null,
    geometry: {
      location: {
        lat: place.location?.latitude ?? 0,
        lng: place.location?.longitude ?? 0,
      },
    },
    rating: place.rating ?? null,
    cuisine:
      place.types
        ?.filter((t) => t.includes('_restaurant'))
        .map((t) =>
          t
            .replace(/_/g, ' ')
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        ) ?? null,
    price_range:
      place.priceRange?.startPrice && place.priceRange?.endPrice
        ? [
            place.priceRange.startPrice.units +
              place.priceRange.startPrice.nanos / 1e9,
            place.priceRange.endPrice.units +
              place.priceRange.endPrice.nanos / 1e9,
          ]
        : null,
  };
}

interface UseRestaurantSearchParams {
  currentPosition: { lat: number; lng: number } | null;
}

interface UseRestaurantSearchResult {
  restaurants: Restaurant[];
  hasActiveDealsByPlaceId: Record<string, boolean>;
  syncActiveDealFlags: (updates: Record<string, boolean>) => void;
  isFetchingRestaurants: boolean;
  placesError: string | null;
  resetSearch: () => void;
  dismissPlacesError: () => void;
}

export function useRestaurantSearch({
  currentPosition,
}: UseRestaurantSearchParams): UseRestaurantSearchResult {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFetchingRestaurants, setIsFetchingRestaurants] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [hasActiveDealsByPlaceId, setHasActiveDealsByPlaceId] = useState<
    Record<string, boolean>
  >({});

  const resetSearch = useCallback(() => {
    setHasSearched(false);
    setRestaurants([]);
  }, []);

  const syncActiveDealFlags = useCallback(
    (updates: Record<string, boolean>) => {
      setHasActiveDealsByPlaceId((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const dismissPlacesError = useCallback(() => setPlacesError(null), []);

  // Fetch from Places API (New) HTTP endpoint, or read from AsyncStorage cache
  useEffect(() => {
    if (!currentPosition || hasSearched) return;

    const { lat, lng } = currentPosition;
    const cacheKey = `restaurants_${lat.toFixed(3)}_${lng.toFixed(3)}_${SEARCH_RADIUS_KM}`;

    (async () => {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const cachedRestaurants: Restaurant[] = JSON.parse(cached);
        setRestaurants(cachedRestaurants);
        setHasSearched(true);
        return;
      }

      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setPlacesError('Could not load nearby restaurants. The map is still available.');
        setHasSearched(true);
        setIsFetchingRestaurants(false);
        return;
      }

      setIsFetchingRestaurants(true);
      try {
        const response = await fetch(
          'https://places.googleapis.com/v1/places:searchNearby',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask':
                'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.priceRange',
            },
            body: JSON.stringify({
              includedTypes: ['restaurant'],
              maxResultCount: 20,
              locationRestriction: {
                circle: {
                  center: { latitude: lat, longitude: lng },
                  radius: SEARCH_RADIUS_KM * 1000,
                },
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Places API error: ${response.status}`);
        }

        const data = await response.json();
        const places: RawPlace[] = data.places ?? [];
        if (places.length > 0) {
          const formatted = places.map(normalizePlace);
          setRestaurants(formatted);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(formatted));
        }
        setHasSearched(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isNetworkError = message === 'Network request failed';
        setPlacesError(
          isNetworkError
            ? 'No internet connection. Restaurant data could not be loaded.'
            : 'Could not load nearby restaurants. The map is still available.'
        );
        setHasSearched(true);
      } finally {
        setIsFetchingRestaurants(false);
      }
    })().catch(() => {
      // Do not log the error object — accessing err.stack crashes Hermes 0.12.0
      setPlacesError('Could not load nearby restaurants. The map is still available.');
      setIsFetchingRestaurants(false);
      setHasSearched(true);
    });
  }, [currentPosition, hasSearched]);

  // TODO(PR 4): add Supabase upsert here once auth is wired in.
  // Concurrent Supabase network calls alongside the Places fetch trigger a
  // Hermes 0.12.0 race in DictPropertyMap on the iOS simulator. Defer until
  // auth lands and the hook has a single active network path.

  // TODO(PR 8): add has_active_deals lookup here once deals are seeded.
  // Same reason as above — avoid concurrent networking TurboModule calls.

  return {
    restaurants,
    hasActiveDealsByPlaceId,
    syncActiveDealFlags,
    isFetchingRestaurants,
    placesError,
    resetSearch,
    dismissPlacesError,
  };
}
