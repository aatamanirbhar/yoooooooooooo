"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Image from "next/image";

export default function CategoryPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);

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

  const getImageUrl = (path) =>
    supabase.storage
      .from("product-images")
      .getPublicUrl(path).data.publicUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-rose-50 to-stone-100">
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
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <p className="text-gray-500 mt-10">
            No products found in this category.
          </p>
        )}
      </div>
    </div>
  );
}