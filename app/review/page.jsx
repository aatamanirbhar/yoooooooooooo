"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ReviewPage() {
  const [form, setForm] = useState({
    customer_name: "",
    rating: 5,
    review_text: "",
  });

  const [success, setSuccess] = useState(false);

  const submitReview = async () => {
    const { error } = await supabase
      .from("reviews")
      .insert([form]);

    if (error) {
      alert(error.message);
      return;
    }

    setSuccess(true);

    setForm({
      customer_name: "",
      rating: 5,
      review_text: "",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50 px-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-6">
          Share Your Review
        </h1>

        {success && (
          <p className="text-emerald-600 mb-4">
            Thank you for your review ❤️
          </p>
        )}

        <input
          placeholder="Your Name"
          value={form.customer_name}
          onChange={(e) =>
            setForm({
              ...form,
              customer_name: e.target.value,
            })
          }
          className="w-full border p-3 rounded-xl mb-4"
        />

        <input
          type="number"
          min="1"
          max="5"
          value={form.rating}
          onChange={(e) =>
            setForm({
              ...form,
              rating: Number(e.target.value),
            })
          }
          className="w-full border p-3 rounded-xl mb-4"
        />

        <textarea
          placeholder="Write your review"
          value={form.review_text}
          onChange={(e) =>
            setForm({
              ...form,
              review_text: e.target.value,
            })
          }
          className="w-full border p-3 rounded-xl mb-4"
        />

        <button
          onClick={submitReview}
          className="w-full bg-black text-white py-3 rounded-2xl"
        >
          Submit Review
        </button>
      </div>
    </div>
  );
}