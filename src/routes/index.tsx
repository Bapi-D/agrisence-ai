import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Camera,
  CheckCircle2,
  Droplets,
  Globe,
  Leaf,
  Mail,
  Menu,
  Phone,
  ScanLine,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { GlassCard } from "@/components/agri/GlassCard";
import { Button } from "@/components/ui/button";
import { useAdvisoryI18n } from "@/i18n/advisory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "AgriSense AI — Precision Agriculture Platform",
      },
      {
        name: "description",
        content:
          "Smart farming solutions with AI-powered crop analytics, soil monitoring, and disease prediction.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Droplets,
    titleKey: "features.waterTitle",
    textKey: "features.waterDesc",
    defaultTitle: "Water & Irrigation AI",
    defaultText:
      "Real-time soil moisture sensors mapped with weather predictions for precise watering.",
  },

  {
    icon: ScanLine,
    titleKey: "features.leafTitle",
    textKey: "features.leafDesc",
    defaultTitle: "Leaf Disease Detection",
    defaultText:
      "Instant disease scanning and organic treatment suggestions via high-res plant analysis.",
  },

  {
    icon: Camera,
    titleKey: "features.cameraTitle",
    textKey: "features.cameraDesc",
    defaultTitle: "Live Camera Monitoring",
    defaultText:
      "24/7 computer vision scanning for crop threat evaluation and field surveillance.",
  },

  {
    icon: Boxes,
    titleKey: "features.gridTitle",
    textKey: "features.gridDesc",
    defaultTitle: "3D Farm Health Grid",
    defaultText:
      "Interactive 3D model mapping individual crop patches with color-coded vitality.",
  },
];

const PRODUCTS = [
  {
    id: "bhu-tejas",
    name: "BHU TEJAS",
    desc: "Liquid formulation microbial consortium developed for soil enrichment and root strength.",
    img: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?q=80&w=600&auto=format&fit=crop",
    tag: "Bio-Fertilizer",
  },
  {
    id: "bio-sparsh",
    name: "BIO SPARSH",
    desc: "Phosphate-solubilizing bacterial bio-fertilizer for balanced nutrient absorption.",
    img: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?q=80&w=600&auto=format&fit=crop",
    tag: "Soil Health",
  },
  {
    id: "agriderma",
    name: "AGRIDERMA",
    desc: "Eco-friendly biological fungicide protecting roots from soil-borne pathogens.",
    img: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=600&auto=format&fit=crop",
    tag: "Crop Protection",
  },
];
const WORKFLOW = [
  {
    number: "01",
    titleKey: "workflow.step1Title",
    textKey: "workflow.step1Desc",
    defaultTitle: "Collect Data",
    defaultText:
      "Integrate field sensors, cameras, and drone/satellite inputs.",
  },

  {
    number: "02",
    titleKey: "workflow.step2Title",
    textKey: "workflow.step2Desc",
    defaultTitle: "AI Analysis",
    defaultText:
      "Computer vision and neural networks analyze soil and leaf health.",
  },

  {
    number: "03",
    titleKey: "workflow.step3Title",
    textKey: "workflow.step3Desc",
    defaultTitle: "Predict Risk",
    defaultText:
      "Forecast pest outbreaks, drought stress, and nutrient gaps.",
  },

  {
    number: "04",
    titleKey: "workflow.step4Title",
    textKey: "workflow.step4Desc",
    defaultTitle: "Take Action",
    defaultText:
      "Get actionable daily recommendations right on your phone.",
  },
];

