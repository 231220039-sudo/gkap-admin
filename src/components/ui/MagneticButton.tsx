import { useRef } from "react";

export default function MagneticButton({ children }: any) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: any) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current!.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  };

  const reset = () => {
    ref.current!.style.transform = "translate(0,0)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={reset}
      className="inline-block transition-transform duration-200"
    >
      {children}
    </div>
  );
}
