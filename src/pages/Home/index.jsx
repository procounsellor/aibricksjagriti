import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import * as THREE from "three";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Cloud,
  Gem,
  GraduationCap,
  Headset,
  HeartPulse,
  Mail,
  Monitor,
  Palette,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";

import HomeScene from "./HomeScene";
import { BACKGROUND_BLACK } from "./colors";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  useAdaptiveQuality,
  AdaptiveQualityMonitor,
} from "../../hooks/useAdaptiveQuality";
import productsConfig from "../../config/products.json";

import founder from "../../assets/ashutosh-1.jpeg";
import founder1 from "../../assets/ashwini-1.jpeg";

/* ------------------------------------------------------------------ */
/* Per-product presentation meta (icons + accent styling)              */
/* ------------------------------------------------------------------ */
const PRODUCT_META = {
  aiBricks: {
    icon: Building2,
    tagKey: "productTagAiBricks",
    chip: "from-cyan-400/90 to-sky-500/90",
    text: "text-cyan-300",
    hoverBorder: "hover:border-cyan-400/50",
    hoverShadow: "hover:shadow-[0_0_50px_-12px_rgba(34,211,238,0.35)]",
    topLine: "via-cyan-400/70",
  },
  proCounsel: {
    icon: GraduationCap,
    tagKey: "productTagProCounsel",
    chip: "from-violet-400/90 to-indigo-500/90",
    text: "text-violet-300",
    hoverBorder: "hover:border-violet-400/50",
    hoverShadow: "hover:shadow-[0_0_50px_-12px_rgba(139,92,246,0.35)]",
    topLine: "via-violet-400/70",
  },
  theMindSoul: {
    icon: HeartPulse,
    tagKey: "productTagTheMindSoul",
    chip: "from-teal-400/90 to-emerald-500/90",
    text: "text-teal-300",
    hoverBorder: "hover:border-teal-400/50",
    hoverShadow: "hover:shadow-[0_0_50px_-12px_rgba(45,212,191,0.35)]",
    topLine: "via-teal-400/70",
  },
};

const SERVICES = [
  { key: "Web", titleKey: "svcWebTitle", descKey: "svcWebDesc", icon: Monitor },
  {
    key: "App",
    titleKey: "svcAppTitle",
    descKey: "svcAppDesc",
    icon: Smartphone,
  },
  { key: "Ai", titleKey: "svcAiTitle", descKey: "svcAiDesc", icon: Sparkles },
  {
    key: "Cloud",
    titleKey: "svcCloudTitle",
    descKey: "svcCloudDesc",
    icon: Cloud,
  },
  {
    key: "Care",
    titleKey: "svcCareTitle",
    descKey: "svcCareDesc",
    icon: Wrench,
  },
  {
    key: "Design",
    titleKey: "svcDesignTitle",
    descKey: "svcDesignDesc",
    icon: Palette,
  },
];

const WHY_ITEMS = [
  { key: "innovation", icon: Rocket, chip: "from-cyan-400 to-sky-600" },
  { key: "quality", icon: Gem, chip: "from-violet-400 to-fuchsia-600" },
  { key: "support", icon: Headset, chip: "from-teal-400 to-emerald-600" },
  { key: "security", icon: ShieldCheck, chip: "from-amber-400 to-orange-600" },
];

