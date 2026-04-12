"use client";
import emailjs from "@emailjs/browser";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";

export default function RadharaniCollection() {

  const [selectedCategory, setSelectedCategory] = useState("");

  const [showSuccess, setShowSuccess] =
  useState(false);
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
    email: "",
    address: "",
  });

useEffect(() => {
  const savedCart =
    localStorage.getItem("cart");

  if (savedCart) {
    setCart(
      JSON.parse(savedCart)
    );
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


    const channel = supabase
  .channel("inventory-live")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "inventory",
    },
    () => {
      fetchProducts();
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
        customer_email:
          customerForm.email,
        phone:
          customerForm.phone,
        address:
          customerForm.address,
        product_name: cart
          .map(
            (item) =>
              item.name
          )
          .join(", "),
        amount:
          getCartTotal(),
        payment_status:
          "pending",
        order_items: cart.map(
          (item) => ({
            name: item.name,
            quantity:
              item.quantity,
            price:
              parseInt(
                item.price.replace(
                  "₹",
                  ""
                )
              ),
            product_code:
              item.product_code,
            image:
              getImageUrl(
                item.images[0]
              ),
          })
        ),
      },
    ])
    .select();

  if (error) {
    alert(error.message);
    return;
  }

  const orderId =
    data[0].id;

    await loadRazorpayScript();

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

        const itemsHtml = cart
  .map(
    (item) => `
      <div style="display:flex; align-items:center; gap:14px; margin-bottom:18px; padding:12px; border:1px solid #eee; border-radius:12px;">
        <img
          src="${getImageUrl(item.images[0])}"
          width="70"
          height="90"
          style="border-radius:10px; object-fit:cover;"
        />

        <div>
          <a
            href="https://radharanistore.vercel.app?code=${item.product_code}"
            style="font-weight:bold; color:#111; text-decoration:none;"
          >
            ${item.name}
          </a>

          <p style="margin:6px 0 0 0; color:#666;">
            Qty: ${item.quantity}
          </p>

          <p style="margin:4px 0 0 0;">
            ₹${
              parseInt(
                item.price.replace(
                  "₹",
                  ""
                )
              ) * item.quantity
            }
          </p>
        </div>
      </div>
    `
  )
  .join("");


  const itemsamanHtml = cart
  .map(
    (item) => `
      <div style="
        margin-bottom:18px;
        padding:16px;
        border:1px solid #ececec;
        border-radius:18px;
        background:#fafafa;
        box-shadow:0 2px 8px rgba(0,0,0,0.04);
      ">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="width:90px; vertical-align:top;">
              <img
                src="${getImageUrl(item.images[0])}"
                width="80"
                height="100"
                style="
                  width:80px;
                  height:100px;
                  object-fit:cover;
                  border-radius:12px;
                  display:block;
                "
              />
            </td>

            <td style="vertical-align:top; padding-left:14px;">
              <p style="
                margin:0;
                font-size:18px;
                font-weight:700;
                color:#111;
                line-height:1.35;
              ">
                ${item.name}
              </p>

              <p style="
                margin:10px 0 0 0;
                font-size:14px;
                color:#666;
              ">
                Quantity: ${item.quantity}
              </p>

              <p style="
                margin:8px 0 0 0;
                font-size:18px;
                font-weight:700;
                color:#111;
              ">
                ₹${
                  parseInt(
                    item.price.replace(
                      "₹",
                      ""
                    )
                  ) * item.quantity
                }
              </p>
            </td>
          </tr>
        </table>
      </div>
    `
  )
  .join("");

await emailjs.send(
  "service_vpx32br",
  "template_jpgwdz4",
  {
    customer_email:
      customerForm.email,
    customer_name:
      customerForm.name,
    phone:
      customerForm.phone,
    address:
      customerForm.address,
    total:
      getCartTotal(),
    items_html:
      itemsamanHtml,
  },
  "gZ3KkN2pXs7YjKieK"
);

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
    total: getCartTotal(),
    payment_id:
      response.razorpay_payment_id,
  },
  "gZ3KkN2pXs7YjKieK"
);

setCart([]);

localStorage.removeItem("cart");
setShowCart(false);
setShowSuccess(true);

