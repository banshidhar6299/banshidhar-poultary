import mongoose, { Document, Schema } from 'mongoose';

export interface IWebsiteSettings extends Document {
  businessName: string;
  businessNameHi: string;
  tagline: string;
  taglineHi: string;
  logoUrl?: string;
  heroVideoUrl?: string;
  heroPosterUrl?: string;
  heroTitle: string;
  heroTitleHi: string;
  heroSubtitle: string;
  heroSubtitleHi: string;
  ctaPrimaryText: string;
  ctaPrimaryTextHi: string;
  aboutTitle: string;
  aboutTitleHi: string;
  aboutContent: string;
  aboutContentHi: string;
  whyChooseUs: Array<{
    title: string;
    titleHi: string;
    description: string;
    descriptionHi: string;
    iconName: string;
  }>;
  dealerName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  addressHi: string;
  googleMapsUrl: string;
  businessHours: string;
  businessHoursHi: string;
  showRatesSection: boolean;
  showAppDownloadSection: boolean;
  showCalculatorSection: boolean;
  footerNotice?: string;
  footerNoticeHi?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSettingsSchema = new Schema<IWebsiteSettings>(
  {
    businessName: { type: String, default: 'BANSHIDHAR POULTRY' },
    businessNameHi: { type: String, default: 'बंशीधर पोल्ट्री' },
    tagline: { type: String, default: 'Your Trusted Partner in Quality Poultry Farming & Chick Supply' },
    taglineHi: { type: String, default: 'गुणवत्तापूर्ण पोल्ट्री फार्मिंग और चूजा आपूर्ति में आपका विश्वसनीय साथी' },
    logoUrl: { type: String, default: '' },
    heroVideoUrl: { type: String, default: '' },
    heroPosterUrl: { type: String, default: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1600&q=80' },
    heroTitle: { type: String, default: 'BANSHIDHAR POULTRY' },
    heroTitleHi: { type: String, default: 'बंशीधर पोल्ट्री फार्मिंग' },
    heroSubtitle: {
      type: String,
      default: 'Premium Quality Chicks, Balanced Feed Formulation & Complete Farmer Support at Transparent Market Rates.'
    },
    heroSubtitleHi: {
      type: String,
      default: 'उच्च गुणवत्ता वाले चूजे, संतुलित दाना और पारदर्शी दरों पर संपूर्ण किसान सहायता।'
    },
    ctaPrimaryText: { type: String, default: 'View Products' },
    ctaPrimaryTextHi: { type: String, default: 'उत्पाद देखें' },
    aboutTitle: { type: String, default: 'About Banshidhar Poultry' },
    aboutTitleHi: { type: String, default: 'बंशीधर पोल्ट्री के बारे में' },
    aboutContent: {
      type: String,
      default: 'Banshidhar Poultry is dedicated to empowering poultry farmers with top-grade day-old broiler chicks, balanced protein-rich feed, biosecurity advice, and transparent market-rate bird lifting settlements. We believe in building enduring relationships with farmers through integrity, prompt service, and digital ledger convenience.'
    },
    aboutContentHi: {
      type: String,
      default: 'बंशीधर पोल्ट्री किसानों को उच्च गुणवत्ता वाले ब्रायलर चूजे, संतुलित दाना, स्वास्थ्य परामर्श और पारदर्शी दरों पर मुर्गियों की समय पर उठान सेवा प्रदान करने के लिए समर्पित है। हम ईमानदारी, त्वरित सेवा और डिजिटल हिसाब-किताब के माध्यम से किसानों के साथ मजबूत व दीर्घकालिक संबंध बनाने में विश्वास रखते हैं।'
    },
    whyChooseUs: [
      {
        title: { type: String, required: true },
        titleHi: { type: String, required: true },
        description: { type: String, required: true },
        descriptionHi: { type: String, required: true },
        iconName: { type: String, default: 'ShieldCheck' }
      }
    ],
    dealerName: { type: String, default: 'Banshidhar Kumar' },
    phone: { type: String, default: '+91 9876543210' },
    whatsappNumber: { type: String, default: '+919876543210' },
    email: { type: String, default: 'contact@banshidharpoultry.com' },
    address: { type: String, default: 'Main Road, Near Kisan Chowk, Bihar - 800001' },
    addressHi: { type: String, default: 'मुख्य मार्ग, किसान चौक के पास, बिहार - 800001' },
    googleMapsUrl: { type: String, default: 'https://maps.google.com' },
    businessHours: { type: String, default: 'Mon - Sun: 7:00 AM - 8:00 PM' },
    businessHoursHi: { type: String, default: 'सोमवार - रविवार: प्रातः 7:00 बजे से सायं 8:00 बजे तक' },
    showRatesSection: { type: Boolean, default: true },
    showAppDownloadSection: { type: Boolean, default: true },
    showCalculatorSection: { type: Boolean, default: true },
    footerNotice: { type: String, default: 'All rights reserved. Digital Poultry Dealer Management System.' },
    footerNoticeHi: { type: String, default: 'सर्वाधिकार सुरक्षित। डिजिटल पोल्ट्री प्रबंधन प्रणाली।' }
  },
  { timestamps: true }
);

export const WebsiteSettings = mongoose.model<IWebsiteSettings>(
  'WebsiteSettings',
  WebsiteSettingsSchema
);
