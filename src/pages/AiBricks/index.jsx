// import React, { Suspense } from "react";
// import { Canvas } from "@react-three/fiber";
// import { Html, ScrollControls } from "@react-three/drei";
// import { motion } from "framer-motion";
// import { useTranslation } from "react-i18next";
// import * as THREE from "three";
// import AiBricksScene from "./AiBricksScene";
// import colors from "./colors";
// import { useReducedMotion } from "../../hooks/useReducedMotion";

// /**
//  * AiBricks Page - Real estate development and construction
//  */
// export default function AiBricksPage() {
//   const { t } = useTranslation();
//   const numPages = 5;
//   const prefersReducedMotion = useReducedMotion();

//   return (
//     <div className="fixed inset-0 w-full h-full">
//       <Canvas
//         camera={{ position: [0, 20, 28], fov: 75 }}
//         shadows
//         gl={{
//           antialias: true,
//           alpha: false,
//           powerPreference: "high-performance",
//           toneMapping: THREE.ACESFilmicToneMapping,
//           toneMappingExposure: 1.5,
//         }}
//         dpr={[1, 2]}
//       >
//         <color attach="background" args={[colors.sky]} />
//         <fog attach="fog" args={[colors.sky, 30, 120]} />
//         <Suspense fallback={null}>
//           <ScrollControls
//             pages={numPages}
//             damping={prefersReducedMotion ? 1 : 0.2}
//           >
//             <AiBricksScene />
//             <Html fullscreen style={{ pointerEvents: "none", color: "white" }}>
//               {/* Hero Section */}
//               <div
//                 className="flex flex-col items-center justify-center w-full h-screen p-4 text-center"
//                 style={{ top: "0vh" }}
//               >
//                 <motion.h2
//                   initial={{ opacity: 0 }}
//                   whileInView={{ opacity: 1 }}
//                   viewport={{ amount: 0.5 }}
//                   transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
//                   className="text-4xl font-bold md:text-6xl"
//                 >
//                   {t("aiBricksTitle")}
//                 </motion.h2>
//                 <motion.p
//                   initial={{ opacity: 0 }}
//                   whileInView={{ opacity: 1 }}
//                   transition={{
//                     delay: prefersReducedMotion ? 0 : 0.2,
//                     duration: prefersReducedMotion ? 0 : 0.8,
//                   }}
//                   viewport={{ amount: 0.5 }}
//                   className="max-w-lg mt-4 text-lg text-black px-6 py-4 rounded-lg bg-white/40 backdrop-blur-sm"
//                 >
//                   {t("aiBricksIntro")}
//                 </motion.p>
//                 <a
//                   href="https://www.aibricksrealtors.com/"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   style={{ pointerEvents: "auto" }}
//                   className="inline-block px-8 py-4 text-lg font-semibold text-white transition rounded-full bg-lime-900 hover:bg-lime-800 mt-8 cursor-pointer"
//                 >
//                   🌐 Explore AiBricks
//                 </a>
//               </div>

//               {/* Feature 1 */}
//               <div
//                 className="flex items-center w-full h-screen"
//                 style={{ top: `${100 * (numPages / 5)}vh` }}
//               >
//                 <div className="w-1/2 p-8 ml-auto">
//                   <motion.h3
//                     initial={{ opacity: 0, x: 20 }}
//                     whileInView={{ opacity: 1, x: 0 }}
//                     transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
//                     className="text-3xl font-semibold text-white px-6 py-4 rounded-lg bg-black/40 backdrop-blur-sm"
//                   >
//                     {t("aiBricksFeature1Title")}
//                   </motion.h3>
//                   <motion.p
//                     initial={{ opacity: 0, x: 20 }}
//                     whileInView={{ opacity: 1, x: 0 }}
//                     transition={{
//                       delay: prefersReducedMotion ? 0 : 0.2,
//                       duration: prefersReducedMotion ? 0 : 0.6,
//                     }}
//                     className="mt-2 text-black px-6 py-4 rounded-lg bg-white/40 backdrop-blur-sm"
//                   >
//                     {t("aiBricksFeature1Desc")}
//                   </motion.p>
//                 </div>
//               </div>

//               {/* Feature 2 */}
//               <div
//                 className="flex items-center w-full h-screen"
//                 style={{ top: `${200 * (numPages / 5)}vh` }}
//               >
//                 <div className="w-1/2 p-8 mr-auto">
//                   <motion.h3
//                     initial={{ opacity: 0, x: -20 }}
//                     whileInView={{ opacity: 1, x: 0 }}
//                     transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
//                     className="text-3xl font-semibold text-white px-6 py-4 rounded-lg bg-black/40 backdrop-blur-sm"
//                   >
//                     {t("aiBricksFeature2Title")}
//                   </motion.h3>
//                   <motion.p
//                     initial={{ opacity: 0, x: -20 }}
//                     whileInView={{ opacity: 1, x: 0 }}
//                     transition={{
//                       delay: prefersReducedMotion ? 0 : 0.2,
//                       duration: prefersReducedMotion ? 0 : 0.6,
//                     }}
//                     className="mt-2 text-black px-6 py-4 rounded-lg bg-white/40 backdrop-blur-sm"
//                   >
//                     {t("aiBricksFeature2Desc")}
//                   </motion.p>
//                 </div>
//               </div>

