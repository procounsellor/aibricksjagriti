import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import productsConfig from "./config/products.json";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsConditions from "./pages/TermsConditions.jsx";
import AboutUsPage from "./pages/AboutUs.jsx";

const PageRegistry = {
  HomePage: lazy(() =>
    import("./pages/Home/index.jsx").then((m) => ({ default: m.default }))
  ),
  AiBricksPage: lazy(() =>
    import("./pages/AiBricks/index.jsx").then((m) => ({ default: m.default }))
  ),
  ProCounselPage: lazy(() =>
    import("./pages/ProCounsel/index.jsx").then((m) => ({ default: m.default }))
  ),
  TheMindSoulPage: lazy(() =>
    import("./pages/TheMindSoul/index.jsx").then((m) => ({
      default: m.default,
    }))
  ),
};

const PricingPage = lazy(() =>
  import("./pages/Pricing/index.jsx").then((m) => ({ default: m.default }))
);

function AppRouter() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen font-sans text-white bg-gray-900 overflow-hidden">
        <Header />
        <main className="flex-grow relative">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<PageRegistry.HomePage />} />
              {Object.values(productsConfig)
                .filter((product) => product.id !== "home")
                .map((product) => {
                  const Component = PageRegistry[product.component];
                  if (!Component) return null;
                  return (
                    <Route
                      key={product.id}
                      path={`/${product.id}`}
                      element={<Component />}
                    />
                  );
                })}
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/about-us" element={<AboutUsPage />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default AppRouter;

// Export for SSR compatibility
export { AppRouter };
