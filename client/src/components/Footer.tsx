import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Clock, Lock, ShieldCheck, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { WebsiteSettings } from '../types';
import { ChickLogo } from './ChickLogo';

interface FooterProps {
  settings?: WebsiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  const { t, isHindi } = useLanguage();

  const businessName = isHindi
    ? settings?.businessNameHi || 'बंशीधर पोल्ट्री'
    : settings?.businessName || 'BANSHIDHAR POULTRY';

  const address = isHindi
    ? settings?.addressHi || 'किसान चौक, मुख्य बाजार मार्ग, समस्तीपुर, बिहार'
    : settings?.address || 'Kisan Chowk, Main Market Road, Samastipur, Bihar';

  const hours = isHindi
    ? settings?.businessHoursHi || 'सोमवार - रविवार: प्रातः 6:00 से सायं 8:00 बजे तक'
    : settings?.businessHours || 'Mon - Sun: 6:00 AM - 8:00 PM';

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ChickLogo size={40} logoUrl={settings?.logoUrl} />
              <span className="font-display text-xl font-black text-white tracking-tight">
                {businessName}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isHindi
                ? 'गुणवत्तापूर्ण एक-दिवसीय चूजे, संतुलित दाना फॉर्मूलेशन और पारदर्शी बाजार दर पर मुर्गियों की सुरक्षित उठान सेवा।'
                : 'Empowering poultry farmers with certified day-old broiler chicks, balanced feeds, and guaranteed lifting settlements.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {isHindi ? 'त्वरित लिंक' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/#rates" className="hover:text-brand-400 transition-colors">{t.nav.rates}</a></li>
              <li><a href="/#products" className="hover:text-brand-400 transition-colors">{t.nav.products}</a></li>
              <li><a href="/#calculator" className="hover:text-brand-400 transition-colors">{t.nav.calculator}</a></li>
              <li><a href="/#about" className="hover:text-brand-400 transition-colors">{t.nav.about}</a></li>
              <li><a href="/#join" className="hover:text-brand-400 transition-colors">{t.nav.joinUs}</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              {isHindi ? 'डीलरशिप संपर्क' : 'Dealership Office'}
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${settings?.phone || '+919876543210'}`} className="hover:text-white">
                  {settings?.phone || '+91 9876543210'}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`https://wa.me/${settings?.whatsappNumber || '919876543210'}`} target="_blank" rel="noreferrer" className="hover:text-white">
                  WhatsApp Support
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{hours}</span>
              </li>
            </ul>
          </div>

          {/* Dealership Trust & Commitment */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isHindi ? 'डीलर विश्वास व गारंटी' : 'Dealer Commitment'}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isHindi
                ? 'समय पर गाड़ी द्वारा मुर्गी उठान, पारदर्शी वजन और सीधे खाते में पारदर्शी हिसाब।'
                : 'Guaranteed farm-gate bird lifting, accurate digital weighment, and transparent passbook accounting.'}
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-300 font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>100% Hatchery Certified Chicks</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Developed by Nishant & Subtle Admin Link */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Banshidhar Poultry. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span>Developed by</span>
            <span className="font-extrabold text-brand-400 bg-brand-950/80 px-2.5 py-0.5 rounded-full border border-brand-800/80 text-[11px] shadow-sm tracking-wide">
              Nishant
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
              title="Dealer Administration"
            >
              <Lock className="w-3 h-3" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
