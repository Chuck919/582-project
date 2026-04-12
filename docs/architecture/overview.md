# Architecture Overview

This document describes the layer structure of the 582-project web application and how each layer relates to the others.

## Layer Diagram

```mermaid
graph TD
  subgraph External["External Services"]
    GAPI["Google Places API"]
    SB["Supabase (DB + Auth + Storage)"]
  end

  subgraph Lib["lib/"]
    SUP["supabase.js\nSupabase client singleton"]
  end

  subgraph Utils["utils/"]
    VAL["validation.js\nsanitizeInput, email/password validators"]
    GEO["geo.js\ncalculateDistance (Haversine)"]
    SEARCH["search.js\nlevenshtein, fuzzyMatch"]
    DEALS_U["deals.js\ncreateDeal, fetchDeals"]
    AVATAR["avatarStorage.js\nuploadAvatar, removeAvatar"]
    SESS["sessionRestaurantFilters.js\nread/write/clear session filters"]
  end

  subgraph Contexts["contexts/"]
    AUTH_CTX["AuthContext.jsx\nuser, profile, signIn, signUp, signOut, updateProfile"]
  end

  subgraph Hooks["hooks/"]
    USE_AUTH["useAuth.js\nconsumes AuthContext"]
    USE_FAV["useFavorites.js\nfavorites CRUD + optimistic updates"]
    USE_SEARCH["useRestaurantSearch.js\nPlaces API fetch, cache, DB upsert"]
    USE_FILTERS["useRestaurantFilters.js\nfilter state, filteredRestaurants, cuisineOptions"]
  end

  subgraph Components["components/"]
    APP["App.jsx\nmap, geolocation, UI orchestration"]
    SIDEBAR["Sidebar.jsx"]
    MARKERS["RestaurantMarkers.jsx"]
    MODAL["RestaurantInfoModal.jsx"]
    DEALFORM["DealForm.jsx"]
    SEARCHBAR["SearchBar.jsx"]
    AUTH_HEADER["AuthHeader.jsx"]
    USER_PROFILE["UserProfile.jsx"]
    LOGIN["Login.jsx"]
    SIGNUP["SignUp.jsx"]
  end

  %% External → Lib
  SB --> SUP

  %% Lib → Utils
  SUP --> DEALS_U
  SUP --> AVATAR

  %% Lib → Contexts
  SUP --> AUTH_CTX

  %% Lib → Hooks
  SUP --> USE_FAV
  SUP --> USE_SEARCH

  %% Utils → Hooks
  SESS --> USE_FILTERS
  GEO --> APP
  SEARCH --> APP
  VAL --> APP
  VAL --> DEALFORM

  %% Contexts → Hooks
  AUTH_CTX --> USE_AUTH

  %% Hooks → Components
  USE_AUTH --> APP
  USE_AUTH --> AUTH_CTX
  USE_AUTH --> DEALFORM
  USE_FAV --> APP
  USE_SEARCH --> APP
  USE_FILTERS --> APP

  %% Utils → Components
  DEALS_U --> APP
  DEALS_U --> DEALFORM
  AVATAR --> USER_PROFILE

  %% Google Maps API → Components
  GAPI --> APP
  GAPI --> USE_SEARCH

  %% Component tree (simplified)
  APP --> SIDEBAR
  APP --> MARKERS
  APP --> MODAL
  APP --> SEARCHBAR
  APP --> AUTH_HEADER
  APP --> USER_PROFILE
  MODAL --> DEALFORM
```

## Layer Responsibilities

| Layer | Responsibility |
|---|---|
| `lib/` | Third-party client instantiation (one file per client) |
| `utils/` | Pure functions and thin service wrappers — no React, no state |
| `contexts/` | Global React state shared across the tree (auth only) |
| `hooks/` | Stateful domain logic consumed by components |
| `components/` | Rendering and user interaction |
