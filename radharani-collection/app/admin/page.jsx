"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";



export default function AdminPage() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    product_code: "",
    images: "",
  });

  const [deleteCode, setDeleteCode] = useState("");

  const addProduct = async () => {
    const { error } = await supabase
      .from("inventory")
      .insert([
        {
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          description: form.description,
          product_code: form.product_code,
         images: form.images
  ? form.images
      .split(",")
      .map((img) => img.trim())
      .filter(Boolean)
  : [],
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Product added");

    setForm({
      name: "",
      price: "",
      stock: "",
      description: "",
      product_code: "",
      images: "",
    });
  };


  const deleteProductByCode = async () => {
  if (!deleteCode.trim()) {
    alert("Enter product code");
    return;
  }

  const confirmDelete = window.confirm(
    `Delete product with code ${deleteCode}?`
  );

  if (!confirmDelete) return;

  const { error } = await supabase
    .from("inventory")
    .delete()
    .eq("product_code", deleteCode.trim());

  if (error) {
    alert(error.message);
    return;
  }

  alert("Product deleted successfully");
  setDeleteCode("");
};

  return (
    <div className="p-8 max-w-xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">
        Admin Panel
      </h1>

      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) =>
          setForm({
            ...form,
            name: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        placeholder="Price"
        value={form.price}
        onChange={(e) =>
          setForm({
            ...form,
            price: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        placeholder="Stock"
        value={form.stock}
        onChange={(e) =>
          setForm({
            ...form,
            stock: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) =>
          setForm({
            ...form,
            description: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        placeholder="Images comma separated"
        value={form.images}
        onChange={(e) =>
          setForm({
            ...form,
            images: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

<input
  type="text"
  placeholder="Product Code"
  value={form.product_code}
  onChange={(e) =>
    setForm({
      ...form,
      product_code: e.target.value,
    })
  }
  className="w-full border p-3 rounded-xl"
/>


      <button
        onClick={addProduct}
        className="w-full bg-black text-white py-3 rounded-xl"
      >
        Add Product
      </button>

<div className="mt-6 space-y-3">
  <input
    type="text"
    placeholder="Enter Product Code to Delete"
    value={deleteCode}
    onChange={(e) =>
      setDeleteCode(e.target.value)
    }
    className="w-full border p-3 rounded-xl"
  />

  <button
    onClick={deleteProductByCode}
    className="w-full bg-red-600 text-white py-3 rounded-xl"
  >
    Delete Product
  </button>
</div>

    </div>
  );
}