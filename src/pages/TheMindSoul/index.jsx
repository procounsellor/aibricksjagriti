// import React, { Suspense } from "react";
// import { Canvas } from "@react-three/fiber";
// import { OrbitControls } from "@react-three/drei";
// import { motion } from "framer-motion";
// import { useTranslation } from "react-i18next";
// import * as THREE from "three";
// import TheMindSoulScene from "./TheMindSoulScene";
// import { BACKGROUND_DARK_PURPLE } from "./colors";
// import { useReducedMotion } from "../../hooks/useReducedMotion";
// import { div } from "framer-motion/client";

// export default function TheMindSoulPage() {
//   const { t } = useTranslation();
//   const prefersReducedMotion = useReducedMotion();

//   return (
//     // <div>
//     <div className="fixed inset-0 w-full h-full">
//       <Canvas
//         camera={{ position: [0, 0, 8], fov: 50 }}
//         gl={{
//           antialias: true,
//           powerPreference: "high-performance",
//           toneMapping: THREE.ACESFilmicToneMapping,
//           toneMappingExposure: 1.0,
//         }}
//         dpr={[1, 2]}
//       >
//         <color attach="background" args={[BACKGROUND_DARK_PURPLE]} />
//         <ambientLight intensity={0.8} />
//         <fog attach="fog" args={[BACKGROUND_DARK_PURPLE, 10, 30]} />
//         <Suspense fallback={null}>
//           <TheMindSoulScene />
//         </Suspense>
//         <OrbitControls
//           enableZoom={false}
//           autoRotate={!prefersReducedMotion}
//           autoRotateSpeed={0.4}
//         />
//       </Canvas>
//       <div className="absolute top-0 left-0 flex flex-col items-center justify-center w-full h-full p-4 text-center pointer-events-none">
//         <motion.h2
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{
//             delay: prefersReducedMotion ? 0 : 0.2,
//             duration: prefersReducedMotion ? 0 : 0.5,
//           }}
//           className="text-5xl font-bold text-white md:text-7xl"
//         >
//           {t("mindSoulTitle")}
//         </motion.h2>
//         <motion.p
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{
//             delay: prefersReducedMotion ? 0 : 0.4,
//             duration: prefersReducedMotion ? 0 : 0.5,
//           }}
//           className="max-w-lg mt-4 text-xl text-gray-300"
//         >
//           {t("mindSoulDesc")}
//         </motion.p>
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{
//             delay: prefersReducedMotion ? 0 : 0.8,
//             duration: prefersReducedMotion ? 0 : 0.5,
//           }}
//           className="flex flex-col gap-4 mt-12 md:flex-row"
//         >
//           <div className="px-6 py-4 rounded-lg bg-black/30 backdrop-blur-sm">
//             <h3 className="font-semibold text-cyan-300">
//               {t("mindSoulFeature1")}
//             </h3>
//           </div>
//           <div className="px-6 py-4 rounded-lg bg-black/30 backdrop-blur-sm">
//             <h3 className="font-semibold text-cyan-300">
//               {t("mindSoulFeature2")}
//             </h3>
//           </div>
//           <div className="px-6 py-4 rounded-lg bg-black/30 backdrop-blur-sm">
//             <h3 className="font-semibold text-cyan-300">
//               {t("mindSoulFeature3")}
//             </h3>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// }

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload } from "@react-three/drei";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import * as THREE from "three";
import TheMindSoulScene from "./TheMindSoulScene";
import { BACKGROUND_DARK_PURPLE } from "./colors";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  useAdaptiveQuality,
  AdaptiveQualityMonitor,
} from "../../hooks/useAdaptiveQuality";

// This page's historical dpr cap is 2 — keep that as the top tier so
// full-quality visuals are unchanged; lower tiers step down from there.
const DPR_STEPS = [1, 1.1, 1.4, 2];

export default function TheMindSoulPage() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  // No composer on this page — the adaptive tier drives dpr only.
  const { dpr, onIncline, onDecline } = useAdaptiveQuality(DPR_STEPS);

  return (
    <div className="w-full bg-[#0b0420] text-white overflow-x-hidden">
      {/* ================= HERO / 3D SECTION ================= */}
      <div className="relative w-full h-screen">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
          dpr={dpr} // adaptive cap (starts at 2)
        >
          <color attach="background" args={[BACKGROUND_DARK_PURPLE]} />
          <ambientLight intensity={0.8} />
          <fog attach="fog" args={[BACKGROUND_DARK_PURPLE, 10, 30]} />
          <AdaptiveQualityMonitor onIncline={onIncline} onDecline={onDecline} />
          <Suspense fallback={null}>
            <TheMindSoulScene />
            <Preload all />
          </Suspense>
          <OrbitControls
            enableZoom={false}
            autoRotate={!prefersReducedMotion}
            autoRotateSpeed={0.4}
          />
        </Canvas>

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold md:text-7xl"
          >
            {t("mindSoulTitle")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-xl mt-4 text-xl text-gray-300"
          >
            {t("mindSoulDesc")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col gap-4 mt-10 md:flex-row"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="px-6 py-4 rounded-lg bg-black/30 backdrop-blur-sm"
              >
                <h3 className="font-semibold text-cyan-300">
                  {t(`mindSoulFeature${item}`)}
                </h3>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ================= PROJECT DETAILS SECTION ================= */}
      <section className="px-6 py-24 md:px-20 ">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <h3 className="mb-6 text-4xl font-bold text-cyan-300">
            Mindsoul Wellness — Project Overview
          </h3>

          <p className="mb-6 text-lg leading-relaxed text-gray-300">
            Mindsoul Wellness is a modern mental health and wellness platform
            designed to help users track emotional well-being, practice
            mindfulness, and build healthier daily habits through a calm and
            immersive digital experience.
          </p>

          <p className="mb-6 text-lg leading-relaxed text-gray-300">
            The project focuses heavily on user experience — from soothing color
            palettes and smooth animations to intuitive flows that reduce
            cognitive load and encourage consistent engagement.
          </p>

          <div className="grid gap-6 mt-10 md:grid-cols-3">
            <FeatureCard
              title="Mood Tracking"
              desc="Log emotions and habits daily to identify patterns and improve mental clarity."
            />
            <FeatureCard
              title="Mindfulness Tools"
              desc="Guided meditation and breathing exercises for stress reduction."
            />
            <FeatureCard
              title="Wellness Analytics"
              desc="Visual insights that help users understand long-term progress."
            />
          </div>
        </motion.div>
      </section>

      {/* ================= HIGHLIGHTS + LIVE LINK ================= */}
      <section className="px-6 py-16 md:px-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto text-center"
        >
          <h3 className="text-4xl font-bold text-cyan-300 mb-6">
            Why This Project Stands Out
          </h3>

          <p className="max-w-3xl mx-auto mb-8 text-lg leading-relaxed text-gray-300">
            Mindsoul Wellness is a purpose-driven mental health and wellness
            platform focused on helping individuals reconnect with their inner
            balance. The brand is built around mindfulness, emotional awareness,
            and holistic well-being — creating a safe digital space for
            reflection, growth, and healing.
          </p>

          <p className="max-w-3xl mx-auto mb-12 text-lg leading-relaxed text-gray-300">
            Through thoughtfully designed experiences, Mindsoul encourages users
            to slow down, understand their emotions, and develop healthier
            mental habits. The platform emphasizes simplicity, calm visuals, and
            guided self-care practices to support long-term wellness journeys.
          </p>

          {/* Brand Values */}
          <div className="grid gap-6 md:grid-cols-3 mb-14">
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur">
              <h4 className="mb-2 text-xl font-semibold text-cyan-300">
                Mindfulness First
              </h4>
              <p className="text-gray-400">
                Every experience is designed to promote awareness, presence, and
                emotional clarity.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 backdrop-blur">
              <h4 className="mb-2 text-xl font-semibold text-cyan-300">
                User-Centered Care
              </h4>
              <p className="text-gray-400">
                The platform prioritizes user comfort, accessibility, and
                emotional safety at every step.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 backdrop-blur">
              <h4 className="mb-2 text-xl font-semibold text-cyan-300">
                Holistic Growth
              </h4>
              <p className="text-gray-400">
                Mindsoul supports mental, emotional, and behavioral well-being
                through consistent, mindful practices.
              </p>
            </div>
          </div>

          {/* Live Link CTA */}
          <a
            href="https://mindsoul-wellness.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 text-lg font-semibold text-black transition rounded-full bg-cyan-300 hover:bg-cyan-200"
          >
            🌐 Explore Mindsoul Wellness
          </a>
        </motion.div>
      </section>
    </div>
  );
}

/* ================= REUSABLE FEATURE CARD ================= */
function FeatureCard({ title, desc }) {
  return (
    <div className="p-6 rounded-xl bg-white/5 backdrop-blur">
      <h4 className="mb-2 text-xl font-semibold text-cyan-300">{title}</h4>
      <p className="text-gray-400">{desc}</p>
    </div>
  );
}
