"use client";

import { useState } from "react"; import { supabase } from "../../lib/supabase";

export default function AdminPage() { const [form, setForm] = useState({ name: "", price: "", stock: "", description: "",category: "", product_code: "", images: "", });

const [deleteCode, setDeleteCode] = useState(""); const [stockCode, setStockCode] = useState(""); const [stockQty, setStockQty] = useState(""); const [stockAction, setStockAction] = useState("add"); const [uploading, setUploading] = useState(false);

const addProduct = async () => { const { error } = await supabase.from("inventory").insert([ { name: form.name, price: Number(form.price), stock: Number(form.stock), category: form.category,description: form.description, product_code: form.product_code, images: form.images ? form.images.split(",").map((img) => img.trim()).filter(Boolean) : [], }, ]);

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
  product_code: "",
  images: "",
});

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
  <option value="Women">Women</option>
  <option value="Dupattas">Dupattas</option>
  <option value="Men">Men</option>
  <option value="Kids Wear">Kids Wear</option>
  <option value="Accessories">Accessories</option>
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
</div>

); }