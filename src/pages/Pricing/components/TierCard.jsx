import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check, Star } from "lucide-react";

export default function TierCard({
  tier,
  productId,
  ctaTo,
  index,
  prefersReducedMotion,
}) {
  const { t } = useTranslation();
  const rawFeatures = t(tier.featuresKey, { returnObjects: true });
  const features = Array.isArray(rawFeatures) ? rawFeatures : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.45,
        delay: prefersReducedMotion ? 0 : index * 0.08,
      }}
      className={`relative flex flex-col h-full p-8 rounded-2xl bg-gray-800 border transition-colors ${
        tier.popular
          ? "border-cyan-400 ring-2 ring-cyan-400/50 shadow-xl shadow-cyan-500/10 lg:scale-105"
          : "border-gray-700 hover:border-gray-500"
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1.5 px-4 py-1 text-xs font-bold tracking-wide uppercase text-gray-900 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 whitespace-nowrap">
            <Star className="w-3.5 h-3.5 fill-current" />
            {t("pricingMostPopular")}
          </span>
        </div>
      )}

      <h3
        className={`text-xl font-bold ${
          tier.popular ? "text-cyan-300" : "text-white"
        }`}
      >
        {t(tier.nameKey)}
      </h3>

      <div className="flex items-baseline flex-wrap gap-x-2 mt-4">
        {tier.from && (
          <span className="text-sm font-medium text-gray-400">
            {t("pricingSvcFrom")}
          </span>
        )}
        <span className="text-4xl font-extrabold text-white">{tier.price}</span>
        <span className="text-sm text-gray-400">{t(tier.periodKey)}</span>
      </div>

      {tier.monthlyUsd && (
        <p className="mt-1 text-sm text-cyan-300">
          {t("pricingSvcPlusMonthly", {
            usd: tier.monthlyUsd,
            inr: tier.monthlyInr,
          })}
        </p>
      )}

      {tier.inrPrice && (
        <p className="mt-1 text-sm text-gray-400">
          {t("pricingSvcInrEquiv", { price: tier.inrPrice })}
        </p>
      )}

      {tier.altKey && (
        <p className="mt-1 text-sm text-cyan-300">
          {t(tier.altKey, { price: tier.altPrice })}
        </p>
      )}

      <ul className="flex-grow mt-8 space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check
              className="w-5 h-5 mt-0.5 shrink-0 text-cyan-400"
              aria-hidden="true"
            />
            <span className="text-sm leading-relaxed text-gray-300">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        to={ctaTo || `/${productId}`}
        className={`block w-full px-6 py-3 mt-8 text-sm font-semibold text-center rounded-full transition ${
          tier.popular
            ? "bg-cyan-400 text-gray-900 hover:bg-cyan-300"
            : "border border-gray-600 text-white hover:border-cyan-400 hover:text-cyan-300"
        }`}
      >
        {t(tier.ctaKey)}
      </Link>
    </motion.div>
  );
}
