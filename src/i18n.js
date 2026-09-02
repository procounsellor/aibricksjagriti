import i18next from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      navHome: "Home",
      navAbout: "About Us",
      navAiBricks: "AiBricks",
      navProCounsel: "ProCounsel",
      navTheMindSoul: "TheMindSoul",
      headerMenuOpen: "Open menu",
      headerMenuClose: "Close menu",
      // ===== Home: hero =====
      heroTitleStart: "We build tomorrow's ",
      heroTitleAccent: "technology",
      heroTitleEnd: ", today.",
      homeSubtitle:
        "Devvo is a software studio shipping web platforms, AI products and mobile apps for teams that care about craft.",
      heroCtaPrimary: "Start a project",
      heroCtaSecondary: "Meet the team",
      homeScroll: "Scroll to explore",
      // ===== Home: stats =====
      statsHeading: "Key numbers",
      stat1Value: "3",
      stat1Label: "Products live",
      stat2Value: "50+",
      stat2Label: "Projects delivered",
      stat3Value: "24/7",
      stat3Label: "Support coverage",
      stat4Value: "2",
      stat4Label: "Countries served",
      // ===== Home: products =====
      productsEyebrow: "Products",
      productsTitle: "Three products. One standard.",
      productsSubtitle:
        "Software we design, build and run ourselves — proof of how we treat every client build.",
      productTagAiBricks: "AI Real Estate",
      productTagProCounsel: "Admission Counselling",
      productTagTheMindSoul: "Digital Wellness",
      exploreCta: "Explore {{name}}",
      // ===== Home: services teaser =====
      servicesEyebrow: "Services",
      servicesTitle: "Everything you need to ship",
      servicesSubtitle:
        "From first sketch to production and beyond — one team, end to end.",
      svcWebTitle: "Websites & Web Apps",
      svcWebDesc: "Fast, responsive sites and custom platforms.",
      svcAppTitle: "Mobile Apps",
      svcAppDesc: "Android & iOS apps that feel native.",
      svcAiTitle: "AI Solutions",
      svcAiDesc: "Chatbots, RAG assistants and custom ML.",
      svcCloudTitle: "Cloud & DevOps",
      svcCloudDesc: "Deploys, monitoring and infrastructure as code.",
      svcCareTitle: "Maintenance",
      svcCareDesc: "Updates, security patches and real SLAs.",
      svcDesignTitle: "Design",
      svcDesignDesc: "Brand, UI systems and product design sprints.",
      servicesCta: "View pricing",
      // ===== Home: why choose us =====
      whyEyebrow: "Why Devvo",
      whyChooseUs: "Why teams choose us",
      whyChooseUsSubtitle:
        "Technical excellence, delivered with the discipline of a product company.",
      innovationTitle: "Innovation First",
      innovationDescription:
        "Modern stacks and creative engineering that set new standards.",
      qualityTitle: "Premium Quality",
      qualityDescription:
        "Rigorous testing and detail obsession — nothing ships half-done.",
      supportTitle: "24/7 Support",
      supportDescription:
        "A dedicated team on call for every question and incident.",
      securityTitle: "Enterprise Security",
      securityDescription:
        "Bank-level encryption and international compliance standards.",
      // ===== Home: CTA band =====
      ctaEyebrow: "Get started",
      ctaTitle: "Ready to transform your business?",
      ctaSubtitle:
        "Tell us what you're building — we'll scope it with transparent pricing and a senior team.",
      ctaButton1: "See plans & pricing",
      ctaButton2: "Email us",
      // ===== Home: team =====
      teamEyebrow: "The team",
      teamTitle: "Built by founders",
      teamSubtitle:
        "Hands-on leadership on every project — no handoffs, no black boxes.",
      teamRoleFounderCeo: "Founder & CEO",
      teamMember1Name: "Ashutosh",
      teamMember2Name: "Ashwini Verma",
      aiBricksTitle: "aiBricks: The Future of Real Estate",
      aiBricksIntro:
        "From digital blueprints to virtual skylines, we are revolutionizing property tech.",
      aiBricksFeature1Title: "AI-Powered Real Estate, Simplified",
      aiBricksFeature1Desc:
        "AIBricks is a next-generation real estate platform that uses artificial intelligence to simplify online property buying. We analyze user preferences, market data, and behavioral insights to deliver highly personalized property recommendations — making every property decision smarter, faster, and more transparent. By combining advanced technology with real estate expertise, AIBricks bridges the gap between buyers and the right opportunities. Our platform continuously learns and adapts, ensuring that recommendations evolve with changing needs and market conditions, helping customers make confident, future-ready property choices.",
      aiBricksFeature2Title: "Intelligent Property Matching",
      aiBricksFeature2Desc:
        "At AIBricks, our AI engine goes beyond basic filters. It understands buyer intent by analyzing budget, location preference, property type, lifestyle needs, and long-term goals. This allows us to recommend properties that truly align with what customers are looking for — saving time, reducing confusion, and improving decision accuracy. Our intelligent system continuously learns from user interactions and market movements, refining its recommendations over time. As a result, buyers receive increasingly relevant options, ensuring a personalized property journey that feels intuitive, efficient, and aligned with their evolving needs.",
      aiBricksFinal: "Reach for the Sky.",
      proCounselTitle:
        "ProCounsel – Your Personal Admission Expert: The Student & Parent Guide",
      proCounselIntro:
        "Your personal admission expert — guiding students and parents through every step of the journey, from exam preparation to final seat allotment.",
      proCounselStart: "The Journey",
      proCounselEnd: "Success",
      mindSoulTitle: "theMindSoul: Digital Wellness",
      theMindSoulIntro:
        "Compassionate digital wellness for every mind — intelligent, accessible tools and a safe space to nurture your mental and emotional well-being.",
      mindSoulDesc:
        "Compassionate, accessible, and intelligent tools for mental and emotional well-being. We provide a safe space to grow.",
      mindSoulFeature1: "Personalized Journeys",
      mindSoulFeature2: "Interactive Activities",
      mindSoulFeature3: "Professional Support",
      // ===== Footer =====
      footerTagline:
        "A software studio building web, AI and mobile products from India for the world.",
      footerProductsHeading: "Products",
      footerCompanyHeading: "Company",
      footerContactHeading: "Contact",
      footerLinkedIn: "LinkedIn",
      footerTwitter: "X (Twitter)",
      footerRights: "© 2026 Devvo. All rights reserved.",
      footerPrivacy: "Privacy Policy",
      footerTerms: "Terms of Service",
      // ===== Pricing page =====
      navPricing: "Pricing",
      pricingHeroTitle: "Simple, Transparent Pricing",
      pricingHeroSubtitle:
        "One team — agency services and three products. Pick what fits where you are today, and scale whenever you're ready.",
      pricingChooseProduct: "Choose a product",
      pricingMostPopular: "Most Popular",
      pricingFreeForever: "free forever",
      pricingOneTime: "one-time",
      pricingPerMonth: "/month",
      pricingPerUserMonth: "/user/month",
      pricingCtaFree: "Start for Free",
      pricingCtaGet: "Get Started",
      pricingCtaTrial: "Start Free Trial",
      // AiBricks
      pricingAbTagline:
        "AI-powered real estate, priced for every step of the journey.",
      pricingAbExplorerName: "Explorer",
      pricingAbExplorerFeatures: [
        "Browse all property listings",
        "5 AI recommendations per month",
        "Basic budget & location matching",
        "Saved searches & alerts",
        "Email support",
      ],
      pricingAbSmartName: "Smart Buyer",
      pricingAbSmartPeriod: "one-time · valid 90 days",
      pricingAbSmartFeatures: [
        "Unlimited AI matches — budget, lifestyle & long-term goals",
        "Priority access to verified listings",
        "Side-by-side property comparison reports",
        "Locality insights: price trends, connectivity, schools",
        "Dedicated buying-assistant chat",
        "Shortlist sharing with family",
      ],
      pricingAbProName: "Pro / Broker",
      pricingAbProAlt: "or {{price}}/year — 2 months free",
      pricingAbProFeatures: [
        "AI lead-to-property matching engine",
        "Unlimited listings with featured placement",
        "Buyer-intent analytics dashboard",
        "CRM + WhatsApp integration",
        "Branded microsite for your agency",
        "Priority support",
      ],
      pricingAbNote1: "45-day money-back guarantee on Smart Buyer",
      pricingAbNote2: "Explorer stays free forever",
      // ProCounsel
      pricingPcTagline:
        "Admission counselling packages that cover one full cycle.",
      pricingPcStarterName: "Starter",
      pricingPcStarterFeatures: [
        "Psychometric assessment + detailed report",
        "1 one-on-one counselling session",
        "Stream & exam roadmap (JEE / NEET / boards)",
        "College & course shortlist",
        "Email support",
      ],
      pricingPcGuidedName: "Guided",
      pricingPcGuidedFeatures: [
        "Everything in Starter",
        "4 one-on-one sessions across the year",
        "Exam-prep & board-exam strategy",
        "Personalized college list with cutoff analysis",
        "Application & registration assistance",
        "Parent orientation session",
        "WhatsApp support",
      ],
      pricingPcCompleteName: "Complete Admission",
      pricingPcCompleteFeatures: [
        "Everything in Guided",
        "Dedicated counsellor for the full admission cycle",
        "Choice-filling strategy for every counselling round",
        "Document verification & registration handled end-to-end",
        "Seat-allotment & upgrade-round guidance",
        "Unlimited sessions till admission",
        "Priority phone support",
      ],
      pricingPcNote1: "Free first consultation",
      pricingPcNote2: "EMI available on Guided & Complete Admission",
      pricingPcNote3: "Extra sessions at ₹499 each",
      // TheMindSoul
      pricingMsTagline: "Wellness for every mind, at every budget.",
      pricingMsFreeName: "Free",
      pricingMsFreeFeatures: [
        "Mood tracking & daily check-ins",
        "1 personalized journey",
        "Limited activity library",
        "Community & self-help articles",
        "Crisis-resource directory",
      ],
      pricingMsPlusName: "Plus",
      pricingMsPlusAlt: "or {{price}}/year — save 44%",
      pricingMsPlusFeatures: [
        "All personalized journeys",
        "Full activity & meditation library",
        "Sleep stories & guided breathing",
        "Progress insights & streaks",
        "AI wellness companion chat",
        "Offline access",
      ],
      pricingMsProName: "Pro Care",
      pricingMsProFeatures: [
        "Everything in Plus",
        "2 live therapist sessions per month (extra sessions ₹799)",
        "Professional-reviewed care plan",
        "Priority chat with your therapist",
        "Family add-on account",
        "Quarterly well-being assessment report",
      ],
      pricingMsNote1: "14-day free trial on Plus",
      pricingMsNote2: "Cancel anytime",
      pricingMsNote3: "Student discount available",
      // FAQ
      pricingFaqTitle: "Frequently Asked Questions",
      pricingFaq1Q: "Can I switch or upgrade plans later?",
      pricingFaq1A:
        "Yes. You can upgrade at any time and pay only the difference for the remaining period. Downgrades take effect at the end of your current billing cycle or package.",
      pricingFaq2Q: "What payment methods do you accept?",
      pricingFaq2A:
        "We accept UPI, all major credit and debit cards, and net banking. EMI options are available on ProCounsel's Guided and Complete Admission packages.",
      pricingFaq3Q: "Do you offer refunds or trials?",
      pricingFaq3A:
        "AiBricks Smart Buyer comes with a 45-day money-back guarantee, and TheMindSoul Plus includes a 14-day free trial. ProCounsel's first consultation is always free, so you can try before you commit.",
      pricingCrossNote:
        "Planning to use more than one of our products? Write to us for bundled pricing across AiBricks, ProCounsel and TheMindSoul.",
      // ===== Pricing page: Services vs Product Plans sections =====
      pricingSectionServices: "Services",
      pricingSectionProducts: "Product Plans",
      pricingChooseSection: "Choose pricing type",
      // ===== Services pricing =====
      pricingSvcTagline:
        "Websites, apps, AI, cloud and growth — delivered by our team, with transparent USD pricing and INR equivalents.",
      pricingSvcChooseCategory: "Choose a service category",
      pricingSvcFrom: "from",
      pricingSvcHourlyBadge: "from {{usd}}/hr",
      pricingSvcHourlyInr: "{{inr}}/hr",
      pricingSvcInrEquiv: "≈ {{price}}",
      pricingSvcPlusMonthly: "+ {{usd}}/mo ({{inr}}/mo)",
      pricingSvcCtaQuote: "Get a Quote",
      // Trust strip
      pricingSvcTrust1: "30–50% advance with milestone payments",
      pricingSvcTrust2: "Free initial consultation",
      pricingSvcTrust3: "Prices exclude 18% GST for Indian clients",
      pricingSvcTrust4: "“Starting from” items are custom-quoted",
      // Website Development
      pricingSvcWebLabel: "Website Development",
      pricingSvcWebStarterName: "Starter Website",
      pricingSvcWebStarterFeatures: [
        "5-page website",
        "Fully responsive design",
        "Contact & WhatsApp form",
        "Basic SEO setup",
        "SSL + hosting setup",
        "1 month support",
      ],
      pricingSvcWebProName: "Business Pro",
      pricingSvcWebProFeatures: [
        "Up to 15 pages",
        "Custom design",
        "CMS + blog",
        "Analytics integration",
        "Speed optimization",
        "3 months support",
      ],
      pricingSvcWebCustomName: "E-commerce / Custom",
      pricingSvcWebCustomFeatures: [
        "Online store up to 100 products",
        "Payment gateway + shipping",
        "Admin dashboard",
        "6 months support",
      ],
      pricingSvcWebFootnote:
        "Custom web apps & SaaS from $2,999 (₹2,50,000) — custom quote.",
      // Mobile App Development
      pricingSvcAppLabel: "Mobile App Development",
      pricingSvcAppLiteName: "App Lite",
      pricingSvcAppLiteFeatures: [
        "Flutter cross-platform app",
        "Up to 8 screens",
        "Push notifications",
        "Play Store submission",
        "1 month support",
      ],
      pricingSvcAppGrowthName: "App Growth",
      pricingSvcAppGrowthFeatures: [
        "Android + iOS",
        "Authentication + user profiles",
        "Payment integration",
        "API + admin panel",
        "Analytics",
        "3 months support",
      ],
      pricingSvcAppScaleName: "App Scale",
      pricingSvcAppScaleFeatures: [
        "Marketplace / on-demand architecture",
        "Real-time chat & tracking",
        "Multi-role apps",
        "Cloud backend",
        "6 months support",
      ],
      // AI Services
      pricingSvcAiLabel: "AI Services",
      pricingSvcAiStarterName: "AI Chatbot Starter",
      pricingSvcAiStarterFeatures: [
        "GPT/Claude website chatbot",
        "Trained on your content",
        "Lead capture",
        "Human handoff",
        "Conversation analytics",
      ],
      pricingSvcAiAssistantName: "AI Business Assistant",
      pricingSvcAiAssistantFeatures: [
        "RAG knowledge-base bot (docs, PDFs, DB)",
        "WhatsApp + web channels",
        "CRM integration",
        "Ongoing retraining",
      ],
      pricingSvcAiCustomName: "Custom AI / ML",
      pricingSvcAiCustomFeatures: [
        "AI API integration into your product",
        "Custom ML & computer-vision models",
        "AI workflow automation",
        "Deployment + monitoring",
      ],
      // Cloud, Servers & DevOps
      pricingSvcCloudLabel: "Cloud, Servers & DevOps",
      pricingSvcCloudSetupName: "Hosting & Setup",
      pricingSvcCloudSetupFeatures: [
        "AWS / GCP / DigitalOcean server setup",
        "Domain, SSL & email setup",
        "App deployment",
        "Automated backups",
        "Security hardening",
      ],
      pricingSvcCloudManagedName: "Managed Cloud",
      pricingSvcCloudManagedFeatures: [
        "24/7 monitoring",
        "Patching & updates",
        "Backups + restore drills",
        "Cost optimization",
        "Monthly report",
      ],
      pricingSvcCloudDevopsName: "DevOps Retainer",
      pricingSvcCloudDevopsFeatures: [
        "CI/CD pipelines",
        "Infrastructure as code",
        "Autoscaling",
        "Security audits",
        "Dedicated engineer hours",
      ],
      pricingSvcCloudFootnote: "Cloud migration from $1,724 (₹1,50,000).",
      // Maintenance & Support
      pricingSvcCareLabel: "Maintenance & Support",
      pricingSvcCareBillingNote: "Annual billing ≈ 2 months free",
      pricingSvcCareBasicName: "Care Basic",
      pricingSvcCareBasicFeatures: [
        "Updates + backups",
        "Uptime monitoring",
        "Security patches",
        "2 hrs of changes/month",
      ],
      pricingSvcCarePlusName: "Care Plus",
      pricingSvcCarePlusFeatures: [
        "Everything in Care Basic",
        "8 hrs of dev time/month",
        "Performance optimization",
        "Monthly health report",
        "Priority support",
      ],
      pricingSvcCareProName: "Care Pro",
      pricingSvcCareProFeatures: [
        "E-commerce / web-app support",
        "20 hrs of dev time/month",
        "Feature enhancements",
        "SLA guarantee",
        "Dedicated manager",
      ],
      pricingSvcCareFootnote:
        "Annual maintenance for custom builds = 18% of project cost/year.",
      // Design & Marketing
      pricingSvcGrowthLabel: "Design & Marketing",
      pricingSvcDesignGroup: "Design",
      pricingSvcMarketingGroup: "Marketing",
      pricingSvcDesignLandingName: "Landing / Brand Design",
      pricingSvcDesignLandingFeatures: [
        "Landing page or brand identity kit",
        "2 design revisions",
        "Developer-ready handoff files",
      ],
      pricingSvcDesignUiName: "App / Web UI Design",
      pricingSvcDesignUiFeatures: [
        "Complete app or web UI in Figma",
        "Design system + components",
        "Clickable prototype",
        "Developer handoff",
      ],
      pricingSvcDesignSprintName: "Product Design Sprint",
      pricingSvcDesignSprintFeatures: [
        "End-to-end product design",
        "Research, UX flows & UI",
        "Prototype + user testing",
        "Ongoing design partnership",
      ],
      pricingSvcMktSeoName: "SEO Starter",
      pricingSvcMktSeoFeatures: [
        "On-page SEO + technical fixes",
        "Keyword research",
        "Monthly ranking report",
      ],
      pricingSvcMktGrowthName: "Growth",
      pricingSvcMktGrowthFeatures: [
        "SEO + content marketing",
        "Social media management",
        "Performance dashboard",
      ],
      pricingSvcMktFullName: "Full Digital",
      pricingSvcMktFullFeatures: [
        "SEO, content, social & ads",
        "Landing pages + funnels",
        "Dedicated growth manager",
      ],
      pricingSvcGrowthFootnote: "6-month minimum on marketing retainers.",
    },
  },
};

i18next.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18next;
