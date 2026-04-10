# Project Memory

## Architecture
- React 19 + Vite 7, JSX (no TypeScript)
- Google Maps via @react-google-maps/api, new Places API (searchNearby)
- Supabase for auth and deals storage
- State: local useState only; restaurant data cached in sessionStorage

## Key Files
- `src/App.jsx` — main component, geolocation, Places API search, map
- `src/components/Sidebar.jsx` / `Sidebar.css` — collapsible restaurant list sidebar
- `src/components/RestaurantMarkers.jsx` — markers + InfoWindow modal
- `src/components/SearchBar.jsx` — fuzzy search bar
- `src/components/AuthHeader.jsx` — auth UI
- `src/App.css` — global styles incl. `.map-type-toggle`, `.places-error-banner`

## Sidebar (added PR #38)
- Left-edge collapsible drawer on desktop; bottom drawer on mobile (<640px)
- Map/Satellite toggle uses `.map-type-toggle` CSS class with `--map-toggle-left` CSS custom property to slide with sidebar on desktop, locked to `10px` on mobile via media query
- Sidebar width: 280px content + 32px toggle button = 312px total; open offset = 322px (10px gap)

## Future Work / Notes
See `memory/future-work.md`
