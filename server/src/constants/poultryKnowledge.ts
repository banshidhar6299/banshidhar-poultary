export interface KnowledgeItem {
  id: string;
  category: string;
  keywords: string[];
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
}

export const POULTRY_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'brooding-temp',
    category: 'Brooding & Temperature',
    keywords: ['brooding', 'temperature', 'chick cold', 'huddling', 'heater', 'तापमान', 'चूजा', 'ठंड', 'ब्रूडिंग'],
    titleEn: 'Day-Old Chick Brooding & Temperature Management',
    titleHi: 'चूजों की ब्रूडिंग और तापमान प्रबंधन',
    contentEn: 'For the first 7 days, chicks require 90-95°F (32-35°C). Reduce temperature by 5°F each week until reaching 70°F (21°C). Watch chick behavior: if huddled under brooder, they are too cold; if panting and running to edges, they are too hot; if evenly spread and active, temperature is optimal.',
    contentHi: 'पहले सप्ताह में चूजों को 90-95°F (32-35°C) तापमान की आवश्यकता होती है। इसके बाद हर हफ्ते 5°F कम करें जब तक कि 70°F न हो जाए। चूजों के व्यवहार को देखें: यदि वे हीटर के पास एक साथ चिपक रहे हैं, तो ठंड लग रही है; यदि हांफ रहे हैं और कोनों में जा रहे हैं, तो गर्मी ज्यादा है; यदि पूरे ब्रूडर में समान रूप से घूम रहे हैं, तो तापमान सही है।'
  },
  {
    id: 'feed-management',
    category: 'Feed & Nutrition',
    keywords: ['feed', 'starter', 'finisher', 'pre-starter', 'growth', 'दाना', 'वजन', 'खुराक', 'स्टार्टर'],
    titleEn: 'Broiler Feed Stages & Optimal Growth',
    titleHi: 'ब्रायलर दाना चरण और वजन वृद्धि',
    contentEn: 'Feed stages: 1) Pre-Starter: Days 1-10 (high protein ~22-23%, fine crumbs). 2) Starter Feed: Days 11-24 (balanced nutrition for skeletal & muscle growth). 3) Finisher Feed: Day 25 to market weight (high energy for rapid weight gain). Always provide clean, toxin-free feed with consistent feeding timings.',
    contentHi: 'दाना प्रबंधन के तीन मुख्य चरण: 1) प्री-स्टार्टर (1-10 दिन): उच्च प्रोटीन (~22-23%), बारीक दाना। 2) स्टार्टर (11-24 दिन): हड्डियों और मांसपेशियों के विकास के लिए संतुलित आहार। 3) फिनिशर (25 दिन से बाजार बिक्री तक): उच्च ऊर्जा वाला दाना। हमेशा स्वच्छ, फफूंदी-रहित और ताज़ा दाना दें।'
  },
  {
    id: 'water-management',
    category: 'Water & Hygiene',
    keywords: ['water', 'drinker', 'cleanliness', 'acidifier', 'पानी', 'सफाई', 'सैनिटाइजर'],
    titleEn: 'Drinking Water Management & Acidification',
    titleHi: 'पीने का पानी और स्वच्छता',
    contentEn: 'Water is crucial for growth (birds drink twice the weight of feed consumed). Keep water pH between 6.0-6.5 using water acidifiers. Clean and sanitize drinker lines daily. Provide electrolyte / vitamin C supplementation during extreme hot days.',
    contentHi: 'पानी चूजों की वृद्धि के लिए अत्यंत महत्वपूर्ण है (मुर्गी जितना दाना खाती है उससे दोगुना पानी पीती है)। पानी का pH 6.0 से 6.5 के बीच रखें। रोजाना ड्रिंकर की अच्छी सफाई करें। अत्यधिक गर्मी के दिनों में इलेक्ट्रोलाइट्स और विटामिन C का पानी में प्रयोग करें।'
  },
  {
    id: 'litter-ventilation',
    category: 'Litter & Air Quality',
    keywords: ['litter', 'ammonia', 'ventilation', 'rice husk', 'sawdust', 'बिछाली', 'अमोनिया', 'हवा', 'गैस'],
    titleEn: 'Litter Management & Ammonia Control',
    titleHi: 'बिछाली (लीटर) प्रबंधन और गैस नियंत्रण',
    contentEn: 'Maintain litter moisture at 20-25%. Wet litter generates ammonia gas, leading to respiratory infections and ascites. Rake litter regularly. Add fresh dry rice husk or lime powder in damp spots. Ensure cross ventilation without creating direct cold drafts on small chicks.',
    contentHi: 'बिछाली में नमी 20-25% बनाए रखें। गीली बिछाली से अमोनिया गैस बनती है जिससे सांस की बीमारी और आंखों में जलन होती है। बिछाली को नियमित रूप से पलटें (रेक करें)। गीली जगहों पर सूखा धान का छिलका या थोड़ा चूना डालें। हवा का आवागमन (क्रॉस वेंटिलेशन) हमेशा बनाए रखें।'
  },
  {
    id: 'common-diseases-symptoms',
    category: 'Health & Disease Warning',
    keywords: ['disease', 'coccidiosis', 'crds', 'ranikhet', 'gumboro', 'bloody stool', 'cough', 'बीमारी', 'खूनी दस्त', 'सांस फूलना', 'रानीखेत'],
    titleEn: 'Common Poultry Disease Warning Signs',
    titleHi: 'मुर्गियों की प्रमुख बीमारियों के चेतावनी लक्षण',
    contentEn: 'Warning signs: 1) Coccidiosis: Bloody or reddish-brown droppings, pale comb, huddling, weakness. 2) CRD (Chronic Respiratory Disease): Wheezing, sneezing, snoring sounds at night, swollen eyes/face. 3) Ranikhet / Newcastle: Greenish diarrhea, twisting neck, tremors, sudden high mortality. 4) IBD/Gumboro: Whitish watery diarrhea, ruffled feathers, sudden depression. In all severe cases, isolate sick birds and consult a certified poultry veterinarian immediately.',
    contentHi: 'प्रमुख चेतावनी लक्षण: 1) कॉक्सीडियोसिस: खूनी या लाल-भूरा दस्त, कमजोरी, सुस्ती। 2) सीआरडी (सांस की बीमारी): रात में घुरघुराहट की आवाज, छींकना, आंख या चेहरे पर सूजन। 3) रानीखेत: हरा दस्त, गर्दन घूमना, अचानक ज्यादा मृत्यु दर। 4) गम्बोरो: सफेद पतला दस्त, पंख बिखरे होना। किसी भी गंभीर लक्षण पर तुरंत बीमार मुर्गियों को अलग करें और डॉक्टर से संपर्क करें।'
  },
  {
    id: 'vaccination-schedule',
    category: 'Vaccination',
    keywords: ['vaccine', 'lasota', 'gumboro', 'ibd', 'rd', 'टीकाकरण', 'वैक्सीन', 'दवा'],
    titleEn: 'Standard Broiler Vaccination Principles',
    titleHi: 'ब्रायलर का मानक टीकाकरण कार्यक्रम',
    contentEn: 'Standard guidelines: Day 5-7: F1 / Lasota (Newcastle / Ranikhet) via eye-drop or drinking water with skimmed milk powder. Day 12-14: IBD (Gumboro) Intermediate strain. Day 21-24: Lasota Booster (optional depending on regional disease pressure). Maintain strict cold chain (2-8°C) during vaccine transport and storage.',
    contentHi: 'मानक टीकाकरण कार्यक्रम: 5-7वां दिन: लासोटा / F1 (रानीखेत) आंख में बूंद या बिना क्लोरीन वाले पानी में। 12-14वां दिन: गम्बोरो (IBD) की खुराक। 21-24वां दिन: लासोटा बूस्टर। वैक्सीन को हमेशा 2-8°C तापमान (बर्फ के डिब्बे) में ही रखें।'
  },
  {
    id: 'biosecurity-mortality',
    category: 'Biosecurity',
    keywords: ['biosecurity', 'disinfection', 'foot bath', 'mortality', 'सुरक्षा', 'कीटाणुनाशक', 'बायोसुरक्षा'],
    titleEn: 'Farm Biosecurity & Mortality Reduction',
    titleHi: 'फार्म की बायोसुरक्षा और मृत्यु दर में कमी',
    contentEn: '1) Maintain footbaths with potassium permanganate or disinfectant at the shed entrance. 2) Restrict outside visitors and wild birds. 3) Promptly dispose of dead birds in a deep pit away from the shed. 4) Spray shed with safe bird-friendly disinfectants twice weekly during high disease season.',
    contentHi: '1) शेड के प्रवेश द्वार पर पोटेशियम परमैंगनेट या कीटाणुनाशक का फुटबाथ रखें। 2) बाहरी व्यक्तियों और जंगली पक्षियों का प्रवेश रोकें। 3) मृत मुर्गियों को तुरंत शेड से दूर गहरे गड्ढे में दबाएं। 4) शेड के आसपास नियमित रूप से चूने और कीटाणुनाशक का छिड़काव करें।'
  }
];

export const searchPoultryKnowledge = (query: string): string => {
  const q = query.toLowerCase();
  const matched = POULTRY_KNOWLEDGE_BASE.filter(item => {
    return (
      item.keywords.some(k => q.includes(k.toLowerCase())) ||
      item.titleEn.toLowerCase().includes(q) ||
      item.titleHi.includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  if (matched.length === 0) {
    // Return top 2 general guidance
    return POULTRY_KNOWLEDGE_BASE.slice(0, 2)
      .map(m => `[Topic: ${m.titleEn} / ${m.titleHi}]\n${m.contentEn}\n${m.contentHi}`)
      .join('\n\n');
  }

  return matched
    .slice(0, 3)
    .map(m => `[Topic: ${m.titleEn} / ${m.titleHi}]\n${m.contentEn}\n${m.contentHi}`)
    .join('\n\n');
};
