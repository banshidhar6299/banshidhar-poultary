import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  CheckCircle,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  PackageCheck,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api, formatINR, formatDate, formatDateTime } from '../../api/client';
import { Product, RateCard, Category, WebsiteSettings } from '../../types';
import { PWAInstallBanner } from '../../components/PWAInstallBanner';
import { WeightCalculator } from '../../components/WeightCalculator';
import { ChickLogo } from '../../components/ChickLogo';

const iconMap: Record<string, any> = {
  ShieldCheck,
  Award,
  PackageCheck,
  Smartphone,
  TrendingUp
};

export const HomePage: React.FC = () => {
  const { t, isHindi } = useLanguage();
  const { settings } = (useOutletContext() as { settings?: WebsiteSettings }) || {};

  const [rates, setRates] = useState<RateCard[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    // Fetch rates
    api.get('/rates/active').then((res) => {
      if (res.data.success) setRates(res.data.data);
    }).catch(() => {});

    // Fetch products
    api.get('/products/active').then((res) => {
      if (res.data.success) setProducts(res.data.data);
    }).catch(() => {});

    // Fetch categories
    api.get('/categories/active').then((res) => {
      if (res.data.success) setCategories(res.data.data);
    }).catch(() => {});
  }, []);

  const filteredProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => {
          const catId = typeof p.category === 'object' ? p.category._id : p.category;
          return catId === selectedCategory;
        });

  const heroTitle = isHindi ? settings?.heroTitleHi || 'बंशीधर पोल्ट्री' : settings?.heroTitle || 'BANSHIDHAR POULTRY';
  const heroSubtitle = isHindi
    ? settings?.heroSubtitleHi || 'उच्च गुणवत्ता वाले चूजे, वैज्ञानिक रूप से तैयार संतुलित दाना और पारदर्शी बाजार भाव पर त्वरित मुर्गी उठान।'
    : settings?.heroSubtitle || 'Premium Quality Day-Old Chicks, Balanced Feed Formulation & Complete Farmer Support at Transparent Market Rates.';

  const aboutTitle = isHindi ? settings?.aboutTitleHi || 'बंशीधर पोल्ट्री के बारे में' : settings?.aboutTitle || 'About Banshidhar Poultry';
  const aboutContent = isHindi
    ? settings?.aboutContentHi || 'बंशीधर पोल्ट्री किसानों को उच्च गुणवत्ता वाले ब्रायलर चूजे, संतुलित दाना, स्वास्थ्य परामर्श और पारदर्शी दरों पर मुर्गियों की समय पर उठान सेवा प्रदान करने के लिए समर्पित है।'
    : settings?.aboutContent || 'Banshidhar Poultry is dedicated to empowering poultry farmers with top-grade day-old broiler chicks, balanced protein-rich feed, biosecurity advice, and transparent market-rate bird lifting settlements.';

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. HERO BANNER WITH VIDEO / POSTER */}
      <section className="relative w-full min-h-[580px] sm:min-h-[640px] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        {/* Background Video / Poster */}
        {settings?.heroVideoUrl ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={settings?.heroPosterUrl}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          >
            <source src={settings.heroVideoUrl} type="video/mp4" />
          </video>
        ) : (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30"
            style={{
              backgroundImage: `url(${
                settings?.heroPosterUrl ||
                'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1600&q=80'
              })`
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-brand-950/70" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center space-y-5 sm:space-y-6 w-full overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 text-brand-300 text-xs sm:text-sm font-bold border border-brand-400/30 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{t.hero.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-white drop-shadow-md break-words">
            {heroTitle}
          </h1>

          <p className="text-xs sm:text-base md:text-lg text-slate-200 max-w-3xl mx-auto leading-relaxed drop-shadow px-2">
            {heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#products"
              className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-brand-600/30 transition-all app-touch-active"
            >
              {t.hero.viewProducts}
            </a>

            <Link
              to="/farmer/login"
              className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all app-touch-active"
            >
              {isHindi ? 'किसान पासबुक लॉगिन' : 'Farmer Passbook Login'}
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        {/* 2. DOWNLOAD FARMER APP SECTION (Directly Below Hero Banner - Spec #9) */}
        <PWAInstallBanner />

        {/* 3. TODAY'S POULTRY RATES SECTION (Spec #14) */}
        <section id="rates" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>{isHindi ? 'दैनिक बाजार भाव' : 'Daily Market Rates'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white">
                {t.rates.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.rates.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rates.map((rate) => (
              <div
                key={rate._id}
                className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none hover:border-brand-500/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-[10px] uppercase">
                    {isHindi && rate.titleHi ? rate.titleHi : rate.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(rate.effectiveDate)}
                  </span>
                </div>

                <div className="my-2">
                  <span className="text-3xl sm:text-4xl font-black font-display text-brand-600 dark:text-brand-400 tracking-tight">
                    {formatINR(rate.rate)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                    / {isHindi && rate.unitHi ? rate.unitHi : rate.unit}
                  </span>
                </div>

                {(rate.note || rate.noteHi) && (
                  <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 line-clamp-1">
                    {isHindi && rate.noteHi ? rate.noteHi : rate.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. FEATURED PRODUCTS CATALOGUE (Display Only - Spec #13) */}
        <section id="products" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">
                <Package className="w-4 h-4" />
                <span>{isHindi ? 'गुणवत्तापूर्ण उत्पाद' : 'Quality Catalog'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white">
                {t.products.title}
              </h2>
            </div>
            <p className="text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1.5 rounded-xl border border-brand-200 dark:border-brand-900/40">
              {t.products.catalogueOnlyNote}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 text-xs font-bold rounded-2xl whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {t.products.allCategories}
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 text-xs font-bold rounded-2xl whitespace-nowrap transition-all ${
                  selectedCategory === cat._id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {isHindi && cat.nameHi ? cat.nameHi : cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod._id}
                className="flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
              >
                {/* Image */}
                <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[10px] font-bold text-brand-700 dark:text-brand-300 shadow-sm">
                    {prod.brand}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {isHindi && prod.nameHi ? prod.nameHi : prod.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {isHindi && prod.shortDescriptionHi ? prod.shortDescriptionHi : prod.shortDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black font-display text-slate-900 dark:text-white">
                        {formatINR(prod.price)}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                        / {isHindi && prod.unitHi ? prod.unitHi : prod.unit}
                      </span>
                    </div>

                    <Link
                      to="/farmer/login"
                      className="px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 rounded-xl transition-colors"
                    >
                      {isHindi ? 'ऑर्डर करें' : 'Order in Portal'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. AUTOMATIC WEIGHT × RATE CALCULATOR (Spec #15) */}
        <section id="calculator">
          <WeightCalculator defaultRate={rates[0]?.rate || 120} />
        </section>

        {/* 6. ABOUT US & WHY CHOOSE BANSHIDHAR POULTRY (Spec #11 & #77) */}
        <section id="about" className="space-y-12">
          <div className="rounded-3xl bg-gradient-to-br from-brand-900 to-slate-900 p-8 sm:p-12 text-white shadow-2xl">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-400/30">
                <Award className="w-3.5 h-3.5" />
                <span>{t.about.dealershipBadge}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
                {aboutTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {aboutContent}
              </p>
            </div>
          </div>

          {/* Why Choose Us Cards */}
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white mb-6 text-center">
              {t.about.whyChooseUsTitle}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(settings?.whyChooseUs || []).map((card, idx) => {
                const IconComponent = iconMap[card.iconName] || ShieldCheck;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-3"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isHindi && card.titleHi ? card.titleHi : card.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {isHindi && card.descriptionHi ? card.descriptionHi : card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 8. CONTACT / DEALERSHIP OFFICE (Spec #17) */}
        <section id="contact" className="space-y-6 pb-12">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              {t.contact.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.contact.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {t.contact.phone}
                </span>
                <a href={`tel:${settings?.phone || '+919876543210'}`} className="text-base font-bold text-slate-900 dark:text-white hover:text-brand-600">
                  {settings?.phone || '+91 9876543210'}
                </a>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {t.contact.whatsapp}
                </span>
                <a
                  href={`https://wa.me/${settings?.whatsappNumber || '919876543210'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600"
                >
                  WhatsApp Direct
                </a>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {t.contact.address}
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                  {isHindi ? settings?.addressHi || 'समस्तीपुर, बिहार' : settings?.address || 'Samastipur, Bihar'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
