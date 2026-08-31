import React from "react";
import { motion } from "framer-motion";

export default function AboutUsPage() {
  return (
    <div className="w-full bg-gray-900 text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-36 px-6 bg-gradient-to-b from-gray-900 to-gray-800 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6"
        >
          Our Development Team
        </motion.h1>
        <p className="max-w-4xl mx-auto text-lg md:text-xl text-gray-300 leading-relaxed">
          We are a full-stack technology team specializing in building scalable,
          secure, and high-performance digital products — from web platforms and
          mobile apps to cloud-hosted AI systems. Our expertise covers the
          entire product lifecycle: design → development → deployment → scaling.
        </p>
        <p className="mt-6 text-gray-400 max-w-3xl mx-auto">
          We don’t just write code — we build production-ready systems that
          businesses can rely on.
        </p>
      </section>

      {/* Services */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {services.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-cyan-500 transition"
              >
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>

                <p className="text-gray-400 mb-4">{item.description}</p>

                <div className="mb-4">
                  <p className="font-semibold mb-2">Technologies:</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {item.technologies.map((tech, i) => (
                      <li key={i}>• {tech}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">What we deliver:</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {item.deliverables.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 max-w-6xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-10">
          🧩 Why Clients Choose Us
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, i) => (
            <div
              key={i}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700"
            >
              <p className="text-lg font-semibold">✔️ {reason}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xl text-gray-300 max-w-3xl mx-auto">
          We don’t just build software —<br />
          we build scalable digital products that grow with your business.
        </p>
      </section>
    </div>
  );
}

const services = [
  {
    title: "🧠 Backend Engineering",
    description:
      "We build robust, secure, and scalable backend systems that power modern applications.",
    technologies: ["Java, Spring Boot", "JPA, Hibernate", "Node.js", "Python"],
    deliverables: [
      "High-performance REST & API-based architectures",
      "Secure authentication & authorization systems",
      "Payment, booking, analytics & real-time features",
      "Cloud-ready microservices & integrations",
    ],
  },
  {
    title: "🎨 Frontend Engineering (Web)",
    description:
      "We create fast, responsive, and conversion-focused web interfaces.",
    technologies: ["React.js", "Next.js", "HTML5, CSS3, JavaScript"],
    deliverables: [
      "High-performance dashboards",
      "Landing pages & SaaS platforms",
      "Admin panels & analytics tools",
      "SEO-optimized and mobile-friendly web apps",
    ],
  },
  {
    title: "📱 Mobile App Development",
    description:
      "We build cross-platform mobile apps that work flawlessly on Android and iOS.",
    technologies: [
      "Flutter",
      "API Integrations",
      "Push Notifications",
      "App Store & Play Store deployment",
    ],
    deliverables: [
      "User-friendly Android & iOS apps",
      "Secure API-driven mobile platforms",
      "Chat, video, booking, payment & real-time features",
      "End-to-end publishing on App Store & Play Store",
    ],
  },
  {
    title: "🗄️ Databases & Storage",
    description:
      "We design scalable, high-availability data architectures for modern applications.",
    technologies: [
      "Firestore",
      "Firebase Realtime Database",
      "Firebase Storage",
      "SQLite",
      "MySQL",
      "PostgreSQL",
    ],
    deliverables: [
      "Structured and NoSQL databases",
      "Real-time syncing",
      "Cloud storage & file management",
      "High-volume data pipelines",
    ],
  },
  {
    title: "☁️ Cloud, DevOps & Deployment",
    description:
      "We manage end-to-end cloud infrastructure for reliable, production-grade systems.",
    technologies: [
      "Google Cloud Platform (GCP)",
      "AWS",
      "Microsoft Azure",
      "GitHub (CI/CD & version control)",
    ],
    deliverables: [
      "Cloud server setup & optimization",
      "CI/CD pipelines",
      "Auto-scaling & monitoring",
      "Secure deployments for web, backend & apps",
    ],
  },
  {
    title: "🤖 Artificial Intelligence & GenAI",
    description: "We build real-world AI systems, not just demos.",
    technologies: [
      "Generative AI",
      "Python",
      "FastAPI",
      "AI-powered chatbots",
      "API-based AI services",
    ],
    deliverables: [
      "AI chatbots",
      "Recommendation engines",
      "Search & data intelligence",
      "End-to-end AI platforms integrated into apps",
    ],
  },
  {
    title: "🎯 UI/UX & Product Design",
    description:
      "We design beautiful, intuitive, and conversion-optimized interfaces.",
    technologies: ["Figma (end-to-end product design)"],
    deliverables: [
      "Wireframes & user journeys",
      "High-fidelity UI designs",
      "Mobile & web design systems",
      "Developer-ready prototypes",
    ],
  },
];

const reasons = [
  "Full-stack expertise under one team",
  "Production-grade architecture",
  "AI-driven solutions",
  "Cloud-ready deployment",
  "Real business-focused development",
];
