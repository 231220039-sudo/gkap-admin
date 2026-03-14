import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const LuxuryPageWrapper = ({ children }: Props) => {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">

      {/* ===== Background glow orbs ===== */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full" />

      {/* ===== Content layer ===== */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default LuxuryPageWrapper;
