import { useState, useRef } from "react";
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

function SearchBar({ onSearch, results, isSearching, onResultSelect, nearbyRestaurants = [] }) {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [outOfAreaMessage, setOutOfAreaMessage] = useState("");
  const debounceTimer = useRef(null);

  const fetchSuggestions = (input) => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    const sanitized = sanitizeInput(input);
    if (!sanitized) {
      setSuggestions([]);
      return;
    }

    const filtered = nearbyRestaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(sanitized.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setHasSearched(false);
    clearTimeout(debounceTimer.current);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
const sanitized = sanitizeInput(query);
    if (!sanitized) return;
    setSuggestions([]);
    setHasSearched(true);
    onSearch(sanitized);
  };

  const handleSuggestionSelect = (restaurant) => {
    setQuery(restaurant.name);
    setSuggestions([]);
    setHasSearched(false);
    setOutOfAreaMessage("");
    onResultSelect(restaurant);
  };

  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
    setSuggestions([]);
    setOutOfAreaMessage("");
  };

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
          {query && (
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

      {showSuggestions && (
        <div
          id="search-dropdown"
          className="search-results"
          role="listbox"
          aria-label="Autocomplete suggestions"
        >
          {suggestions.map((restaurant, i) => (
            <div
              key={restaurant.place_id ?? i}
              className="search-result-item"
              role="option"
              tabIndex={0}
              onClick={() => handleSuggestionSelect(restaurant)}
              onKeyDown={(e) => e.key === "Enter" && handleSuggestionSelect(restaurant)}
            >
              <span className="result-name">{restaurant.name}</span>
              {restaurant.vicinity && <span className="result-address">{restaurant.vicinity}</span>}
            </div>
          ))}
        </div>
      )}

      {outOfAreaMessage && (
        <div className="search-results">
          <div className="no-results out-of-area-message">{outOfAreaMessage}</div>
        </div>
      )}

      {showResults && (
        <div className="search-results" role="listbox" aria-label="Search results">
          {results.length > 0 ? (
            results.map((restaurant) => (
              <div
                key={restaurant.place_id}
                className="search-result-item"
                role="option"
                tabIndex={0}
                onClick={() => handleSuggestionSelect(restaurant)}
                onKeyDown={(e) => e.key === "Enter" && handleSuggestionSelect(restaurant)}
              >
                <span className="result-name">{restaurant.name}</span>
                {restaurant.vicinity && <span className="result-address">{restaurant.vicinity}</span>}
                {restaurant.rating && <span className="result-rating">★ {restaurant.rating}</span>}
              </div>
            ))
          ) : (
            <div className="no-results">
              &ldquo;{sanitizeInput(query)}&rdquo; was not found among the restaurants near your
              location. Try searching for a restaurant shown on the map.
            </div>
          )}
        </div>
      )}

      {isSearching && <div className="search-loading">Searching…</div>}
    </div>
  );
}

export default SearchBar;
