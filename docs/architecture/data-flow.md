# Data Flow

This document describes how the three main data domains — restaurants, deals, and favorites — move through the application.

---

## Restaurant Data Flow

```mermaid
sequenceDiagram
  participant App
  participant useRestaurantSearch
  participant SessionStorage
  participant GooglePlaces as Google Places API
  participant Supabase

  App->>useRestaurantSearch: mount (map, currentPosition, searchRadius)
  useRestaurantSearch->>SessionStorage: check cache key
  alt cache hit
    SessionStorage-->>useRestaurantSearch: cached restaurants[]
    useRestaurantSearch-->>App: restaurants (from cache)
  else cache miss
    useRestaurantSearch->>GooglePlaces: searchNearby(request)
    GooglePlaces-->>useRestaurantSearch: Place[]
    useRestaurantSearch->>useRestaurantSearch: normalizePlace() → restaurant[]
    useRestaurantSearch->>SessionStorage: write cache
    useRestaurantSearch-->>App: restaurants
    useRestaurantSearch->>Supabase: upsert restaurants (sync for favorites/deals)
  end
  useRestaurantSearch->>Supabase: select has_active_deals
  Supabase-->>useRestaurantSearch: hasActiveDealsByPlaceId
  useRestaurantSearch-->>App: hasActiveDealsByPlaceId
  App->>useRestaurantFilters: restaurantsWithDistance (distance computed via calculateDistance)
  useRestaurantFilters-->>App: filteredRestaurants, cuisineOptions
  App->>Sidebar: filteredRestaurants
  App->>RestaurantMarkers: filteredRestaurants, hasActiveDealsByPlaceId
```

---

## Deals Data Flow

```mermaid
sequenceDiagram
  participant App
  participant Supabase
  participant RestaurantInfoModal
  participant DealForm

  App->>Supabase: fetchDeals() on mount + after deal added
  Supabase-->>App: deals grouped by restaurant_id
  App->>RestaurantInfoModal: deals[selectedRestaurant.place_id]
  RestaurantInfoModal->>DealForm: render (restaurantId, onSuccess)
  DealForm->>Supabase: createDeal({ title, description, price, restaurant_id, user_id })
  Supabase-->>DealForm: created deal
  DealForm->>App: onDealAdded callback
  App->>App: refreshDeals() — re-fetches deals + hasActiveDealsByPlaceId
```

---

## Favorites Data Flow

```mermaid
sequenceDiagram
  participant App
  participant useFavorites
  participant Supabase
  participant Sidebar
  participant RestaurantInfoModal

  App->>useFavorites: mount (user from useAuth)
  useFavorites->>Supabase: select favorites for user
  Supabase-->>useFavorites: restaurant_id[]
  useFavorites->>Supabase: select restaurant rows by id
  Supabase-->>useFavorites: favoriteRestaurants[]
  useFavorites-->>App: isFavorite, isFavoriteLoading, toggleFavorite, favoriteRestaurants

  App->>Sidebar: isFavorite, favoriteRestaurants
  App->>RestaurantInfoModal: isFavorite, isFavoriteLoading, toggleFavorite

  Note over useFavorites: toggleFavorite uses optimistic updates
  RestaurantInfoModal->>useFavorites: toggleFavorite(restaurantId, restaurantData)
  useFavorites->>useFavorites: optimistic state update
  useFavorites->>Supabase: insert or delete favorites row
  alt DB error
    useFavorites->>useFavorites: rollback optimistic update
  end
```