function Landing() {
  const { t } = useTranslation(["nav", "common", "dashboard"]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adv = useAdvisoryI18n();

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const element = document.getElementById(id);

    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md shadow-lg shadow-black/40 h-20 flex items-center">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <Leaf className="h-6 w-6" />
            </span>

            <div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                AgriSense <span className="text-emerald-400">AI</span>
              </span>

              <p className="text-[10px] text-slate-400 hidden sm:block">
                Smart Farming Intelligence
              </p>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-8 font-medium text-sm text-slate-300 md:flex">
            <a
              href="#features"
              onClick={(e) => scrollToSection(e, "features")}
              className="transition-colors hover:text-emerald-400 cursor-pointer"
            >
              {t("nav:features", {
                defaultValue: "Features",
              })}
            </a>

            <a
              href="#products"
              onClick={(e) => scrollToSection(e, "products")}
              className="transition-colors hover:text-emerald-400 cursor-pointer"
            >
              {t("nav:products", {
                defaultValue: "Our Products",
              })}
            </a>

            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, "how-it-works")}
              className="transition-colors hover:text-emerald-400 cursor-pointer"
            >
              {t("nav:howItWorks", {
                defaultValue: "How it Works",
              })}
            </a>
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="hidden md:flex items-center gap-4">

            <Link to="/auth">
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {t("common:signIn", {
                  defaultValue: "Sign In",
                })}
              </Button>
            </Link>

            <Link to="/auth">
              <Button
                size="sm"
                className="bg-emerald-600 font-semibold text-white shadow-md hover:bg-emerald-500"
              >
                {t("common:getStarted", {
                  defaultValue: "Get Started",
                })}
              </Button>
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <div className="flex items-center gap-2 md:hidden">

            <button
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="p-2 text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-0 right-0 md:hidden border-b border-slate-800 bg-slate-950 px-6 py-5 space-y-4 shadow-xl">
            <nav className="flex flex-col space-y-3 font-medium text-sm text-slate-300">
              <a
                href="#features"
                onClick={(e) =>
                  scrollToSection(e, "features")
                }
                className="hover:text-emerald-400"
              >
                {t("nav:features", {
                  defaultValue: "Features",
                })}
              </a>

              <a
                href="#products"
                onClick={(e) =>
                  scrollToSection(e, "products")
                }
                className="hover:text-emerald-400"
              >
                {t("nav:products", {
                  defaultValue: "Our Products",
                })}
              </a>

              <a
                href="#how-it-works"
                onClick={(e) =>
                  scrollToSection(e, "how-it-works")
                }
                className="hover:text-emerald-400"
              >
                {t("nav:howItWorks", {
                  defaultValue: "How it Works",
                })}
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant="outline"
                  className="w-full border-slate-700 text-black hover:bg-slate-800"
                >
                  {t("common:signIn", {
                    defaultValue: "Sign In",
                  })}
                </Button>
              </Link>

              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
                  {t("common:getStarted", {
                    defaultValue: "Get Started",
                  })}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 min-h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6">
        <img
          src="/images/strawberry-field.jpg"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop";
          }}
          alt="Strawberry Field"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/70 to-slate-950" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 backdrop-blur px-4 py-1.5 text-xs font-semibold text-emerald-300">
            <Sparkles className="h-4 w-4 text-emerald-400" />

            <span>
              {t("common:badge", {
                defaultValue:
                  "Next-Gen Precision Agriculture",
              })}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15] max-w-4xl mx-auto">
            {t("common:heroTitle1", {
              defaultValue: "Transform your ",
            })}

            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
              {t("common:heroTitle2", {
                defaultValue: "fields",
              })}
            </span>

            {t("common:heroTitle3", {
              defaultValue:
                " with real-time AI insights.",
            })}
          </h1>

          <p className="mt-6 text-sm sm:text-base md:text-lg leading-relaxed text-slate-300 max-w-3xl mx-auto">
            {t("common:heroDesc", {
              defaultValue:
                "AgriSense AI merges IoT soil moisture sensors, leaf-level computer vision diagnostics, and predictive analytics into an all-in-one command center.",
            })}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/auth"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 bg-emerald-600 font-semibold px-8 text-white shadow-lg shadow-emerald-900/50 hover:bg-emerald-500"
              >
                {t("common:startTrial", {
                  defaultValue: "Start Free Trial",
                })}

                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <a
              href="#features"
              onClick={(e) =>
                scrollToSection(e, "features")
              }
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white"
              >
                {t("common:explorePlatform", {
                  defaultValue: "Explore Platform",
                })}
              </Button>
            </a>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/80 pt-6 text-xs sm:text-sm text-slate-300 font-medium">
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {t("common:check1", {
                defaultValue: "Automated Irrigation",
              })}
            </span>

            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {t("common:check2", {
                defaultValue:
                  "Early Disease Detection",
              })}
            </span>

            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {t("common:check3", {
                defaultValue:
                  "Live Field Camera AI",
              })}
            </span>

            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {t("common:check4", {
                defaultValue:
                  "Yield Risk Forecasting",
              })}
            </span>
          </div>
        </div>
      </section>

      {/* CONTENT SECTIONS */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* FEATURES SECTION */}
        <section
          id="features"
          className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12"
        >
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
              {t("common:featuresTitle", {
                defaultValue:
                  "Smart Features Built for the Field",
              })}
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              {t("common:featuresSub", {
                defaultValue:
                  "Everything you need to improve yield and lower resource wastage.",
              })}
            </p>
          </div>

          <div className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <GlassCard
                key={f.titleKey}
                className="group relative overflow-hidden bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 p-6 rounded-2xl shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                  <f.icon className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-semibold text-white">
                  {t(f.titleKey, {
                    defaultValue: f.defaultTitle,
                  })}
                </h3>

                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-400">
                  {t(f.textKey, {
                    defaultValue: f.defaultText,
                  })}
                </p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* BIO PRODUCTS SECTION */}
        <section
          id="products"
          className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12"
        >
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {t("common:productsBadge", {
                defaultValue:
                  "Bio Inputs & Solutions",
              })}
            </span>

            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
              {t("common:productsTitle", {
                defaultValue:
                  "Our Organic Bio Products",
              })}
            </h2>

            <p className="mt-2 text-slate-400 max-w-2xl mx-auto">
              {t("common:productsSub", {
                defaultValue:
                  "High-yield bio-fertilizers and organic soil conditioners.",
              })}
            </p>
          </div>

          <div className="mt-10 grid gap-6 grid-cols-1 md:grid-cols-3">
            {PRODUCTS.map((p) => (
              <GlassCard
                key={p.id}
                className="flex flex-col justify-between bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 transition-all p-5 rounded-2xl"
              >
                <div>
                  <div className="h-40 overflow-hidden rounded-xl bg-slate-800 mb-4">
                    <img
                      src={p.img}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400">
                    {p.tag}
                  </span>

                  <h3 className="mt-3 text-lg font-bold text-white">
                    {p.name}
                  </h3>

                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5 w-full border-slate-700 bg-slate-800 text-emerald-400 hover:bg-slate-700 hover:text-emerald-300"
                >
                  {t("common:viewProduct", {
                    defaultValue:
                      "View Product Info",
                  })}
                </Button>
              </GlassCard>
</Link>
))}
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section
          id="how-it-works"
          className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12"
        >
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-10">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {t("common:workflowBadge", {
                  defaultValue:
                    "Simple Workflow",
                })}
              </span>

              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
                {t("common:workflowTitle", {
                  defaultValue:
                    "From raw field data to actionable decisions",
                })}
              </h2>
            </div>

            <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5"
                >
                  <span className="text-3xl font-black text-emerald-500/40">
                    {step.number}
                  </span>

                  <h3 className="mt-2 text-base font-semibold text-white">
                    {t(step.titleKey, {
                      defaultValue:
                        step.defaultTitle,
                    })}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {t(step.textKey, {
                      defaultValue: step.defaultText,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <Leaf className="h-6 w-6 text-emerald-400" />

                <span className="text-xl font-bold text-white">
                  AgriSense AI
                </span>
              </div>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-400">
                Empowering farmers worldwide with actionable AI
                intelligence, crop health analytics, and organic
                bio-fertilizer formulations.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">
                Platform
              </h4>

              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <a
                    href="#features"
                    onClick={(e) =>
                      scrollToSection(e, "features")
                    }
                    className="hover:text-emerald-400 cursor-pointer"
                  >
                    {t("nav:features", {
                      defaultValue: "Features",
                    })}
                  </a>
                </li>

                <li>
                  <a
                    href="#products"
                    onClick={(e) =>
                      scrollToSection(e, "products")
                    }
                    className="hover:text-emerald-400 cursor-pointer"
                  >
                    {t("nav:products", {
                      defaultValue: "Our Products",
                    })}
                  </a>
                </li>

                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) =>
                      scrollToSection(
                        e,
                        "how-it-works",
                      )
                    }
                    className="hover:text-emerald-400 cursor-pointer"
                  >
                    {t("nav:howItWorks", {
                      defaultValue: "How it Works",
                    })}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">
                Products
              </h4>

              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <a
                    href="#products"
                    onClick={(e) =>
                      scrollToSection(e, "products")
                    }
                    className="hover:text-emerald-400 cursor-pointer"
                  >
                    BHU TEJAS Bio-Fertilizer
                  </a>
                </li>

                <li>
                  <a
                    href="#products"
                    onClick={(e) =>
                      scrollToSection(e, "products")
                    }
                    className="hover:text-emerald-400 cursor-pointer"
                  >
                    BIO SPARSH Nutrient Saver
                  </a>
                </li>

                <li>
                  <a
                    href="#products"
                    onClick={(e) =>
                      scrollToSection(e, "products")
                    }
                    className="hover:text-emerald-400 cursor-pointer"
                  >
                    AGRIDERMA Fungicide
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">
                Contact & Support
              </h4>

              <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                  support@agrisense.ai
                </li>

                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                  +91 99999-99999
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800/80 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} AgriSense AI Inc. All
            rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
