import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsappPopup } from "../WhatsappPopup";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      <Navbar />
      {/* Add padding-top to offset fixed navbar height (14 = md:h-14, 12 = h-12) */}
      <main className="flex-1 pt-14 md:pt-16">{children}</main>
      <Footer />
      <WhatsappPopup />
    </div>
  );
};

export default Layout;
