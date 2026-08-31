import {
  Globe,
  Smartphone,
  Bot,
  Cloud,
  Wrench,
  Palette,
  CreditCard,
  MessageCircle,
  Percent,
  FileText,
} from "lucide-react";

// Agency services pricing data.
// USD is the primary price (converted from INR at ~₹87 = $1, rounded to
// clean marketing price points); the INR equivalent is shown as secondary
// text. Prices and rates are literal data; every human-readable string is
// an i18n key resolved through react-i18next (see src/i18n.js).
//
// Tier shape (extends the product tier shape used by TierCard):
//   price        primary USD price (string, literal)
//   inrPrice     INR equivalent, rendered as a smaller secondary line
//   from         true → renders a "from" prefix before the price
//   monthlyUsd / monthlyInr   optional recurring add-on ("+ $X/mo (₹Y/mo)")
//   periodKey / popular / nameKey / featuresKey / ctaKey   as in pricing.js
export const SERVICES_ORDER = ["web", "app", "ai", "cloud", "care", "growth"];

export const SERVICES = {
  web: {
    id: "web",
    icon: Globe,
    labelKey: "pricingSvcWebLabel",
    hourlyUsd: "$20",
    hourlyInr: "₹1,700",
    tiers: [
      {
        id: "webStarter",
        nameKey: "pricingSvcWebStarterName",
        price: "$299",
        inrPrice: "₹24,999",
        periodKey: "pricingOneTime",
        featuresKey: "pricingSvcWebStarterFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
      {
        id: "webPro",
        nameKey: "pricingSvcWebProName",
        price: "$699",
        inrPrice: "₹59,999",
        periodKey: "pricingOneTime",
        popular: true,
        featuresKey: "pricingSvcWebProFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
      {
        id: "webCustom",
        nameKey: "pricingSvcWebCustomName",
        price: "$1,499",
        inrPrice: "₹1,25,000",
        from: true,
        periodKey: "pricingOneTime",
        featuresKey: "pricingSvcWebCustomFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
    ],
    footnoteKeys: ["pricingSvcWebFootnote"],
  },

  app: {
    id: "app",
    icon: Smartphone,
    labelKey: "pricingSvcAppLabel",
    hourlyUsd: "$25",
    hourlyInr: "₹2,200",
    tiers: [
      {
        id: "appLite",
        nameKey: "pricingSvcAppLiteName",
        price: "$1,749",
        inrPrice: "₹1,49,000",
        periodKey: "pricingOneTime",
        featuresKey: "pricingSvcAppLiteFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
      {
        id: "appGrowth",
        nameKey: "pricingSvcAppGrowthName",
        price: "$4,599",
        inrPrice: "₹3,99,000",
        periodKey: "pricingOneTime",
        popular: true,
        featuresKey: "pricingSvcAppGrowthFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
      {
        id: "appScale",
        nameKey: "pricingSvcAppScaleName",
        price: "$9,199",
        inrPrice: "₹8,00,000",
        from: true,
        periodKey: "pricingOneTime",
        featuresKey: "pricingSvcAppScaleFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
    ],
  },

  ai: {
    id: "ai",
    icon: Bot,
    labelKey: "pricingSvcAiLabel",
    hourlyUsd: "$35",
    hourlyInr: "₹3,000",
    tiers: [
      {
        id: "aiStarter",
        nameKey: "pricingSvcAiStarterName",
        price: "$579",
        inrPrice: "₹49,000",
        periodKey: "pricingOneTime",
        monthlyUsd: "$59",
        monthlyInr: "₹4,999",
        featuresKey: "pricingSvcAiStarterFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
      {
        id: "aiAssistant",
        nameKey: "pricingSvcAiAssistantName",
        price: "$1,999",
        inrPrice: "₹1,75,000",
        periodKey: "pricingOneTime",
        monthlyUsd: "$115",
        monthlyInr: "₹9,999",
        popular: true,
        featuresKey: "pricingSvcAiAssistantFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
      {
        id: "aiCustom",
        nameKey: "pricingSvcAiCustomName",
        price: "$4,599",
        inrPrice: "₹4,00,000",
        from: true,
        periodKey: "pricingOneTime",
        featuresKey: "pricingSvcAiCustomFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
    ],
  },

  cloud: {
    id: "cloud",
    icon: Cloud,
    labelKey: "pricingSvcCloudLabel",
    hourlyUsd: "$30",
    hourlyInr: "₹2,600",
    tiers: [
      {
        id: "cloudSetup",
        nameKey: "pricingSvcCloudSetupName",
        price: "$172",
        inrPrice: "₹14,999",
        periodKey: "pricingOneTime",
        featuresKey: "pricingSvcCloudSetupFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
      {
        id: "cloudManaged",
        nameKey: "pricingSvcCloudManagedName",
        price: "$229",
        inrPrice: "₹19,999",
        periodKey: "pricingPerMonth",
        popular: true,
        featuresKey: "pricingSvcCloudManagedFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
      {
        id: "cloudDevops",
        nameKey: "pricingSvcCloudDevopsName",
        price: "$689",
        inrPrice: "₹60,000",
        from: true,
        periodKey: "pricingPerMonth",
        featuresKey: "pricingSvcCloudDevopsFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
    ],
    footnoteKeys: ["pricingSvcCloudFootnote"],
  },

  care: {
    id: "care",
    icon: Wrench,
    labelKey: "pricingSvcCareLabel",
    hourlyUsd: "$18",
    hourlyInr: "₹1,550",
    noteKey: "pricingSvcCareBillingNote",
    tiers: [
      {
        id: "careBasic",
        nameKey: "pricingSvcCareBasicName",
        price: "$35",
        inrPrice: "₹2,999",
        periodKey: "pricingPerMonth",
        featuresKey: "pricingSvcCareBasicFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
      {
        id: "carePlus",
        nameKey: "pricingSvcCarePlusName",
        price: "$92",
        inrPrice: "₹7,999",
        periodKey: "pricingPerMonth",
        popular: true,
        featuresKey: "pricingSvcCarePlusFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
      {
        id: "carePro",
        nameKey: "pricingSvcCareProName",
        price: "$229",
        inrPrice: "₹19,999",
        periodKey: "pricingPerMonth",
        featuresKey: "pricingSvcCareProFeatures",
        ctaKey: "pricingSvcCtaQuote",
      },
    ],
    footnoteKeys: ["pricingSvcCareFootnote"],
  },

  growth: {
    id: "growth",
    icon: Palette,
    labelKey: "pricingSvcGrowthLabel",
    hourlyUsd: "$25",
    hourlyInr: "₹2,200",
    groups: [
      {
        id: "design",
        titleKey: "pricingSvcDesignGroup",
        tiers: [
          {
            id: "designLanding",
            nameKey: "pricingSvcDesignLandingName",
            price: "$399",
            inrPrice: "₹35,000",
            periodKey: "pricingOneTime",
            featuresKey: "pricingSvcDesignLandingFeatures",
            ctaKey: "pricingSvcCtaQuote",
          },
          {
            id: "designUi",
            nameKey: "pricingSvcDesignUiName",
            price: "$1,099",
            inrPrice: "₹95,000",
            periodKey: "pricingOneTime",
            popular: true,
            featuresKey: "pricingSvcDesignUiFeatures",
            ctaKey: "pricingSvcCtaQuote",
          },
          {
            id: "designSprint",
            nameKey: "pricingSvcDesignSprintName",
            price: "$2,299",
            inrPrice: "₹2,00,000",
            from: true,
            periodKey: "pricingOneTime",
            featuresKey: "pricingSvcDesignSprintFeatures",
            ctaKey: "pricingSvcCtaQuote",
          },
        ],
      },
      {
        id: "marketing",
        titleKey: "pricingSvcMarketingGroup",
        tiers: [
          {
            id: "mktSeo",
            nameKey: "pricingSvcMktSeoName",
            price: "$139",
            inrPrice: "₹12,000",
            periodKey: "pricingPerMonth",
            featuresKey: "pricingSvcMktSeoFeatures",
            ctaKey: "pricingSvcCtaQuote",
          },
          {
            id: "mktGrowth",
            nameKey: "pricingSvcMktGrowthName",
            price: "$345",
            inrPrice: "₹30,000",
            periodKey: "pricingPerMonth",
            featuresKey: "pricingSvcMktGrowthFeatures",
            ctaKey: "pricingSvcCtaQuote",
          },
          {
            id: "mktFull",
            nameKey: "pricingSvcMktFullName",
            price: "$689",
            inrPrice: "₹60,000",
            periodKey: "pricingPerMonth",
            featuresKey: "pricingSvcMktFullFeatures",
            ctaKey: "pricingSvcCtaQuote",
          },
        ],
      },
    ],
    footnoteKeys: ["pricingSvcGrowthFootnote"],
  },
};

// Trust strip shown under every service category.
export const SERVICES_TRUST = [
  { icon: CreditCard, key: "pricingSvcTrust1" },
  { icon: MessageCircle, key: "pricingSvcTrust2" },
  { icon: Percent, key: "pricingSvcTrust3" },
  { icon: FileText, key: "pricingSvcTrust4" },
];
