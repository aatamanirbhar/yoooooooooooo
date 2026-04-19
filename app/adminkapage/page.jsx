"use client";

import { useState, useEffect } from "react"; import { supabase } from "../../lib/supabase";

export default function AdminPage() { const [form, setForm] = useState({ name: "", price: "", stock: "", description: "",category: "", product_code: "", images: "", sizes: "",video_url: "",
  colors: "",custom_tag: "",});

  const [editCode, setEditCode] = useState("");
const [editForm, setEditForm] = useState(null);

  const [couponForm, setCouponForm] = useState({
  code: "",
  discount_type: "percent",
  discount_value: "",
  min_order: "",
});

const [coupons, setCoupons] = useState([]);

const [deleteCode, setDeleteCode] = useState(""); const [stockCode, setStockCode] = useState(""); const [stockQty, setStockQty] = useState(""); const [stockAction, setStockAction] = useState("add"); const [uploading, setUploading] = useState(false);

useEffect(() => {
  fetchCoupons();
}, []);


const addCoupon = async () => {
  const { error } = await supabase
    .from("coupons")
    .insert([
      {
        code: couponForm.code.toUpperCase(),
        discount_type:
          couponForm.discount_type,
        discount_value: Number(
          couponForm.discount_value
        ),
        min_order: Number(
          couponForm.min_order
        ),
        active: true,
      },
    ]);

  if (error) {
    alert(error.message);
    return;
  }

  setCouponForm({
    code: "",
    discount_type: "percent",
    discount_value: "",
    min_order: "",
  });

  fetchCoupons();
};


const fetchProductForEdit = async () => {
  if (!editCode.trim()) {
    alert("Enter product code");
    return;
  }

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("product_code", editCode.trim())
    .single();

  if (error || !data) {
    alert("Product not found");
    return;
  }

  setEditForm({
    ...data,
    images: (data.images || []).join(", "),
    sizes: (data.sizes || []).join(", "),
    colors: (data.colors || []).join(", "),
  });
};


const updateProduct = async () => {
  if (!editForm) return;

  const { error } = await supabase
    .from("inventory")
    .update({
      name: editForm.name,
      price: Number(editForm.price),
      stock: Number(editForm.stock),
      description: editForm.description,
      category: editForm.category,
      video_url: editForm.video_url,
      custom_tag: editForm.custom_tag,
      images: editForm.images
        ? editForm.images.split(",").map(i => i.trim())
        : [],
      sizes: editForm.sizes
        ? editForm.sizes.split(",").map(s => s.trim())
        : [],
      colors: editForm.colors
        ? editForm.colors.split(",").map(c => c.trim())
        : [],
    })
    .eq("product_code", editCode);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Product updated");
  setEditForm(null);
  setEditCode("");
};

const deleteCouponByName = async (code) => {
  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("code", code.toUpperCase());

  if (error) {
    alert(error.message);
    return;
  }

  fetchCoupons();
};

const addProduct = async () => { const { error } = await supabase.from("inventory").insert([ { name: form.name, price: Number(form.price), stock: Number(form.stock), category: form.category,description: form.description, product_code: form.product_code,custom_tag: form.custom_tag, images: form.images
  ? form.images.split(",").map((img) => img.trim()).filter(Boolean)
  : [],
sizes: form.sizes
  ? form.sizes.split(",").map((size) => size.trim())
  : [],
colors: form.colors
  ? form.colors.split(",").map((color) => color.trim())
  : [],  video_url: form.video_url,  }, ]);

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
  category: "",
  product_code: "",
  images: "",
  sizes: "",
colors: "",
video_url: "",
custom_tag: "",
});

};


const fetchCoupons = async () => {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("id", { ascending: false });

  if (!error) {
    setCoupons(data || []);
  }
};

const deleteProductByCode = async () => { if (!deleteCode.trim()) { alert("Enter product code"); return; }

const { error } = await supabase
  .from("inventory")
  .delete()
  .eq("product_code", deleteCode.trim());

if (error) {
  alert(error.message);
  return;
}

alert("Product deleted");
setDeleteCode("");

};

const updateStockByCode = async () => { if (!stockCode || !stockQty) { alert("Enter code and quantity"); return; }

const { data, error } = await supabase
  .from("inventory")
  .select("stock")
  .eq("product_code", stockCode)
  .single();

if (error || !data) {
  alert("Product not found");
  return;
}

const currentStock = Number(data.stock) || 0;
const qty = Number(stockQty);

const newStock =
  stockAction === "add"
    ? currentStock + qty
    : Math.max(currentStock - qty, 0);

const { error: updateError } = await supabase
  .from("inventory")
  .update({ stock: newStock })
  .eq("product_code", stockCode);

if (updateError) {
  alert(updateError.message);
  return;
}

alert(`Stock updated to ${newStock}`);
setStockCode("");
setStockQty("");
setStockAction("add");

};

