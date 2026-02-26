import { useState, useRef, useEffect, useCallback } from "react";
import "./SearchBar.css";

/**
 * Sanitizes user input by stripping HTML tags and characters that could
 * be used for XSS or injection attacks, then trims whitespace.
 */
function sanitizeInput(input) {
  return input
    .replace(/<[^>]*>/g, "")      // strip HTML tags
    .replace(/[<>"'`;&]/g, "")    // strip remaining dangerous chars
    .trim();
}

function SearchBar({ onSearch, results, isSearching, onResultSelect, currentPosition }) {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const debounceTimer = useRef(null);
  // Session token groups autocomplete keystrokes + place detail fetch into one
  // billable event. Reset after each selection or manual submission.
  const sessionTokenRef = useRef(null);

  const getSessionToken = useCallback(() => {
    if (
      !sessionTokenRef.current &&
      window.google?.maps?.places?.AutocompleteSessionToken
    ) {
      sessionTokenRef.current =
        new window.google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  const resetSessionToken = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  const fetchSuggestions = useCallback(
    async (input) => {
      if (!input || !window.google?.maps?.places?.AutocompleteSuggestion) {
        setSuggestions([]);
        return;
      }

      setIsFetchingSuggestions(true);
      try {
        const request = {
          input,
          sessionToken: getSessionToken(),
          includedPrimaryTypes: ["restaurant"],
        };
        if (currentPosition) {
          request.locationBias = { center: currentPosition, radius: 10000 };
        }
        const { suggestions: raw } =
          await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );
        setSuggestions(raw ?? []);
      } catch (err) {
        console.error("Autocomplete failed:", err);
        setSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    },
    [currentPosition, getSessionToken]
  );

  // Debounce autocomplete: fetch 300 ms after the user stops typing
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setHasSearched(false);
    clearTimeout(debounceTimer.current);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const sanitized = sanitizeInput(value);
    if (!sanitized) return;

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(sanitized);
    }, 300);
  };

  // Manual submit: fall back to full text search (e.g. when user ignores suggestions)
  const handleSubmit = (e) => {
    e.preventDefault();
    const sanitized = sanitizeInput(query);
    if (!sanitized) return;
    setSuggestions([]);
    setHasSearched(true);
    resetSessionToken();
    onSearch(sanitized);
  };

  // Select an autocomplete suggestion: fetch full place details then open modal
  const handleSuggestionSelect = async (suggestion) => {
    const prediction = suggestion.placePrediction;
    const name = prediction.mainText?.toString() ?? prediction.text.toString();
    setQuery(name);
    setSuggestions([]);
    setHasSearched(false);
    resetSessionToken(); // ends the billing session

    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["id", "displayName", "formattedAddress", "location", "types", "rating"],
      });
      const restaurant = {
        place_id: place.id,
        name: place.displayName,
        vicinity: place.formattedAddress,
        geometry: {
          location: {
            lat: place.location.lat(),
            lng: place.location.lng(),
          },
        },
        rating: place.rating,
        types: place.types,
      };
      onResultSelect(restaurant);
    } catch (err) {
      console.error("Place detail fetch failed:", err);
      // Fall back to text search so the user still gets a result
      onSearch(name);
      setHasSearched(true);
    }
  };

  // Select a result from a manual text search
  const handleResultSelect = (restaurant) => {
    onResultSelect(restaurant);
    setQuery("");
    setHasSearched(false);
  };

  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
    setSuggestions([]);
    clearTimeout(debounceTimer.current);
  };

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  const showSuggestions = suggestions.length > 0;
  const showResults = hasSearched && !isSearching && !showSuggestions;

  return (
    <div className="search-container">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search for a restaurant..."
            value={query}
            onChange={handleChange}
            maxLength={100}
            aria-label="Search restaurants"
            aria-autocomplete="list"
            aria-controls="search-dropdown"
            autoComplete="off"
          />
          {/* Spinner while fetching suggestions */}
          {isFetchingSuggestions && (
            <span className="search-spinner" aria-hidden="true" />
          )}
          {/* Clear button when there's text and we're not loading */}
          {query && !isFetchingSuggestions && (
            <button
              type="button"
              className="search-clear-button"
              onClick={handleClear}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
        <button
          type="submit"
          className="search-button"
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? "Searching…" : "Search"}
        </button>
      </form>

      {/* Autocomplete suggestions (shown while typing) */}
      {showSuggestions && (
        <div
          id="search-dropdown"
          className="search-results"
          role="listbox"
          aria-label="Autocomplete suggestions"
        >
          {suggestions.map((suggestion, i) => {
            const prediction = suggestion.placePrediction;
            const main = prediction.mainText?.toString() ?? "";
            const secondary = prediction.secondaryText?.toString() ?? "";
            return (
              <div
                key={prediction.placeId ?? i}
                className="search-result-item"
                role="option"
                tabIndex={0}
                onClick={() => handleSuggestionSelect(suggestion)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSuggestionSelect(suggestion)
                }
              >
                <span className="result-name">{main}</span>
                {secondary && (
                  <span className="result-address">{secondary}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual text-search results (shown after pressing Search) */}
      {showResults && (
        <div className="search-results" role="listbox" aria-label="Search results">
          {results.length > 0 ? (
            results.map((restaurant) => (
              <div
                key={restaurant.place_id}
                className="search-result-item"
                role="option"
                tabIndex={0}
                onClick={() => handleResultSelect(restaurant)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleResultSelect(restaurant)
                }
              >
                <span className="result-name">{restaurant.name}</span>
                {restaurant.vicinity && (
                  <span className="result-address">{restaurant.vicinity}</span>
                )}
                {restaurant.rating && (
                  <span className="result-rating">★ {restaurant.rating}</span>
                )}
              </div>
            ))
          ) : (
            <div className="no-results">
              No restaurants found for &ldquo;{sanitizeInput(query)}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Full-text search loading */}
      {isSearching && <div className="search-loading">Searching…</div>}
    </div>
  );
}

export default SearchBar;
