import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.jpg";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Shop", path: "/shop" },
  { name: "Customize", path: "/customize" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: cartItems = [] } = useCart();
  const { user } = useAuth();
  const cartCount = user ? cartItems.length : 0;

  const handleAddressClick = () => {
    navigate(user ? "/addresses" : "/login");
  };

  /* Shadow on scroll */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed top-0 w-full z-50 border-b transition-shadow bg-white",
          isScrolled ? "shadow-md" : ""
        )}
      >
        <nav className="section-container py-2">
          <div className="flex items-center justify-between h-12 md:h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <motion.img
                src={logo}
                alt="G-KAP Logo"
                className="h-8 md:h-10 w-auto"
                whileHover={{ scale: 1.05 }}
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "relative text-xl font-light uppercase tracking-wide text-black hover:text-black/80",
                    location.pathname === link.path && "font-medium"
                  )}
                  style={{ fontFamily: "Zalando Sans Expanded, sans-serif" }}
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black rounded-full"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Search className="h-6 w-6" />
              </Button>

              <Button variant="ghost" size="icon" onClick={handleAddressClick}>
                <span className="material-icons text-[24px]">place</span>
              </Button>

              <Link to={user ? "/profile" : "/login"}>
                <Button variant="ghost" size="icon">
                  <span className="material-icons text-[24px]">account_circle</span>
                </Button>
              </Link>

              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <span className="material-icons text-[24px]">shopping_cart</span>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold"
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </motion.span>
                  )}
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 pt-20 bg-white md:hidden"
          >
            <div className="section-container flex flex-col gap-6 py-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-xl uppercase text-black"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {/* Mobile Action Icons */}
              <div className="flex justify-around items-center mt-6 gap-6">
                <Button variant="ghost" size="icon">
                  <Search className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setIsMobileMenuOpen(false); handleAddressClick(); }}>
                  <span className="material-icons text-[24px]">place</span>
                </Button>
                <Link to={user ? "/profile" : "/login"} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="icon">
                    <span className="material-icons text-[24px]">account_circle</span>
                  </Button>
                </Link>
                <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="icon" className="relative">
                    <span className="material-icons text-[24px]">shopping_cart</span>
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold"
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </motion.span>
                    )}
                  </Button>
                </Link>
              </div>

              {!user && (
                <>
                  <Link to="/login" className="text-xl uppercase" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/signup" className="text-xl uppercase" onClick={() => setIsMobileMenuOpen(false)}>
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
