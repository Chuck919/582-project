import React, { useEffect, useState } from "react";
import "./RestaurantInfoModal.css";
import DealForm from "./DealForm";
import { useAuth } from "../contexts/useAuth";
import { supabase } from "../lib/supabaseClient";

function RestaurantInfoModal({ restaurant, onClose, deals, onDealAdded }) {
  const { user } = useAuth();
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

  const cuisineLabel = restaurant.cuisine?.length
    ? restaurant.cuisine.join(", ")
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
        <p>Cuisine: {cuisineLabel}</p>
        
        <div className="deals-section">
          <h3>Current Deals</h3>
          {deals && deals.length > 0 ? (
            deals.map((deal, index) => (
              <div key={deal.id || index} className="deal-item">
                <p><strong>{deal.title}</strong></p>
                {deal.description && <p>{deal.description}</p>}
                {deal.expiry_date && (
                  <p>Expires: {new Date(deal.expiry_date).toLocaleDateString()}</p>
                )}
                {deal.terms && <p>Terms: {deal.terms}</p>}
              </div>
            ))
          ) : (
            <p>No current deals available.</p>
          )}
        </div>

        <div className="deal-form-section">
          <h3>Submit a Deal</h3>
          {user ? (
            <DealForm
              restaurantId={restaurant.place_id}
              onSuccess={(deal) => {
                onDealAdded?.(deal);
              }}
            />
          ) : (
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
              Log in to submit a deal.
            </p>
          )}
        </div>
        
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
