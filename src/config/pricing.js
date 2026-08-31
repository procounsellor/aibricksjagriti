import {
  ShieldCheck,
  Sparkles,
  Gift,
  CreditCard,
  PlusCircle,
  Clock,
  RefreshCcw,
  GraduationCap,
} from "lucide-react";

// Pricing data for all three products.
// Prices (₹ amounts) are literal data; every human-readable string is an
// i18n key resolved through react-i18next (see src/i18n.js).
export const PRICING_ORDER = ["aiBricks", "proCounsel", "theMindSoul"];

export const PRICING = {
  aiBricks: {
    id: "aiBricks",
    labelKey: "navAiBricks",
    taglineKey: "pricingAbTagline",
    tiers: [
      {
        id: "explorer",
        nameKey: "pricingAbExplorerName",
        price: "₹0",
        periodKey: "pricingFreeForever",
        featuresKey: "pricingAbExplorerFeatures",
        ctaKey: "pricingCtaFree",
      },
      {
        id: "smartBuyer",
        nameKey: "pricingAbSmartName",
        price: "₹1,999",
        periodKey: "pricingAbSmartPeriod",
        popular: true,
        featuresKey: "pricingAbSmartFeatures",
        ctaKey: "pricingCtaGet",
      },
      {
        id: "proBroker",
        nameKey: "pricingAbProName",
        price: "₹1,499",
        periodKey: "pricingPerUserMonth",
        altKey: "pricingAbProAlt",
        altPrice: "₹14,999",
        featuresKey: "pricingAbProFeatures",
        ctaKey: "pricingCtaGet",
      },
    ],
    notes: [
      { icon: ShieldCheck, key: "pricingAbNote1" },
      { icon: Sparkles, key: "pricingAbNote2" },
    ],
  },

  proCounsel: {
    id: "proCounsel",
    labelKey: "navProCounsel",
    taglineKey: "pricingPcTagline",
    tiers: [
      {
        id: "starter",
        nameKey: "pricingPcStarterName",
        price: "₹2,499",
        periodKey: "pricingOneTime",
        featuresKey: "pricingPcStarterFeatures",
        ctaKey: "pricingCtaGet",
      },
      {
        id: "guided",
        nameKey: "pricingPcGuidedName",
        price: "₹9,999",
        periodKey: "pricingOneTime",
        popular: true,
        featuresKey: "pricingPcGuidedFeatures",
        ctaKey: "pricingCtaGet",
      },
      {
        id: "complete",
        nameKey: "pricingPcCompleteName",
        price: "₹29,999",
        periodKey: "pricingOneTime",
        featuresKey: "pricingPcCompleteFeatures",
        ctaKey: "pricingCtaGet",
      },
    ],
    notes: [
      { icon: Gift, key: "pricingPcNote1" },
      { icon: CreditCard, key: "pricingPcNote2" },
      { icon: PlusCircle, key: "pricingPcNote3" },
    ],
  },

  theMindSoul: {
    id: "theMindSoul",
    labelKey: "navTheMindSoul",
    taglineKey: "pricingMsTagline",
    tiers: [
      {
        id: "free",
        nameKey: "pricingMsFreeName",
        price: "₹0",
        periodKey: "pricingFreeForever",
        featuresKey: "pricingMsFreeFeatures",
        ctaKey: "pricingCtaFree",
      },
      {
        id: "plus",
        nameKey: "pricingMsPlusName",
        price: "₹299",
        periodKey: "pricingPerMonth",
        altKey: "pricingMsPlusAlt",
        altPrice: "₹1,999",
        popular: true,
        featuresKey: "pricingMsPlusFeatures",
        ctaKey: "pricingCtaTrial",
      },
      {
        id: "proCare",
        nameKey: "pricingMsProName",
        price: "₹1,499",
        periodKey: "pricingPerMonth",
        featuresKey: "pricingMsProFeatures",
        ctaKey: "pricingCtaGet",
      },
    ],
    notes: [
      { icon: Clock, key: "pricingMsNote1" },
      { icon: RefreshCcw, key: "pricingMsNote2" },
      { icon: GraduationCap, key: "pricingMsNote3" },
    ],
  },
};
