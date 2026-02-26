import React, { useEffect, useState } from "react";
import "./RestaurantInfoModal.css";
import { supabase } from "../lib/supabaseClient";

function RestaurantInfoModal({ restaurant, onClose }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurant) return;

    const fetchDeals = async () => {
      setLoading(true);
      try {
        console.log('Looking up restaurant:', restaurant.name);
        
        // First, find the restaurant in Supabase by name (without .single() to see all matches)
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name')
          .ilike('name', `%${restaurant.name}%`);

        console.log('Restaurant query result:', restaurantData, restaurantError);

        if (restaurantError || !restaurantData || restaurantData.length === 0) {
          console.log('Restaurant not found in database:', restaurant.name);
          setDeals([]);
          setLoading(false);
          return;
        }

        // Use the first match
        const matchedRestaurant = restaurantData[0];
        console.log('Matched restaurant:', matchedRestaurant);

        // Fetch deals for this restaurant
        const { data: dealsData, error: dealsError } = await supabase
          .from('deals')
          .select('*')
          .eq('restaurant_id', matchedRestaurant.id);

        console.log('Deals query result:', dealsData, dealsError);

        if (dealsError) {
          console.error('Error fetching deals:', dealsError);
          setDeals([]);
        } else {
          setDeals(dealsData || []);
        }
      } catch (error) {
        console.error('Error fetching deals:', error);
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [restaurant]);

  if (!restaurant) return null;

  const filteredTypes = restaurant.types
    ? restaurant.types
        .filter((type) => type.includes("_restaurant"))
        .map((type) =>
          type
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        )
        .join(", ")
    : "N/A";

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>{restaurant.name}</h2>
        <p>Rating: {restaurant.rating || "N/A"}</p>
        <p>Cuisine: {filteredTypes || "N/A"}</p>
        
        <div className="deals-section">
          <h3>Deals</h3>
          {loading ? (
            <p className="deals-loading">Loading deals...</p>
          ) : deals.length > 0 ? (
            <div className="deals-list">
              {deals.map((deal) => (
                <div key={deal.id} className="deal-item">
                  <p className="deal-description">{deal.description}</p>
                  <p className="deal-discount">Discount: {deal.discount_amount}</p>
                  <p className="deal-expiration">
                    Expires: {formatDate(deal.expiration_date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-deals">N/A</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RestaurantInfoModal;
