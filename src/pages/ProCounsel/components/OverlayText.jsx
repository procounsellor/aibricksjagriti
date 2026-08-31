import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// Import stage images
import stage0Img from "../../../assets/procounsel/stage_0_intro.png";
import stage1Img from "../../../assets/procounsel/stage_1_exam_preps.png";
import stage2Img from "../../../assets/procounsel/stage_2_board_exams.png";
import stage3Img from "../../../assets/procounsel/stage_3_entrance_exams.png";
import stage4Img from "../../../assets/procounsel/stage_4_registration.png";
import stage5Img from "../../../assets/procounsel/stage_5_doc_verification.png";
import stage6Img from "../../../assets/procounsel/stage_6_seat_allotment.png";
// Reusing images for missing ones due to rate limit
const stage7Img = stage6Img; // Placeholder
const stage8Img = stage0Img; // Placeholder
const stage9Img = stage0Img; // Placeholder

// Pillar data with detailed content
const PILLAR_DATA = [
  {
    timePeriod: "Dec–Jan",
    title: "Exam Preps & Pre-Boards",
    description:
      "This is where the pressure starts building. Pre-boards, coaching tests and school expectations can make students feel confused and stressed about both marks and future career choices.",
    howProCounselHelps: [
      "We start with career mapping and psychometric tests to align subjects, interests and strengths.",
      "Our counsellors help students prioritise boards + entrance prep with realistic study plans.",
      "Parents get clear guidance on streams, exams and timelines, so there's less confusion and fewer last-minute decisions.",
    ],
    goal: "Calm the chaos, build clarity, and create a roadmap before the real exam marathon begins.",
    image: stage1Img,
  },
  {
    timePeriod: "Feb–Mar",
    title: "Board Exams",
    description:
      "During board exams, students don't need more noise—they need clarity, structure and emotional balance.",
    howProCounselHelps: [
      "We ensure students are not scrambling for admission information in the middle of exams – everything is pre-planned.",
      "Light-touch check-ins for stress and mental wellness, so they stay focused without burnout.",
      "Parents receive simple, timely updates on what comes immediately after boards – forms, result dates, and exam schedules.",
    ],
    goal: "Let students focus on scoring well, while we prepare the next steps in the background.",
    image: stage2Img,
  },
  {
    timePeriod: "Mar–Apr",
    title: "Entrance Exams (JEE, NEET, CET, etc.)",
    description:
      "Multiple exams, shifting dates and changing cutoffs – this is where most students feel completely overwhelmed.",
    howProCounselHelps: [
      "We create a custom exam strategy: which exams to prioritize, safe vs. ambitious options, and backup plans.",
      "Guidance on form filling, exam registrations, and document readiness (photos, signatures, certificates, etc.).",
      "Realistic college and course mapping based on mock scores, so students know what they're aiming for – and what to do if scores fluctuate.",
    ],
    goal: "Convert random exam attempts into a structured, smart attempt strategy.",
    image: stage3Img,
  },
  {
    timePeriod: "May–Jun",
    title: "Registration",
    description:
      "Result season begins and so does confusion: multiple portals, notices, deadlines and changing formats.",
    howProCounselHelps: [
      "Complete application & registration support for state, central and private colleges.",
      "We ensure no important portal or deadline is missed – CET, JEE, NEET counselling, university registrations, etc.",
      "Specialised support for NRI, DASA, FN quota & international admissions where applicable.",
      "Parents and students get a single point of contact instead of running behind multiple agents or websites.",
    ],
    goal: "Accurate, on-time applications everywhere you have a real chance.",
    image: stage4Img,
  },
  {
    timePeriod: "Jun–Jul",
    title: "Document Verification",
    description:
      'This is the "technical" phase that often costs students their seat due to small mistakes.',
    howProCounselHelps: [
      "Step-by-step guidance on document preparation & verification – caste certificates, income proofs, gap certificates, domicile, etc.",
      "Cross-checking all details (names, dates, categories) to avoid rejection due to clerical errors.",
      "Support for online and offline verification processes, including help with queries at centres.",
    ],
    goal: "Smooth verification with zero document-related surprises.",
    image: stage5Img,
  },
  {
    timePeriod: "Jul–Aug",
    title: "Seat Allotments / CAP Rounds",
    description:
      "Choice filling and CAP rounds decide whether a student gets an average college or a dream-fit college.",
    howProCounselHelps: [
      "Expert support for CAP / centralised counselling choice filling – branches, colleges and priority order.",
      "Data-backed guidance using past cut-offs, budgets, locations and student preferences.",
      "Clear explanations of round-wise decisions: when to freeze, float, slide or wait, so families don't panic.",
      'Ongoing one-to-one support till "Admission Done" is actually done, not just on paper.',
    ],
    goal: "Maximise your chances of a better college and branch without unnecessary risks.",
    image: stage6Img,
  },
  {
    timePeriod: "Aug–Sep",
    title: "Non-CAP / SPOT / Institute-Level (IL) Rounds",
    description:
      "Even after main rounds, many great opportunities open up silently through SPOT and IL rounds.",
    howProCounselHelps: [
      "Real-time tracking of SPOT, mop-up and institute-level rounds so you don't miss hidden opportunities.",
      "Honest guidance on whether to stick to your current seat or upgrade to another option.",
      "Help with quick documentation and decision-making, because these rounds move fast.",
    ],
    goal: "Convert last-minute openings into smart upgrades, not emotional gambles.",
    image: stage7Img,
  },
  {
    timePeriod: "Sep–Oct",
    title: "Start of Academic Year",
    description:
      "The admission is done – but the adjustment just begins: new city, hostel search, academics, peer pressure.",
    howProCounselHelps: [
      "Assistance with hostel and local accommodation near your college.",
      "Guidance on orientation, subject selection, and first-year expectations so students settle smoothly.",
      "Access to mental wellness support if the student feels homesick, anxious, or unsure.",
    ],
    goal: "Help students feel confident and supported, not lost in a new environment.",
    image: stage8Img,
  },
  {
    timePeriod: "Oct–Forever",
    title:
      "Beyond Admission: Hostel, Loans, Internships, Placements & Further Studies",
    description:
      "ProCounsel doesn't stop at \"Congratulations, you're admitted.\" We stay with the student through college and beyond.",
    howProCounselHelps: [
      "Education loan guidance – understanding options, documentation and application.",
      "Mentorship for college projects, internships and placements, with an industry-oriented approach.",
      "Career growth planning: upskilling, certification programs, and further studies (India & abroad).",
      "Continuous access to career counsellors who understand the student's journey from day one.",
    ],
    goal: "From first year to first job (and beyond), we help students build a career – not just get into a college.",
    image: stage9Img,
  },
];

