import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="relative z-10 p-4 mt-auto text-center text-gray-500 bg-gray-900 border-t border-gray-800">
      <div className="container flex flex-col items-center justify-between mx-auto max-w-7xl sm:flex-row">
        <p className="text-sm">{t("footerRights")}</p>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <Link to="/pricing" className="text-sm hover:text-gray-300">
            {t("navPricing")}
          </Link>
          <Link to="/privacy-policy" className="text-sm hover:text-gray-300">
            {t("footerPrivacy")}
          </Link>
          <Link to="/terms-conditions" className="text-sm hover:text-gray-300">
            {t("footerTerms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
