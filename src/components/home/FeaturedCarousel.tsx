import { useRef, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import QuickViewModal from "@/components/QuickViewModal";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CARD_WIDTH = 640;
const GAP = 40;

export const FeaturedCarousel = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [quickView, setQuickView] = useState<any | null>(null);

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const { data: products = [], isLoading, error } = useProducts();
  const featured = products.slice(0, 4);

  const snapTo = (i: number) => {
    trackRef.current?.scrollTo({
      left: i * (CARD_WIDTH + GAP),
      behavior: "smooth",
    });
    setIndex(i);
  };

  // ---- DRAG ----
  const down = (x: number) => {
    isDown.current = true;
    startX.current = x;
    scrollLeft.current = trackRef.current!.scrollLeft;
  };

  const move = (x: number) => {
    if (!isDown.current) return;
    const walk = (startX.current - x) * 1.1;
    trackRef.current!.scrollLeft = scrollLeft.current + walk;
  };

  const up = () => {
    isDown.current = false;
    const newIndex = Math.round(
      trackRef.current!.scrollLeft / (CARD_WIDTH + GAP)
    );
    snapTo(newIndex);
  };

  return (
    <section className="py-20 bg-background">
      <div className="relative w-[92vw] mx-auto overflow-hidden">

        <h2 className="text-black font-display font-bold text-4xl md:text-5xl mb-10 tracking-tight text-center">
          TRENDING T-SHIRTS IN THE HOUSE
        </h2>

        {/* LEFT */}
        <button
          onClick={() => snapTo(Math.max(index - 1, 0))}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white border border-black/30 rounded-full p-3 hover:bg-black hover:text-white transition"
        >
          <ChevronLeft />
        </button>

        {/* RIGHT */}
        <button
          onClick={() =>
            snapTo(Math.min(index + 1, featured.length - 1))
          }
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white border border-black/30 rounded-full p-3 hover:bg-black hover:text-white transition"
        >
          <ChevronRight />
        </button>

        {/* TRACK */}
        <div
          ref={trackRef}
          className="flex gap-[40px] overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={(e) => down(e.pageX)}
          onMouseMove={(e) => move(e.pageX)}
          onMouseUp={up}
          onMouseLeave={up}
          onTouchStart={(e) => down(e.touches[0].pageX)}
          onTouchMove={(e) => move(e.touches[0].pageX)}
          onTouchEnd={up}
        >
          {isLoading ? (
            <div className="w-full text-center py-20">Loading...</div>
          ) : error ? (
            <div className="w-full text-center py-20 text-red-500">
              Failed to load products.
            </div>
          ) : featured.length === 0 ? (
            <div className="w-full text-center py-20">
              No products found.
            </div>
          ) : (
            featured.map((product) => (
              <div
                key={product.id}
                style={{ width: CARD_WIDTH }}
                className="group flex-shrink-0 bg-white border border-black/20 rounded-xl overflow-hidden"
              >
                {/* IMAGE HOVER + QUICK VIEW */}
                <div className="relative group w-full aspect-[4/5] overflow-hidden bg-gray-100">

                  <img
                    src={product.product_images?.[0]?.image_url}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                  />

                  {product.product_images?.[1]?.image_url && (
                    <img
                      src={product.product_images[1].image_url}
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                  )}

                  <button
                    onClick={() => setQuickView(product)}
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full text-sm font-medium shadow-md opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                  >
                    Quick View
                  </button>
                </div>

                {/* INFO */}
                <div className="p-5 text-center">
                  <h3 className="font-semibold mb-1">
                    {product.name}
                  </h3>

                  <div className="text-sm">
                    {product.original_price && (
                      <del className="text-muted-foreground mr-2">
                        Rs. {product.original_price}
                      </del>
                    )}
                    <span className="font-bold text-black">
                      Rs. {product.price}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-black mt-14" />
      </div>

      {/* Quick View Modal */}
      {quickView && (
        <QuickViewModal
          product={quickView}
          onClose={() => setQuickView(null)}
        />
      )}
    </section>
  );
};

export default FeaturedCarousel;