showToast(
  "Payment successful"
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

  const message = ` Hi, I want to place an order.%0A%0A${cart
    .map(
      (item) =>
        `${item.name} (${item.product_code})x${item.quantity} - ₹${
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
  
localStorage.removeItem("cart");
  setShowCart(false);

  setTimeout(() => {
    window.open(
      `https://wa.me/919509295882?text=${message}`,
      "_blank"
    );
  }, 300);
};

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-rose-50 to-stone-100 text-gray-900">
      {/* Background Video */}


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


      {/* Premium Sale Strip */}
<div className="sticky top-0 z-[60] bg-black text-white overflow-hidden">
  <div className="whitespace-nowrap py-2 text-xs md:text-sm tracking-[0.25em] uppercase animate-scroll-strip">
    <span className="mx-8">Festive Sale Live</span>
    <span className="mx-8">Free Shipping Above ₹999</span>
    <span className="mx-8">Premium At Shop Prices</span>
    <span className="mx-8">WhatsApp Support Available</span>
    <span className="mx-8">New Bridal Collection Live</span>
  </div>
</div>

      {/* Header */}
    <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/40 shadow-sm">
  <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-5">
    <div>
      <h1 className="text-3xl md:text-5xl font-semibold tracking-wide text-black leading-tight">
        राधारानी स्टोर
      </h1>

      <p className="text-xs md:text-sm text-gray-500 mt-1 tracking-[0.35em] uppercase font-medium">
        Premium At Shop Prices
      </p>
    </div>

    <button
      onClick={handleCartClick}
      className="relative bg-black text-white px-6 py-3 rounded-full shadow-xl hover:scale-105 transition-all duration-300"
    >
      🛍 Cart

      <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-md">
        {cart.length}
      </span>
    </button>
  </div>
</div>


{/* Auto Moving Luxury Product Carousel */}
<div className="relative z-10 px-6 pt-6">
  <div className="max-w-7xl mx-auto rounded-[32px] overflow-hidden shadow-2xl border border-white/40 bg-white/70 backdrop-blur-xl">
    <div className="px-6 py-5 border-b border-gray-200 bg-white/60">
      <p className="text-xs tracking-[0.35em] uppercase text-gray-500">
        Featured Collection
      </p>

      <h2 className="text-2xl md:text-4xl font-semibold mt-2">
        Trending Premium Styles
      </h2>
    </div>

    <div className="overflow-hidden py-6">
      <div className="flex gap-6 w-max animate-scroll">
        {[...products.slice(0, 10), ...products.slice(7, 10)].map(
          (product, index) => (
            <div
              key={`${product.id}-${index}`}
              onClick={() => {
                setSelectedProduct(product);
                setShowDetails(true);
              }}
              className="w-[260px] md:w-[320px] bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300"
            >
              {product.images?.[0] && (
                <Image
                  src={getImageUrl(product.images[0])}
                  alt={product.name}
                  width={400}
                  height={500}
                  className="w-full h-72 object-cover"
                />
              )}

              <div className="p-5">
                <h3 className="text-lg font-semibold line-clamp-1">
                  {product.name}
                </h3>

                <p className="text-xl font-bold mt-2">
                  {product.price}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="mt-4 w-full bg-black text-white py-3 rounded-2xl hover:bg-gray-800 transition-all"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  </div>
</div>

{/* Trust Strip */}
<div className="max-w-7xl mx-auto px-6 mt-4">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-lg border border-white/40">
    <div className="text-center text-sm font-medium">🚚 Free Delivery</div>
    <div className="text-center text-sm font-medium">🔒 Secure Payment</div>
    <div className="text-center text-sm font-medium">💬 WhatsApp Support</div>
    <div className="text-center text-sm font-medium">✨ Premium Quality</div>
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
                className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 text-gray-700 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all"
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

{/* You may also like */}
<div className="mt-8">
  <p className="text-xl font-semibold mb-4">
    You may also like
  </p>

  <div className="grid grid-cols-2 gap-4">
    {products
      .filter(
        (p) =>
          p.id !== selectedProduct.id
      )
      .slice(0, 4)
      .map((item) => (
        <div
          key={item.id}
          onClick={() => {
            setSelectedProduct(item);
          }}
          className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all"
        >
          <Image
            src={getImageUrl(
              item.images[0]
            )}
            alt={item.name}
            width={200}
            height={250}
            className="w-full h-40 object-cover"
          />

          <div className="p-3">
            <p className="font-medium line-clamp-1">
              {item.name}
            </p>

            <p className="font-bold mt-1">
              {item.price}
            </p>
          </div>
        </div>
      ))}
  </div>
</div>


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
                className="w-11 h-11 flex items-center justify-center bg-black text-white rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all"
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
      className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-black rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all"
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
      className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all"
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
  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-red-500 rounded-2xl shadow-sm hover:bg-red-50 hover:scale-105 transition-all"
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

            <div className="mt-8 space-y-5 bg-stone-50/80 backdrop-blur-xl p-5 rounded-3xl border border-gray-200 shadow-sm">
             <label className="text-sm font-medium text-gray-600">
  Full Name
</label>
             
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
                className="w-full bg-white border border-gray-200 px-5 py-4 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
              />

         <label className="text-sm font-medium text-gray-600">
  Phone Number
</label>     <input
                type="text"
                placeholder="Phone Number"
                value={customerForm.phone}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    phone: e.target.value,
                  })
                }
                className="w-full bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
              />
<label className="text-sm font-medium text-gray-600">
  Email Address
</label>
              <input
  type="email"
  placeholder="Email Address"
  value={customerForm.email}
  onChange={(e) =>
    setCustomerForm({
      ...customerForm,
      email: e.target.value,
    })
  }
  className="w-full border p-3 rounded-xl"
/>

     <label className="text-sm font-medium text-gray-600">
  Delivery Address
</label>         <textarea
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
              className="mt-6 w-full bg-black text-white py-4 rounded-2xl shadow-xl hover:scale-[1.01] transition-all duration-300"
            >
              Buy Now
            </button>

            <button
              onClick={handleWhatsApp}
              className="mt-3 w-full bg-emerald-600 text-white py-4 rounded-2xl shadow-xl hover:scale-[1.01] transition-all duration-300"
            >
              Buy on WhatsApp
            </button>
          </div>
        </div>
      )}