const handleImageDrop = async (e) => { e.preventDefault(); const files = e.dataTransfer.files; if (!files.length) return;

setUploading(true);
const paths = [];

for (const file of files) {
  const fileName = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file);

  if (error) {
    alert(error.message);
    setUploading(false);
    return;
  }

  paths.push(fileName);
}

setForm((prev) => ({
  ...prev,
  images: prev.images
    ? `${prev.images}, ${paths.join(", ")}`
    : paths.join(", "),
}));

setUploading(false);

};

return ( <div className="min-h-screen p-8 max-w-2xl mx-auto space-y-6"> <h1 className="text-3xl font-bold">Admin Panel</h1>

<div className="space-y-3 border p-4 rounded-2xl">
    <h2 className="text-xl font-semibold">Add Product</h2>
    <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border p-3 rounded-xl" />
    <input placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border p-3 rounded-xl" />
    <input placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full border p-3 rounded-xl" />
    <input placeholder="Product Code" value={form.product_code} onChange={(e) => setForm({ ...form, product_code: e.target.value })} className="w-full border p-3 rounded-xl" />
    <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border p-3 rounded-xl" />
      <input
  placeholder="Real Product Video URL"
  value={form.video_url}
  onChange={(e) =>
    setForm({
      ...form,
      video_url: e.target.value,
    })
  }
  className="w-full border p-3 rounded-xl"
/>
      <input
  placeholder="Sizes Available (e.g. S, M, L, XL)"
  value={form.sizes}
  onChange={(e) =>
    setForm({ ...form, sizes: e.target.value })
  }
  className="w-full border p-3 rounded-xl"
/>

<input
  placeholder="Colors Available (e.g. Black, White, Blue)"
  value={form.colors}
  onChange={(e) =>
    setForm({ ...form, colors: e.target.value })
  }
  className="w-full border p-3 rounded-xl"
/>
    <select
  value={form.category}
  onChange={(e) =>
    setForm({
      ...form,
      category: e.target.value,
    })
  }
  className="w-full bg-white border border-gray-200 px-5 py-4 rounded-2xl"
>
  <option value="">Select Category</option>
  <option value="dupattas">Dupattas</option>
  <option value="tshirt">T-Shirts</option>
  <option value="mens-shorts">Men's Shorts</option>
  <option value="women">Women</option>
  <option value="men">Men</option>
  <option value="kids-wear">Kids Wear</option>
  <option value="accessories">Accessories</option>
</select>

    <div className="w-full border-2 border-dashed p-6 rounded-xl text-center space-y-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleImageDrop}
    >
      <p>{uploading ? "Uploading..." : "Drag & drop images here"}</p>
      <p className="text-sm text-gray-500">or tap below to upload on mobile</p>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={async (e) => {
          const files = e.target.files;
          if (!files?.length) return;

          setUploading(true);
          const paths = [];

          for (const file of files) {
            const fileName = `${Date.now()}-${file.name}`;
            const { error } = await supabase.storage
              .from("product-images")
              .upload(fileName, file);

            if (error) {
              alert(error.message);
              setUploading(false);
              return;
            }

            paths.push(fileName);
          }

          setForm((prev) => ({
            ...prev,
            images: prev.images
              ? `${prev.images}, ${paths.join(", ")}`
              : paths.join(", "),
          }));

          setUploading(false);
        }}
        className="w-full border p-2 rounded-lg"
      />
    </div>

    <input value={form.images} readOnly placeholder="Uploaded images" className="w-full border p-3 rounded-xl" />
    <input
  placeholder="Custom Tag"
  value={form.custom_tag}
  onChange={(e) =>
    setForm({
      ...form,
      custom_tag: e.target.value,
    })
  }
  className="w-full border p-3 rounded-xl"
/>

    <button onClick={addProduct} className="w-full bg-black text-white py-3 rounded-xl">Add Product</button>
  </div>

  <div className="space-y-3 border p-4 rounded-2xl">
    <h2 className="text-xl font-semibold">Delete Product</h2>
    <input placeholder="Product Code" value={deleteCode} onChange={(e) => setDeleteCode(e.target.value)} className="w-full border p-3 rounded-xl" />
    <button onClick={deleteProductByCode} className="w-full bg-red-600 text-white py-3 rounded-xl">Delete Product</button>
  </div>

  <div className="space-y-3 border p-4 rounded-2xl">
    <h2 className="text-xl font-semibold">Update Stock</h2>
    <input placeholder="Product Code" value={stockCode} onChange={(e) => setStockCode(e.target.value)} className="w-full border p-3 rounded-xl" />
    <input placeholder="Quantity" value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="w-full border p-3 rounded-xl" />
    <select value={stockAction} onChange={(e) => setStockAction(e.target.value)} className="w-full border p-3 rounded-xl">
      <option value="add">Add Stock</option>
      <option value="remove">Reduce Stock</option>
    </select>
    <button onClick={updateStockByCode} className="w-full bg-blue-600 text-white py-3 rounded-xl">Update Stock</button>
  </div>


<div className="space-y-3 border p-4 rounded-2xl">
  <h2 className="text-xl font-semibold">Edit Product</h2>

  <input
    placeholder="Enter Product Code"
    value={editCode}
    onChange={(e) => setEditCode(e.target.value)}
    className="w-full border p-3 rounded-xl"
  />

  <button
    onClick={fetchProductForEdit}
    className="w-full bg-gray-800 text-white py-3 rounded-xl"
  >
    Load Product
  </button>

  {editForm && (
    <>
      <input
        value={editForm.name}
        onChange={(e) =>
          setEditForm({ ...editForm, name: e.target.value })
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={editForm.price}
        onChange={(e) =>
          setEditForm({ ...editForm, price: e.target.value })
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={editForm.stock}
        onChange={(e) =>
          setEditForm({ ...editForm, stock: e.target.value })
        }
        className="w-full border p-3 rounded-xl"
      />

      <textarea
        value={editForm.description}
        onChange={(e) =>
          setEditForm({
            ...editForm,
            description: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={editForm.images}
        onChange={(e) =>
          setEditForm({
            ...editForm,
            images: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={editForm.sizes}
        onChange={(e) =>
          setEditForm({
            ...editForm,
            sizes: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={editForm.colors}
        onChange={(e) =>
          setEditForm({
            ...editForm,
            colors: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={editForm.video_url || ""}
        onChange={(e) =>
          setEditForm({
            ...editForm,
            video_url: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        value={editForm.custom_tag || ""}
        onChange={(e) =>
          setEditForm({
            ...editForm,
            custom_tag: e.target.value,
          })
        }
        className="w-full border p-3 rounded-xl"
      />

      <button
        onClick={updateProduct}
        className="w-full bg-green-600 text-white py-3 rounded-xl"
      >
        Update Product
      </button>
    </>
  )}
</div>


<div className="mt-10 bg-white rounded-3xl p-6 shadow-lg">
  <h2 className="text-2xl font-bold mb-5">
    Coupon Manager
  </h2>

  <input
    placeholder="Coupon Code"
    value={couponForm.code}
    onChange={(e) =>
      setCouponForm({
        ...couponForm,
        code: e.target.value,
      })
    }
    className="w-full border p-3 rounded-xl mb-3"
  />

  <select
    value={couponForm.discount_type}
    onChange={(e) =>
      setCouponForm({
        ...couponForm,
        discount_type: e.target.value,
      })
    }
    className="w-full border p-3 rounded-xl mb-3"
  >
    <option value="percent">
      Percent
    </option>
    <option value="flat">
      Flat
    </option>
  </select>

  <input
    placeholder="Discount Value"
    value={couponForm.discount_value}
    onChange={(e) =>
      setCouponForm({
        ...couponForm,
        discount_value: e.target.value,
      })
    }
    className="w-full border p-3 rounded-xl mb-3"
  />

  <input
    placeholder="Minimum Order"
    value={couponForm.min_order}
    onChange={(e) =>
      setCouponForm({
        ...couponForm,
        min_order: e.target.value,
      })
    }
    className="w-full border p-3 rounded-xl mb-3"
  />

  <button
    onClick={addCoupon}
    className="w-full bg-black text-white py-3 rounded-2xl"
  >
    Add Coupon
  </button>

  <div className="mt-6 space-y-3">
    {coupons.map((coupon) => (
      <div
        key={coupon.id}
        className="border rounded-2xl p-4 flex justify-between"
      >
        <div>
          <p className="font-bold">
            {coupon.code}
          </p>
          <p>
            {coupon.discount_type} - ₹
            {coupon.discount_value}
          </p>
        </div>

        <button
          onClick={() =>
            deleteCoupon(coupon.id)
          }
          className="text-red-600"
        >
          Delete
        </button>
      </div>
    ))}
  </div>
</div>

</div>

); }