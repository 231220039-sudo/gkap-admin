import { X } from "lucide-react";
import { useState } from "react";

export const QuickViewModal = ({ product, onClose }: any) => {
  const images = product.product_images || [];
  const [active, setActive] = useState(images[0]?.image_url);

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      {/* PANEL */}
      <div className="bg-white w-[92vw] max-w-6xl rounded-2xl p-10 grid grid-cols-1 md:grid-cols-2 gap-12 relative">
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5"
        >
          <X />
        </button>
        {/* LEFT – GALLERY */}
        <div className="flex gap-4">
          {/* THUMBS */}
          <div className="flex flex-col gap-3">
            {images.map((img: any) => (
              <button
                key={img.id}
                onClick={() => setActive(img.image_url)}
                className={`w-20 h-24 border rounded-lg overflow-hidden ${
                  active === img.image_url
                    ? "border-black"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={img.image_url}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          {/* MAIN */}
          <div className="flex-1 aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={active}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {/* RIGHT – INFO */}
        <div>
          <h2 className="text-3xl font-bold mb-3">
            {product.name}
          </h2>
          <div className="flex gap-3 text-xl mb-6">
            {product.original_price && (
              <del className="text-gray-400">
                Rs. {product.original_price}
              </del>
            )}
            <span className="text-orange-500 font-semibold">
              Rs. {product.price}
            </span>
          </div>
          <p className="text-gray-600 mb-6">
            {product.description}
          </p>
          {/* SIZE */}
          <div className="mb-6">
            <p className="font-medium mb-2">Size</p>
            <div className="flex gap-3">
              {product.sizes.map((s: string) => (
                <button
                  key={s}
                  className="border px-4 py-2 rounded-md hover:border-black"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {/* ACTION */}
          <div className="flex gap-4 mt-8">
            <button className="flex-1 bg-orange-400 text-white py-4 rounded-full font-semibold">
              Add to cart
            </button>
            <button className="flex-1 bg-blue-600 text-white py-4 rounded-full font-semibold">
              Buy now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
