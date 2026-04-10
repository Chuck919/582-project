# Future Work / Design Notes

## Move SearchBar into Sidebar
Currently `SearchBar` floats at the top-center of the map independently.
A cleaner UX might integrate it into the `Sidebar` component as a search
input at the top of the restaurant list panel. Benefits:
- Single unified place to find/filter restaurants
- Reduces UI clutter on the map surface
- Search results could filter the sidebar list in-place rather than
  showing a separate dropdown overlay
Considerations:
- SearchBar currently passes results to `handleResultSelect` in App.jsx;
  the same callback works if SearchBar moves inside Sidebar
- Would need to pass `onSearch`, `results`, `onResultSelect`,
  `currentPosition`, and `nearbyRestaurants` down into Sidebar (or lift
  search state up)
- Mobile: sidebar is a bottom drawer — search bar at the bottom might
  conflict with virtual keyboard; keep search at top on mobile or keep it
  separate for mobile breakpoint

## Error Handling for Empty/Failed Restaurant Data
Currently `placesError` shows a dismissible banner but the sidebar just
shows "No restaurants found nearby." in both the error case and the
genuine zero-results case. Improvements to consider:
- Distinguish between "API failed" vs "genuinely no restaurants nearby"
  in the sidebar empty state (pass an `isError` or `placesError` prop)
- Add a retry button in the sidebar empty state that re-triggers the
  Places API search (reset `hasSearched` flag)
- Show a loading skeleton in the sidebar while the initial fetch is in
  progress (pass an `isLoading` prop)
- If offline (`!navigator.onLine`), show a specific message in the sidebar
