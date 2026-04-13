"use client";

import emailjs from "@emailjs/browser";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Image from "next/image";

export default function CategoryPage() {
  const { slug } = useParams();

  const [showSuccess, setShowSuccess] = useState(false);

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState("");

  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    fetchProducts();

    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [slug]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

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
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("category", slug)
      .order("id");

    const formatted = (data || []).map((item) => ({
      ...item,
      price: `₹${item.price}`,
      description: item.description || "No description available",
      images: item.images || [],
    }));

    setProducts(formatted);
  };

  const getImageUrl = (path) =>
    supabase.storage
      .from("product-images")
      .getPublicUrl(path).data.publicUrl;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 1200);
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      showToast("Added to cart");
      return;
    }

    setCart((prev) => [...prev, { ...product, quantity: 1 }]);
    showToast("Added to cart");
  };

  const removeFromCart = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const increaseCartQuantity = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const removeItemRow = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const getCartTotal = () =>
    cart.reduce(
      (sum, item) =>
        sum +
        parseInt(item.price.replace("₹", "")) * item.quantity,
      0
    );

  const handleCartClick = () => {
    window.history.pushState({}, "");
    setShowCart(true);
  };

  const openDetailsModal = (product) => {
    window.history.pushState({}, "");
    setSelectedProduct(product);
    setShowDetails(true);
  };

  const openZoomImage = (img) => {
    window.history.pushState({}, "");
    setZoomedImage(getImageUrl(img));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);

      document.body.appendChild(script);
    });
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

    await loadRazorpayScript();

    const paymentObject = new window.Razorpay({
      key: "rzp_live_Sah1IEXfM3UJCg",
      amount: getCartTotal() * 100,
      currency: "INR",
      name: "Radharani Collection",

      handler: async function (response) {
  // customer confirmation email
  await emailjs.send(
    "service_vpx32br",
    "template_jpgwdz4",
    {
      customer_email: customerForm.email,
      customer_name: customerForm.name,
      phone: customerForm.phone,
      address: customerForm.address,
      total: getCartTotal(),
      items_html: cart
        .map(
          (item) => `
            <p>
              ${item.name} x${item.quantity} - ₹${
                parseInt(item.price.replace("₹", "")) *
                item.quantity
              }
            </p>
          `
        )
        .join(""),
    },
    "gZ3KkN2pXs7YjKieK"
  );

  // admin notification email
  await emailjs.send(
    "service_vpx32br",
    "template_m4vm0ov",
    {
      customer_name: customerForm.name,
      phone: customerForm.phone,
      email: customerForm.email,
      address: customerForm.address,
      items: cart
        .map(
          (item) =>
            `${item.name} x${item.quantity}`
        )
        .join(", "),
      total: getCartTotal(),
      payment_id: response.razorpay_payment_id,
    },
    "gZ3KkN2pXs7YjKieK"
  );

  setCart([]);
  localStorage.removeItem("cart");
  setShowCart(false);

  setShowSuccess(true);

  showToast("Order placed successfully");
},
    });

    paymentObject.open();
  };

  const handleWhatsApp = (product = null) => {
    let message = "";

    if (product) {
      message =
        `Hi, I want to buy this product.%0A%0A` +
        `Name: ${product.name}%0A` +
        `Price: ${product.price}%0A` +
        `Code: ${product.product_code}`;
    } else {
      message = `Hi, I want to place an order.%0A%0A${cart
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
        )}%0A%0ATotal: ₹${getCartTotal()}`;
    }

    window.open(
      `https://wa.me/919509295882?text=${message}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-rose-50 to-stone-100">
      {toastMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          <div className="bg-black text-white px-6 py-3 rounded-2xl">
            {toastMessage}
          </div>
        </div>
      )}

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
          onClick={() => setZoomedImage(null)}
        >
          <button className="absolute top-6 right-6 bg-white px-4 py-2 rounded-xl">
            Close
          </button>

          <Image
            src={zoomedImage}
            alt="Zoomed"
            width={900}
            height={1200}
            className="max-h-[90vh] w-auto rounded-2xl"
          />
        </div>
      )}

      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-5">
          <div>
            <h1 className="text-3xl font-semibold capitalize">
              {slug.replace("-", " ")}
            </h1>
          </div>

          <button
            onClick={handleCartClick}
            className="relative bg-black text-white px-6 py-3 rounded-full"
          >
            🛍 Cart
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
              {cart.length}
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-6 py-10">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => openDetailsModal(product)}
            className="group bg-white rounded-3xl overflow-hidden shadow-lg cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]"
          >
            {product.images?.[0] && (
              <Image
                src={getImageUrl(product.images[0])}
                alt={product.name}
                width={400}
                height={500}
                className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}

            <div className="p-6">
              <h2 className="text-xl font-semibold">
                {product.name}
              </h2>

              <p className="text-2xl font-bold mt-3">
                {product.price}
              </p>

              <div className="mt-4 grid grid-cols-4 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="bg-black text-white py-3 rounded-2xl text-sm"
                >
                  Add
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                    handleCartClick();
                  }}
                  className="bg-rose-600 text-white py-3 rounded-2xl text-sm"
                >
                  Buy
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsApp(product);
                  }}
                  className="bg-emerald-600 text-white py-3 rounded-2xl text-sm"
                >
                  WA
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCartClick();
                  }}
                  className="border border-black py-3 rounded-2xl text-sm"
                >
                  Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showDetails && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-start pt-4">
          <div className="bg-white w-[95%] max-w-3xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {selectedProduct.name}
              </h2>

              <button
                onClick={() => setShowDetails(false)}
                className="bg-black text-white px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectedProduct.images?.map(
                (img, index) => (
                  <Image
                    key={index}
                    src={getImageUrl(img)}
                    alt={selectedProduct.name}
                    width={300}
                    height={400}
                    onClick={() =>
                      openZoomImage(img)
                    }
                    className="w-full h-64 object-cover rounded-xl cursor-pointer"
                  />
                )
              )}
            </div>

            <p className="text-xl font-bold mt-5">
              Price: {selectedProduct.price}
            </p>

            <p className="mt-4 text-gray-700">
              {selectedProduct.description}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  addToCart(selectedProduct)
                }
                className="bg-black text-white py-3 rounded-2xl"
              >
                Add to Cart
              </button>

              <button
                onClick={handleCartClick}
                className="border border-black py-3 rounded-2xl"
              >
                Go to Cart
              </button>

              <button
                onClick={() => {
                  addToCart(selectedProduct);
                  handleCartClick();
                }}
                className="bg-rose-600 text-white py-3 rounded-2xl"
              >
                Buy Now
              </button>

              <button
                onClick={() =>
                  handleWhatsApp(selectedProduct)
                }
                className="bg-emerald-600 text-white py-3 rounded-2xl"
              >
                Buy on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="bg-white w-[95%] max-w-2xl rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold">
                Your Cart
              </h2>

              <button
                onClick={() => setShowCart(false)}
                className="bg-black text-white px-4 py-2 rounded-xl"
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

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() =>
                        removeFromCart(item.id)
                      }
                    >
                      -
                    </button>

                    <p>
                      Qty: {item.quantity}
                    </p>

                    <button
                      onClick={() =>
                        increaseCartQuantity(
                          item.id
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() =>
                    removeItemRow(item.id)
                  }
                >
                  🗑️
                </button>
              </div>
            ))}

            <p className="mt-4 font-bold">
              Total: ₹{getCartTotal()}
            </p>

            <input
              placeholder="Full Name"
              value={customerForm.name}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  name: e.target.value,
                })
              }
              className="w-full border p-3 rounded-xl mt-4"
            />

            <input
              placeholder="Phone"
              value={customerForm.phone}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  phone: e.target.value,
                })
              }
              className="w-full border p-3 rounded-xl mt-3"
            />

            <input
              placeholder="Email"
              type="email"
              value={customerForm.email}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  email: e.target.value,
                })
              }
              className="w-full border p-3 rounded-xl mt-3"
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
              className="w-full border p-3 rounded-xl mt-3"
            />

            <button
              onClick={handleBuyNow}
              className="mt-4 w-full bg-black text-white py-3 rounded-2xl"
            >
              Buy Now
            </button>

            <button
              onClick={() =>
                handleWhatsApp()
              }
              className="mt-3 w-full bg-emerald-600 text-white py-3 rounded-2xl"
            >
              Buy on WhatsApp
            </button>
          </div>
        </div>
      )}


      {showSuccess && (
  <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center">
    <div className="bg-white w-[90%] max-w-md rounded-3xl p-8 text-center shadow-2xl">
      <div className="text-5xl mb-4">✅</div>

      <h2 className="text-2xl font-bold mb-3">
        Order Placed Successfully
      </h2>

      <p className="text-gray-600 mb-6">
        Thank you for shopping with
        Radharani Collection.
      </p>

      <button
        onClick={() => setShowSuccess(false)}
        className="w-full bg-green-600 text-white py-3 rounded-2xl"
      >
        Continue Shopping
      </button>
    </div>
  </div>
)}
    </div>
  );
}