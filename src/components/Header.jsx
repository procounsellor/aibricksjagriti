import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import productsConfig from "../config/products.json";
import logo from "../assets/logo.png";

const productLinks = [
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

export default function Header({ onChangeLang }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentLang = i18n.language;

  const NavLinks = () => (
    <>
      {productLinks.map((page) => {
        const isActive = location.pathname === page.path;
        return (
          <Link
            key={page.id}
            to={page.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              isActive
                ? "text-cyan-400 bg-gray-800"
                : "text-gray-300 hover:text-white hover:bg-gray-700"
            }`}
          >
            <page.icon className="w-4 h-4" />
            {t(page.nameKey)}
          </Link>
        );
      })}
      <button
        onClick={() => {
          onChangeLang(currentLang === "en" ? "es" : "en");
          setIsMobileMenuOpen(false);
        }}
        className="px-4 py-2 text-sm font-medium text-left text-gray-300 rounded-md transition-all hover:text-white hover:bg-gray-700"
      >
        {t("langSwitch")}
      </button>
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 text-white bg-black bg-opacity-30 backdrop-blur-md">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto max-w-7xl">
        <Link to="/" className="flex items-center py-2">
          <img src={logo} alt="Devvo home" className="h-12 w-auto" />
        </Link>
        <nav className="items-center hidden gap-2 md:flex">
          <NavLinks />
        </nav>
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-700"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          className="absolute left-0 right-0 p-4 bg-gray-900 border-t border-gray-700 md:hidden top-16"
        >
          <nav className="flex flex-col gap-2">
            <NavLinks />
          </nav>
        </div>
      )}
    </header>
  );
}
