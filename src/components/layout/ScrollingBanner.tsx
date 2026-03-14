import { motion } from "framer-motion";

export const ScrollingBanner = () => {
  // Create the text that will repeat
  const text = "YOUR WAY OF LIVING";
  // Repeat the text multiple times to ensure continuous scrolling
  const repeatedText = Array(20).fill(text).join(" • ");

  return (
    <div className="w-full bg-white border-y-2 border-black overflow-hidden py-5">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{
          x: [0, -2000],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 20,
            ease: "linear",
          },
        }}
      >
        <span className="text-5xl md:text-6xl font-bold uppercase tracking-wider text-black">
          {repeatedText}
        </span>
        <span className="text-5xl md:text-6xl font-bold uppercase tracking-wider text-black">
          {repeatedText}
        </span>
      </motion.div>
    </div>
  );
};

export default ScrollingBanner;
