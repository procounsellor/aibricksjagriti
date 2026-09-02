import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Linkedin, Mail, Twitter } from "lucide-react";
import logo from "../assets/logo.png";

const PRODUCT_LINKS = [
  { nameKey: "navAiBricks", path: "/aiBricks" },
  { nameKey: "navProCounsel", path: "/proCounsel" },
  { nameKey: "navTheMindSoul", path: "/theMindSoul" },
];

const COMPANY_LINKS = [
  { nameKey: "navAbout", path: "/about-us" },
  { nameKey: "navPricing", path: "/pricing" },
  { nameKey: "footerPrivacy", path: "/privacy-policy" },
  { nameKey: "footerTerms", path: "/terms-conditions" },
];

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
    >
      {children}
    </Link>
  );
}

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative z-10 mt-auto border-t border-white/[0.08] bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:pr-8">
            <Link to="/" className="inline-flex items-center rounded-md">
              <img src={logo} alt="Devvo — home" className="h-10 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              {t("footerTagline")}
            </p>
          </div>

          {/* Products */}
          <nav aria-label={t("footerProductsHeading")}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t("footerProductsHeading")}
            </h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.path}>
                  <FooterLink to={link.path}>{t(link.nameKey)}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label={t("footerCompanyHeading")}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t("footerCompanyHeading")}
            </h3>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.path}>
                  <FooterLink to={link.path}>{t(link.nameKey)}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t("footerContactHeading")}
            </h3>
            <a
              href="mailto:hello@devvo.in"
              className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-white"
            >
              <Mail aria-hidden="true" className="h-4 w-4" />
              hello@devvo.in
            </a>
            <div className="mt-5 flex gap-3">
              <a
                href="#"
                aria-label={t("footerLinkedIn")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition-colors duration-200 hover:border-white/25 hover:text-white"
              >
                <Linkedin aria-hidden="true" className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label={t("footerTwitter")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition-colors duration-200 hover:border-white/25 hover:text-white"
              >
                <Twitter aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">{t("footerRights")}</p>
          <p className="text-xs text-slate-600">devvo.in</p>
        </div>
      </div>
    </footer>
  );
}
