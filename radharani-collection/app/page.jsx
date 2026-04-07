"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";

export default function RadharaniCollection() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showEmptyMessage, setShowEmptyMessage] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const getImageUrl = (path) => {
    return supabase.storage
      .from("product-images")
      .getPublicUrl(path).data.publicUrl;
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("id");

    if (error) {
      console.log(error);
      return;
    }

    const formatted = (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      price: `₹${item.price}`,
      stock: item.stock,
      description: item.description,
      images: item.images || [],
    }));

    setProducts(formatted);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 1500);
  };

  const isInCart = (id) => {
    return cart.some((item) => item.id === id);
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast("Sold out");
      return;
    }

    if (isInCart(product.id)) {
      showToast("Already in cart");
      return;
    }

    setCart((prev) => [...prev, product]);
    showToast("Added to cart");
  };

  const removeFromCart = (indexToRemove) => {
    setCart((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleCartClick = () => {
    if (cart.length === 0) {
      setShowEmptyMessage(true);
      setTimeout(() => {
        setShowEmptyMessage(false);
      }, 1500);
      return;
    }

    setShowCart(true);
  };

  const markSoldOut = async () => {
    for (const item of cart) {
      await supabase
        .from("inventory")
        .update({ stock: 0 })
        .eq("id", item.id);
    }

    fetchProducts();
    setCart([]);
    setShowCart(false);
  };

  const handleBuyNow = async () => {
    if (
      !customerForm.name ||
      !customerForm.phone ||
      !customerForm.address
    ) {
      showToast("Fill all details");
      return;
    }

    await markSoldOut();

    window.location.href =
      "https://rzp.io/l/YOURPAYMENTLINK";
  };

  const handleWhatsApp = async () => {
    if (
      !customerForm.name ||
      !customerForm.phone ||
      !customerForm.address
    ) {
      showToast("Fill all details");
      return;
    }

    const items = cart
      .map((item) => `${item.name} - ${item.price}`)
      .join("%0A");

    await markSoldOut();

    const message = `Hello, I want to order:%0A${items}%0A%0AName: ${customerForm.name}%0APhone: ${customerForm.phone}%0AAddress: ${customerForm.address}`;

    window.location.href = `https://wa.me/919509295882?text=${message}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-2 rounded-xl">
          {toastMessage}
        </div>
      )}

      <div className="flex justify-between items-center p-6">
        <h1 className="text-4xl font-bold">
          Radharani Collection
        </h1>

        <div className="relative">
          {showEmptyMessage && (
            <div className="absolute bottom-full mb-2 right-0 bg-black text-white px-4 py-2 rounded-xl">
              Your cart is empty
            </div>
          )}

          <button
            onClick={handleCartClick}
            className="relative bg-green-600 text-white px-5 py-3 rounded-2xl"
          >
            🛒 Cart
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
              {cart.length}
            </span>
          </button>
        </div>
      </div>

      {/* Product details modal */}
      {showDetails && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="bg-white w-[95%] max-w-3xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {selectedProduct.name}
              </h2>

              <button
                onClick={() => setShowDetails(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectedProduct.images.map((img, index) => (
                <Image
                  key={index}
                  src={getImageUrl(img)}
                  alt={selectedProduct.name}
                  width={300}
                  height={400}
                  className="w-full h-64 object-cover rounded-xl"
                />
              ))}
            </div>

            <p className="mt-4 text-xl font-bold">
              {selectedProduct.price}
            </p>

            <p className="mt-2">
              {selectedProduct.description}
            </p>

            <p className="mt-2 font-semibold">
              Stock: {selectedProduct.stock}
            </p>

            <button
              onClick={() =>
                addToCart(selectedProduct)
              }
              disabled={selectedProduct.stock <= 0}
              className="mt-4 w-full bg-black text-white py-3 rounded-xl disabled:bg-gray-400"
            >
              {selectedProduct.stock <= 0
                ? "Sold Out"
                : "Add to Cart"}
            </button>
          </div>
        </div>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="bg-white w-[95%] max-w-2xl rounded-3xl p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Your Cart
              </h2>

              <button
                onClick={() => setShowCart(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>

            {cart.map((item, index) => (
              <div
                key={index}
                className="flex justify-between border-b py-3"
              >
                <div>
                  <p>{item.name}</p>
                  <p>{item.price}</p>
                </div>

                <button
                  onClick={() =>
                    removeFromCart(index)
                  }
                  className="bg-red-500 text-white px-3 py-2 rounded-xl"
                >
                  Delete
                </button>
              </div>
            ))}

            <input
              type="text"
              placeholder="Full Name"
              className="w-full border p-3 rounded-xl mt-4"
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  name: e.target.value,
                })
              }
            />

            <input
              type="text"
              placeholder="Phone"
              className="w-full border p-3 rounded-xl mt-3"
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  phone: e.target.value,
                })
              }
            />

            <textarea
              placeholder="Address"
              className="w-full border p-3 rounded-xl mt-3"
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  address: e.target.value,
                })
              }
            />

            <button
              onClick={handleBuyNow}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl"
            >
              Buy Now
            </button>

            <button
              onClick={handleWhatsApp}
              className="mt-3 w-full bg-green-600 text-white py-3 rounded-xl"
            >
              Buy on WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Product cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 p-6">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => {
              setSelectedProduct(product);
              setShowDetails(true);
            }}
            className="cursor-pointer bg-white rounded-3xl shadow-xl overflow-hidden"
          >
            <Image
              src={getImageUrl(product.images[0])}
              alt={product.name}
              width={400}
              height={500}
              className="w-full h-72 object-cover"
            />

            <div className="p-5">
              <h2 className="text-xl font-semibold">
                {product.name}
              </h2>

              <p className="font-bold mt-2">
                {product.price}
              </p>

              <p className="mt-1">
                Stock: {product.stock}
              </p>

              {product.stock <= 0 && (
                <p className="text-red-600 font-bold mt-2">
                  SOLD OUT
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}