import { useState } from "react";
import { createDeal } from "../utils/deals";
import "./DealForm.css";

/**
 * A simple form that allows a user to submit a deal.  
 *
 * Props:
 * - restaurantId (string) - optional. If provided, the deal will be tied to the
 *   given restaurant. The value should match whatever you use for
 *   `restaurant_id` in the database (in this project we use `place_id`).
 * - onSuccess(deal) - callback invoked after a successful submission.
 * - onError(error) - callback invoked on failure.
 */
export default function DealForm({ restaurantId = "", onSuccess, onError }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !description || !price) {
      setError("Please fill in title, description and price.");
      return;
    }

    setSubmitting(true);

    try {
      const priceNum = parseFloat(price);
      const dealInput = {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        restaurant_id: restaurantId,
      };
      const deal = await createDeal(dealInput);

      // clear fields
      setTitle("");
      setDescription("");
      setPrice("");

      onSuccess?.(deal);
    } catch (err) {
      console.error("deal submission error", err);
      const message = err?.message || "Unable to create deal";
      setError(message);
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="deal-form" onSubmit={handleSubmit}>
      <div className="deal-field">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="deal-input"
        />
      </div>
      <div className="deal-field">
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="deal-input"
          rows={3}
        />
      </div>
      <div className="deal-field">
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="deal-input"
          step="0.01"
        />
      </div>
      {error && <div className="deal-error">{error}</div>}
      <button type="submit" className="deal-btn" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Deal"}
      </button>
    </form>
  );
}
