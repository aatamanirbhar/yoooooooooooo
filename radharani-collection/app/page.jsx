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


    const channel = supabase
      .channel("inventory-live")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "inventory",
        },
        (payload) => {
          setProducts((prev) =>
            prev.map((item) =>
              item.id === payload.new.id
                ? { ...item, stock: payload.new.stock }
                : item
            )
          );

          setSelectedProduct((prev) =>
            prev && prev.id === payload.new.id
              ? { ...prev, stock: payload.new.stock }
              : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
  const handleBack = () => {
    if (zoomedImage) {
      setZoomedImage(null);
      return;
    }

    if (showDetails) {
      setShowDetails(false);
      return;
    }

    if (showCart) {
      setShowCart(false);
      return;
    }
  };

  window.addEventListener("popstate", handleBack);

  return () => {
    window.removeEventListener("popstate", handleBack);
  };
}, [zoomedImage, showDetails, showCart]);


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
        product_code: item.product_code,
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

  setCart((prev) => {
    const existing = prev.find(
      (item) => item.id === product.id
    );

    if (existing) {
      return prev.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      );
    }

    return [
      ...prev,
      {
        ...product,
        quantity: 1,
      },
    ];
  });

  showToast("Added to cart");
};

const removeFromCart = (id) => {
  setCart((prev) =>
    prev
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                item.quantity - 1,
            }
          : item
      )
      .filter(
        (item) =>
          item.quantity > 0
      )
  );

  showToast("Removed from cart");
};

const increaseCartQuantity = (id) => {
  setCart((prev) =>
    prev.map((item) => {
      if (item.id !== id) return item;

      const product = products.find(
        (p) => p.id === id
      );

      if (
        item.quantity >=
        product.stock
      ) {
        showToast(
          "No more stock available"
        );
        return item;
      }

      return {
        ...item,
        quantity:
          item.quantity + 1,
      };
    })
  );
};

const removeItemRow = (id) => {
  setCart((prev) =>
    prev.filter(
      (item) => item.id !== id
    )
  );

  showToast("Item removed");
};

 const handleCartClick = () => {
  if (cart.length === 0) {
    showToast("Your cart is empty");
    return;
  }

  window.history.pushState({}, "");
setShowCart(true);
};

  const updateStockToSoldOut = async () => {
  console.log("CART:", cart);

  const productId = cart?.[0]?.id;

  console.log("PRODUCT ID:", productId);

  if (!productId) {
    showToast("Cart empty / no product id");
    return false;
  }

  const { data, error } = await supabase
    .from("inventory")
    .update({ stock: 0 })
    .eq("id", productId)
    .select();

  console.log("UPDATE DATA:", data);
  console.log("UPDATE ERROR:", error);

  if (error) {
    showToast(error.message);
    return false;
  }

  showToast("Stock updated to 0");
  return true;
};

  const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};


const updateStockAfterPayment =
  async () => {
    for (const item of cart) {
      const product =
        products.find(
          (p) =>
            p.id === item.id
        );

      if (!product) continue;

      const currentStock =
        Number(product.stock) || 0;

      const newStock =
        Math.max(
          currentStock -
            item.quantity,
          0
        );

      await supabase
        .from("inventory")
        .update({
          stock: newStock,
        })
        .eq("id", item.id);
    }

    await fetchProducts();
  };


  const getCartTotal = () => {
  return cart.reduce(
    (sum, item) =>
      sum +
      parseInt(
        item.price.replace("₹", "")
      ) * item.quantity,
    0
  );
};


