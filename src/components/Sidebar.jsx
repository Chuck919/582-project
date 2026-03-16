import { useMemo, useState } from "react";
import "./Sidebar.css";

function Sidebar({ restaurants, onRestaurantSelect, deals, isOpen, onToggle, isFavorite }) {
    const [sortBy, setSortBy] = useState("distance");
    const [showDeals, setShowDeals] = useState(true);

    const sortedRestaurants = useMemo(() => {
        return [...restaurants].sort((a, b) => {
            const aHasDeals = deals[a.place_id]?.length > 0;
            const bHasDeals = deals[b.place_id]?.length > 0;

            if (showDeals) {
                if (aHasDeals !== bHasDeals) {
                    return aHasDeals ? -1 : 1;
                }
            }

            if (sortBy === "distance") {
                const aDist = Number.isFinite(a.distanceMeters) ? a.distanceMeters : Number.POSITIVE_INFINITY;
                const bDist = Number.isFinite(b.distanceMeters) ? b.distanceMeters : Number.POSITIVE_INFINITY;
                if (aDist !== bDist) return aDist - bDist;
            }

            return (a.name || "").localeCompare(b.name || "");
        });
    }, [restaurants, sortBy, showDeals, deals]);

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
                        <h2 className="sidebar-title">Nearby Restaurants</h2>
                        <span className="sidebar-count">{sortedRestaurants.length}</span>
                    </div>

                    <div className="sidebar-controls">
                        <button
                            id="sidebar-deals-btn"
                            className={`sidebar-deals-btn ${showDeals ? "sidebar-deals-btn--active" : ""}`}
                            onClick={() => setShowDeals(!showDeals)}
                        >
                            Deals
                        </button>

                        <select
                            id="sidebar-sort"
                            className="sidebar-sort"
                            aria-label="Sort restaurants"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="distance">Distance</option>
                        </select>
                    </div>
                </div>

                {sortedRestaurants.length > 0 ? (
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
                    <p className="sidebar-empty">No restaurants found nearby.</p>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;