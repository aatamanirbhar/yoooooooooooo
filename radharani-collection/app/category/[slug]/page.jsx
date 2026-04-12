"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Image from "next/image";

export default function CategoryPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
const [showDetails, setShowDetails] = useState(false);
const [cart, setCart] = useState([]);
const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [slug]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("category", slug);

    if (!error) {
      setProducts(data || []);
    }
  };

  const addToCart = (product) => {
  setCart((prev) => [...prev, product]);
};

  const getImageUrl = (path) =>
    supabase.storage
      .from("product-images")
      .getPublicUrl(path).data.publicUrl;

  return (

    

    
    <div className="min-h-screen bg-gradient-to-br from-white via-rose-50 to-stone-100">

<header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <h1 className="text-2xl font-semibold capitalize">
      {slug.replace("-", " ")}
    </h1>

    <button
      onClick={() => setShowCart(true)}
      className="bg-black text-white px-4 py-2 rounded-2xl shadow-lg"
    >
      🛒 Go to Cart ({cart.length})
    </button>
  </div>
</header>


      <div className="max-w-7xl mx-auto px-6 py-10">
        <p className="text-xs tracking-[0.35em] uppercase text-gray-500 mb-2">
          Category
        </p>

        <h1 className="text-4xl md:text-5xl font-semibold capitalize mb-8">
          {slug.replace("-", " ")}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
  key={product.id}
  onClick={() => {
    setSelectedProduct(product);
    setShowDetails(true);
  }}
              className="group relative bg-white/90 rounded-[28px] overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              {product.images?.[0] && (
                <Image
                  src={getImageUrl(
                    product.images[0]
                  )}
                  alt={product.name}
                  width={400}
                  height={500}
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                />
              )}

              <div className="p-6">
                <h2 className="text-xl font-semibold">
                  {product.name}
                </h2>

                <p className="text-2xl font-bold mt-3">
                  ₹{product.price}
                </p>

<div className="mt-4 space-y-3">
  <button
    onClick={(e) => {
      e.stopPropagation();
      addToCart(product);
    }}
    className="w-full bg-black text-white py-3 rounded-2xl shadow-lg"
  >
    Add to Cart
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      setSelectedProduct(product);
      setShowDetails(true);
    }}
    className="w-full bg-rose-600 text-white py-3 rounded-2xl shadow-lg"
  >
    Buy Now
  </button>

  <a
    href={`https://wa.me/919509295882?text=Hi, I want to buy ${product.name}`}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="block w-full bg-emerald-600 text-white py-3 rounded-2xl text-center shadow-lg"
  >
    Buy on WhatsApp
  </a>

  <button
    onClick={(e) => {
      e.stopPropagation();
      setShowCart(true);
    }}
    className="w-full border border-black py-3 rounded-2xl"
  >
    Go to Cart
    </button>
</div>
              </div>
            </div>
          ))}
        </div>
              </div>
    </div>
  );
}