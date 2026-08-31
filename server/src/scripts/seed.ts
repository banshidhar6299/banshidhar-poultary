import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Admin } from '../models/Admin';
import { Farmer } from '../models/Farmer';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { RateCard } from '../models/RateCard';
import { LedgerTransaction } from '../models/LedgerTransaction';
import { ChickBatch } from '../models/ChickBatch';
import { Conversation } from '../models/Conversation';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { AISettings } from '../models/AISettings';

const seed = async () => {
  // ⚠️ PRODUCTION SAFETY GUARD
  if (process.env.NODE_ENV === 'production') {
    console.error('\n❌ FATAL: Cannot run seed script in production!');
    console.error('   The seed script DESTROYS ALL DATA and creates demo accounts.');
    console.error('   This is only for local development.\n');
    process.exit(1);
  }

  console.warn('\n⚠️  WARNING: This seed script will DELETE ALL existing data!');
  console.warn('⚠️  Default credentials (admin/admin123, farmer123) are for DEVELOPMENT ONLY.');
  console.warn('⚠️  NEVER use these credentials in production.\n');

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banshidhar_poultry';
  console.log(`[Seed] Connecting to MongoDB: ${mongoURI}`);
  await mongoose.connect(mongoURI);

  console.log('[Seed] Clearing existing collections for fresh setup...');
  await Promise.all([
    Admin.deleteMany({}),
    Farmer.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    RateCard.deleteMany({}),
    LedgerTransaction.deleteMany({}),
    ChickBatch.deleteMany({}),
    Conversation.deleteMany({}),
    WebsiteSettings.deleteMany({}),
    AISettings.deleteMany({})
  ]);

  console.log('[Seed] Creating default Admin...');
  const adminSalt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', adminSalt);

  const admin = await Admin.create({
    username: 'admin',
    email: 'admin@banshidharpoultry.com',
    passwordHash: adminPasswordHash,
    name: 'Banshidhar Poultry Admin',
    phone: '+91 9876543210',
    role: 'ADMIN'
  });

  console.log('[Seed] Creating Categories...');
  const catFeed = await Category.create({
    name: 'Feed & Nutrition',
    nameHi: 'दाना एवं पोषण आहार',
    slug: 'feed-nutrition',
    description: 'High FCR balanced broiler poultry feeds',
    descriptionHi: 'बेहतर बढ़वार और वजन के लिए संतुलित ब्रायलर दाना',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    displayOrder: 1,
    isActive: true
  });

  const catChicks = await Category.create({
    name: 'Day-Old Chicks',
    nameHi: 'एक-दिवसीय चूजे',
    slug: 'day-old-chicks',
    description: 'Certified disease-free vaccinated broiler chicks',
    descriptionHi: 'प्रमाणित टीकाकरण युक्त उच्च कोटि के ब्रायलर चूजे',
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    displayOrder: 2,
    isActive: true
  });

  const catMeds = await Category.create({
    name: 'Supplements & Bio-care',
    nameHi: 'सप्लीमेंट्स एवं दवाइयां',
    slug: 'supplements-biocare',
    description: 'Essential poultry vitamins, electrolytes, and acidifiers',
    descriptionHi: 'आवश्यक पोल्ट्री विटामिन, इलेक्ट्रोलाइट्स और बायो-केयर',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    displayOrder: 3,
    isActive: true
  });

  console.log('[Seed] Creating Products...');
  const prodPreStarter = await Product.create({
    name: 'Banshidhar Pre-Starter Crumbs (50kg)',
    nameHi: 'बंशीधर प्री-स्टार्टर दाना (50 किग्रा)',
    category: catFeed._id,
    brand: 'Banshidhar Quality Feeds',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
    shortDescription: 'High protein (23%) micro-crumbs for Days 1-10 chick brooding.',
    shortDescriptionHi: '1-10 दिन के चूजों की तीव्र वृद्धि हेतु 23% प्रोटीन युक्त बारीक दाना।',
    fullDescription: 'Enriched with essential amino acids, digestive enzymes, and probiotics for gut development.',
    price: 1750,
    unit: '50kg Bag',
    unitHi: '50 किग्रा बोरी',
    bagWeightKg: 50,
    inStock: true,
    isFeatured: true,
    isActive: true,
    displayOrder: 1
  });

  const prodStarter = await Product.create({
    name: 'Banshidhar Broiler Starter Feed (50kg)',
    nameHi: 'बंशीधर ब्रायलर स्टार्टर दाना (50 किग्रा)',
    category: catFeed._id,
    brand: 'Banshidhar Quality Feeds',
    imageUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80',
    shortDescription: 'Nutrient-rich starter feed for Days 11-24 skeletal and muscle growth.',
    shortDescriptionHi: '11-24 दिन के पक्षियों के संपूर्ण विकास हेतु संतुलित दाना।',
    price: 1650,
    unit: '50kg Bag',
    unitHi: '50 किग्रा बोरी',
    bagWeightKg: 50,
    inStock: true,
    isFeatured: true,
    isActive: true,
    displayOrder: 2
  });

  const prodFinisher = await Product.create({
    name: 'Banshidhar Broiler Finisher Pellets (50kg)',
    nameHi: 'बंशीधर ब्रायलर फिनिशर दाना (50 किग्रा)',
    category: catFeed._id,
    brand: 'Banshidhar Quality Feeds',
    imageUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=600&q=80',
    shortDescription: 'High energy finisher pellets for Days 25+ fast weight gain.',
    shortDescriptionHi: '25 दिन से बाजार बिक्री तक अधिकतम वजन और बेहतर FCR हेतु।',
    price: 1600,
    unit: '50kg Bag',
    unitHi: '50 किग्रा बोरी',
    bagWeightKg: 50,
    inStock: true,
    isFeatured: true,
    isActive: true,
    displayOrder: 3
  });

  const prodChicks = await Product.create({
    name: 'Cobb 500 Broiler Day-Old Chicks',
    nameHi: 'कॉब 500 ब्रायलर एक-दिवसीय चूजे',
    category: catChicks._id,
    brand: 'Banshidhar Hatchery Select',
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    shortDescription: 'Top genetic line vaccinated against Marek & Ranikhet.',
    shortDescriptionHi: 'उच्च आनुवंशिक क्षमता और टीके से सुरक्षित स्वस्थ चूजे।',
    price: 35,
    unit: 'per Chick',
    unitHi: 'प्रति चूजा',
    inStock: true,
    isFeatured: true,
    isActive: true,
    displayOrder: 4
  });

  const prodVitamins = await Product.create({
    name: 'Banshidhar GrowTonic Vitamin Supplement (1L)',
    nameHi: 'बंशीधर ग्रो-टॉनिक मल्टीविटामिन (1 लीटर)',
    category: catMeds._id,
    brand: 'Banshidhar BioCare',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    shortDescription: 'Anti-stress vitamin A, D3, E & B-Complex formula for immunity.',
    shortDescriptionHi: 'तनाव मुक्ति और रोग प्रतिरोधक क्षमता बढ़ाने हेतु प्रीमियम विटामिन।',
    price: 450,
    unit: '1L Bottle',
    unitHi: '1 लीटर बोतल',
    inStock: true,
    isFeatured: false,
    isActive: true,
    displayOrder: 5
  });

  console.log('[Seed] Creating Today Rate Cards...');
  await RateCard.create([
    {
      title: 'Broiler Chick Price',
      titleHi: 'आज का चूजा रेट',
      rate: 35,
      unit: 'per Chick',
      unitHi: 'प्रति चूजा',
      effectiveDate: new Date(),
      note: 'Cobb 500 / Ross 308 Day-old',
      noteHi: 'कॉब 500 / रॉस 308',
      displayOrder: 1,
      isActive: true
    },
    {
      title: 'Broiler Live Bird Farm Rate',
      titleHi: 'तैयार ब्रायलर उठान रेट',
      rate: 120,
      unit: 'per KG Live Weight',
      unitHi: 'प्रति किग्रा लाइव वजन',
      effectiveDate: new Date(),
      note: 'Farm gate lifting cash settlement',
      noteHi: 'फार्म गेट पर नकद निपटान',
      displayOrder: 2,
      isActive: true
    },
    {
      title: 'Starter Feed Bag Rate',
      titleHi: 'स्टार्टर दाना बोरी रेट',
      rate: 1650,
      unit: 'per 50kg Bag',
      unitHi: 'प्रति 50 किग्रा बोरी',
      effectiveDate: new Date(),
      note: 'Premium crumble feed',
      noteHi: 'प्रीमियम क्रम्बल दाना',
      displayOrder: 3,
      isActive: true
    },
    {
      title: 'Finisher Feed Bag Rate',
      titleHi: 'फिनिशर दाना बोरी रेट',
      rate: 1600,
      unit: 'per 50kg Bag',
      unitHi: 'प्रति 50 किग्रा बोरी',
      effectiveDate: new Date(),
      note: 'High energy pellet',
      noteHi: 'उच्च ऊर्जा पेलेट दाना',
      displayOrder: 4,
      isActive: true
    }
  ]);

  console.log('[Seed] Creating sample test Farmer...');
  const farmerSalt = await bcrypt.genSalt(10);
  const farmerPasswordHash = await bcrypt.hash('farmer123', farmerSalt);

  const farmer = await Farmer.create({
    farmerId: 'BP-1001',
    username: 'BP-1001',
    passwordHash: farmerPasswordHash,
    mustChangePassword: false,
    name: 'Rameshwar Yadav',
    phone: '+91 9876541234',
    email: 'rameshwar@example.com',
    farmName: 'Yadav Broiler Farm',
    address: 'Near Kali Mandir, Station Road',
    village: 'Hasanpur',
    district: 'Samastipur',
    state: 'Bihar',
    pinCode: '848206',
    farmCapacity: 2000,
    status: 'ACTIVE'
  });

  // Conversation for test farmer
  await Conversation.create({
    farmerId: farmer._id,
    farmerName: farmer.name,
    lastMessage: 'Welcome to Banshidhar Poultry Farmer Portal!',
    lastMessageAt: new Date()
  });

  console.log('[Seed] Creating test flock batch for Farmer...');
  const batch = await ChickBatch.create({
    batchNumber: 'BATCH-2026-001',
    farmerId: farmer._id,
    farmerName: farmer.name,
    breed: 'Broiler (Cobb 500)',
    chicksSupplied: 1000,
    startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
    initialChicksCost: 35000,
    ratePerChick: 35,
    mortalityCount: 15,
    status: 'ACTIVE',
    notes: 'Healthy batch, standard weight progression'
  });

  console.log('[Seed] Creating sample ledger records for Farmer...');
  // 1. Chick Supply Debit: 1000 * 35 = ₹35,000
  await LedgerTransaction.create({
    farmerId: farmer._id,
    farmerName: farmer.name,
    transactionDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    transactionType: 'CHICK_PURCHASE',
    description: 'Chick Supply: 1000 Chicks (Cobb 500) @ ₹35',
    descriptionHi: 'चूजा आपूर्ति: 1000 चूजे (कॉब 500) @ ₹35',
    quantity: 1000,
    unit: 'Chicks',
    rate: 35,
    debit: 35000,
    credit: 0,
    referenceId: batch.batchNumber,
    referenceType: 'CHICK_SUPPLY',
    createdBy: 'ADMIN'
  });

  // 2. Starter Feed Purchase Debit: 2 bags * ₹1,600 = ₹3,200
  await LedgerTransaction.create({
    farmerId: farmer._id,
    farmerName: farmer.name,
    transactionDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    transactionType: 'PRODUCT_PURCHASE',
    description: 'Purchase: 2 Bags Broiler Starter Feed (50kg) @ ₹1,600',
    descriptionHi: 'खरीद: 2 बोरी ब्रायलर स्टार्टर दाना @ ₹1,600',
    quantity: 2,
    unit: '50kg Bag',
    rate: 1600,
    debit: 3200,
    credit: 0,
    referenceId: 'ORD-2026-0001',
    referenceType: 'ORDER',
    createdBy: 'ADMIN'
  });

  // 3. Payment Received Credit: ₹20,000 (Remaining Due: 35,000 + 3,200 - 20,000 = ₹18,200)
  await LedgerTransaction.create({
    farmerId: farmer._id,
    farmerName: farmer.name,
    transactionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    transactionType: 'PAYMENT_RECEIVED',
    description: 'Cash Payment Received at Banshidhar Dealer Counter',
    descriptionHi: 'दुकान काउंटर पर नकद भुगतान प्राप्त',
    debit: 0,
    credit: 20000,
    referenceId: 'RCPT-1082',
    referenceType: 'PAYMENT',
    createdBy: 'ADMIN'
  });

  console.log('[Seed] Initializing Website & AI Settings...');
  await WebsiteSettings.create({
    businessName: 'BANSHIDHAR POULTRY',
    businessNameHi: 'बंशीधर पोल्ट्री',
    tagline: 'Your Trusted Partner in Quality Poultry Farming & Chick Supply',
    taglineHi: 'गुणवत्तापूर्ण पोल्ट्री फार्मिंग और चूजा आपूर्ति में आपका विश्वसनीय साथी',
    heroTitle: 'BANSHIDHAR POULTRY',
    heroTitleHi: 'बंशीधर पोल्ट्री फार्मिंग',
    heroSubtitle: 'Premium Quality Day-Old Chicks, Scientifically Balanced Feed & Guaranteed Bird Lifting at Transparent Market Rates.',
    heroSubtitleHi: 'उच्च गुणवत्ता वाले चूजे, वैज्ञानिक रूप से तैयार संतुलित दाना और पारदर्शी बाजार भाव पर त्वरित मुर्गी उठान।',
    ctaPrimaryText: 'View Products',
    ctaPrimaryTextHi: 'उत्पाद सूची देखें',
    dealerName: 'Banshidhar Kumar',
    phone: '+91 9876543210',
    whatsappNumber: '+919876543210',
    email: 'contact@banshidharpoultry.com',
    address: 'Kisan Chowk, Main Market Road, Samastipur, Bihar - 848101',
    addressHi: 'किसान चौक, मुख्य बाजार मार्ग, समस्तीपुर, बिहार - 848101',
    googleMapsUrl: 'https://maps.google.com',
    businessHours: 'Mon - Sun: 6:00 AM - 8:00 PM',
    businessHoursHi: 'सोमवार - रविवार: प्रातः 6:00 बजे से सायं 8:00 बजे तक',
    showRatesSection: true,
    showAppDownloadSection: true,
    showCalculatorSection: true,
    whyChooseUs: [
      {
        title: 'Quality Broiler Chicks',
        titleHi: 'उच्च गुणवत्ता वाले चूजे',
        description: 'Healthy, vaccinated day-old chicks from certified high-yield hatcheries.',
        descriptionHi: 'प्रमाणित हैचरी से स्वस्थ, टीकाकरण युक्त एक-दिवसीय चूजे।',
        iconName: 'Award'
      },
      {
        title: 'Balanced Protein Feed',
        titleHi: 'संतुलित प्रोटीन दाना',
        description: 'Scientifically formulated Pre-Starter, Starter, and Finisher feeds for optimal FCR.',
        descriptionHi: 'बेहतर FCR और तेज वजन वृद्धि के लिए वैज्ञानिक रूप से तैयार दाना।',
        iconName: 'PackageCheck'
      },
      {
        title: 'Transparent Market Rates',
        titleHi: 'पारदर्शी बाजार दरें',
        description: 'Daily fair chick and broiler market rates with zero hidden charges.',
        descriptionHi: 'बिना किसी छुपे खर्च के दैनिक निष्पक्ष चूजा और ब्रायलर दरें।',
        iconName: 'TrendingUp'
      },
      {
        title: 'Digital Passbook & Support',
        titleHi: 'डिजिटल खाता व त्वरित सहायता',
        description: 'Instant mobile statement, flock management advice, and prompt bird lifting.',
        descriptionHi: 'मोबाइल पर तुरंत खाता पर्ची, फार्म प्रबंधन सलाह और समय पर मुर्गी उठान।',
        iconName: 'Smartphone'
      }
    ]
  });

  await AISettings.create({
    isEnabled: true,
    primaryProvider: 'agentrouter',
    providerPriority: ['agentrouter', 'gemini', 'groq'],
    agentRouterModel: 'claude-3-5-sonnet-20241022',
    geminiModel: 'gemini-1.5-flash',
    groqModel: 'llama-3.3-70b-versatile',
    maxResponseTokens: 800,
    dailyQueryLimitPerFarmer: 30,
    circuitBreakerCooldownSec: 60
  });

  console.log('\n======================================================');
  console.log('✅ BANSHIDHAR POULTRY SEED COMPLETED SUCCESSFULLY!');
  console.log('------------------------------------------------------');
  console.log('Admin Login:   admin / admin123');
  console.log('Farmer Login:  BP-1001 / farmer123');
  console.log('======================================================\n');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
