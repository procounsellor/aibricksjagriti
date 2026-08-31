import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import * as THREE from "three";

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

// Founder images
const founderImage =
  "https://images.unsplash.com/photo-1615109398623-88346a601842?fm=jpg&q=60&w=3000";

export default function HomePage() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  // Device-adaptive dpr cap (1.75 -> 1.4 -> 1.1 -> 1 on sustained low FPS)
  const { dpr, onIncline, onDecline } = useAdaptiveQuality();

  const products = Object.values(productsConfig).filter((p) => p.id !== "home");

  return (
    /* 🔑 REMOVE INTERNAL SCROLL – browser handles scrolling */
    <div className="relative w-full min-h-screen bg-gray-900 overflow-x-hidden">
      {/* ================= HERO SECTION ================= */}
      <div className="relative h-screen sm-h-[60vh] w-full overflow-hidden md:snap-start">
        {/* 3D Background */}
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

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: prefersReducedMotion ? 0 : 0.2,
              duration: prefersReducedMotion ? 0 : 0.5,
            }}
            className="text-5xl font-bold text-white md:text-7xl lg:text-8xl mt-10"
          >
            {t("homeTitle")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: prefersReducedMotion ? 0 : 0.4,
              duration: prefersReducedMotion ? 0 : 0.5,
            }}
            className="max-w-3xl mt-6 text-xl md:text-2xl text-white px-6 py-2 rounded-lg bg-black/30 backdrop-blur-sm"
          >
            {t("homeSubtitle")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: prefersReducedMotion ? 0 : 0.6,
              duration: prefersReducedMotion ? 0 : 0.5,
            }}
            className="max-w-4xl mt-4 text-base md:text-lg text-white px-6 py-2 rounded-lg bg-black/30 backdrop-blur-sm"
          >
            {t("homeDescription")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: prefersReducedMotion ? 0 : 0.8,
              duration: prefersReducedMotion ? 0 : 0.5,
            }}
            className="mt-8 flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider animate-bounce"
          >
            <span>{t("homeScroll")}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* ================= PRODUCTS ================= */}
      <section className="relative z-10 bg-gray-900 py-20 px-4 snap-start min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t("productsTitle")}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t("productsSubtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="pointer-events-auto"
              >
                <Link
                  to={`/${product.id}`}
                  className="block bg-gray-800 rounded-lg p-8 hover:bg-gray-750 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl border border-gray-700 hover:border-cyan-500 h-full"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      {t(product.labelKey).charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-2xl font-bold text-white ml-4">
                      {t(product.labelKey)}
                    </h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    {t(`${product.id}Intro`)}
                  </p>
                  <div className="mt-6 flex items-center text-cyan-400 font-medium">
                    <span>{t("exploreCta", { name: t(product.labelKey) })}</span>
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 py-20 px-4 md:snap-start min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t("whyChooseUs")}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t("whyChooseUsSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {["innovation", "quality", "support", "security"].map(
              (feature, i) => (
                <motion.div key={i} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                    {t(`${feature}Icon`)}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t(`${feature}Title`)}
                  </h3>
                  <p className="text-gray-400">{t(`${feature}Description`)}</p>
                </motion.div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ================= TEAM ================= */}
      <section className="bg-gradient-to-b from-gray-800 to-gray-900 px-4 py-24 md:snap-start min-h-screen">
        {/* <div className="max-w-7xl mx-auto"> */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="relative mb-24 py-24 md:py-32 px-6 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto relative min-h-[600px] md:min-h-[800px] lg:min-h-[900px]">
            {/* Large Centered Title - Behind Images */}
            <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
              <motion.h2
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black text-white leading-none tracking-tighter text-center px-4"
                style={{
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  fontWeight: 900,
                  lineHeight: "0.9",
                  letterSpacing: "-0.05em",
                }}
              >
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  OUR TEAM
                </motion.span>
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  OF
                </motion.span>
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  EXPERTS
                </motion.span>
              </motion.h2>
            </div>

            {/* Team Members - Absolutely Positioned Around Text (Desktop) */}
            <div className="relative z-10 hidden md:block min-h-[600px] md:min-h-[700px] lg:min-h-[800px]">
              {/* CEO Card 1 - Left Side, Overlapping Text */}
              <motion.div
                initial={{ opacity: 0, x: -200 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="absolute group hidden md:block md:left-[5%] md:top-[5%] md:w-[200px] lg:left-[6%] lg:top-[8%] lg:w-[250px] xl:w-[280px]"
                style={{
                  zIndex: 30,
                }}
              >
                <div
                  className="relative overflow-hidden transition-all duration-500"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-10px) scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                  }}
                >
                  {/* Team Member Image */}
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-800">
                    <img
                      src={founder}
                      alt="Founder & CEO"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Name and Title - Overlay Bottom Left */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                      <h3 className="text-white font-bold text-sm md:text-base mb-0.5 uppercase tracking-wider">
                        FOUNDER & CEO
                      </h3>
                      <p className="text-white/80 text-xs uppercase tracking-wider">
                        Ashutosh
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CEO Card 2 - Right Side, Overlapping Text */}
              <motion.div
                initial={{ opacity: 0, x: 200 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="absolute group hidden md:block md:right-[5%] md:top-[25%] md:w-[180px] lg:right-[7%] lg:top-[30%] lg:w-[230px] xl:w-[260px]"
                style={{
                  zIndex: 25,
                }}
              >
                <div
                  className="relative overflow-hidden transition-all duration-500"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-10px) scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                  }}
                >
                  {/* Team Member Image */}
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-800">
                    <img
                      src={founder1}
                      alt="Founder & CEO"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Name and Title - Overlay Bottom Left */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                      <h3 className="text-white font-bold text-sm md:text-base mb-0.5 uppercase tracking-wider">
                        FOUNDER & CEO
                      </h3>
                      <p className="text-white/80 text-xs uppercase tracking-wider">
                        Ashwini Verma
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CTO Card 1 - Left Side, Bottom */}
              {/* <motion.div
                initial={{ opacity: 0, x: -200 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="absolute group hidden md:block md:left-[10%] md:top-[65%] md:w-[180px] lg:left-[13%] lg:top-[70%] lg:w-[230px] xl:w-[260px]"
                style={{
                  zIndex: 20,
                }}
              >
                <div
                  className="relative overflow-hidden transition-all duration-500"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-10px) scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                  }}
                >
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-800">
                    <img
                      src={founderImage}
                      alt="Founder & CTO"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                      <h3 className="text-white font-bold text-sm md:text-base mb-0.5 uppercase tracking-wider">
                        FOUNDER & CTO
                      </h3>
                      <p className="text-white/80 text-xs uppercase tracking-wider">
                        Chief Technology Officer
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div> */}
            </div>

            {/* Team Members - Mobile/Tablet Grid Layout */}
            <div className="relative z-10 md:hidden grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-8 max-w-2xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
                className="group"
              >
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-800">
                  <img
                    src={founder}
                    alt="Founder & CEO"
                    className="w-full h-full object-cover"
                  />
                  {/* Name and Title - Overlay Bottom Left */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                    <h3 className="text-white font-bold text-sm mb-0.5 uppercase tracking-wider">
                      FOUNDER & CEO
                    </h3>
                    <p className="text-white/80 text-xs uppercase tracking-wider">
                      Ashutosh
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
                className="group"
              >
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-800">
                  <img
                    src={founder1}
                    alt="Founder & CEO"
                    className="w-full h-full object-cover"
                  />
                  {/* Name and Title - Overlay Bottom Left */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                    <h3 className="text-white font-bold text-sm mb-0.5 uppercase tracking-wider">
                      FOUNDER & CEO
                    </h3>
                    <p className="text-white/80 text-xs uppercase tracking-wider">
                      Ashwini Verma
                    </p>
                  </div>
                </div>
              </motion.div>
              {/* <motion.div
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
                className="group"
              >
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-800">
                  <img
                    src={founderImage}
                    alt="Founder & CTO"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                    <h3 className="text-white font-bold text-sm mb-0.5 uppercase tracking-wider">
                      FOUNDER & CTO
                    </h3>
                    <p className="text-white/80 text-xs uppercase tracking-wider">
                      Chief Technology Officer
                    </p>
                  </div>
                </div>
              </motion.div> */}
            </div>
          </div>
        </motion.div>
        {/* </div> */}
      </section>

      {/* ================= CTA ================= */}
      <section className="bg-gradient-to-r from-cyan-600 to-purple-600 py-20 px-4 md:snap-start min-h-screen flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t("ctaTitle")}
          </h2>
          <p className="text-xl text-white/90 mb-8">{t("ctaSubtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
            <a
              href="#contact"
              className="px-8 py-4 bg-white text-gray-900 rounded-lg font-bold text-lg"
            >
              {t("ctaButton1")}
            </a>
            <Link
              to="/aibricks"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg"
            >
              {t("ctaButton2")}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
