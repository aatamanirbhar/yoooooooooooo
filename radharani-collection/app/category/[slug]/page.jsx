"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Image from "next/image";
import emailjs from "@emailjs/browser";

export default function CategoryPage() {
  const { slug } = useParams();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    const savedCart =
      localStorage.getItem("cart");

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  useEffect(() => {
    fetchProducts();
  }, [slug]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("category", slug);

    setProducts(data || []);
  };

  const getImageUrl = (path) =>
    supabase.storage
      .from("product-images")
      .getPublicUrl(path).data.publicUrl;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(
      () => setToastMessage(""),
      1200
    );
  };

  const addToCart = (product) => {
    const existing = cart.find(
      (item) => item.id === product.id
    );

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        )
      );
      showToast("Added to cart");
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        ...product,
        quantity: 1,
      },
    ]);

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
  };

  const increaseCartQuantity = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  };

  const removeItemRow = (id) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          item.id !== id
      )
    );
  };

  const getCartTotal = () =>
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
          item.quantity,
      0
    );

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () =>
        resolve(true);

      document.body.appendChild(script);
    });
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

    await loadRazorpayScript();

    const paymentObject =
      new window.Razorpay({
        key: "rzp_live_Sah1IEXfM3UJCg",
        amount:
          getCartTotal() * 100,
        currency: "INR",
        name:
          "Radharani Collection",
        handler: async function (
          response
        ) {
          await emailjs.send(
            "service_vpx32br",
            "template_m4vm0ov",
            {
              customer_name:
                customerForm.name,
              phone:
                customerForm.phone,
              address:
                customerForm.address,
              items: cart
                .map(
                  (item) =>
                    `${item.name} x${item.quantity}`
                )
                .join(", "),
              total:
                getCartTotal(),
              payment_id:
                response.razorpay_payment_id,
            },
            "gZ3KkN2pXs7YjKieK"
          );

          setCart([]);
          localStorage.removeItem(
            "cart"
          );
          setShowCart(false);

          showToast(
            "Payment successful"
          );
        },
      });

    paymentObject.open();
  };

  const handleWhatsApp = () => {
    const message = `Hi, I want to order:\n\n${cart
      .map(
        (item) =>
          `${item.name} x${item.quantity}`
      )
      .join(
        "\n"
      )}\n\nTotal: ₹${getCartTotal()}`;

    window.open(
      `https://wa.me/919509295882?text=${encodeURIComponent(
        message
      )}`,
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

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold capitalize">
            {slug.replace("-", " ")}
          </h1>

          <button
            onClick={() =>
              setShowCart(true)
            }
            className="bg-black text-white px-4 py-2 rounded-2xl"
          >
            🛒 Go to Cart (
            {cart.length})
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => {
              setSelectedProduct(
                product
              );
              setShowDetails(true);
            }}
            className="bg-white rounded-3xl overflow-hidden shadow-lg cursor-pointer"
          >
            {product.images?.[0] && (
              <Image
                src={getImageUrl(
                  product.images[0]
                )}
                alt={product.name}
                width={400}
                height={500}
                className="w-full h-80 object-cover"
              />
            )}

            <div className="p-6">
              <h2 className="text-xl font-semibold">
                {product.name}
              </h2>

              <p className="text-2xl font-bold mt-3">
                ₹{product.price}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="bg-black text-white py-3 rounded-2xl"
                >
                  Add to Cart
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                    setShowCart(true);
                  }}
                  className="bg-rose-600 text-white py-3 rounded-2xl"
                >
                  Buy Now
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://wa.me/919509295882?text=Hi, I want to buy ${product.name}`,
                      "_blank"
                    );
                  }}
                  className="bg-emerald-600 text-white py-3 rounded-2xl"
                >
                  Buy on WhatsApp
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCart(true);
                  }}
                  className="border border-black py-3 rounded-2xl"
                >
                  Go to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="bg-white w-[95%] max-w-2xl rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-5">
              Your Cart
            </h2>

            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between py-3 border-b"
              >
                <div>
                  <p>{item.name}</p>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() =>
                        removeFromCart(
                          item.id
                        )
                      }
                    >
                      -
                    </button>

                    <p>
                      Qty:{" "}
                      {
                        item.quantity
                      }
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
                    removeItemRow(
                      item.id
                    )
                  }
                >
                  🗑️
                </button>
              </div>
            ))}

            <p className="mt-4 font-bold">
              Total: ₹
              {getCartTotal()}
            </p>

            <input
              placeholder="Full Name"
              value={
                customerForm.name
              }
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  name:
                    e.target.value,
                })
              }
              className="w-full border p-3 rounded-xl mt-4"
            />

            <input
              placeholder="Phone"
              value={
                customerForm.phone
              }
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  phone:
                    e.target.value,
                })
              }
              className="w-full border p-3 rounded-xl mt-3"
            />

            <textarea
              placeholder="Address"
              value={
                customerForm.address
              }
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  address:
                    e.target.value,
                })
              }
              className="w-full border p-3 rounded-xl mt-3"
            />

            <button
              onClick={
                handleBuyNow
              }
              className="mt-4 w-full bg-black text-white py-3 rounded-2xl"
            >
              Buy Now
            </button>

            <button
              onClick={
                handleWhatsApp
              }
              className="mt-3 w-full bg-emerald-600 text-white py-3 rounded-2xl"
            >
              Buy on WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}