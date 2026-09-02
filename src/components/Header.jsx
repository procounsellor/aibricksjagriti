import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  Home,
  Brain,
  GraduationCap,
  Menu,
  X,
  Users,
  Tag,
} from "lucide-react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import logo from "../assets/logo.png";

const NAV_LINKS = [
  { id: "Home", nameKey: "navHome", icon: Home, path: "/" },
  { id: "About Us", nameKey: "navAbout", icon: Users, path: "/about-us" },
  { id: "AiBricks", nameKey: "navAiBricks", icon: Building, path: "/aiBricks" },
  {
    id: "ProCounsel",
    nameKey: "navProCounsel",
    icon: GraduationCap,
    path: "/proCounsel",
  },
  {
    id: "TheMindSoul",
    nameKey: "navTheMindSoul",
    icon: Brain,
    path: "/theMindSoul",
  },
  { id: "Pricing", nameKey: "navPricing", icon: Tag, path: "/pricing" },
];

export default function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const linkClasses = (isActive) =>
    `relative flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "text-cyan-300 bg-cyan-400/[0.08] ring-1 ring-inset ring-cyan-400/25"
        : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
    }`;

  const NavLinks = ({ mobile = false }) => (
    <>
      {NAV_LINKS.map((page) => {
        const isActive = location.pathname === page.path;
        return (
          <Link
            key={page.id}
            to={page.path}
            aria-current={isActive ? "page" : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`${linkClasses(isActive)} ${mobile ? "w-full" : ""}`}
          >
            <page.icon aria-hidden="true" className="h-4 w-4" />
            {t(page.nameKey)}
          </Link>
        );
      })}
    </>
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 text-white transition-all duration-300 ${
        scrolled || isMobileMenuOpen
          ? "border-b border-white/[0.08] bg-ink-950/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center rounded-md py-2">
          <img src={logo} alt="Devvo — home" className="h-11 w-auto" />
        </Link>

        <nav
          aria-label={t("navHome")}
          className="hidden items-center gap-1.5 md:flex"
        >
          <NavLinks />
        </nav>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-slate-200 transition-colors hover:bg-white/[0.08]"
            aria-label={isMobileMenuOpen ? t("headerMenuClose") : t("headerMenuOpen")}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X aria-hidden="true" className="h-6 w-6" />
            ) : (
              <Menu aria-hidden="true" className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1, height: "auto" }
                : { opacity: 1, height: "auto" }
            }
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-1.5 p-4">
              <NavLinks mobile />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