// Overlay text component to be rendered outside Canvas.
// Reads scroll progress from a mutable ref and only re-renders itself when the
// displayed value actually changes - the page and 3D scene stay untouched.
export function OverlayText({ scrollProgressRef, prefersReducedMotion }) {
  const { t } = useTranslation();
  const totalSections = PILLAR_DATA.length + 1; // 9 pillars + 1 intro = 10 sections
  const [expandedCards, setExpandedCards] = useState({});
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let rafId;
    const update = () => {
      const progress = scrollProgressRef?.current ?? 0;
      // Functional update: returning the previous value bails out of the
      // re-render whenever the progress hasn't meaningfully changed.
      setScrollProgress((prev) =>
        Math.abs(prev - progress) > 0.0005 ? progress : prev
      );
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [scrollProgressRef]);

  // Memoize sections to avoid recalculation
  const allSections = useMemo(
    () => [
      {
        type: "intro",
        title: t("proCounselTitle"),
        tagline: t("proCounselIntro"),
        image: stage0Img,
      },
      ...PILLAR_DATA.map((pillar) => ({
        type: "pillar",
        ...pillar,
      })),
    ],
    [t]
  );

  // Clamp scroll progress to ensure it stays within bounds
  const clampedScrollProgress = Math.max(0, Math.min(1, scrollProgress));

  // Calculate which section should be visible based on scroll
  // Use totalSections to make transitions happen earlier and more evenly
  const sectionProgress = clampedScrollProgress * totalSections;
  const currentSectionIndex = Math.min(
    Math.floor(sectionProgress),
    totalSections - 1
  );
  const nextSectionIndex = Math.min(currentSectionIndex + 1, totalSections - 1);
  // Smooth transition progress between sections
  const transitionProgress = Math.max(
    0,
    Math.min(1, sectionProgress - currentSectionIndex)
  );

  // Check if intro section is active
  const isIntroActive =
    currentSectionIndex === 0 ||
    (currentSectionIndex === 0 && transitionProgress < 0.5);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {allSections.map((section, index) => {
        // Check if this is intro section
        const isIntro = section.type === "intro";

        // For intro: full screen, centered
        // For pillar cards: stacking effect on right side
        if (isIntro) {
          // Intro section - full screen, centered
          const introOffset = (0 - sectionProgress) * 100;
          const isIntroVisible = introOffset < 100 && introOffset > -100;
          if (!isIntroVisible && index !== currentSectionIndex) return null;

          const introOpacity =
            index === currentSectionIndex ? 1 - transitionProgress * 0.3 : 0.2;

          return (
            <div
              key={index}
              className="absolute left-0 right-0 top-0 bottom-0 w-full h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8"
              style={{
                top: `${introOffset}vh`,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                opacity: Math.max(0, Math.min(1, introOpacity)),
                willChange: "transform, opacity",
                transition: "none",
                zIndex: totalSections,
              }}
            >
              <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center px-4 sm:px-6 md:px-8 lg:px-16 mb-4 sm:mb-6 md:mb-8">
                {/* Logo Section */}
                <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6 md:mr-8 lg:mr-12">
                  <img
                    src="https://procounsel.co.in/logo.png"
                    alt="ProCounsel Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 object-contain rounded-2xl"
                  />
                </div>

                {/* Vertical Separator - Hidden on mobile */}
                <div className="hidden sm:block h-24 sm:h-28 md:h-32 lg:h-40 w-px bg-white opacity-30 sm:mr-6 md:mr-8 lg:mr-12"></div>

                {/* Text Section */}
                <div className="flex flex-col items-center sm:items-start justify-center text-center sm:text-left">
                  {/* ProCounsel - Large, bold */}
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-1 sm:mb-2 tracking-tight">
                    ProCounsel
                  </h2>

                  {/* By CatalystAI - Smaller */}
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white mb-2 sm:mb-3 font-medium">
                    By CatalystAI
                  </p>
                </div>
              </div>
              
              {/* Tagline - Centered below intro */}
              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white uppercase tracking-wider font-light text-center px-4 max-w-4xl">
                Your Personal Admission Expert : The Student & Parent Guide
              </p>
            </div>
          );
        }

        // Pillar cards - smooth stacking effect on right side
        // Only show cards that are current or in the past (stacking)
        if (index > currentSectionIndex + 1) return null;

        // Calculate stacking position - cards stack in place
        const cardsBelow = Math.max(0, currentSectionIndex - index);
        const isCurrent = index === currentSectionIndex;
        const isNext = index === nextSectionIndex;

        // Stacking transform - cards stay in place, stack on top of each other
        // No vertical movement, just stacking with slight offsets for depth
        const scale = 1 - cardsBelow * 0.02; // Slightly smaller for cards below
        const translateX = -cardsBelow * 12; // Horizontal offset for depth effect
        const translateY = -cardsBelow * 8; // Small vertical offset for stacking depth

        // Card background opacity - previous cards fade out
        let cardOpacity = 1;
        if (index < currentSectionIndex) {
          // Previous cards fade out but remain visible for stacking effect
          cardOpacity = Math.max(0, 0.15 - cardsBelow * 0.03);
        } else if (isCurrent) {
          cardOpacity = 1;
        } else if (isNext) {
          cardOpacity = transitionProgress;
        }

        // Content opacity - previous card content fades out completely
        let contentOpacity = 1;
        if (index < currentSectionIndex) {
          // Previous cards' content fades out completely
          contentOpacity = 0;
        } else if (isCurrent) {
          // Current card content stays visible, slight fade as transitioning
          contentOpacity = 1 - transitionProgress * 0.2;
        } else if (isNext) {
          // Next card content fades in
          contentOpacity = transitionProgress;
        }

        const isExpanded = expandedCards[index] || false;
        const toggleExpand = () => {
          setExpandedCards(prev => ({
            ...prev,
            [index]: !prev[index]
          }));
        };

        return (
          <div
            key={index}
            className="absolute right-0 bottom-0 md:top-0 md:bottom-auto w-full sm:w-[60%] md:w-[50%] lg:w-[45%] xl:w-[40%] h-auto md:h-screen flex items-end md:items-center justify-center p-0 sm:p-4 md:p-6 pointer-events-auto"
            style={{
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              opacity: Math.max(0, Math.min(1, cardOpacity)),
              transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
              willChange: "transform, opacity",
              transition:
                "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out",
              zIndex: totalSections - index, // Newer cards on top
            }}
          >
            <div
              className="w-full flex flex-col max-h-[50vh] sm:max-h-[60vh] md:max-h-screen overflow-y-auto rounded-t-lg md:rounded-none"
              style={{
                opacity: Math.max(0, Math.min(1, contentOpacity)),
                transition: "opacity 0.3s ease-out",
              }}
            >
              {/* Image section at top - Hidden on mobile unless expanded */}
              <div className={`w-full h-[35%] sm:h-[40%] md:h-[45%] mb-2 sm:mb-3 overflow-hidden rounded-lg bg-gray-800 flex-shrink-0 ${!isExpanded ? 'hidden sm:block' : 'block'}`}>
                <div
                  className="w-full h-full relative"
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(99, 102, 241, 0.6) 0%, rgba(147, 51, 234, 0.6) 50%, rgba(236, 72, 153, 0.6) 100%)`,
                  }}
                >
                  {/* Actual image */}
                  <img
                    src={section.image}
                    alt={section.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Content section */}
              <div className="flex flex-col items-start justify-start flex-1 px-2 sm:px-2 rounded-t-lg md:rounded-none">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1 sm:mb-2">
                  {section.timePeriod}
                </h3>
                <h4 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-white mb-1 sm:mb-2">
                  {section.title}
                </h4>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-2 sm:mb-3">
                  {section.description}
                </p>

                {/* How ProCounsel helps - Hidden on mobile unless expanded */}
                {section.howProCounselHelps &&
                  section.howProCounselHelps.length > 0 && (
                    <div className={`mb-2 sm:mb-3 ${!isExpanded ? 'hidden sm:block' : 'block'}`}>
                      <p className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2">
                        How ProCounsel helps:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-300 leading-relaxed">
                        {section.howProCounselHelps.map((help, idx) => (
                          <li key={idx}>{help}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Goal - Hidden on mobile unless expanded */}
                {section.goal && (
                  <div className={`mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-600 ${!isExpanded ? 'hidden sm:block' : 'block'}`}>
                    <p className="text-xs sm:text-sm text-gray-400 italic">
                      <span className="font-semibold text-white">
                        Goal of this phase:
                      </span>{" "}
                      {section.goal}
                    </p>
                  </div>
                )}

                {/* Read More/Read Less Button - Only on mobile */}
                <button
                  onClick={toggleExpand}
                  className="sm:hidden mt-3 mb-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors duration-200 uppercase tracking-wide"
                  style={{ pointerEvents: 'auto' }}
                >
                  {isExpanded ? 'Read Less' : 'Read More'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
