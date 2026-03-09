import "./Sidebar.css";

function Sidebar({ restaurants, onRestaurantSelect, deals, isOpen, onToggle }) {
  return (
    <aside
      className={`sidebar ${isOpen ? "sidebar--open" : ""}`}
      aria-label="Nearby restaurants"
    >
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="sidebar-panel"
        title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <span className="sidebar-toggle-icon" aria-hidden="true">&#8250;</span>
        {!isOpen && <span className="sidebar-toggle-label">Restaurants</span>}
      </button>
      <div id="sidebar-panel" className="sidebar-content">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Nearby Restaurants</h2>
          <span className="sidebar-count">{restaurants.length}</span>
        </div>
        {restaurants.length > 0 ? (
          <ul className="sidebar-list">
            {restaurants.map((r) => {
              const dealCount = deals[r.place_id]?.length ?? 0;
              return (
                <li key={r.place_id} className="sidebar-item">
                  <button
                    className="sidebar-item-btn"
                    onClick={() => onRestaurantSelect(r)}
                  >
                    <span className="sidebar-item-name">{r.name}</span>
                    {r.rating && (
                      <span className="sidebar-item-rating">★ {r.rating}</span>
                    )}
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
