import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import {
  SERVICES,
  SERVICES_ORDER,
  SERVICES_TRUST,
} from "../../../config/servicesPricing";
import TierCard from "./TierCard";

export default function ServicesSection({ prefersReducedMotion }) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(SERVICES_ORDER[0]);
  const activeCategory = SERVICES[activeId];
  const tabRefs = useRef({});

  const handleTabKeyDown = (event) => {
    const count = SERVICES_ORDER.length;
    const currentIndex = SERVICES_ORDER.indexOf(activeId);
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
    const nextId = SERVICES_ORDER[nextIndex];
    setActiveId(nextId);
    tabRefs.current[nextId]?.focus();
  };

  // Categories either hold a flat tier list or named groups of tiers
  // (e.g. Design & Marketing). Normalize to groups for rendering.
  const groups = activeCategory.groups || [
    { id: "all", tiers: activeCategory.tiers },
  ];

  return (
    <div>
      <p className="text-center text-lg text-gray-400 max-w-3xl mx-auto mb-10">
        {t("pricingSvcTagline")}
      </p>

      {/* ============ CATEGORY SWITCHER ============ */}
      <div
        role="tablist"
        aria-label={t("pricingSvcChooseCategory")}
        className="flex flex-wrap justify-center gap-2 p-2 mx-auto max-w-4xl rounded-2xl bg-gray-800 border border-gray-700"
      >
        {SERVICES_ORDER.map((id) => {
          const Icon = SERVICES[id].icon;
          const isActive = id === activeId;
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el;
              }}
              id={`pricing-svc-tab-${id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`pricing-svc-panel-${id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveId(id)}
              onKeyDown={handleTabKeyDown}
              className={`relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-full transition-colors ${
                isActive ? "text-gray-900" : "text-gray-300 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="pricing-svc-active-tab"
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.3,
                    type: "tween",
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
                />
              )}
              <Icon className="relative z-10 w-4 h-4" aria-hidden="true" />
              <span className="relative z-10">{t(SERVICES[id].labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* ============ ACTIVE CATEGORY ============ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeId}
          role="tabpanel"
          id={`pricing-svc-panel-${activeId}`}
          aria-labelledby={`pricing-svc-tab-${activeId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
        >
          {/* Hourly-rate badge (+ optional category note) */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 mt-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full text-cyan-300 bg-cyan-400/10 border border-cyan-400/40">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {t("pricingSvcHourlyBadge", { usd: activeCategory.hourlyUsd })}
              <span className="font-normal text-cyan-300/70">
                · {t("pricingSvcHourlyInr", { inr: activeCategory.hourlyInr })}
              </span>
            </span>
            {activeCategory.noteKey && (
              <span className="text-sm text-gray-400">
                {t(activeCategory.noteKey)}
              </span>
            )}
          </div>

          {/* Tier groups */}
          {groups.map((group) => (
            <div key={group.id}>
              {group.titleKey && (
                <h3 className="mt-12 text-xl font-bold text-center text-white">
                  {t(group.titleKey)}
                </h3>
              )}
              <div
                className={`grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto ${
                  group.titleKey ? "mt-8" : "mt-12"
                }`}
              >
                {group.tiers.map((tier, index) => (
                  <TierCard
                    key={tier.id}
                    tier={tier}
                    ctaTo="/about-us"
                    index={index}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Footnotes */}
          {activeCategory.footnoteKeys && (
            <div className="mt-10 space-y-2">
              {activeCategory.footnoteKeys.map((key) => (
                <p
                  key={key}
                  className="text-center text-sm text-gray-400 max-w-2xl mx-auto"
                >
                  {t(key)}
                </p>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ============ SERVICES TRUST STRIP ============ */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-8 mt-14 pt-8 border-t border-gray-700/50 max-w-5xl mx-auto">
        {SERVICES_TRUST.map(({ icon: Icon, key }) => (
          <div
            key={key}
            className="flex items-center gap-2 text-sm text-gray-400"
          >
            <Icon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>{t(key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