/* ------------------------------------------------------------------ */
/* Small shared building blocks                                        */
/* ------------------------------------------------------------------ */
function Reveal({ children, delay = 0, className }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={reduced ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, subtitle, align = "center" }) {
  const alignCls =
    align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <Reveal className={`flex flex-col ${alignCls} mb-12 md:mb-16`}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  // Device-adaptive dpr cap (1.75 -> 1.4 -> 1.1 -> 1 on sustained low FPS)
  const { dpr, onIncline, onDecline } = useAdaptiveQuality();

  const products = Object.values(productsConfig).filter((p) => p.id !== "home");

  const heroItem = (delay) => ({
    initial: prefersReducedMotion ? false : { opacity: 0, y: 22 },
    animate: prefersReducedMotion ? {} : { opacity: 1, y: 0 },
    transition: {
      delay: prefersReducedMotion ? 0 : delay,
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  });

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
    { value: t("stat4Value"), label: t("stat4Label") },
  ];

  const team = [
    { img: founder, name: t("teamMember1Name"), ring: "from-cyan-400 to-sky-600" },
    {
      img: founder1,
      name: t("teamMember2Name"),
      ring: "from-violet-400 to-fuchsia-600",
    },
  ];

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-ink-950 text-white">
      {/* ================= HERO ================= */}
      <section
        aria-label={t("heroTitleStart")}
        className="relative h-screen w-full overflow-hidden"
      >
        {/* 3D background — untouched wiring */}
        <div className="absolute inset-0 pointer-events-none md:pointer-events-auto">
          <Canvas
            camera={{ position: [0, 6.4, 16.5], fov: 62 }}
            gl={{
              antialias: false, // MSAA is wasted once the EffectComposer owns the target
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.15,
            }}
            dpr={dpr} // adaptive cap (starts at 1.75) with the bloom composer
          >
            <color attach="background" args={[BACKGROUND_BLACK]} />
            <AdaptiveQualityMonitor
              onIncline={onIncline}
              onDecline={onDecline}
            />
            <Suspense fallback={null}>
              <HomeScene />
              <Preload all />
            </Suspense>
          </Canvas>
        </div>

        {/* Readability scrims over the canvas */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/80 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent"
        />

        {/* Hero content */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
          <motion.h1
            {...heroItem(0.1)}
            className="max-w-5xl text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl"
          >
            {t("heroTitleStart")}
            <span className="text-gradient-brand">{t("heroTitleAccent")}</span>
            {t("heroTitleEnd")}
          </motion.h1>

          <motion.p
            {...heroItem(0.36)}
            className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg md:text-xl"
          >
            {t("homeSubtitle")}
          </motion.p>

          <motion.div
            {...heroItem(0.5)}
            className="pointer-events-auto mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          >
            <motion.span
              whileHover={prefersReducedMotion ? {} : { scale: 1.04 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="inline-flex"
            >
              <Link
                to="/pricing"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-7 py-3 text-sm font-semibold text-white shadow-glow-cyan transition-shadow duration-300 hover:shadow-glow-violet sm:text-base"
              >
                {t("heroCtaPrimary")}
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </motion.span>
            <motion.span
              whileHover={prefersReducedMotion ? {} : { scale: 1.04 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="inline-flex"
            >
              <Link
                to="/about-us"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-slate-200 backdrop-blur-md transition-colors duration-300 hover:border-white/40 hover:bg-white/[0.08] hover:text-white sm:text-base"
              >
                {t("heroCtaSecondary")}
              </Link>
            </motion.span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          {...heroItem(0.9)}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-7 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
            {t("homeScroll")}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-500 ${
              prefersReducedMotion ? "" : "animate-float-slow"
            }`}
          />
        </motion.div>
      </section>

      {/* ================= STATS BAR ================= */}
      <section
        aria-label={t("statsHeading")}
        className="relative border-y border-white/[0.06] bg-white/[0.02]"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal
              key={s.label}
              delay={prefersReducedMotion ? 0 : i * 0.07}
              className={`flex flex-col items-center gap-1 px-4 py-8 text-center ${
                i % 2 === 1 ? "border-l border-white/[0.06]" : ""
              } ${i === 2 ? "md:border-l md:border-white/[0.06]" : ""} ${
                i >= 2 ? "border-t border-white/[0.06] md:border-t-0" : ""
              }`}
            >
              <span className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                {s.value}
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                {s.label}
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section
        aria-label={t("productsTitle")}
        className="relative px-4 py-24 md:py-32"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] max-w-full -translate-x-1/2 rounded-full bg-cyan-500/[0.07] blur-[120px]"
        />
        <div className="relative mx-auto max-w-7xl">
          <SectionHeading
            eyebrow={t("productsEyebrow")}
            title={t("productsTitle")}
            subtitle={t("productsSubtitle")}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {products.map((product, index) => {
              const meta = PRODUCT_META[product.id] ?? PRODUCT_META.aiBricks;
              const Icon = meta.icon;
              return (
                <Reveal
                  key={product.id}
                  delay={prefersReducedMotion ? 0 : index * 0.12}
                >
                  <Link
                    to={`/${product.id}`}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 ${meta.hoverBorder} ${meta.hoverShadow}`}
                  >
                    {/* gradient top hairline */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent ${meta.topLine} to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
                    />
                    <div className="flex items-start justify-between">
                      <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${meta.chip} text-white shadow-lg`}
                      >
                        <Icon aria-hidden="true" className="h-6 w-6" />
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-5 w-5 text-slate-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-300"
                      />
                    </div>
                    <span
                      className={`mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] ${meta.text}`}
                    >
                      {t(meta.tagKey)}
                    </span>
                    <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-white">
                      {t(product.labelKey)}
                    </h3>
                    <p className="mt-3 flex-grow text-sm leading-relaxed text-slate-400">
                      {t(`${product.id}Intro`)}
                    </p>
                    <span
                      className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${meta.text}`}
                    >
                      {t("exploreCta", { name: t(product.labelKey) })}
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SERVICES TEASER ================= */}
      <section
        aria-label={t("servicesTitle")}
        className="relative border-t border-white/[0.06] px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow={t("servicesEyebrow")}
            title={t("servicesTitle")}
            subtitle={t("servicesSubtitle")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <Reveal key={svc.key} delay={prefersReducedMotion ? 0 : i * 0.06}>
                  <div className="group flex h-full items-start gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors duration-300 hover:border-white/[0.16] hover:bg-white/[0.05]">
                    <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-cyan-300 transition-colors duration-300 group-hover:border-cyan-400/40 group-hover:text-cyan-200">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {t(svc.titleKey)}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">
                        {t(svc.descKey)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.1} className="mt-10 flex justify-center">
            <Link
              to="/pricing"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
            >
              {t("servicesCta")}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section
        aria-label={t("whyChooseUs")}
        className="relative border-t border-white/[0.06] px-4 py-24 md:py-32"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-24 h-[360px] w-[520px] max-w-full rounded-full bg-violet-500/[0.06] blur-[120px]"
        />
        <div className="relative mx-auto max-w-7xl">
          <SectionHeading
            eyebrow={t("whyEyebrow")}
            title={t("whyChooseUs")}
            subtitle={t("whyChooseUsSubtitle")}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.key} delay={prefersReducedMotion ? 0 : i * 0.08}>
                  <div className="group h-full rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition-colors duration-300 hover:border-white/[0.16]">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.chip} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-white">
                      {t(`${item.key}Title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {t(`${item.key}Description`)}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= TEAM ================= */}
      <section
        aria-label={t("teamTitle")}
        className="relative border-t border-white/[0.06] px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow={t("teamEyebrow")}
            title={t("teamTitle")}
            subtitle={t("teamSubtitle")}
          />

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2">
            {team.map((member, i) => (
              <Reveal key={member.name} delay={prefersReducedMotion ? 0 : i * 0.12}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-white/[0.18] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]">
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-6 top-0 z-10 h-px bg-gradient-to-r from-transparent ${
                      i === 0 ? "via-cyan-400/70" : "via-violet-400/70"
                    } to-transparent`}
                  />
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={member.img}
                      alt={`${member.name} — ${t("teamRoleFounderCeo")}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink-950/95 via-ink-950/40 to-transparent"
                    />
                  </div>
                  <div className="relative -mt-10 px-6 pb-6">
                    <p
                      className={`bg-gradient-to-r ${member.ring} bg-clip-text text-[11px] font-semibold uppercase tracking-[0.18em] text-transparent`}
                    >
                      {t("teamRoleFounderCeo")}
                    </p>
                    <h3 className="mt-1 text-xl font-bold tracking-tight text-white">
                      {member.name}
                    </h3>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA BAND ================= */}
      <section aria-label={t("ctaTitle")} className="px-4 pb-24 pt-8 md:pb-32">
        <Reveal className="mx-auto max-w-6xl">
          <div className="bg-grid-faint relative overflow-hidden rounded-3xl border border-white/[0.1] bg-ink-900 px-6 py-16 text-center sm:px-12 md:py-24">
            {/* radial glows */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] max-w-none -translate-x-1/2 rounded-full bg-cyan-500/[0.14] blur-[110px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-40 right-[-10%] h-[360px] w-[520px] rounded-full bg-violet-500/[0.14] blur-[110px]"
            />
            <div
              aria-hidden="true"
              className="bg-noise-faint pointer-events-none absolute inset-0"
            />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">
                {t("ctaEyebrow")}
              </span>
              <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("ctaTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">
                {t("ctaSubtitle")}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <motion.span
                  whileHover={prefersReducedMotion ? {} : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="inline-flex"
                >
                  <Link
                    to="/pricing"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-7 py-3 text-sm font-semibold text-white shadow-glow-cyan transition-shadow duration-300 hover:shadow-glow-violet sm:text-base"
                  >
                    {t("ctaButton1")}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                </motion.span>
                <motion.span
                  whileHover={prefersReducedMotion ? {} : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="inline-flex"
                >
                  <a
                    href="mailto:hello@devvo.in"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-slate-200 transition-colors duration-300 hover:border-white/40 hover:bg-white/[0.08] hover:text-white sm:text-base"
                  >
                    <Mail aria-hidden="true" className="h-4 w-4" />
                    {t("ctaButton2")}
                  </a>
                </motion.span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
