"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DataPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });

  const [message, setMessage] = useState("");

  const whatsappInviteLink =
    "https://chat.whatsapp.com/IHJ45efC2RuD6MSbhMkStE?mode=gi_t";

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveData = async (type) => {
    if (!form.name || !form.email || !form.whatsapp) {
      setMessage("Please fill all fields.");
      return;
    }

    const { error } = await supabase.from("coupon_leads").insert([
      {
        ...form,
        preference: type,
      },
    ]);

    if (error) {
      setMessage("Something went wrong.");
      return;
    }

    if (type === "group") {
      window.location.href = whatsappInviteLink;
    } else {
      setMessage(
        "Coupon code will be sent to your WhatsApp and email shortly."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          Get 10% OFF Coupon
        </h1>

        <p className="text-sm text-center mb-6 text-gray-600">
          Please make sure your WhatsApp number and email are correct because
          the coupon code will be sent there.
        </p>

        <div className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3"
          />

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3"
          />

          <input
            type="tel"
            name="whatsapp"
            placeholder="Enter WhatsApp number"
            value={form.whatsapp}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3"
          />

          <button
            onClick={() => saveData("group")}
            className="w-full bg-black text-white rounded-xl py-3 font-semibold"
          >
            Join Our WhatsApp Group
          </button>

          <button
            onClick={() => saveData("coupon")}
            className="w-full border border-black rounded-xl py-3 font-semibold"
          >
            I Just Want the Coupon Only
          </button>
        </div>

        {message && (
          <p className="text-green-600 text-center mt-4">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}