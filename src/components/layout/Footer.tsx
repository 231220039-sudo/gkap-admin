import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerLinks = {
  shop: [
    { name: "All Products", path: "/shop" },
    { name: "Anime Collection", path: "/shop?category=anime" },
    { name: "Streetwear", path: "/shop?category=streetwear" },
    { name: "Minimal Logos", path: "/shop?category=minimal" },
    { name: "New Arrivals", path: "/shop?sort=newest" },
  ],
  company: [
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Sustainability", path: "/about#sustainability" },
  ],
  support: [
    { name: "FAQ", path: "/contact#faq" },
    // { name: "Shipping & Returns", path: "/shipping" },
    { name: "Track Order", path: "/track-order" },
    { name: "Returns and Refund Policy", path: "/returns-and-refund-policy" },
  ],
  legal: [
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Returns and Refund Policy", path: "/returns-and-refund-policy" },
    { name: "Terms & Conditions", path: "/terms-and-conditions" },
  ],
};

const socialLinks = [
  { icon: Instagram, label: "Instagram", url: "https://www.instagram.com/gkap_branding/" },
  { icon: Twitter, label: "Twitter", url: "https://twitter.com/gkap_branding" },
  { icon: Facebook, label: "Facebook", url: "https://facebook.com/gkap_branding" },
  { icon: Youtube, label: "YouTube", url: "https://youtube.com/@gkap_branding" },
];

export const Footer = () => {
  return (
    <footer className="w-full bg-foreground text-background overflow-x-hidden">
      {/* Main Footer Content */}
      <div className="section-container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-display font-bold">
                G-<span className="text-gradient-primary">KAP</span>
              </span>
            </Link>
            <p className="text-background/70 text-sm mb-6">
              Your Design. Your Style. Your G-KAP. Premium custom-printed T-shirts for creators.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-background/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-background/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-background/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-background/70 min-w-0">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="break-all overflow-wrap break-words min-w-0 flex-shrink">gkapprints@gmail.com</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-background/70">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                <span>7287980727</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-background/70">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>EP Padmavathi colony hayathnagar hyderabad 501505</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="section-container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-background/50">
              © {new Date().getFullYear()} G-KAP. All rights reserved.
            </p>
            <div className="flex gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-background/50 hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
