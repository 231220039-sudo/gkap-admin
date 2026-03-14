import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import animeCollection from "@/assets/collection-anime.jpg";
import minimalCollection from "@/assets/collection-minimal.jpg";
import streetwearCollection from "@/assets/collection-streetwear.jpg";

gsap.registerPlugin(ScrollTrigger);

type Collection = {
  title: string;
  description: string;
  image: string;
  color?: string;
  category: string;
};
const collections: Collection[] = [
  {
    title: "anime",
    description: "anime",
    image: animeCollection,
    color: "#f9e71b",
    category: "anime" // Add this key
  },
  {
    title: "minimal",
    description: "minimal",
    image: minimalCollection,
    color: "#3ac36c",
    category: "minimal" // Add this key
  },
  {
    title: "streetwear",
    description: "streetwear",
    image: streetwearCollection,
    color: "#e86e29",
    category: "streetwear" // Add this key
  }
];

export const StackedCollections = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const context = gsap.context(() => {
      const wrappers = gsap.utils.toArray<HTMLElement>(".card-wrapper");
      const cards = gsap.utils.toArray<HTMLElement>(".card-inner");

      wrappers.forEach((wrapper, i) => {
        const card = cards[i];

        // PHASE 1: EXPANSION (First Card)
        if (i === 0) {
          gsap.fromTo(card, 
            { width: "650px", height: "350px" },
            {
              width: "1500px", height: "850px",
              scrollTrigger: {
                trigger: wrapper,
                start: "top center",
                end: "top 1%",
                scrub: true,
              }
            }
          );
        }

        // PHASE 2: STACKING & PERSPECTIVE
        gsap.to(card, {
          scale: i === wrappers.length - 1 ? 1 : 0.95 + 0.025 * i,
          rotationX: i === wrappers.length - 1 ? 0 : -10,
          transformOrigin: "top center",
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: `top ${60 + 20 * i}px`,
            endTrigger: ".cards-main-container",
            end: "bottom center", // Tightened to fix the bottom gap
            pin: true,
            pinSpacing: false,
            scrub: true,
          }
        });
      });
    }, containerRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={containerRef} className="bg-[#f6f0e5] py-32 w-full overflow-hidden">
      <div className="cards-main-container max-w-[90vw] mx-auto px-5 relative">
        {collections.map((item, i) => (
          <div key={i} className="card-wrapper w-full mb-[20vh] perspective-[1000px] flex justify-center">
            {/* 1. REMOVE 'bg-white' and apply 'item.color' here */}
            <div 
              className="card-inner w-[1500px] h-[850px] rounded-[35px] shadow-2xl overflow-hidden relative border border-black/5"
              style={{ backgroundColor: item.color }} 
            >
              
              {/* 2. ADD 'text-white' or 'text-black' based on background for contrast */}
              <div className="absolute inset-0 flex flex-col md:flex-row items-center p-12 md:p-20 text-white">
                <div className="w-full md:w-1/2 text-left">
                  <h3 className="text-6xl font-black uppercase tracking-tighter mb-4 drop-shadow-md">
                    {item.title}
                  </h3>
                  <p className="text-xl opacity-90 mb-8 max-w-sm">
                    {item.description}
                  </p>
                  <Link to={`/shop?category=${item.category}`} className="inline-block px-10 py-4 bg-white text-black rounded-full font-bold uppercase hover:scale-105 transition-transform">
                    Explore
                  </Link>
                </div>
                <div className="w-full md:w-1/2 h-full flex items-center justify-center">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="max-h-[90%] object-contain drop-shadow-2xl" 
                  />
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
      {/* 3. REDUCED SPACER: To close the large gap at the bottom */}
      <div className="h-[20vh]" />
    </section>
  );
};