import React, { Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import ProCounselScene from "./ProCounselScene";
import { BACKGROUND_DARK } from "./colors";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  useAdaptiveQuality,
  AdaptiveQualityMonitor,
} from "../../hooks/useAdaptiveQuality";
import { OverlayText } from "./components/OverlayText";
import ProCounselLoader from "./components/ProCounselLoader";

// TODO: Replace with actual logo path when available
// import proCounselLogo from '../../assets/procounsel/logo.png';
const proCounselLogo = null; // Placeholder - replace with actual logo import

// Founder images
const founderImage =
  "https://images.unsplash.com/photo-1615109398623-88346a601842?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFufGVufDB8fDB8fHww";

export default function ProCounselPage() {
  const numPages = 10; // Match the number of sections (1 intro + 9 pillars)
  const prefersReducedMotion = useReducedMotion();
  // Device-adaptive dpr cap (1.75 -> 1.4 -> 1.1 -> 1 on sustained low FPS);
  // PostFX also reads the tier to drop ChromaticAberration / bloom levels.
  const { dpr, onIncline, onDecline } = useAdaptiveQuality();
  // Mutable scroll progress - read imperatively by useFrame callbacks and the
  // overlay, so scrolling never re-renders the React scene tree.
  const scrollProgressRef = useRef(0);
  // Coarse state for the About section reveal - only flips at the boundary.
  const [reachedEnd, setReachedEnd] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const canvasRef = useRef(null);

  // Hide loader after initial load
  useEffect(() => {
    const startTime = Date.now();
    const minimumLoadTime = 3000; // Minimum 3 seconds to show loader
    let hideTimer = null;

    // Function to hide loader, respecting minimum time
    const hideLoader = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minimumLoadTime - elapsed);

      hideTimer = setTimeout(() => {
        setIsLoading(false);
      }, remaining);
    };

    // Check if page is already loaded
    if (document.readyState === "complete") {
      hideLoader();
    } else {
      // Wait for page load
      window.addEventListener("load", hideLoader, { once: true });
    }

    // Fallback: hide after maximum time (5 seconds) if something goes wrong
    const maxTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      clearTimeout(maxTimer);
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener("load", hideLoader);
    };
  }, []);

  // Calculate scroll progress from window scroll and keep canvas fixed.
  // Layout reads (offsetTop / innerHeight) are cached and refreshed only on
  // resize — the per-scroll-frame path reads scrollTop only (no forced
  // layout) and touches canvas styles only when the fixed/absolute state
  // actually flips.
  useEffect(() => {
    const layout = { containerTop: 0, scrollAreaHeight: 1 };
    let canvasMode = null; // "fixed" | "released" | null (null = force rewrite)

    const measure = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      layout.containerTop = container.offsetTop;
      layout.scrollAreaHeight = numPages * window.innerHeight;
    };

    const applyCanvasMode = (mode) => {
      const canvas = canvasRef.current;
      if (!canvas || mode === canvasMode) return;
      canvasMode = mode;
      if (mode === "fixed") {
        // Canvas stays fixed during the journey
        canvas.style.position = "fixed";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.right = "0";
        canvas.style.zIndex = "1";
      } else {
        // After student reaches end, allow canvas to scroll away and show About section
        canvas.style.position = "absolute";
        canvas.style.top = `${layout.scrollAreaHeight}px`;
        canvas.style.zIndex = "0";
      }
    };

    const handleScroll = () => {
      if (!scrollContainerRef.current || !canvasRef.current) return;
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Calculate scroll progress - only allow scrolling within the scroll area
      const scrollWithinArea = Math.max(0, scrollTop - layout.containerTop);
      const progress = Math.min(
        1,
        Math.max(0, scrollWithinArea / layout.scrollAreaHeight)
      );
      scrollProgressRef.current = progress;
      // Boolean state only changes at the boundary, so React bails out of
      // re-rendering on every other scroll frame.
      setReachedEnd(progress >= 1);

      // Keep canvas fixed at top until student reaches the end (progress = 1)
      applyCanvasMode(progress < 1 ? "fixed" : "released");
    };

    // Use requestAnimationFrame for smoother updates
    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        handleScroll();
        rafId = null;
      });
    };
    const onResize = () => {
      measure();
      canvasMode = null; // geometry changed - rewrite styles with fresh values
      handleScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    measure();
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [numPages]);

  return (
    <div
      ref={scrollContainerRef}
      className="relative w-full"
      style={{
        minHeight: `${(numPages + 1) * 100}vh`,
        position: "relative",
      }}
    >
      {/* 3D Canvas Section - Fixed during scroll pages, then scrolls away */}
      <div
        ref={canvasRef}
        style={{
          height: "100vh",
          width: "100%",
          zIndex: 1,
          position: "relative",
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        <Canvas
          camera={{ position: [0, 5, 15], fov: 60 }}
          shadows
          gl={{
            // MSAA off: the scene renders through the PostFX EffectComposer
            // (half-float bloom chain), which supersedes canvas antialiasing.
            antialias: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          // Adaptive cap (starts at 1.75): bloom is the big per-pixel cost.
          dpr={dpr}
        >
          <color attach="background" args={[BACKGROUND_DARK]} />
          <fog attach="fog" args={[BACKGROUND_DARK, 28, 95]} />
          <AdaptiveQualityMonitor onIncline={onIncline} onDecline={onDecline} />
          <Suspense fallback={null}>
            <ProCounselScene scrollRef={scrollProgressRef} />
            <Preload all />
          </Suspense>
        </Canvas>

        {/* Fixed overlay text - nine sections that move up on scroll */}
        <OverlayText
          scrollProgressRef={scrollProgressRef}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Loader overlay - shows while loading */}
      {isLoading && <ProCounselLoader />}

      {/* Spacer to create scroll space for the 3D scene - this allows the sticky canvas to work */}
      <div className="relative" style={{ height: `${numPages * 100}vh` }} />

      {/* About Us Section - scrolls up after student reaches the end (scrollProgress = 1) */}
      <section
        className="relative w-full min-h-screen py-20 px-6"
        style={{
          zIndex: reachedEnd ? 10 : 0,
          position: "relative",
          background: "linear-gradient(to bottom, #f8fafc, #ffffff)",
          marginTop: 0,
          minHeight: "100vh",
          transform: reachedEnd ? "translateY(0)" : `translateY(${100}vh)`,
          opacity: reachedEnd ? 1 : 0,
          visibility: reachedEnd ? "visible" : "hidden",
          pointerEvents: reachedEnd ? "auto" : "none",
          transition:
            "transform 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease-in-out, visibility 0.8s ease-in-out",
        }}
      >
        <div className="max-w-7xl pt-16 mx-auto">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex justify-center mb-12"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-30"></div>
              <img
                src="https://procounsel.co.in/logo.png"
                alt="ProCounsel Logo"
                className="relative h-24 w-24 object-contain rounded-full shadow-lg"
              />
            </div>
          </motion.div>

          {/* About ProCounsel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider px-4 py-2 bg-indigo-50 rounded-full">
                About Us
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              About{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ProCounsel
              </span>
            </h2>
            <div className="max-w-4xl mx-auto space-y-4">
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                ProCounsel is India's most trusted admission counseling
                platform, dedicated to guiding students through their higher
                education journey. We understand that navigating the complex
                admission process can be overwhelming, and we're here to make it
                seamless and stress-free.
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                With a pan-India network of professional admission experts, we
                provide comprehensive support from exam preparation to final
                admission, ensuring every student finds their perfect academic
                destination.
              </p>
            </div>
          </motion.div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-6 mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="group relative p-6 md:p-8 rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                boxShadow:
                  "0 10px 30px -5px rgba(79, 70, 229, 0.1), 0 4px 6px -2px rgba(79, 70, 229, 0.05)",
                border: "1px solid rgba(79, 70, 229, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px -5px rgba(79, 70, 229, 0.2), 0 8px 12px -4px rgba(79, 70, 229, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px -5px rgba(79, 70, 229, 0.1), 0 4px 6px -2px rgba(79, 70, 229, 0.05)";
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                    Our Mission
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                  To democratize access to quality education by providing expert
                  guidance, transparent information, and personalized support to
                  every aspiring student, regardless of their background or
                  location.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="group relative p-6 md:p-8 rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                boxShadow:
                  "0 10px 30px -5px rgba(139, 92, 246, 0.1), 0 4px 6px -2px rgba(139, 92, 246, 0.05)",
                border: "1px solid rgba(139, 92, 246, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px -5px rgba(139, 92, 246, 0.2), 0 8px 12px -4px rgba(139, 92, 246, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px -5px rgba(139, 92, 246, 0.1), 0 4px 6px -2px rgba(139, 92, 246, 0.05)";
              }}
            >
              <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-2xl">🌟</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                    Our Vision
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                  To become India's leading education counseling platform,
                  empowering millions of students to achieve their academic
                  dreams and build successful careers through expert guidance
                  and innovative technology.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Our Team Section - Modern Dark Design */}
          {/* <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative mb-24 py-24 md:py-32 px-6 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto relative min-h-[600px] md:min-h-[800px] lg:min-h-[900px]">
              <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                <motion.h2
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black text-black leading-none tracking-tighter text-center px-4"
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

              <div className="relative z-10 hidden md:block min-h-[600px] md:min-h-[700px] lg:min-h-[800px]">
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
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
                    }}
                  >
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-800">
                      <img
                        src={founderImage}
                        alt="Founder & CEO"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                        <h3 className="text-white font-bold text-sm md:text-base mb-0.5 uppercase tracking-wider">
                          FOUNDER & CEO
                        </h3>
                        <p className="text-white/80 text-xs uppercase tracking-wider">
                          Chief Executive Officer
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

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
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
                    }}
                  >
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-800">
                      <img
                        src={founderImage}
                        alt="Founder & CEO"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                        <h3 className="text-white font-bold text-sm md:text-base mb-0.5 uppercase tracking-wider">
                          FOUNDER & CEO
                        </h3>
                        <p className="text-white/80 text-xs uppercase tracking-wider">
                          Chief Executive Officer
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
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
                      e.currentTarget.style.transform =
                        "translateY(0) scale(1)";
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
                </motion.div>
              </div>

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
                      src={founderImage}
                      alt="Founder & CEO"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                      <h3 className="text-white font-bold text-sm mb-0.5 uppercase tracking-wider">
                        FOUNDER & CEO
                      </h3>
                      <p className="text-white/80 text-xs uppercase tracking-wider">
                        Chief Executive Officer
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
                      src={founderImage}
                      alt="Founder & CEO"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                      <h3 className="text-white font-bold text-sm mb-0.5 uppercase tracking-wider">
                        FOUNDER & CEO
                      </h3>
                      <p className="text-white/80 text-xs uppercase tracking-wider">
                        Chief Executive Officer
                      </p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
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
                </motion.div>
              </div>
            </div>
          </motion.div> */}

          {/* Section Divider */}
          <div className="relative mb-24">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2 rounded-full text-white text-sm font-semibold shadow-lg">
                Our Services
              </span>
            </div>
          </div>

          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider px-4 py-2 bg-indigo-50 rounded-full">
                What We Offer
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 leading-tight">
              A Pan-India Community of
            </h2>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Professional Admission Experts
            </h3>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: 360° Admission Support */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)",
                boxShadow:
                  "0 10px 30px -5px rgba(99, 102, 241, 0.1), 0 4px 6px -2px rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-6px) scale(1.03)";
                e.currentTarget.style.boxShadow =
                  "0 25px 50px -5px rgba(99, 102, 241, 0.25), 0 10px 15px -5px rgba(99, 102, 241, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px -5px rgba(99, 102, 241, 0.1), 0 4px 6px -2px rgba(99, 102, 241, 0.05)";
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl">🎯</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                360° Admission Support
              </h4>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Comprehensive guidance throughout your entire admission journey
              </p>
            </motion.div>

            {/* Feature 2: Documentation Support */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #d1fae5 100%)",
                boxShadow:
                  "0 10px 30px -5px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)",
                border: "1px solid rgba(16, 185, 129, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-6px) scale(1.03)";
                e.currentTarget.style.boxShadow =
                  "0 25px 50px -5px rgba(16, 185, 129, 0.25), 0 10px 15px -5px rgba(16, 185, 129, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px -5px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)";
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl">📄</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Documentation Support
              </h4>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Expert assistance with all required documents and verification
              </p>
            </motion.div>

            {/* Feature 3: SPOT/IL Round Guidance */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)",
                boxShadow:
                  "0 10px 30px -5px rgba(217, 119, 6, 0.1), 0 4px 6px -2px rgba(217, 119, 6, 0.05)",
                border: "1px solid rgba(217, 119, 6, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-6px) scale(1.03)";
                e.currentTarget.style.boxShadow =
                  "0 25px 50px -5px rgba(217, 119, 6, 0.25), 0 10px 15px -5px rgba(217, 119, 6, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px -5px rgba(217, 119, 6, 0.1), 0 4px 6px -2px rgba(217, 119, 6, 0.05)";
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl">📊</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                SPOT/IL Round Guidance
              </h4>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Navigate special and institutional rounds with confidence
              </p>
            </motion.div>

            {/* Feature 4: Mental Wellness Program */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true, margin: "-100px" }}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f3e8ff 100%)",
                boxShadow:
                  "0 10px 30px -5px rgba(147, 51, 234, 0.1), 0 4px 6px -2px rgba(147, 51, 234, 0.05)",
                border: "1px solid rgba(147, 51, 234, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-6px) scale(1.03)";
                e.currentTarget.style.boxShadow =
                  "0 25px 50px -5px rgba(147, 51, 234, 0.25), 0 10px 15px -5px rgba(147, 51, 234, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px -5px rgba(147, 51, 234, 0.1), 0 4px 6px -2px rgba(147, 51, 234, 0.05)";
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl">🧘</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Mental Wellness Program
              </h4>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Supporting your emotional well-being during the admission
                process
              </p>
            </motion.div>
          </div>
        </div>
        <div className="flex items-center justify-center mt-20">
          <a
            href="https://www.procounsel.co.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 text-lg font-semibold text-black transition rounded-full bg-cyan-300 hover:bg-cyan-200"
          >
            🌐 Explore ProCounsel
          </a>
        </div>
      </section>
    </div>
  );
}
