"use client";

import React, { useState } from 'react'
import Image from 'next/image'

export default function RadharaniCollection() {
  const [cart, setCart] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [showCart, setShowCart] = useState(false)

  const products = [
    {
      id: 1,
      name: 'Pink Anarkali Suit',
      price: '₹999',
      stock: 1,
      image: '/dress1.jpg',
      images: ['/dress1.jpg', '/dress1-back.jpg', '/dress1-close.jpg'],
      description: 'Premium festive ethnic wear with elegant embroidery and soft fabric.'
    },
    {
      id: 2,
      name: 'Designer Kurti',
      price: '₹799',
      stock: 1,
      image: '/dress2.jpg',
      images: ['/dress2.jpg', '/dress2-side.jpg'],
      description: 'Elegant designer kurti perfect for casual and festive wear.'
    }
  ]

  const isInCart = (productId) => cart.some((item) => item.id === productId)
  const getAvailableStock = (product) => (isInCart(product.id) ? 0 : product.stock)

  const addToCart = (product) => {
    if (isInCart(product.id)) {
      setToastMessage(`${product.name} already in cart`)
      setTimeout(() => setToastMessage(''), 1000)
      return
    }

    if (product.stock <= 0) {
      setToastMessage(`${product.name} is sold out`)
      setTimeout(() => setToastMessage(''), 1000)
      return
    }

    setCart((prev) => [...prev, { ...product, quantity: 1 }])
    setToastMessage(`${product.name} added to cart ✅`)
    setTimeout(() => setToastMessage(''), 1000)
  }

  const removeFromCart = (indexToRemove) => {
    setCart((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const checkoutOnWhatsApp = () => {
    const items = cart
      .map((item, index) => `${index + 1}. ${item.name} x ${item.quantity} - ${item.price}`)
      .join('%0A')
    const message = `Hello, I want to order:%0A${items}`
    window.open(`https://wa.me/91YOURNUMBER?text=${message}`, '_blank')
  }

  const openCart = () => {
    setSelectedProduct(null)
    setShowCart(true)
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white text-sm px-4 py-2 rounded-xl">
          {toastMessage}
        </div>
      )}

      <video autoPlay loop muted playsInline preload="auto" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10">
        <source src="/background-video.mp4" type="video/mp4" />
      </video>

      {showCart ? (
        <div className="min-h-screen bg-black/20 p-6 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold">Your Cart</h1>
            <button onClick={() => setShowCart(false)} className="border px-4 py-2 rounded-xl bg-white">
              ← Back
            </button>
          </div>

          <div className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-lg">Your cart is empty.</p>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white rounded-2xl p-4 shadow">
                  <div className="flex items-center gap-4">
                    <Image src={item.image} alt={item.name} width={80} height={100} className="rounded-xl object-cover" />
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p>{item.price}</p>
                      <p>Qty: 1</p>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(index)} className="bg-red-500 text-white px-4 py-2 rounded-xl">
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="mt-8 flex gap-4 flex-wrap">
              <button onClick={() => alert('Connect Razorpay / Stripe checkout here')} className="bg-blue-600 text-white px-6 py-3 rounded-2xl">
                Buy Now
              </button>
              <button onClick={checkoutOnWhatsApp} className="bg-green-500 text-white px-6 py-3 rounded-2xl">
                Buy on WhatsApp
              </button>
            </div>
          )}
        </div>
      ) : selectedProduct ? (
        <div className="min-h-screen bg-black/20 p-6 md:p-10">
          <button onClick={() => setSelectedProduct(null)} className="mb-6 px-4 py-2 border rounded-xl bg-white">
            ← Back to Products
          </button>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              {selectedProduct.images.map((img, index) => (
                <div key={index} className="overflow-hidden rounded-2xl max-w-sm">
                  <Image src={img} alt={selectedProduct.name} width={400} height={500} className="w-full rounded-2xl object-cover transition-transform duration-300 hover:scale-150 cursor-zoom-in" />
                </div>
              ))}
            </div>

            <div>
              <h1 className="text-4xl font-bold">{selectedProduct.name}</h1>
              <p className="mt-4 text-gray-700">{selectedProduct.description}</p>
              <p className="mt-4 text-2xl font-bold">{selectedProduct.price}</p>
              <p className="mt-2 text-sm">Stock: {getAvailableStock(selectedProduct) > 0 ? 'Available' : 'Sold Out'}</p>

              <div className="mt-6 flex gap-4 flex-wrap">
                <button
                  onClick={() => addToCart(selectedProduct)}
                  disabled={getAvailableStock(selectedProduct) === 0}
                  className={`px-6 py-3 rounded-2xl text-white ${getAvailableStock(selectedProduct) === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-black'}`}
                >
                  {getAvailableStock(selectedProduct) === 0 ? 'Sold Out' : 'Add to Cart'}
                </button>
                <button onClick={openCart} className="bg-orange-500 text-white px-6 py-3 rounded-2xl">
                  Go to Cart ({cart.length})
                </button>
                <button onClick={() => alert('Connect Razorpay / Stripe here later')} className="bg-blue-600 text-white px-6 py-3 rounded-2xl">
                  Buy Now
                </button>
                <a href={`https://wa.me/91YOURNUMBER?text=I want to buy ${selectedProduct.name}`} className="bg-green-500 text-white px-6 py-3 rounded-2xl">
                  Buy on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white/30 p-6 md:p-10">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl md:text-6xl font-bold text-center flex-1">Radharani Collection</h1>
            <button onClick={openCart} className="ml-4 relative bg-green-600 text-white px-5 py-3 rounded-2xl">
              🛒 Go to Cart
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {products.map((product) => {
              const soldOut = getAvailableStock(product) === 0
              return (
                <div
                  key={product.id}
                  onClick={() => !soldOut && setSelectedProduct(product)}
                  className={`rounded-3xl overflow-hidden shadow-xl bg-white transition duration-300 ${soldOut ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-2xl hover:-translate-y-2'}`}
                >
                  <Image src={product.image} alt={product.name} width={400} height={500} className="w-full h-72 object-cover object-center" />
                  <div className="p-5">
                    <h2 className="text-xl font-semibold">{product.name}</h2>
                    <p className="text-lg font-bold mt-3">{product.price}</p>
                    {soldOut && <p className="mt-2 text-red-600 font-semibold">Sold Out</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/*
Each product supports max quantity 1.
If added to cart, stock becomes zero and card shows Sold Out.
Removing from cart makes it available again.
*/