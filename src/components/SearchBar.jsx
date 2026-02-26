import { useState } from "react";
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

function SearchBar({ onSearch, results, isSearching, onResultSelect }) {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const sanitized = sanitizeInput(query);
    if (!sanitized) return;
    setHasSearched(true);
    onSearch(sanitized);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    // Reset result panel when the user clears the input
    if (e.target.value === "") {
      setHasSearched(false);
    }
  };

  const handleSelect = (restaurant) => {
    onResultSelect(restaurant);
    setQuery("");
    setHasSearched(false);
  };

  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
  };

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

      {/* Results panel */}
      {hasSearched && !isSearching && (
        <div className="search-results" role="listbox" aria-label="Search results">
          {results.length > 0 ? (
            results.map((restaurant) => (
              <div
                key={restaurant.place_id}
                className="search-result-item"
                role="option"
                tabIndex={0}
                onClick={() => handleSelect(restaurant)}
                onKeyDown={(e) => e.key === "Enter" && handleSelect(restaurant)}
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

      {/* Loading indicator below input */}
      {isSearching && (
        <div className="search-loading">Searching…</div>
      )}
    </div>
  );
}

export default SearchBar;