//               {/* Feature 3 - Sustainability */}
//               <div
//                 className="flex items-center w-full h-screen"
//                 style={{ top: `${300 * (numPages / 5)}vh` }}
//               >
//                 <div className="w-1/2 p-8 ml-auto">
//                   <motion.h3
//                     initial={{ opacity: 0, x: 20 }}
//                     whileInView={{ opacity: 1, x: 0 }}
//                     transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
//                     className="text-3xl font-semibold text-white px-6 py-4 rounded-lg bg-black/40 backdrop-blur-sm"
//                   >
//                     Powered by Data, Driven by Trust
//                   </motion.h3>
//                   <motion.p
//                     initial={{ opacity: 0, x: 20 }}
//                     whileInView={{ opacity: 1, x: 0 }}
//                     transition={{
//                       delay: prefersReducedMotion ? 0 : 0.2,
//                       duration: prefersReducedMotion ? 0 : 0.6,
//                     }}
//                     className="mt-2 text-black px-6 py-4 rounded-lg bg-white/40 backdrop-blur-sm"
//                   >
//                     Our platform leverages real-time market trends, pricing
//                     analytics, and location intelligence to provide clear
//                     insights into every property. AIBricks ensures buyers
//                     understand value, growth potential, and market positioning —
//                     enabling confident decisions backed by accurate data. By
//                     presenting complex data in a simple and transparent manner,
//                     AIBricks removes uncertainty from the buying process. Buyers
//                     gain a complete understanding of market dynamics, helping
//                     them compare options effectively and invest with confidence
//                     in properties that offer long-term value.
//                   </motion.p>
//                 </div>
//               </div>

//               {/* Final Section */}
//               <div
//                 className="flex flex-col items-center justify-center w-full h-screen p-4 text-center"
//                 style={{ top: `${400 * (numPages / 5)}vh` }}
//               >
//                 <motion.h2
//                   initial={{ opacity: 0, scale: 0.5 }}
//                   whileInView={{ opacity: 1, scale: 1 }}
//                   transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
//                   className="text-4xl font-bold md:text-6xl"
//                 >
//                   {t("aiBricksFinal")}
//                 </motion.h2>
//               </div>
//             </Html>
//           </ScrollControls>
//         </Suspense>
//       </Canvas>
//     </div>
//   );
// }

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, Preload, ScrollControls } from "@react-three/drei";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import * as THREE from "three";
import AiBricksScene from "./AiBricksScene";
import { PostFX } from "./components";
import colors from "./colors";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  useAdaptiveQuality,
  AdaptiveQualityMonitor,
} from "../../hooks/useAdaptiveQuality";

// This page's historical dpr cap is 1.5 — keep that as the top tier so
// full-quality visuals are unchanged; lower tiers step down from there.
const DPR_STEPS = [1, 1.1, 1.3, 1.5];

