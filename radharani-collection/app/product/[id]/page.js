export default function ProductPage() {
  return (
    <div className="p-6">
      <img src="/dress1.jpg" className="rounded-2xl mb-4" />

      <h1 className="text-2xl font-bold">Pink Anarkali Suit</h1>
      <p className="mt-2">Beautiful festive wear collection</p>
      <p className="text-xl mt-2">₹999</p>

      <a
        href="https://wa.me/918949720403?text=I want to buy this dress"
        className="bg-green-500 text-white px-5 py-3 rounded-xl inline-block mt-4"
      >
        Buy on WhatsApp
      </a>
    </div>
  );
}