{showSuccess && (
  <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center">
    <div className="bg-white w-[90%] max-w-md rounded-3xl p-8 text-center shadow-2xl">
      <div className="text-5xl mb-4">
        ✅
      </div>

      <h2 className="text-2xl font-bold mb-3">
        Order Placed Successfully
      </h2>

      <p className="text-gray-600 mb-6">
        Thank you for shopping with
        Radharani Collection.
      </p>

      <button
        onClick={() =>
          setShowSuccess(false)
        }
        className="w-full bg-green-600 text-white py-3 rounded-2xl"
      >
        Continue Shopping
      </button>
    </div>
  </div>
)}


      {/* Product Cards */}
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-6 py-10">
        {products.slice(5, 10).map((product) => {
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
              className="group relative bg-white/80 backdrop-blur-xl border border-white/40 rounded-[28px] overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 cursor-pointer"
            >
              {soldOut && (
                <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-xl font-bold">
                    SOLD OUT
                  </div>
                </div>
              )}

  {/* Bestseller Badge */}
  <div className="absolute top-3 left-3 z-20 bg-black text-white px-3 py-1 rounded-full text-[10px] tracking-[0.15em] uppercase shadow-lg">
    Bestseller
  </div>

  {product.stock <= 2 && (
    <div className="absolute top-3 right-3 z-20 bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] shadow-lg">
      Only {product.stock} left
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
                  className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}

              <div className="p-6">
                <h2 className="text-xl font-semibold tracking-wide">
                  {product.name}
                </h2>

                <p className="text-2xl font-bold mt-3 text-gray-900">
                  {product.price}
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2">
                    <button
                        onClick={(e) => {
                              e.stopPropagation();
                                    addToCart(product);
                                        }}
                                            disabled={soldOut}
                                               className="bg-black hover:bg-gray-800 text-white py-3 rounded-2xl text-sm font-medium transition-all duration-300 shadow-md"
                                                  >
                                                      Add to Cart
                                                        </button>
                                                                                 
                                                          <button
                                                              onClick={(e) => {
                                                                    e.stopPropagation();
                                                                          addToCart(product);
                                                                                setShowCart(true);
                                                                                    }}
                                                                                        disabled={soldOut}
                                                                                            className="bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-2xl text-sm font-medium transition-all duration-300 shadow-md"
                                                                                              >
                                                                                                  Buy Now
                                                                                                    </button>

                                                                                                      <button
                                                                                                          onClick={(e) => {
                                                                                                                e.stopPropagation();

                                                                                                                      const message =
                                                                                                                              `Hi, I want to buy this product.%0A%0A` +
                                                                                                                                      `Name: ${product.name}%0A` +
                                                                                                                                              `Price: ${product.price}%0A` +
                                                                                                                                                      `Code: ${product.product_code}`;

                                                                                                                                                            window.open(
                                                                                                                                                                    `https://wa.me/919509295882?text=${message}`,
                                                                                                                                                                            "_blank"
                                                                                                                                                                                  );
                                                                                                                                                                                      }}
                                                                                                                                                                                          disabled={soldOut}
                                                                                                                                                                                              className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl text-sm font-medium transition-all duration-300 shadow-md"
                                                                                                                                                                                                >
                                                                                                                                                                                                   Buy via WhatsApp
                                                                                                                                                                                                      </button>

                                                                                                                                                                                                        <button
                                                                                                                                                                                                            onClick={(e) => {
                                                                                                                                                                                                                  e.stopPropagation();
                                                                                                                                                                                                                        handleCartClick();
                                                                                                                                                                                                                            }}
                                                                                                                                                                                                                                className="bg-white border border-gray-300 hover:bg-gray-50 text-black py-3 rounded-2xl text-sm font-medium transition-all duration-300"
                                                                                                                                                                                                                                  >
                                                                                                                                                                                                                                     Go to Cart
                                                                                                                                                                                                                                        </button>
                                                                                                                                                                                                                                        </div>

                                                                                                                                                                                                                                        



              </div>
            </div>
          );
        })}
         <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </div>
     <a
  href="https://wa.me/919509295882"
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-6 right-6 z-[100] bg-emerald-600 text-white px-5 py-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
>
  <span className="text-lg">💬</span>
  <span className="font-medium">
    Chat Now
  </span>