export default function AiBricksPage() {
  const { t } = useTranslation();
  const numPages = 5;
  const prefersReducedMotion = useReducedMotion();
  // Device-adaptive dpr cap; PostFX also reads the tier for bloom cost.
  const { dpr, onIncline, onDecline } = useAdaptiveQuality(DPR_STEPS);
  // Loading veil: the three.js chunk is large, so on slow networks the canvas
  // area would otherwise sit as a black void with no feedback.
  const [sceneReady, setSceneReady] = useState(false);

  // WebGL context-loss handling - preventDefault allows the browser to
  // restore the context instead of leaving a dead canvas
  const glCleanupRef = useRef(null);
  useEffect(
    () => () => {
      if (glCleanupRef.current) glCleanupRef.current();
      glCleanupRef.current = null;
    },
    []
  );

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Loading veil — covers the canvas until the WebGL scene is up */}
      <div
        aria-hidden={sceneReady}
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#1a1206] via-[#2b1d0e] to-[#0c0804] transition-opacity duration-700 ${
          sceneReady ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" />
        <p className="text-sm font-medium tracking-[0.2em] text-amber-100/80 uppercase">
          {t("aiBricksTitle")}
        </p>
      </div>
      <Canvas
        camera={{ position: [0, 20, 28], fov: 75 }}
        shadows
        dpr={dpr} // adaptive cap (starts at 1.5) — reduce load for mobile
        gl={{
          antialias: false, // MSAA is wasted once the EffectComposer owns the target
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          const handleContextLost = (event) => {
            event.preventDefault();
          };
          canvas.addEventListener("webglcontextlost", handleContextLost, false);
          glCleanupRef.current = () => {
            canvas.removeEventListener("webglcontextlost", handleContextLost, false);
          };
          // Give the first frames a beat to compile before lifting the veil.
          setTimeout(() => setSceneReady(true), 400);
        }}
      >
        <color attach="background" args={[colors.sky]} />
        <fog attach="fog" args={[colors.sky, 30, 120]} />
        <AdaptiveQualityMonitor onIncline={onIncline} onDecline={onDecline} />

        <Suspense fallback={null}>
          <ScrollControls
            pages={numPages}
            damping={prefersReducedMotion ? 1 : 0.15}
          >
            <AiBricksScene />

            <Html fullscreen style={{ pointerEvents: "none" }}>
              {/* HERO */}
              <section className="flex flex-col items-center justify-center w-full h-screen px-4 text-center">
                {/* The hero is always in view on load — animate on mount, never
                    gate it behind an IntersectionObserver inside the portal. */}
                <motion.h2
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                  className="text-2xl font-bold sm:text-3xl md:text-5xl lg:text-6xl"
                >
                  {t("aiBricksTitle")}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="max-w-xl mt-4 text-sm sm:text-base md:text-lg text-black px-4 py-3 rounded-lg bg-white/40 backdrop-blur-sm"
                >
                  {t("aiBricksIntro")}
                </motion.p>

                <a
                  href="https://www.aibricksrealtors.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ pointerEvents: "auto" }}
                  className="inline-block px-6 py-3 mt-6 text-sm font-semibold text-white transition rounded-full sm:text-base bg-lime-900 hover:bg-lime-800"
                >
                  🌐 Explore AiBricks
                </a>
              </section>

              {/* FEATURE 1 */}
              <section
                className="flex items-center justify-center w-full h-screen px-4"
                style={{ top: `${100 * (numPages / 5)}vh` }}
              >
                <div className="w-full max-w-2xl text-center md:text-left md:ml-auto">
                  <motion.h3 className="text-xl font-semibold sm:text-2xl md:text-3xl text-white px-4 py-3 rounded-lg bg-black/40 backdrop-blur-sm">
                    {t("aiBricksFeature1Title")}
                  </motion.h3>

                  <motion.p className="mt-3 text-sm sm:text-base text-black px-4 py-3 rounded-lg bg-white/40 backdrop-blur-sm">
                    {t("aiBricksFeature1Desc")}
                  </motion.p>
                </div>
              </section>

              {/* FEATURE 2 */}
              <section
                className="flex items-center justify-center w-full h-screen px-4"
                style={{ top: `${200 * (numPages / 5)}vh` }}
              >
                <div className="w-full max-w-2xl text-center md:text-left md:mr-auto">
                  <motion.h3 className="text-xl font-semibold sm:text-2xl md:text-3xl text-white px-4 py-3 rounded-lg bg-black/40 backdrop-blur-sm">
                    {t("aiBricksFeature2Title")}
                  </motion.h3>

                  <motion.p className="mt-3 text-sm sm:text-base text-black px-4 py-3 rounded-lg bg-white/40 backdrop-blur-sm">
                    {t("aiBricksFeature2Desc")}
                  </motion.p>
                </div>
              </section>

              {/* FEATURE 3 */}
              <section
                className="flex items-center justify-center w-full h-screen px-4"
                style={{ top: `${300 * (numPages / 5)}vh` }}
              >
                <div className="w-full max-w-2xl text-center md:text-left md:ml-auto">
                  <motion.h3 className="text-xl font-semibold sm:text-2xl md:text-3xl text-white px-4 py-3 rounded-lg bg-black/40 backdrop-blur-sm">
                    Powered by Data, Driven by Trust
                  </motion.h3>

                  <motion.p className="mt-3 text-sm sm:text-base text-black px-4 py-3 rounded-lg bg-white/40 backdrop-blur-sm">
                    Our platform leverages real-time market trends, pricing
                    analytics, and location intelligence to provide clear
                    insights into every property. AIBricks ensures buyers
                    understand value, growth potential, and market positioning —
                    enabling confident decisions backed by accurate data. By
                    presenting complex data in a simple and transparent manner,
                    AIBricks removes uncertainty from the buying process. Buyers
                    gain a complete understanding of market dynamics, helping
                    them compare options effectively and invest with confidence
                    in properties that offer long-term value.
                  </motion.p>
                </div>
              </section>

              {/* FINAL */}
              <section
                className="flex flex-col items-center justify-center w-full h-screen px-4 text-center"
                style={{ top: `${400 * (numPages / 5)}vh` }}
              >
                <motion.h2 className="text-2xl font-bold sm:text-3xl md:text-5xl lg:text-6xl">
                  {t("aiBricksFinal")}
                </motion.h2>
              </section>
            </Html>
          </ScrollControls>

          {/* Real bloom + vignette + night grain */}
          <PostFX reducedMotion={prefersReducedMotion} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
