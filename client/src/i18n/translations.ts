export type Language = 'en' | 'hi';

export const translations = {
  en: {
    brand: {
      name: 'BANSHIDHAR POULTRY',
      tagline: 'Quality Broiler Chicks, Balanced Feeds & Guaranteed Bird Lifting'
    },
    nav: {
      home: 'Home',
      products: 'Products',
      categories: 'Categories',
      rates: "Today's Rates (आज का भाव)",
      calculator: 'Weight Calculator',
      about: 'About Us',
      joinUs: 'Join as Farmer',
      contact: 'Contact Us',
      farmerLogin: 'Farmer Login',
      adminPortal: 'Admin Portal',
      logout: 'Logout'
    },
    hero: {
      badge: 'Authorized Day-Old Chick & Feed Dealership',
      title: 'BANSHIDHAR POULTRY',
      subtitle: 'Premium Day-Old Broiler Chicks, High-FCR Balanced Feed & Transparent Farm-Gate Bird Lifting Settlements.',
      viewProducts: 'View Catalog',
      farmerLogin: 'Farmer Portal (लॉगिन)',
      joinUs: 'Join With Us'
    },
    appDownload: {
      badge: 'Installable App',
      title: 'Install Banshidhar Farmer App',
      description: 'Get daily live rates, order chicks & feed, manage your digital passbook (बकाया / एडवांस), and access 24/7 AI poultry guidance directly on your phone.',
      installBtn: 'Install Farmer App (PWA)',
      installed: 'App Installed on this device',
      loginBtn: 'Open Farmer Portal'
    },
    rates: {
      title: "Today's Poultry Rates (आज का बाजार भाव)",
      subtitle: 'Live daily dealer rates updated by Banshidhar Poultry',
      effectiveDate: 'Effective Date',
      lastUpdated: 'Last Updated',
      note: 'Note'
    },
    calculator: {
      title: 'Automatic Weight × Rate Calculator (तौल कैलकुलेटर)',
      subtitle: 'Instant gross calculation: Birds Count × Avg Weight (KG) × Live Rate/KG',
      weightLabel: 'Total Weight (KG)',
      rateLabel: 'Rate per KG (₹)',
      birdsCount: 'Number of Birds',
      avgWeight: 'Average Weight per Bird (KG)',
      totalAmount: 'Total Gross Amount (₹)',
      clear: 'Reset',
      formula: 'Formula: Total KG × Rate/KG'
    },
    products: {
      title: 'Product Catalog (दाना एवं चूजा सूची)',
      subtitle: 'Scientifically balanced feeds, healthy broiler chicks, and essential farm supplements',
      allCategories: 'All Categories',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      brand: 'Brand',
      unit: 'Unit',
      price: 'Price',
      catalogueOnlyNote: 'Display catalog only. Registered farmers can place direct orders from their portal.'
    },
    about: {
      title: 'About Banshidhar Poultry',
      dealershipBadge: 'Trusted Dealership Partner',
      experience: 'Years of Commitment & Farmer Trust',
      whyChooseUsTitle: 'Why Choose Banshidhar Poultry?'
    },
    joinUs: {
      title: 'Join With Us as a Partner Farmer',
      subtitle: 'Submit your farm details to start receiving premium chicks, feed supply, and prompt bird lifting support',
      fullName: 'Farmer Full Name',
      phone: 'Mobile Number',
      email: 'Email Address (Optional)',
      farmName: 'Farm Name (Optional)',
      farmAddress: 'Farm Address / Location',
      village: 'Village / Town',
      district: 'District',
      state: 'State',
      pinCode: 'PIN Code',
      farmSize: 'Farm Shed Capacity (Birds)',
      farmerType: 'Experience Level',
      newFarmer: 'New to Poultry Farming',
      existingFarmer: 'Experienced Poultry Farmer',
      expectedChicks: 'Expected Chicks per Batch',
      message: 'Additional Notes / Requirements',
      submitBtn: 'Submit Registration Request',
      submitting: 'Submitting application...',
      successMsg: 'Application submitted successfully! Our team will contact you shortly.'
    },
    contact: {
      title: 'Dealership Contact & Office',
      subtitle: 'Reach out to Banshidhar Poultry office for supplies, chicks, or farm inquiries',
      dealerName: 'Dealer / Proprietor',
      phone: 'Call Dealer',
      whatsapp: 'WhatsApp Direct',
      directions: 'Google Maps Directions',
      address: 'Office Address',
      hours: 'Working Hours'
    },
    farmer: {
      welcome: 'Welcome,',
      farmerId: 'Farmer ID',
      dueBalance: 'Due Balance (आपका बकाया)',
      advanceBalance: 'Advance Balance (आपका एडवांस)',
      clearBalance: 'Account Settled (हिसाब चुकता)',
      activeFlock: 'Active Flock Batch (सक्रिय बैच)',
      daysOld: 'Days Old (दिन)',
      chicksSupplied: 'Chicks Supplied (कुल चूजे)',
      quickRates: "Today's Market Rates (आज का भाव)",
      latestOrder: 'Recent Order',
      orderNow: 'Order Products',
      viewLedger: 'View Digital Passbook (खाता)',
      informSale: 'Inform Dealer: Birds Ready for Lifting (मुर्गी उठान)',
      bottomNav: {
        home: 'Home',
        products: 'Products',
        orders: 'Orders',
        ledger: 'Passbook (खाता)',
        chat: 'Messages'
      }
    },
    ledger: {
      title: 'Digital Passbook & Ledger (डिजिटल खाता)',
      totalPurchases: 'Total Purchases (कुल खरीद / Debit)',
      totalPayments: 'Total Payments (कुल भुगतान / Credit)',
      currentStatus: 'Account Status',
      downloadPDF: 'Download PDF Statement (खाता पर्ची)',
      date: 'Date',
      description: 'Particulars / Description',
      reference: 'Bill / Ref ID',
      debit: 'Debit / खरीद (₹)',
      credit: 'Credit / जमा (₹)',
      balance: 'Balance / शेष (₹)',
      emptyLedger: 'No transactions recorded yet in this passbook.'
    },
    orders: {
      title: 'My Orders (ऑर्डर सूची)',
      orderId: 'Order ID',
      items: 'Items',
      total: 'Total Amount',
      status: 'Status',
      statusPending: 'Pending Approval',
      statusConfirmed: 'Confirmed',
      statusDelivered: 'Delivered',
      statusCancelled: 'Cancelled',
      placeOrder: 'Confirm & Place Order',
      addToOrder: 'Add',
      quantity: 'Qty',
      orderSuccess: 'Order placed successfully!'
    },
    chat: {
      title: 'Dealership Direct Chat',
      online: 'Online',
      typing: 'typing...',
      placeholder: 'Type your message or query...',
      recordVoice: 'Record Voice Note (वॉयस संदेश)',
      recording: 'Recording audio...',
      send: 'Send',
      cancel: 'Cancel',
      uploadMedia: 'Attach Photo/Video'
    },
    ai: {
      title: 'Poultry AI Doctor (कुक्कुट मित्र)',
      badge: '24/7 AI Health Assistant',
      placeholder: 'Ask about brooding temperature, feed, symptoms, or attach a photo...',
      analyzing: 'AI analyzing symptoms and poultry knowledge...',
      disclaimer: 'Note: AI guidance is for general farm assistance. For serious diseases, consult a certified veterinarian.',
      uploadPhoto: 'Upload Bird/Dropping Photo'
    },
    common: {
      loading: 'Loading...',
      save: 'Save Changes',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View Details',
      submit: 'Submit',
      search: 'Search...',
      filter: 'Filter',
      status: 'Status',
      actions: 'Actions',
      back: 'Back',
      all: 'All',
      yes: 'Yes',
      no: 'No',
      admin: 'Admin'
    }
  },
  hi: {
    brand: {
      name: 'बंशीधर पोल्ट्री',
      tagline: 'क्वालिटी ब्रायलर चूजे, संतुलित दाना और मुर्गियों का समय पर उठान'
    },
    nav: {
      home: 'Home (होम)',
      products: 'Products (उत्पाद)',
      categories: 'Categories (श्रेणियां)',
      rates: 'Today Rates (आज का भाव)',
      calculator: 'Weight Calculator (कैलकुलेटर)',
      about: 'About (हमारे बारे में)',
      joinUs: 'Join Farmer (जुड़ें)',
      contact: 'Contact (संपर्क)',
      farmerLogin: 'Farmer Login (किसान लॉगिन)',
      adminPortal: 'Admin Portal (एडमिन)',
      logout: 'Logout (लॉगआउट)'
    },
    hero: {
      badge: 'Authorized Day-Old Chick & Feed Dealership',
      title: 'बंशीधर पोल्ट्री',
      subtitle: 'उच्च गुणवत्ता वाले ब्रायलर चूजे, हाई-FCR संतुलित दाना और पारदर्शी बाजार दर पर त्वरित फार्म-गेट मुर्गी उठान।',
      viewProducts: 'उत्पाद देखें (Products)',
      farmerLogin: 'Farmer Portal (लॉगिन)',
      joinUs: 'हमारे साथ जुड़ें (Join Us)'
    },
    appDownload: {
      badge: 'Installable App',
      title: 'अपने फोन में Farmer App इंस्टॉल करें',
      description: 'दैनिक बाजार भाव, दाना-चूजा ऑर्डर, डिजिटल पासबुक (बकाया / एडवांस) और 24/7 AI पोल्ट्री डॉक्टर के लिए ऐप इंस्टॉल करें।',
      installBtn: 'Install Farmer App (PWA)',
      installed: 'App आपके डिवाइस पर इंस्टॉल है',
      loginBtn: 'पोर्टल में लॉगिन करें'
    },
    rates: {
      title: 'Today Rates (आज का बाजार भाव)',
      subtitle: 'बंशीधर पोल्ट्री प्रबंधन द्वारा प्रतिदिन अपडेट किया जाने वाला आधिकारिक भाव',
      effectiveDate: 'Effective Date',
      lastUpdated: 'Last Updated',
      note: 'Note'
    },
    calculator: {
      title: 'Weight × Rate Calculator (तौल कैलकुलेटर)',
      subtitle: 'मुर्गी वजन (KG) और लाइव रेट डालकर कुल राशि तुरंत निकालें',
      weightLabel: 'कुल वजन / Total Weight (KG)',
      rateLabel: 'दर प्रति किग्रा / Rate per KG (₹)',
      birdsCount: 'मुर्गियों की संख्या (Birds)',
      avgWeight: 'औसत वजन / Avg Weight (KG)',
      totalAmount: 'कुल सकल राशि / Total Amount (₹)',
      clear: 'Reset',
      formula: 'गणना: कुल किग्रा × प्रति किग्रा रेट'
    },
    products: {
      title: 'Product Catalog (दाना एवं चूजा सूची)',
      subtitle: 'वैज्ञानिक रूप से तैयार प्री-स्टार्टर, स्टार्टर, फिनिशर दाना और स्वस्थ चूजे',
      allCategories: 'All Categories',
      inStock: 'Available (उपलब्ध)',
      outOfStock: 'Out of Stock',
      brand: 'Brand',
      unit: 'Unit',
      price: 'Price',
      catalogueOnlyNote: 'यह केवल डिस्प्ले कैटलॉग है। रजिस्टर्ड किसान अपने पोर्टल से सीधे ऑर्डर कर सकते हैं।'
    },
    about: {
      title: 'बंशीधर पोल्ट्री के बारे में',
      dealershipBadge: 'Authorized Dealership',
      experience: 'विश्वास और गुणवत्तापूर्ण सेवा के वर्ष',
      whyChooseUsTitle: 'बंशीधर पोल्ट्री क्यों चुनें?'
    },
    joinUs: {
      title: 'क्या आप पार्टनर किसान के रूप में जुड़ना चाहते हैं?',
      subtitle: 'गुणवत्तापूर्ण चूजे, दाना और उठान सेवा प्राप्त करने के लिए अपने फार्म का विवरण भरें',
      fullName: 'किसान का पूरा नाम (Full Name)',
      phone: 'मोबाइल नंबर (Phone)',
      email: 'ईमेल (Email Optional)',
      farmName: 'फार्म का नाम (Farm Name)',
      farmAddress: 'फार्म का पूरा पता (Address)',
      village: 'गांव / कस्बा (Village)',
      district: 'जिला (District)',
      state: 'राज्य (State)',
      pinCode: 'पिन कोड (PIN Code)',
      farmSize: 'फार्म शेड क्षमता (Birds Capacity)',
      farmerType: 'अनुभव का प्रकार',
      newFarmer: 'नया पोल्ट्री किसान (New Farmer)',
      existingFarmer: 'अनुभवी पोल्ट्री किसान (Existing Farmer)',
      expectedChicks: 'प्रति बैच चूजों की संख्या',
      message: 'अन्य कोई विवरण या टिप्पणी',
      submitBtn: 'आवेदन जमा करें (Submit)',
      submitting: 'आवेदन भेजा जा रहा है...',
      successMsg: 'धन्यवाद! आपका आवेदन प्राप्त हो गया है। हमारी टीम जल्द आपसे संपर्क करेगी।'
    },
    contact: {
      title: 'डीलरशिप कार्यालय व संपर्क',
      subtitle: 'चूजा, दाना या मुर्गी उठान के लिए बंशीधर पोल्ट्री कार्यालय से संपर्क करें',
      dealerName: 'Dealer / Proprietor',
      phone: 'कॉल करें (Call Us)',
      whatsapp: 'WhatsApp Direct',
      directions: 'नक्शा देखें (Map)',
      address: 'कार्यालय का पता',
      hours: 'कार्य समय (Hours)'
    },
    farmer: {
      welcome: 'स्वागत है,',
      farmerId: 'Farmer ID',
      dueBalance: 'Due Balance (आपका बकाया)',
      advanceBalance: 'Advance Balance (आपका एडवांस)',
      clearBalance: 'Account Settled (हिसाब चुकता)',
      activeFlock: 'Active Batch (सक्रिय फ्लॉक)',
      daysOld: 'दिन का चूजा (Days Old)',
      chicksSupplied: 'डाले गए चूजे (Supplied)',
      quickRates: 'Today Rates (आज का भाव)',
      latestOrder: 'Recent Order',
      orderNow: 'नया ऑर्डर करें (Order Now)',
      viewLedger: 'डिजिटल पासबुक देखें (Passbook)',
      informSale: 'डीलर को सूचना दें: मुर्गियां उठान के लिए तैयार हैं',
      bottomNav: {
        home: 'Home',
        products: 'Products',
        orders: 'Orders',
        ledger: 'Passbook (खाता)',
        chat: 'Messages'
      }
    },
    ledger: {
      title: 'Digital Passbook (डिजिटल खाता)',
      totalPurchases: 'कुल खरीद (Total Debit)',
      totalPayments: 'कुल भुगतान (Total Credit)',
      currentStatus: 'खाता स्थिति (Status)',
      downloadPDF: 'PDF खाता पर्ची डाउनलोड करें (Download Statement)',
      date: 'तारीख (Date)',
      description: 'विवरण (Particulars)',
      reference: 'Ref / Bill ID',
      debit: 'Debit / खरीद (₹)',
      credit: 'Credit / जमा (₹)',
      balance: 'Balance / शेष (₹)',
      emptyLedger: 'पासबुक में अभी कोई लेन-देन दर्ज नहीं है।'
    },
    orders: {
      title: 'मेरे ऑर्डर (My Orders)',
      orderId: 'Order ID',
      items: 'सामग्री (Items)',
      total: 'कुल राशि (Total Amount)',
      status: 'Status',
      statusPending: 'Pending (लंबित)',
      statusConfirmed: 'Confirmed (कन्फर्म)',
      statusDelivered: 'Delivered (डिलीवर)',
      statusCancelled: 'Cancelled (रद्द)',
      placeOrder: 'ऑर्डर कन्फर्म करें (Place Order)',
      addToOrder: 'जोड़ें (+)',
      quantity: 'Qty',
      orderSuccess: 'ऑर्डर सफलतापूर्वक दर्ज हो गया!'
    },
    chat: {
      title: 'डीलर से सीधी बातचीत (Chat)',
      online: 'Online',
      typing: 'लिख रहे हैं...',
      placeholder: 'अपना संदेश लिखें...',
      recordVoice: 'वॉयस नोट भेजें (Voice Note)',
      recording: 'ऑडियो रिकॉर्डिंग हो रही है...',
      send: 'भेजें (Send)',
      cancel: 'रद्द करें',
      uploadMedia: 'फोटो/वीडियो जोड़ें'
    },
    ai: {
      title: 'कुक्कुट मित्र (Poultry AI Doctor)',
      badge: '24/7 AI Health Assistant',
      placeholder: 'चूजे की देखभाल, दाना, तापमान या बीमारी के लक्षण पूछें...',
      analyzing: 'AI लक्षणों और पोल्ट्री ज्ञान का विश्लेषण कर रहा है...',
      disclaimer: 'सूचना: यह केवल सामान्य फार्म सलाह है। गंभीर बीमारी में डॉक्टर से संपर्क करें।',
      uploadPhoto: 'मुर्गी या बीट की फोटो भेजें'
    },
    common: {
      loading: 'लोड हो रहा है...',
      save: 'Save (सुरक्षित करें)',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      submit: 'Submit',
      search: 'Search (खोजें)...',
      filter: 'Filter',
      status: 'Status',
      actions: 'Actions',
      back: 'Back',
      all: 'All (सभी)',
      yes: 'Yes',
      no: 'No',
      admin: 'Admin'
    }
  }
};
