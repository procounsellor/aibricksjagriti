import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import productsConfig from "./config/products.json";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsConditions from "./pages/TermsConditions.jsx";
import AboutUsPage from "./pages/AboutUs.jsx";

// A deploy replaces hashed chunk files, so a tab opened before the deploy can
// fail its next dynamic import. Reload once to pick up the fresh index.html
// instead of stranding the user on a dead loading state.
const lazyWithReload = (importer) =>
  lazy(() =>
    importer().catch((error) => {
      const key = "chunk-reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(key);
      throw error;
    })
  );

const PageRegistry = {
  HomePage: lazyWithReload(() => import("./pages/Home/index.jsx")),
  AiBricksPage: lazyWithReload(() => import("./pages/AiBricks/index.jsx")),
  ProCounselPage: lazyWithReload(() => import("./pages/ProCounsel/index.jsx")),
  TheMindSoulPage: lazyWithReload(() =>
    import("./pages/TheMindSoul/index.jsx")
  ),
};

const PricingPage = lazyWithReload(() => import("./pages/Pricing/index.jsx"));

// Routes whose page is a fixed full-screen 3D experience with its own internal
// scrolling: the document has no height there, so the global footer would sit
// permanently over the scene.
const IMMERSIVE_ROUTES = new Set(["/aibricks"]);

function AppLayout() {
  const location = useLocation();
  const hideFooter = IMMERSIVE_ROUTES.has(location.pathname.toLowerCase());

  return (
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
      {!hideFooter && <Footer />}
    </div>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default AppRouter;

// Export for SSR compatibility
export { AppRouter };