</a>


      {/* Dupatta Promo Video Section */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div
          onClick={() => {
            window.location.href =
              "/category/dupattas";
          }}
          className="relative rounded-[32px] overflow-hidden shadow-2xl cursor-pointer group"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-[220px] md:h-[320px] object-cover group-hover:scale-105 transition-all duration-700"
          >
            <source
              src="/duppatas-banner.mp4"
              type="video/mp4"
            />
          </video>

          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <p className="text-xs tracking-[0.35em] uppercase mb-3">
                New Drop
              </p>

              <h2 className="text-3xl md:text-5xl font-semibold">
                Dupattas @ ₹100
              </h2>

              <p className="mt-3 text-sm md:text-base text-white/90">
                Tap to explore the collection
              </p>
            </div>
          </div>
        </div>
      </div>

{/* Shop by Category */}
<div className="max-w-7xl mx-auto px-6 py-12">
  <p className="text-xs tracking-[0.35em] uppercase text-gray-500 mb-3">
    Shop by Category
  </p>

  <h2 className="text-3xl md:text-4xl font-semibold mb-8">
    Explore Collections
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
    {[
      {
        title: "Women",
        video: "/women.mp4",
        slug: "women",
      },
      {
        title: "Men",
        video: "/men.mp4",
        slug: "men",
      },
      {
        title: "Kids Wear",
        video: "/kids.mp4",
        slug: "kids-wear",
      },
      {
        title: "Accessories",
        video: "/accessories.mp4",
        slug: "accessories",
      },
    ].map((cat) => (
      <div
        key={cat.slug}
        onClick={() => {
          window.location.href = `/category/${cat.slug}`;
        }}
        className="relative rounded-[28px] overflow-hidden shadow-xl cursor-pointer group"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-[180px] md:h-[220px] object-cover group-hover:scale-105 transition-all duration-700"
        >
          <source
            src={cat.video}
            type="video/mp4"
          />
        </video>

        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <p className="text-white text-lg md:text-xl font-semibold text-center px-2">
            {cat.title}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>


    </div>
  );
}

