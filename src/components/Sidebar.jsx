import { useMemo, useState } from "react";
import "./Sidebar.css";

function Sidebar({ restaurants, onRestaurantSelect, deals, isOpen, onToggle, isFavorite, favoriteRestaurants = [], user, minRating = 0, onMinRatingChange, priceFilter = "", onPriceFilterChange, distanceFilter = "", onDistanceFilterChange, cuisineFilter = "", onCuisineFilterChange, cuisineOptions = [] }) {
    const [showDeals, setShowDeals] = useState(true);
    const [activeTab, setActiveTab] = useState("nearby");

    const sortedRestaurants = useMemo(() => {
        return [...restaurants].sort((a, b) => {
            const aHasDeals = deals[a.place_id]?.length > 0;
            const bHasDeals = deals[b.place_id]?.length > 0;

            if (showDeals) {
                if (aHasDeals !== bHasDeals) {
                    return aHasDeals ? -1 : 1;
                }
            }

            const aDist = Number.isFinite(a.distanceMeters) ? a.distanceMeters : Number.POSITIVE_INFINITY;
            const bDist = Number.isFinite(b.distanceMeters) ? b.distanceMeters : Number.POSITIVE_INFINITY;
            if (aDist !== bDist) return aDist - bDist;

            return (a.name || "").localeCompare(b.name || "");
        });
    }, [restaurants, showDeals, deals]);

    const isNearby = activeTab === "nearby";
    const headerTitle = isNearby ? "Nearby Restaurants" : "Saved Restaurants";
    const headerCount = isNearby ? sortedRestaurants.length : favoriteRestaurants.length;

    return (
        <aside
            className={`sidebar ${isOpen ? "sidebar--open" : "sidebar--closed"}`}
            aria-label="Nearby restaurants"
        >
            <button
                className="sidebar-toggle"
                onClick={onToggle}
                aria-expanded={isOpen}
                title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
                <span className="sidebar-toggle-icon" aria-hidden="true">&#8249;</span>
                {!isOpen && <span className="sidebar-toggle-label">Restaurants</span>}
            </button>

            <div className="sidebar-content">
                <div className="sidebar-header">
                    <div className="sidebar-title-group">
                        <h2 className="sidebar-title">{headerTitle}</h2>
                        <span className="sidebar-count">{headerCount}</span>
                    </div>

                    {isNearby && (
                        <div className="sidebar-controls">
                            <button
                                id="sidebar-deals-btn"
                                className={`sidebar-deals-btn ${showDeals ? "sidebar-deals-btn--active" : ""}`}
                                onClick={() => setShowDeals(!showDeals)}
                            >
                                Deals
                            </button>

                            <select
                                className="sidebar-rating-filter"
                                aria-label="Minimum rating"
                                value={minRating}
                                onChange={(e) => onMinRatingChange(Number(e.target.value))}
                            >
                                <option value={0}>Rating</option>
                                <option value={3}>3+ ★</option>
                                <option value={3.5}>3.5+ ★</option>
                                <option value={4}>4+ ★</option>
                                <option value={4.5}>4.5+ ★</option>
                            </select>

                            <select
                                className="sidebar-price-filter"
                                aria-label="Price range"
                                value={priceFilter}
                                onChange={(e) => onPriceFilterChange(e.target.value)}
                            >
                                <option value="">Price</option>
                                <option value="$">$</option>
                                <option value="$$">$$</option>
                                <option value="$$$">$$$</option>
                                <option value="$$$$">$$$$</option>
                            </select>

                            <select
                                className="sidebar-distance-filter"
                                aria-label="Maximum distance"
                                value={distanceFilter}
                                onChange={(e) => onDistanceFilterChange(e.target.value)}
                            >
                                <option value="">Distance</option>
                                <option value="1">&lt; 1 mi</option>
                                <option value="3">&lt; 3 mi</option>
                                <option value="5">&lt; 5 mi</option>
                                <option value="10">&lt; 10 mi</option>
                            </select>

                            <select
                                className="sidebar-cuisine-filter"
                                aria-label="Cuisine type"
                                value={cuisineFilter}
                                onChange={(e) => onCuisineFilterChange(e.target.value)}
                            >
                                <option value="">Cuisine</option>
                                {cuisineOptions.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                        </div>
                    )}
                </div>

                <div className="sidebar-tabs">
                    <button
                        className={`sidebar-tab${activeTab === "nearby" ? " sidebar-tab--active" : ""}`}
                        onClick={() => setActiveTab("nearby")}
                    >
                        Nearby
                    </button>
                    <button
                        className={`sidebar-tab${activeTab === "favorites" ? " sidebar-tab--active" : ""}`}
                        onClick={() => setActiveTab("favorites")}
                    >
                        Favorites
                    </button>
                </div>

                {isNearby ? (
                    sortedRestaurants.length > 0 ? (
                        <ul className="sidebar-list">
                            {sortedRestaurants.map((r) => {
                                const dealCount = deals[r.place_id]?.length ?? 0;
                                const isFav = isFavorite?.(r.place_id);
                                const distanceLabel = Number.isFinite(r.distanceMiles)
                                    ? (r.distanceMiles < 0.1 ? "< 0.1 mi" : `${r.distanceMiles.toFixed(1)} mi`)
                                    : null;

                                return (
                                    <li key={r.place_id} className="sidebar-item">
                                        <button
                                            className="sidebar-item-btn"
                                            onClick={() => onRestaurantSelect(r)}
                                        >
                                            <span className="sidebar-item-name">
                                                {isFav && <span className="sidebar-item-favorite" aria-label="Saved">★ </span>}
                                                {r.name}
                                            </span>

                                            <div className="sidebar-item-meta">
                                                {r.rating && (
                                                    <span className="sidebar-item-rating">★ {r.rating}</span>
                                                )}
                                                {distanceLabel && (
                                                    <span
                                                        className="sidebar-item-distance"
                                                        data-distance-miles={r.distanceMiles.toFixed(3)}
                                                    >
                                                        {distanceLabel}
                                                    </span>
                                                )}
                                            </div>

                                            {r.vicinity && (
                                                <span className="sidebar-item-address">{r.vicinity}</span>
                                            )}

                                            {dealCount > 0 && (
                                                <span className="sidebar-item-deals-badge">
                                                    {dealCount} deal{dealCount > 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="sidebar-empty">
                            {(minRating > 0 || priceFilter || distanceFilter || cuisineFilter)
                                ? "No restaurants match the current filters."
                                : "No restaurants found nearby."}
                        </p>
                    )
                ) : (
                    !user ? (
                        <p className="sidebar-empty">Log in to see your saved restaurants.</p>
                    ) : favoriteRestaurants.length > 0 ? (
                        <ul className="sidebar-list">
                            {favoriteRestaurants.map((r) => (
                                <li key={r.place_id} className="sidebar-item">
                                    <button
                                        className="sidebar-item-btn"
                                        onClick={() => onRestaurantSelect(r)}
                                    >
                                        <span className="sidebar-item-name">
                                            <span className="sidebar-item-favorite" aria-label="Saved">★ </span>
                                            {r.name}
                                        </span>

                                        <div className="sidebar-item-meta">
                                            {r.rating && (
                                                <span className="sidebar-item-rating">★ {r.rating}</span>
                                            )}
                                            {r.cuisine?.length > 0 && (
                                                <span className="sidebar-item-address">{r.cuisine.join(", ")}</span>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="sidebar-empty">No saved restaurants yet.</p>
                    )
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
