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
      stock: Number(item.stock) || 0,
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

  const getCartQty = (productId) =>
    cart.find((item) => item.id === productId)?.quantity || 0;

  const addToCart = (product) => {
    const currentQty = getCartQty(product.id);
    const availableStock = Number(product.stock) || 0;

    if (availableStock <= 0) {
      showToast("Sold out");
      return;
    }

    if (currentQty >= availableStock) {
      showToast("No more stock available");
      return;
    }

    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        { ...product, quantity: 1 },
      ]);
    }

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
      prev.map((item) => {
        if (item.id !== id) return item;

        const product = products.find((p) => p.id === id);
        const stock = Number(product?.stock) || 0;

        if (item.quantity >= stock) {
          showToast("No more stock available");
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
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
              parseInt(item.price.replace("₹", "")) *
              item.quantity
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

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-6 py-10">
        {products.map((product) => {
          const soldOut =
            getCartQty(product.id) >= product.stock ||
            product.stock <= 0;

          return (
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
                  className="w-full h-80 object-cover"
                />
              )}

              <div className="p-6">
                <h2 className="text-xl font-semibold">
                  {product.name}
                </h2>

                <p className="text-2xl font-bold mt-3">
                  {product.price}
                </p>

                <p className="mt-2 font-medium">
                  Stock left: {product.stock - getCartQty(product.id)}
                </p>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={soldOut}
                    className="bg-black text-white py-3 rounded-2xl text-sm disabled:bg-gray-400"
                  >
                    {soldOut ? "Sold" : "Add"}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                      handleCartClick();
                    }}
                    disabled={soldOut}
                    className="bg-rose-600 text-white py-3 rounded-2xl text-sm disabled:bg-gray-400"
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
          );
        })}
      </div>
    </div>
  );
}