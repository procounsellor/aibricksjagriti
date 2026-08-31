import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Briefcase, Package } from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import ServicesSection from "./components/ServicesSection";
import ProductPlansSection from "./components/ProductPlansSection";

// Top-level page sections: agency services first (default), product plans second.
const SECTIONS = [
  { id: "services", labelKey: "pricingSectionServices", icon: Briefcase },
  { id: "products", labelKey: "pricingSectionProducts", icon: Package },
];
const SECTION_ORDER = SECTIONS.map((s) => s.id);

export default function PricingPage() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState(SECTION_ORDER[0]);
  const sectionTabRefs = useRef({});

  const handleSectionKeyDown = (event) => {
    const count = SECTION_ORDER.length;
    const currentIndex = SECTION_ORDER.indexOf(activeSection);
    let nextIndex = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % count;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (currentIndex - 1 + count) % count;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = count - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextId = SECTION_ORDER[nextIndex];
    setActiveSection(nextId);
    sectionTabRefs.current[nextId]?.focus();
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: prefersReducedMotion ? 0 : 0.6,
      delay: prefersReducedMotion ? 0 : delay,
    },
  });

  return (
    <div className="w-full bg-gray-900 text-white overflow-x-hidden">
      {/* ================= HERO ================= */}
      <section className="relative pt-36 pb-12 px-6 bg-gradient-to-b from-gray-900 to-gray-800 text-center">
        <motion.h1
          {...fadeUp(0)}
          className="text-4xl md:text-6xl font-extrabold mb-6"
        >
          {t("pricingHeroTitle")}
        </motion.h1>
        <motion.p
          {...fadeUp(0.15)}
          className="max-w-3xl mx-auto text-lg md:text-xl text-gray-300 leading-relaxed"
        >
          {t("pricingHeroSubtitle")}
        </motion.p>

        {/* ============ SECTION SWITCHER ============ */}
        <motion.div {...fadeUp(0.3)} className="mt-10">
          <div
            role="tablist"
            aria-label={t("pricingChooseSection")}
            className="inline-flex flex-col sm:flex-row justify-center gap-2 p-2 mx-auto w-full max-w-md sm:w-auto rounded-2xl sm:rounded-full bg-gray-800/80 backdrop-blur border border-gray-600 shadow-lg shadow-cyan-500/5"
          >
            {SECTIONS.map(({ id, labelKey, icon: Icon }) => {
              const isActive = id === activeSection;
              return (
                <button
                  key={id}
                  ref={(el) => {
                    sectionTabRefs.current[id] = el;
                  }}
                  id={`pricing-section-tab-${id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`pricing-section-panel-${id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveSection(id)}
                  onKeyDown={handleSectionKeyDown}
                  className={`relative flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold rounded-full transition-colors ${
                    isActive
                      ? "text-gray-900"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="pricing-section-active-tab"
                      transition={{
                        duration: prefersReducedMotion ? 0 : 0.3,
                        type: "tween",
                        ease: "easeOut",
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
                    />
                  )}
                  <Icon className="relative z-10 w-5 h-5" aria-hidden="true" />
                  <span className="relative z-10">{t(labelKey)}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ================= ACTIVE SECTION ================= */}
      <section className="px-6 pb-24 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto pt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              role="tabpanel"
              id={`pricing-section-panel-${activeSection}`}
              aria-labelledby={`pricing-section-tab-${activeSection}`}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            >
              {activeSection === "services" ? (
                <ServicesSection prefersReducedMotion={prefersReducedMotion} />
              ) : (
                <ProductPlansSection
                  prefersReducedMotion={prefersReducedMotion}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
