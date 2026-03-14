
import { useRef, useEffect, useState } from "react";
import hero1 from "@/assets/hero-tshirt.jpg";
import hero2 from "@/assets/tshirt-mockup.jpg";

const images = [hero1, hero2];

export const FloatingHero = () => {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Auto-slide every 2 seconds
  useEffect(() => {
    if (dragging) return;
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => timeoutRef.current && clearTimeout(timeoutRef.current);
  }, [current, dragging]);

  // Touch/drag handlers
  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setDragging(true);
    setDragOffset(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragging && touchStartX.current !== null) {
      setDragOffset(e.touches[0].clientX - touchStartX.current);
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) > 50) {
        if (diff < 0) setCurrent((prev) => (prev + 1) % images.length);
        else setCurrent((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    setDragging(false);
    setDragOffset(0);
    touchStartX.current = null;
  };
  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    setDragging(true);
    setDragOffset(0);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && touchStartX.current !== null) {
      setDragOffset(e.clientX - touchStartX.current);
    }
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (touchStartX.current !== null) {
      const diff = e.clientX - touchStartX.current;
      if (Math.abs(diff) > 50) {
        if (diff < 0) setCurrent((prev) => (prev + 1) % images.length);
        else setCurrent((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    setDragging(false);
    setDragOffset(0);
    touchStartX.current = null;
  };

  return (
    <section className="relative w-full min-h-screen overflow-hidden flex items-center justify-center bg-black">
      <div
        className={`absolute inset-0 w-full h-full select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={dragging ? handleMouseUp : undefined}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="w-full h-full relative overflow-hidden">
          {images.map((img, idx) => {
            // If dragging, offset the current image and neighbors
            let offset = (idx - current) * 100;
            if (dragging) {
              if (idx === current) offset += (dragOffset / window.innerWidth) * 100;
              if (idx === (current - 1 + images.length) % images.length && dragOffset > 0) offset += (dragOffset / window.innerWidth) * 100;
              if (idx === (current + 1) % images.length && dragOffset < 0) offset += (dragOffset / window.innerWidth) * 100;
            }
            return (
              <img
                key={idx}
                src={img}
                alt={`Hero ${idx}`}
                className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-700"
                style={{
                  transform: `translateX(${offset}%)`,
                  zIndex: idx === current ? 10 : 0
                }}
                draggable={false}
              />
            );
          })}
        </div>
      </div>
      {/* Optional: Dots indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {images.map((_, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-full ${idx === current ? 'bg-white' : 'bg-white/40'} transition-all`}
          />
        ))}
      </div>
    </section>
  );
};

export default FloatingHero;