const handleBuyNow = async () => {
  if (
    !customerForm.name ||
    !customerForm.phone ||
    !customerForm.address
  ) {
    showToast(
      "Please fill all details"
    );
    return;
  }

  const totalAmount =
    getCartTotal();

  const { data, error } =
    await supabase
      .from("orders")
      .insert([
        {
          customer_name:
            customerForm.name,
          phone:
            customerForm.phone,
          address:
            customerForm.address,
          product_name: cart
            .map(
              (item) =>
                `${item.name} x${item.quantity}`
            )
            .join(", "),
          amount:
            totalAmount,
          payment_status:
            "pending",
        },
      ])
      .select();

  if (error) {
    alert(error.message);
    return;
  }

  const orderId =
    data[0].id;

  const paymentObject =
    new window.Razorpay({
      key: "rzp_test_SayxRYG9e6D0Gv",
      amount:
        totalAmount * 100,
      currency: "INR",
      name:
        "Radharani Collection",

      handler: async function (
        response
      ) {
        await supabase
          .from("orders")
          .update({
            payment_status:
              "successful",
            payment_id:
              response.razorpay_payment_id,
          })
          .eq("id", orderId);

        await updateStockAfterPayment();

 const message = `✅ PAID ORDER%0A%0A${cart
  .map(
    (item) =>
      `${item.name} x${item.quantity} - ₹${
        parseInt(
          item.price.replace("₹", "")
        ) * item.quantity
      }`
  )
  .join(
    "%0A"
  )}%0A%0ATotal: ₹${getCartTotal()}%0A%0AName: ${customerForm.name}%0APhone: ${customerForm.phone}%0AAddress: ${customerForm.address}`;

        setCart([]);
        setShowCart(false);

        window.open(
          `https://wa.me/919509295882?text=${message}`,
          "_blank"
        );
      },
    });

  paymentObject.open();
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

    const success = await updateStockToSoldOut();

    if (!success) return;

    const itemText = `${cart[0].name} - ${cart[0].price}`;

    const message = `Hello, I want to order:%0A${cart
  .map(
    (item) =>
      `${item.name} x${item.quantity} - ₹${
        parseInt(
          item.price.replace(
            "₹",
            ""
          )
        ) * item.quantity
      }`
  )
  .join(
    "%0A"
  )}%0A%0ATotal: ₹${getCartTotal()}%0A%0AName: ${customerForm.name}%0APhone: ${customerForm.phone}%0AAddress: ${customerForm.address}`;

    setCart([]);
    setShowCart(false);

    setTimeout(() => {
      window.open(
        `https://wa.me/919509295882?text=${message}`,
        "_blank"
      );
    }, 700);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-20 -z-10 pointer-events-none"
      >
        <source
          src="/background-video.mp4"
          type="video/mp4"
        />
      </video>

      {/* Toast */}
     {toastMessage && (
  <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
    <div className="bg-black/90 text-white px-6 py-3 rounded-2xl shadow-2xl text-base font-medium animate-pulse">
      {toastMessage}
    </div>
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
            width={900}
            height={1200}
            className="max-h-[90vh] w-auto rounded-2xl"
          />
        </div>
      )}

      {/* Header */}
      <div className="relative z-50 flex justify-between items-center p-6">
        <h1 className="text-4xl font-bold text-black">
          राधारानी Collection
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

      {/* Details Modal */}
      {showDetails && selectedProduct && (
       <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-start pt-4">
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
                 onClick={() => {
  window.history.pushState({}, "");
  setZoomedImage(getImageUrl(img));
}}
                  className="w-full h-64 object-cover rounded-xl cursor-pointer"
                />
              ))}
            </div>

            <p className="text-xl font-bold mt-5">
              Price: {selectedProduct.price}
            </p>

            <p className="mt-4 text-gray-700">
              Description: {selectedProduct.description}
            </p>

             <p className="mt-4 text-gray-700">
              Product Code: {selectedProduct.product_code}
            </p>

<p className="mt-3 font-semibold">
  Stock: {
    selectedProduct.stock -
    (cart.find(
      (item) =>
        item.id === selectedProduct.id
    )?.quantity || 0)
  }
</p>

            <button
  onClick={() =>
    addToCart(selectedProduct)
  }
  disabled={
    selectedProduct.stock -
      (cart.find(
        (item) =>
          item.id ===
          selectedProduct.id
      )?.quantity || 0) <= 0
  }
  className="mt-5 w-full bg-black text-white py-3 rounded-xl disabled:bg-gray-400"
>
  {selectedProduct.stock -
    (cart.find(
      (item) =>
        item.id ===
        selectedProduct.id
    )?.quantity || 0) <= 0
    ? "Sold Out"
    : "Add to Cart"}
</button>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="bg-white w-[95%] max-w-2xl rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
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
  <p>{item.name}</p>

  <div className="flex items-center gap-3 mt-2">
    <button
      onClick={() =>
        removeFromCart(item.id)
      }
      className="bg-red-500 text-white px-3 py-1 rounded-lg"
    >
      -
    </button>

    <p>Qty: {item.quantity}</p>

    <button
      onClick={() =>
        increaseCartQuantity(
          item.id
        )
      }
      className="bg-green-600 text-white px-3 py-1 rounded-lg"
    >
      +
    </button>
  </div>

  <p className="mt-2">
    ₹
    {parseInt(
      item.price.replace("₹", "")
    ) * item.quantity}
  </p>
</div>

               <button
  onClick={() =>
    removeItemRow(item.id)
  }
  className="mt-2 bg-red-500 text-white px-3 py-1 rounded-lg"
>
  🗑️
</button>
              </div>
            ))}


            <div className="mt-4 border-t pt-4">
  <p className="text-xl font-bold">
    Total: ₹{getCartTotal()}
  </p>
</div>

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
                placeholder="Address"
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
        const cartQty =
  cart.find(
    (item) =>
      item.id === product.id
  )?.quantity || 0;

const soldOut =
  product.stock - cartQty <= 0;

          return (
            <div
              key={product.id}
           onClick={() => {
  window.history.pushState({}, "");
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
         <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </div>
     
    </div>
  );
}