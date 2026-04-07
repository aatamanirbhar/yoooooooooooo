"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";

export default function RadharaniCollection() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showEmptyMessage, setShowEmptyMessage] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchProducts();

    const interval = setInterval(() => {
      fetchProducts();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("id");

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return;
    }

    const formatted = (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      price: `₹${item.price}`,
      stock: item.stock,
      description:
        item.description || "No description available",
      images: item.images || [],
    }));

    setProducts(formatted);
  };

  const getImageUrl = (path) => {
    return supabase.storage
      .from("product-images")
      .getPublicUrl(path).data.publicUrl;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 1200);
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast("Sold out");
      return;
    }

    const alreadyExists = cart.find(
      (item) => item.id === product.id
    );

    if (alreadyExists) {
      showToast("Only one quantity allowed");
      return;
    }

    setCart([product]);
    showToast("Added to cart");
  };

  const removeFromCart = () => {
    setCart([]);
    showToast("Removed from cart");
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

  const markItemsSoldOut = async () => {
    for (const item of cart) {
      const { error } = await supabase
        .from("inventory")
        .update({ stock: 0 })
        .eq("id", item.id);

      if (error) {
        console.log(error);
        showToast("Failed to update stock");
        return false;
      }
    }

    await fetchProducts();
    setCart([]);
    setShowCart(false);

    return true;
  };

  const handleBuyNow = async () => {
    if (
      !customerForm.name ||
      !customerForm.phone ||
      !customerForm.address
    ) {
      showToast("Please fill all details");
      return;
    }

    const success = await markItemsSoldOut();

    if (!success) return;

    showToast("Redirecting to payment...");

    setTimeout(() => {
      window.location.href =
        "https://rzp.io/l/YOURPAYMENTLINK";
    }, 1000);
  };

  const handleWhatsApp = async () => {
    if (
      !customerForm.name ||
      !customerForm.phone ||
      !customerForm.address
    ) {
      showToast("Please fill all details");
      return;
    }

    const itemsText = cart
      .map((item) => `${item.name} - ${item.price}`)
      .join("%0A");

    const success = await markItemsSoldOut();

    if (!success) return;

    const message = `Hello, I want to order:%0A${itemsText}%0A%0AName: ${customerForm.name}%0APhone: ${customerForm.phone}%0AAddress: ${customerForm.address}`;

    window.location.href = `https://wa.me/919509295882?text=${message}`;
  };

  return (
    <div className="relative min-h-screen">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-20 -z-10"
      >
        <source
          src="/background-video.mp4"
          type="video/mp4"
        />
      </video>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-2 rounded-xl shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
          onClick={() => setZoomedImage(null)}
        >
          <Image
            src={zoomedImage}
            alt="Zoomed"
            width={800}
            height={1000}
            className="max-h-[90vh] w-auto rounded-2xl"
          />
        </div>
      )}

      {/* Header */}
      <div className="relative z-50 flex justify-between items-center p-6">
        <h1 className="text-4xl font-bold text-black">
          Radharani Collection
        </h1>

        <div className="relative">
          {showEmptyMessage && (
            <div className="absolute bottom-full mb-2 right-0 bg-black text-white px-4 py-2 rounded-xl whitespace-nowrap">
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

      {/* Details Modal */}
      {showDetails && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="bg-white w-[95%] max-w-3xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
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
                  onClick={() =>
                    setZoomedImage(
                      getImageUrl(img)
                    )
                  }
                  className="w-full h-64 object-cover rounded-xl cursor-pointer"
                />
              ))}
            </div>

            <p className="text-xl font-bold mt-5">
              {selectedProduct.price}
            </p>

            <p className="mt-4 text-gray-700 leading-7">
              {selectedProduct.description}
            </p>

            <p className="mt-3 font-semibold">
              Stock: {selectedProduct.stock}
            </p>

            <button
              onClick={() =>
                addToCart(selectedProduct)
              }
              disabled={
                selectedProduct.stock <= 0 ||
                cart.some(
                  (item) =>
                    item.id ===
                    selectedProduct.id
                )
              }
              className="mt-5 w-full bg-black text-white py-3 rounded-xl disabled:bg-gray-400"
            >
              {selectedProduct.stock <= 0
                ? "Sold Out"
                : "Add to Cart"}
            </button>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="bg-white w-[95%] max-w-2xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
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

            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between border-b py-3"
              >
                <div>
                  <p className="font-semibold">
                    {item.name}
                  </p>
                  <p>{item.price}</p>
                </div>

                <button
                  onClick={removeFromCart}
                  className="bg-red-500 text-white px-3 py-2 rounded-xl"
                >
                  Delete
                </button>
              </div>
            ))}

            <div className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    name: e.target.value,
                  })
                }
                className="w-full border p-3 rounded-xl"
              />

              <input
                type="text"
                placeholder="Phone Number"
                value={customerForm.phone}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    phone: e.target.value,
                  })
                }
                className="w-full border p-3 rounded-xl"
              />

              <textarea
                placeholder="Full Address"
                value={customerForm.address}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    address: e.target.value,
                  })
                }
                className="w-full border p-3 rounded-xl"
              />
            </div>

            <button
              onClick={handleBuyNow}
              className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl"
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

      {/* Product Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 p-6">
        {products.map((product) => {
          const soldOut =
            product.stock <= 0 ||
            cart.some(
              (item) =>
                item.id === product.id
            );

          return (
            <div
              key={product.id}
              onClick={() => {
                setSelectedProduct(product);
                setShowDetails(true);
              }}
              className="relative bg-white rounded-3xl overflow-hidden shadow-xl cursor-pointer"
            >
              {soldOut && (
                <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-xl font-bold">
                    SOLD OUT
                  </div>
                </div>
              )}

              {product.images?.[0] && (
                <Image
                  src={getImageUrl(
                    product.images[0]
                  )}
                  alt={product.name}
                  width={400}
                  height={500}
                  className="w-full h-72 object-cover"
                />
              )}

              <div className="p-5">
                <h2 className="text-xl font-semibold">
                  {product.name}
                </h2>

                <p className="text-lg font-bold mt-2">
                  {product.price}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}