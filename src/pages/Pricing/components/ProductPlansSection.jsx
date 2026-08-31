import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Building, GraduationCap, Brain } from "lucide-react";
import { PRICING, PRICING_ORDER } from "../../../config/pricing";
import TierCard from "./TierCard";

const PRODUCT_ICONS = {
  aiBricks: Building,
  proCounsel: GraduationCap,
  theMindSoul: Brain,
};

const FAQ_ITEMS = [1, 2, 3];

export default function ProductPlansSection({ prefersReducedMotion }) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(PRICING_ORDER[0]);
  const activeProduct = PRICING[activeId];
  const tabRefs = useRef({});

  const handleTabKeyDown = (event) => {
    const count = PRICING_ORDER.length;
    const currentIndex = PRICING_ORDER.indexOf(activeId);
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
    const nextId = PRICING_ORDER[nextIndex];
    setActiveId(nextId);
    tabRefs.current[nextId]?.focus();
  };

  return (
    <div>
      {/* ============ PRODUCT SWITCHER ============ */}
      <div
        role="tablist"
        aria-label={t("pricingChooseProduct")}
        className="flex flex-col sm:flex-row justify-center gap-2 p-2 mx-auto max-w-2xl rounded-2xl sm:rounded-full bg-gray-800 border border-gray-700"
      >
        {PRICING_ORDER.map((id) => {
          const Icon = PRODUCT_ICONS[id];
          const isActive = id === activeId;
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el;
              }}
              id={`pricing-tab-${id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`pricing-panel-${id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveId(id)}
              onKeyDown={handleTabKeyDown}
              className={`relative flex items-center justify-center gap-2 flex-1 px-6 py-3 text-sm font-semibold rounded-full transition-colors ${
                isActive ? "text-gray-900" : "text-gray-300 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="pricing-active-tab"
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.3,
                    type: "tween",
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
                />
              )}
              <Icon className="relative z-10 w-4 h-4" />
              <span className="relative z-10">{t(PRICING[id].labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* ============ TIERS FOR ACTIVE PRODUCT ============ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeId}
          role="tabpanel"
          id={`pricing-panel-${activeId}`}
          aria-labelledby={`pricing-tab-${activeId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
        >
          <p className="mt-10 text-center text-lg text-gray-400">
            {t(activeProduct.taglineKey)}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 items-stretch max-w-6xl mx-auto">
            {activeProduct.tiers.map((tier, index) => (
              <TierCard
                key={tier.id}
                tier={tier}
                productId={activeProduct.id}
                index={index}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>

          {/* ============ TRUST NOTES ============ */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-8 mt-12">
            {activeProduct.notes.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="flex items-center gap-2 text-sm text-gray-400"
              >
                <Icon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <span>{t(key)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ============ FAQ ============ */}
      <div className="pt-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-cyan-300 mb-12">
            {t("pricingFaqTitle")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FAQ_ITEMS.map((n) => (
              <div
                key={n}
                className="p-6 rounded-xl bg-white/5 backdrop-blur border border-gray-700/50"
              >
                <h3 className="mb-3 text-lg font-semibold text-white">
                  {t(`pricingFaq${n}Q`)}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {t(`pricingFaq${n}A`)}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-gray-400 max-w-2xl mx-auto">
            {t("pricingCrossNote")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
