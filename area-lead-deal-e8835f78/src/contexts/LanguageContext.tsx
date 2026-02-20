import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'mr' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    mr: string;
    hi: string;
  };
}

const translations: Translations = {
  // App name & branding
  appName: { en: 'LEADX', mr: 'LEADX', hi: 'LEADX' },
  tagline: { en: 'Local Lead Exchange', mr: 'स्थानिक लीड एक्सचेंज', hi: 'लोकल लीड एक्सचेंज' },

  // Navigation
  home: { en: 'Home', mr: 'होम', hi: 'होम' },
  history: { en: 'History', mr: 'इतिहास', hi: 'इतिहास' },
  community: { en: 'Community', mr: 'समुदाय', hi: 'समुदाय' },
  profile: { en: 'Profile', mr: 'प्रोफाइल', hi: 'प्रोफाइल' },

  // Auth
  login: { en: 'Login', mr: 'लॉगिन', hi: 'लॉगिन' },
  signup: { en: 'Sign Up', mr: 'साइन अप', hi: 'साइन अप' },
  logout: { en: 'Logout', mr: 'लॉगआउट', hi: 'लॉगआउट' },
  phone: { en: 'Phone Number', mr: 'फोन नंबर', hi: 'फ़ोन नंबर' },
  email: { en: 'Email', mr: 'ईमेल', hi: 'ईमेल' },
  password: { en: 'Password', mr: 'पासवर्ड', hi: 'पासवर्ड' },
  name: { en: 'Name', mr: 'नाव', hi: 'नाम' },
  continue: { en: 'Continue', mr: 'पुढे', hi: 'आगे' },

  // Dashboard
  generateLead: { en: 'Generate Lead', mr: 'लीड तयार करा', hi: 'लीड बनाएं' },
  getLeads: { en: 'Get Nearby Leads', mr: 'जवळील लीड मिळवा', hi: 'पास के लीड पाएं' },
  postJob: { en: 'Post a job request', mr: 'काम पोस्ट करा', hi: 'काम पोस्ट करें' },
  findWork: { en: 'Find work near you', mr: 'तुमच्या जवळ काम शोधा', hi: 'अपने पास काम खोजें' },

  // Lead Form
  serviceType: { en: 'Service Type', mr: 'सेवा प्रकार', hi: 'सेवा का प्रकार' },
  location: { en: 'Location', mr: 'स्थान', hi: 'स्थान' },
  customerPhone: { en: 'Customer Phone', mr: 'ग्राहक फोन', hi: 'ग्राहक फ़ोन' },
  customerName: { en: 'Customer Name', mr: 'ग्राहकाचे नाव', hi: 'ग्राहक का नाम' },
  notes: { en: 'Notes', mr: 'टिप्पणी', hi: 'नोट्स' },
  uploadPhoto: { en: 'Upload Photo', mr: 'फोटो अपलोड करा', hi: 'फोटो अपलोड करें' },
  submit: { en: 'Submit', mr: 'सबमिट करा', hi: 'सबमिट करें' },

  // Service Types
  rentAgreement: { en: 'Rent Agreement', mr: 'भाडे करार', hi: 'किराया करार' },
  domicile: { en: 'Domicile', mr: 'अधिवास', hi: 'अधिवास' },
  incomeCertificate: { en: 'Income Certificate', mr: 'उत्पन्न प्रमाणपत्र', hi: 'आय प्रमाण पत्र' },
  birthCertificate: { en: 'Birth Certificate', mr: 'जन्म प्रमाणपत्र', hi: 'जन्म प्रमाण पत्र' },
  deathCertificate: { en: 'Death Certificate', mr: 'मृत्यू प्रमाणपत्र', hi: 'मृत्यु प्रमाण पत्र' },
  other: { en: 'Other', mr: 'इतर', hi: 'अन्य' },

  // Leads List
  availableLeads: { en: 'Available Leads', mr: 'उपलब्ध लीड्स', hi: 'उपलब्ध लीड्स' },
  noLeads: { en: 'No leads available', mr: 'कोणतीही लीड उपलब्ध नाही', hi: 'कोई लीड उपलब्ध नहीं' },
  kmAway: { en: 'km away', mr: 'कि.मी. दूर', hi: 'कि.मी. दूर' },
  viewDetails: { en: 'View Details', mr: 'तपशील पहा', hi: 'विवरण देखें' },
  acceptLead: { en: 'Accept Lead', mr: 'लीड स्वीकारा', hi: 'लीड स्वीकारें' },
  leadTaken: { en: 'Lead Taken', mr: 'लीड घेतली', hi: 'लीड ली गई' },

  // Subscription
  subscribe: { en: 'Subscribe', mr: 'सदस्यता घ्या', hi: 'सदस्यता लें' },
  subscribeNow: { en: 'Subscribe Now', mr: 'आता सदस्यता घ्या', hi: 'अभी सदस्यता लें' },
  unlockLeads: { en: 'Unlock all leads', mr: 'सर्व लीड्स अनलॉक करा', hi: 'सभी लीड्स अनलॉक करें' },
  perMonth: { en: '/month', mr: '/महिना', hi: '/महीना' },
  freePlan: { en: 'Free Plan', mr: 'मोफत प्लॅन', hi: 'मुफ्त प्लान' },
  premiumPlan: { en: 'Premium Plan', mr: 'प्रीमियम प्लॅन', hi: 'प्रीमियम प्लान' },

  // Profile
  serviceRadius: { en: 'Service Radius', mr: 'सेवा त्रिज्या', hi: 'सेवा दायरा' },
  saveProfile: { en: 'Save Profile', mr: 'प्रोफाइल सेव्ह करा', hi: 'प्रोफाइल सेव करें' },
  setLocation: { en: 'Set Your Location', mr: 'तुमचे स्थान सेट करा', hi: 'अपना स्थान सेट करें' },

  // Onboarding
  welcome: { en: 'Welcome to LEADX', mr: 'LEADX मध्ये स्वागत', hi: 'LEADX में स्वागत' },
  setupProfile: { en: 'Set up your profile', mr: 'तुमची प्रोफाइल सेट करा', hi: 'अपनी प्रोफाइल सेट करें' },
  setupLocation: { en: 'Set your service area', mr: 'तुमचे सेवा क्षेत्र सेट करा', hi: 'अपना सेवा क्षेत्र सेट करें' },
  getStarted: { en: 'Get Started', mr: 'सुरू करा', hi: 'शुरू करें' },
  skip: { en: 'Skip', mr: 'वगळा', hi: 'छोड़ें' },

  // Alerts
  success: { en: 'Success!', mr: 'यश!', hi: 'सफलता!' },
  error: { en: 'Error', mr: 'त्रुटी', hi: 'त्रुटि' },
  leadCreated: { en: 'Lead created successfully', mr: 'लीड यशस्वीरित्या तयार झाली', hi: 'लीड सफलतापूर्वक बनाई गई' },
  leadAccepted: { en: 'Lead accepted!', mr: 'लीड स्वीकारली!', hi: 'लीड स्वीकार की गई!' },
  leadAlreadyTaken: { en: 'Sorry, someone just took this lead!', mr: 'क्षमस्व, कोणीतरी नुकतीच ही लीड घेतली!', hi: 'क्षमा करें, किसी ने अभी यह लीड ले ली!' },
  subscribeToView: { en: 'Subscribe to view full details', mr: 'पूर्ण तपशील पाहण्यासाठी सदस्यता घ्या', hi: 'पूर्ण विवरण देखने के लिए सदस्यता लें' },
  newLeadAlert: { en: 'New Lead available in your area!', mr: 'तुमच्या परिसरात नवीन लीड उपलब्ध!', hi: 'आपके क्षेत्र में नई लीड उपलब्ध!' },

  // Status
  open: { en: 'Open', mr: 'उघडा', hi: 'खुला' },
  claimed: { en: 'Claimed', mr: 'दावा केला', hi: 'दावा किया' },
  completed: { en: 'Completed', mr: 'पूर्ण', hi: 'पूर्ण' },
  cancelled: { en: 'Cancelled', mr: 'रद्द', hi: 'रद्द' },

  // Common
  loading: { en: 'Loading...', mr: 'लोड होत आहे...', hi: 'लोड हो रहा है...' },
  refresh: { en: 'Refresh', mr: 'रिफ्रेश', hi: 'रिफ्रेश' },
  cancel: { en: 'Cancel', mr: 'रद्द करा', hi: 'रद्द करें' },
  confirm: { en: 'Confirm', mr: 'पुष्टी करा', hi: 'पुष्टि करें' },
  back: { en: 'Back', mr: 'मागे', hi: 'पीछे' },
  next: { en: 'Next', mr: 'पुढे', hi: 'आगे' },
  save: { en: 'Save', mr: 'सेव्ह करा', hi: 'सेव करें' },
  close: { en: 'Close', mr: 'बंद करा', hi: 'बंद करें' },
  contact: { en: 'Contact', mr: 'संपर्क', hi: 'संपर्क' },
  call: { en: 'Call', mr: 'कॉल करा', hi: 'कॉल करें' },
  near: { en: 'Near', mr: 'जवळ', hi: 'पास' },
  ago: { en: 'ago', mr: 'पूर्वी', hi: 'पहले' },

  // ── Landing Page — Header / Nav ──
  navServices: { en: 'Services', mr: 'सेवा', hi: 'सेवाएं' },
  navHowItWorks: { en: 'How It Works', mr: 'कसे काम करते', hi: 'कैसे काम करता है' },
  navContact: { en: 'Contact', mr: 'संपर्क', hi: 'संपर्क' },
  navPostJob: { en: 'Post a Job', mr: 'काम पोस्ट करा', hi: 'काम पोस्ट करें' },
  navFindWork: { en: 'Find Work', mr: 'काम शोधा', hi: 'काम खोजें' },

  // ── Landing Page — Hero ──
  heroHeading: { en: 'Connect with your local opportunities.', mr: 'तुमच्या स्थानिक संधींशी जोडले जा.', hi: 'अपने स्थानीय अवसरों से जुड़ें।' },
  heroSubtext: { en: 'Find the best event gigs in your neighborhood.', mr: 'तुमच्या परिसरातील सर्वोत्तम इव्हेंट गिग्स शोधा.', hi: 'अपने आसपास के सबसे अच्छे इवेंट गिग्स खोजें।' },
  heroGetStarted: { en: 'Get Started', mr: 'सुरू करा', hi: 'शुरू करें' },
  heroBadge: { en: 'Get Leads in Your Area', mr: 'तुमच्या परिसरात लीड्स मिळवा', hi: 'अपने क्षेत्र में लीड्स पाएं' },
  heroTagline: { en: '✨ Free to join · 📍 Local leads only · ⚡ Instant alerts', mr: '✨ मोफत सदस्यता · 📍 फक्त स्थानिक लीड्स · ⚡ तात्काळ सूचना', hi: '✨ मुफ्त में जुड़ें · 📍 सिर्फ लोकल लीड्स · ⚡ तुरंत अलर्ट' },
  heroSearchPrefix: { en: 'I need a ', mr: 'मला हवा आहे ', hi: 'मुझे चाहिए ' },

  // ── Landing Page — Service Grid ──
  servicesTitle: { en: 'Popular Services', mr: 'लोकप्रिय सेवा', hi: 'लोकप्रिय सेवाएं' },
  servicesSubtitle: { en: 'Browse categories to find exactly what you need.', mr: 'तुम्हाला हवे ते शोधण्यासाठी श्रेण्या ब्राउझ करा.', hi: 'अपनी जरूरत के अनुसार श्रेणियां ब्राउज़ करें।' },
  servicesSeeAll: { en: 'See all categories', mr: 'सर्व श्रेण्या पहा', hi: 'सभी श्रेणियां देखें' },
  catEvents: { en: 'Events & Celebrations', mr: 'कार्यक्रम आणि उत्सव', hi: 'कार्यक्रम और उत्सव' },
  catHomeRepairs: { en: 'Home Repairs & Maintenance', mr: 'घर दुरुस्ती आणि देखभाल', hi: 'घर की मरम्मत और रखरखाव' },
  catElectronic: { en: 'Electronic & Home Appliances', mr: 'इलेक्ट्रॉनिक आणि घरगुती उपकरणे', hi: 'इलेक्ट्रॉनिक और घरेलू उपकरण' },
  catAcademic: { en: 'Academic & College Services', mr: 'शैक्षणिक आणि कॉलेज सेवा', hi: 'शैक्षणिक और कॉलेज सेवाएं' },
  catLogistics: { en: 'Logistics & Daily Labor', mr: 'वाहतूक आणि दैनिक मजूर', hi: 'लॉजिस्टिक्स और दैनिक मजदूरी' },
  catPersonalCare: { en: 'Personal Care & Wellness', mr: 'वैयक्तिक काळजी आणि आरोग्य', hi: 'व्यक्तिगत देखभाल और कल्याण' },
  catCleaning: { en: 'Cleaning & Sanitization', mr: 'स्वच्छता आणि निर्जंतुकीकरण', hi: 'सफाई और सैनिटाइजेशन' },
  catProfessional: { en: 'Professional & Legal Services', mr: 'व्यावसायिक आणि कायदेशीर सेवा', hi: 'पेशेवर और कानूनी सेवाएं' },
  catIT: { en: 'IT & Digital Solutions', mr: 'आयटी आणि डिजिटल उपाय', hi: 'आईटी और डिजिटल समाधान' },
  catUrgent: { en: 'Urgent & Emergency Help', mr: 'तातडी आणि आपत्कालीन मदत', hi: 'तत्काल और आपातकालीन सहायता' },
  catHospitality: { en: 'Hospitality & Stay Management', mr: 'आदरातिथ्य आणि निवास व्यवस्थापन', hi: 'आतिथ्य और ठहरने की व्यवस्था' },
  catSubEvents: { en: 'Hosts, Photography, Catering & DJ', mr: 'होस्ट, फोटोग्राफी, केटरिंग आणि DJ', hi: 'होस्ट, फोटोग्राफी, केटरिंग और DJ' },
  catSubHomeRepairs: { en: 'Electricians, Plumbers, Carpenters & More', mr: 'इलेक्ट्रिशियन, प्लंबर, सुतार आणि अधिक', hi: 'इलेक्ट्रीशियन, प्लंबर, बढ़ई और अधिक' },
  catSubElectronic: { en: 'AC, Kitchen, Washing Machine & TV', mr: 'एसी, किचन, वॉशिंग मशीन आणि टीव्ही', hi: 'एसी, किचन, वॉशिंग मशीन और टीवी' },
  catSubAcademic: { en: 'Tutors, Projects, Printing & Training', mr: 'ट्यूटर, प्रोजेक्ट, प्रिंटिंग आणि प्रशिक्षण', hi: 'ट्यूटर, प्रोजेक्ट, प्रिंटिंग और प्रशिक्षण' },
  catSubLogistics: { en: 'Movers, Delivery, Drivers & Laborers', mr: 'मूव्हर्स, डिलिव्हरी, ड्रायव्हर्स आणि मजूर', hi: 'मूवर्स, डिलीवरी, ड्राइवर और मजदूर' },
  catSubPersonalCare: { en: 'Salon, Spa, Fitness & Nursing', mr: 'सलून, स्पा, फिटनेस आणि नर्सिंग', hi: 'सैलून, स्पा, फिटनेस और नर्सिंग' },
  catSubCleaning: { en: 'Home, Kitchen, Car & Tank Cleaning', mr: 'घर, किचन, कार आणि टँक स्वच्छता', hi: 'घर, किचन, कार और टैंक सफाई' },
  catSubProfessional: { en: 'Rent Agreements, Notary, Tax & Insurance', mr: 'भाडे करार, नोटरी, कर आणि विमा', hi: 'किराया करार, नोटरी, कर और बीमा' },
  catSubIT: { en: 'PC Repair, WiFi, Mobile & CCTV', mr: 'पीसी रिपेअर, वायफाय, मोबाइल आणि सीसीटीव्ही', hi: 'पीसी रिपेयर, वाईफाई, मोबाइल और सीसीटीवी' },
  catSubUrgent: { en: 'Roadside, Key Maker, Gas & Ambulance', mr: 'रोडसाइड, की-मेकर, गॅस आणि अॅम्ब्युलन्स', hi: 'रोडसाइड, चाभी मेकर, गैस और एम्बुलेंस' },
  catSubHospitality: { en: 'Guest House, PG, Homestay & Concierge', mr: 'गेस्ट हाऊस, पीजी, होमस्टे आणि कॉन्सियर्ज', hi: 'गेस्ट हाउस, पीजी, होमस्टे और कॉन्सियर्ज' },

  // ── Landing Page — Trust Section ──
  trustBadge: { en: 'Trusted', mr: 'विश्वसनीय', hi: 'विश्वसनीय' },
  trustQuote: { en: '"Found an amazing plumber in 5 minutes! The verified reviews made it so easy."', mr: '"५ मिनिटांत एक उत्तम प्लंबर सापडला! सत्यापित पुनरावलोकनांमुळे ते खूप सोपे झाले."', hi: '"5 मिनट में एक शानदार प्लंबर मिल गया! सत्यापित समीक्षाओं ने इसे बहुत आसान बना दिया।"' },
  trustCommunity: { en: 'Join 10,000+ neighbors building a better community together.', mr: '10,000+ शेजाऱ्यांसोबत एक चांगला समुदाय बनवा.', hi: '10,000+ पड़ोसियों के साथ एक बेहतर समुदाय बनाएं।' },

  // ── Landing Page — Features ──
  featuresTitle: { en: 'Why Join Leads Nearby?', mr: 'Leads Nearby मध्ये का सामील व्हा?', hi: 'Leads Nearby से क्यों जुड़ें?' },
  featuresSubtitle: { en: 'Simple features. Real leads. Real business.', mr: 'साधी वैशिष्ट्ये. खरे लीड्स. खरा व्यवसाय.', hi: 'सरल सुविधाएं। असली लीड्स। असली कमाई।' },
  featMainBadge: { en: '#1 Feature', mr: '#1 वैशिष्ट्य', hi: '#1 सुविधा' },
  featMainTitle: { en: 'Get a Notification When Someone Needs Your Help Nearby', mr: 'जेव्हा कोणाला तुमच्या जवळ मदत हवी असेल तेव्हा सूचना मिळवा', hi: 'जब कोई आपके पास मदद चाहता है तो अधिसूचना पाएं' },
  featMainDesc: { en: 'A customer looking for your service comes in your area? You get an instant alert on your phone. No waiting. No scrolling. Just real leads.', mr: 'तुमच्या सेवेचा शोधणारा ग्राहक तुमच्या परिसरात आला? तुम्हाला तुमच्या फोनवर तात्काळ सूचना मिळेल. प्रतीक्षा नाही. स्क्रोलिंग नाही. फक्त खरे लीड्स.', hi: 'आपकी सेवा खोजने वाला ग्राहक आपके क्षेत्र में आया? आपको फोन पर तुरंत अलर्ट मिलेगा। कोई इंतजार नहीं। बस असली लीड्स।' },
  featBullet1: { en: '📱 Instant WhatsApp alert', mr: '📱 तात्काळ WhatsApp सूचना', hi: '📱 तुरंत WhatsApp अलर्ट' },
  featBullet2: { en: '📍 Only leads near your location', mr: '📍 फक्त तुमच्या जवळचे लीड्स', hi: '📍 सिर्फ आपके पास के लीड्स' },
  featBullet3: { en: '⚡ Click to claim in seconds', mr: '⚡ सेकंदात क्लेम करा', hi: '⚡ सेकंडों में क्लेम करें' },
  featBullet4: { en: '💬 Direct chat with customer', mr: '💬 ग्राहकाशी थेट चॅट', hi: '💬 ग्राहक से सीधी चैट' },
  featLiveDemo: { en: 'New Lead: Rent Agreement - 2km Away', mr: 'नवीन लीड: भाडे करार - 2km दूर', hi: 'नई लीड: किराया करार - 2km दूर' },
  featClaimNow: { en: 'Tap to Claim Now', mr: 'आता क्लेम करा', hi: 'अभी क्लेम करें' },
  featFirstToSee: { en: "You're the first to see this lead", mr: 'तुम्ही या लीडला पहिले पाहत आहात', hi: 'आप इस लीड को पहले देख रहे हैं' },
  featLocalLeads: { en: 'Only Local Leads', mr: 'फक्त स्थानिक लीड्स', hi: 'सिर्फ स्थानीय लीड्स' },
  featLocalLeadsDesc: { en: 'Set your area. Get leads nearby. No wasting time on far away jobs.', mr: 'तुमचे क्षेत्र सेट करा. जवळचे लीड्स मिळवा. दूरच्या कामांवर वेळ वाया घालवू नका.', hi: 'अपना क्षेत्र सेट करें। पास के लीड्स पाएं। दूर की नौकरियों पर समय बर्बाद न करें।' },
  featRealPeople: { en: 'Real People, Real Leads', mr: 'खरे लोक, खरे लीड्स', hi: 'असली लोग, असली लीड्स' },
  featRealPeopleDesc: { en: 'No bots. No timepass. Only verified customers who need your help.', mr: 'बॉट नाहीत. टाइमपास नाही. फक्त सत्यापित ग्राहक ज्यांना तुमच्या मदतीची गरज आहे.', hi: 'कोई बॉट नहीं। टाइमपास नहीं। सिर्फ सत्यापित ग्राहक जिन्हें आपकी मदद चाहिए।' },
  featEasyProof: { en: 'Easy Proof', mr: 'सोपा पुरावा', hi: 'आसान प्रमाण' },
  featEasyProofDesc: { en: 'Upload photos of completed work. Build trust. Get more leads.', mr: 'पूर्ण केलेल्या कामाचे फोटो अपलोड करा. विश्वास निर्माण करा. अधिक लीड्स मिळवा.', hi: 'पूरे किए गए काम की फोटो अपलोड करें। विश्वास बनाएं। अधिक लीड्स पाएं।' },
  featSafeVerified: { en: 'Safe & Verified', mr: 'सुरक्षित आणि सत्यापित', hi: 'सुरक्षित और सत्यापित' },
  featSafeVerifiedDesc: { en: 'All users are verified. Your data is safe. Trust the platform.', mr: 'सर्व वापरकर्ते सत्यापित आहेत. तुमचा डेटा सुरक्षित आहे. प्लॅटफॉर्मवर विश्वास ठेवा.', hi: 'सभी उपयोगकर्ता सत्यापित हैं। आपका डेटा सुरक्षित है। प्लेटफॉर्म पर भरोसा करें।' },
  featFirstCome: { en: 'First Come, First Serve', mr: 'आधी आला तो मिळवतो', hi: 'पहले आएं, पहले पाएं' },
  featFirstComeDesc: { en: 'Fast people earn more. Be quick. Claim the lead first.', mr: 'जलद लोक अधिक कमवतात. वेगवान व्हा. आधी लीड क्लेम करा.', hi: 'तेज लोग ज्यादा कमाते हैं। जल्दी करें। पहले लीड क्लेम करें।' },
  featDirectContact: { en: 'Direct Contact', mr: 'थेट संपर्क', hi: 'सीधा संपर्क' },
  featDirectContactDesc: { en: 'Get customer phone number. Talk directly. No middleman.', mr: 'ग्राहकाचा फोन नंबर मिळवा. थेट बोला. कोणताही मध्यस्थ नाही.', hi: 'ग्राहक का फोन नंबर पाएं। सीधे बात करें। कोई बिचौलिया नहीं।' },

  // ── Landing Page — How It Works ──
  howTitle: { en: 'How It Works - 3 Simple Steps', mr: 'हे कसे काम करते - 3 सोप्या पायऱ्या', hi: 'यह कैसे काम करता है - 3 आसान कदम' },
  howSubtitle: { en: 'Start earning in minutes, not days', mr: 'दिवस नाही, मिनिटांत कमाई सुरू करा', hi: 'दिनों में नहीं, मिनटों में कमाई शुरू करें' },
  howStep1Title: { en: 'Sign Up (2 minutes)', mr: 'साइन अप (2 मिनिटे)', hi: 'साइन अप (2 मिनट)' },
  howStep1Desc: { en: 'Enter Your Details. Done!', mr: 'तुमचे तपशील भरा. झालं!', hi: 'अपनी जानकारी भरें। बस!' },
  howStep2Title: { en: 'Set Your Location (1 minute)', mr: 'तुमचे स्थान सेट करा (1 मिनिट)', hi: 'अपना स्थान सेट करें (1 मिनट)' },
  howStep2Desc: { en: 'Show where you work. How far can you travel? What service you offer?', mr: 'तुम्ही कुठे काम करता ते दाखवा. तुम्ही किती दूर जाऊ शकता? तुम्ही कोणती सेवा देता?', hi: 'दिखाएं कि आप कहाँ काम करते हैं। कितनी दूर जा सकते हैं? कौन सी सेवा देते हैं?' },
  howStep3Title: { en: 'Get Alerts & Earn (Every day)', mr: 'सूचना मिळवा आणि कमवा (दररोज)', hi: 'अलर्ट पाएं और कमाएं (हर दिन)' },
  howStep3Desc: { en: 'Get notified when a customer needs you. Accept. Meet. Earn. Repeat.', mr: 'जेव्हा ग्राहकाला तुमची गरज असेल तेव्हा सूचना मिळवा. स्वीकारा. भेटा. कमवा. पुन्हा करा.', hi: 'जब ग्राहक को आपकी जरूरत हो तो अलर्ट पाएं। स्वीकार करें। मिलें। कमाएं। दोहराएं।' },

  // ── Landing Page — Posters ──
  postersTitle: { en: "See What's Possible", mr: 'काय शक्य आहे ते पहा', hi: 'क्या संभव है देखें' },
  postersSubtitle: { en: 'Real stories. Real earnings.', mr: 'खऱ्या कथा. खरी कमाई.', hi: 'सच्ची कहानियां। सच्ची कमाई।' },
  posterGetServices: { en: 'Get All Services', mr: 'सर्व सेवा मिळवा', hi: 'सभी सेवाएं पाएं' },
  posterGetServicesDesc: { en: 'New Services in your area, 2km away', mr: 'तुमच्या परिसरात नवीन सेवा, 2km दूर', hi: 'आपके क्षेत्र में नई सेवाएं, 2km दूर' },
  posterEarnMoney: { en: 'Earn Real Money', mr: 'खरे पैसे कमवा', hi: 'असली पैसे कमाएं' },
  posterEarnMoneyDesc: { en: 'Complete work, get paid instantly', mr: 'काम पूर्ण करा, लगेच पैसे मिळवा', hi: 'काम पूरा करें, तुरंत भुगतान पाएं' },
  posterInstantAlert: { en: 'Instant Alert', mr: 'तात्काळ सूचना', hi: 'तुरंत अलर्ट' },
  posterInstantAlertDesc: { en: 'Get notified the moment a lead comes', mr: 'लीड आल्यावर लगेच सूचना मिळवा', hi: 'लीड आते ही सूचना पाएं' },
  posterNoTimepass: { en: 'No Timepass', mr: 'टाइमपास नाही', hi: 'टाइमपास नहीं' },
  posterNoTimepassDesc: { en: 'Only real, verified leads - no fake messages', mr: 'फक्त खरे, सत्यापित लीड्स - बनावट संदेश नाही', hi: 'सिर्फ असली, सत्यापित लीड्स - कोई फर्जी संदेश नहीं' },

  // ── Landing Page — Contact ──
  contactTitle: { en: 'Get in Touch', mr: 'संपर्क साधा', hi: 'संपर्क करें' },
  contactSubtitle: { en: 'Have questions? We\'re here to help', mr: 'प्रश्न आहेत? आम्ही मदत करायला तयार आहोत', hi: 'सवाल हैं? हम मदद के लिए यहां हैं' },
  contactPhone: { en: 'Phone', mr: 'फोन', hi: 'फोन' },
  contactPhoneDesc: { en: 'Mon-Sat: 9AM - 6PM', mr: 'सोम-शनि: सकाळी 9 - सायं 6', hi: 'सोम-शनि: सुबह 9 - शाम 6' },
  contactEmail: { en: 'Email', mr: 'ईमेल', hi: 'ईमेल' },
  contactEmailDesc: { en: 'We reply within 24 hours', mr: 'आम्ही 24 तासांत उत्तर देतो', hi: 'हम 24 घंटे में जवाब देते हैं' },
  contactWebsite: { en: 'Website', mr: 'वेबसाइट', hi: 'वेबसाइट' },
  contactWebsiteDesc: { en: 'Visit our company site', mr: 'आमच्या कंपनीची साइट भेट द्या', hi: 'हमारी कंपनी साइट पर जाएं' },

  // ── Landing Page — CTA ──
  ctaTitle: { en: 'Ready to Get Started?', mr: 'सुरू करायला तयार आहात?', hi: 'शुरू करने के लिए तैयार हैं?' },
  ctaSubtitle: { en: 'Join thousands of service providers and customers connecting every day on Leads Nearby', mr: 'दररोज Leads Nearby वर जोडले जाणाऱ्या हजारो सेवा प्रदाते आणि ग्राहकांमध्ये सामील व्हा', hi: 'हर दिन Leads Nearby पर जुड़ने वाले हजारों सेवा प्रदाताओं और ग्राहकों से जुड़ें' },
  ctaButton: { en: 'Create Free Account', mr: 'मोफत खाते बनवा', hi: 'मुफ्त अकाउंट बनाएं' },

  // ── Landing Page — FAQ ──
  faqTitle: { en: 'Frequently Asked Questions', mr: 'वारंवार विचारले जाणारे प्रश्न', hi: 'अक्सर पूछे जाने वाले प्रश्न' },
  faqSubtitle: { en: 'Everything you need to know about Leads Nearby', mr: 'Leads Nearby बद्दल तुम्हाला सर्व काही जाणून घ्या', hi: 'Leads Nearby के बारे में वह सब कुछ जो आपको जानना चाहिए' },
  faqQ1: { en: 'What is Leads Nearby?', mr: 'Leads Nearby म्हणजे काय?', hi: 'Leads Nearby क्या है?' },
  faqA1: { en: 'Leads Nearby is a platform that connects local service providers (electricians, plumbers, tutors, etc.) with customers who need their services. You get real, verified leads from people near your location.', mr: 'Leads Nearby हे एक प्लॅटफॉर्म आहे जे स्थानिक सेवा प्रदाते (इलेक्ट्रिशियन, प्लंबर, ट्यूटर इ.) यांना त्यांच्या सेवांची गरज असलेल्या ग्राहकांशी जोडते. तुम्हाला तुमच्या स्थानाजवळच्या लोकांकडून खरे, सत्यापित लीड्स मिळतात.', hi: 'Leads Nearby एक प्लेटफॉर्म है जो स्थानीय सेवा प्रदाताओं (इलेक्ट्रीशियन, प्लंबर, ट्यूटर आदि) को उन ग्राहकों से जोड़ता है जिन्हें उनकी सेवाओं की आवश्यकता है। आपको अपने स्थान के पास के लोगों से असली, सत्यापित लीड्स मिलते हैं।' },
  faqQ2: { en: 'How do I register on Leads Nearby?', mr: 'Leads Nearby वर नोंदणी कशी करायची?', hi: 'Leads Nearby पर रजिस्टर कैसे करें?' },
  faqA2: { en: 'Registering is simple and takes just 2 minutes! Click the "Get Started" button, fill in your details, set your service category and location, and you\'re ready to receive leads.', mr: 'नोंदणी सोपी आहे आणि फक्त 2 मिनिटे लागतात! "सुरू करा" बटणावर क्लिक करा, तुमचे तपशील भरा, तुमची सेवा श्रेणी आणि स्थान सेट करा, आणि तुम्ही लीड्स मिळवायला तयार आहात.', hi: 'रजिस्टर करना आसान है और सिर्फ 2 मिनट लगते हैं! "शुरू करें" बटन पर क्लिक करें, अपनी जानकारी भरें, अपनी सेवा श्रेणी और स्थान सेट करें, और आप लीड्स प्राप्त करने के लिए तैयार हैं।' },
  faqQ3: { en: 'Is it free to join?', mr: 'सामील होणे मोफत आहे का?', hi: 'क्या जुड़ना मुफ्त है?' },
  faqA3: { en: 'Yes! Joining Leads Nearby is completely free. You can create your account, set your profile, and start receiving lead notifications at no cost. Premium features are available for those who want more.', mr: 'हो! Leads Nearby मध्ये सामील होणे पूर्णपणे मोफत आहे. तुम्ही तुमचे खाते बनवू शकता, तुमची प्रोफाइल सेट करू शकता आणि कोणत्याही खर्चाशिवाय लीड सूचना मिळवायला सुरुवात करू शकता.', hi: 'हां! Leads Nearby से जुड़ना पूरी तरह से मुफ्त है। आप अपना अकाउंट बना सकते हैं, प्रोफाइल सेट कर सकते हैं और बिना किसी खर्च के लीड नोटिफिकेशन पाना शुरू कर सकते हैं।' },
  faqQ4: { en: 'How do I get leads?', mr: 'मला लीड्स कसे मिळतात?', hi: 'मुझे लीड्स कैसे मिलेंगे?' },
  faqA4: { en: 'Once you set your location and service category, you\'ll receive instant WhatsApp notifications whenever a customer nearby needs your service. Be the first to respond and claim the lead!', mr: 'एकदा तुम्ही तुमचे स्थान आणि सेवा श्रेणी सेट केल्यावर, जवळचा ग्राहक तुमच्या सेवेची गरज असेल तेव्हा तुम्हाला तात्काळ WhatsApp सूचना मिळेल. प्रथम प्रतिसाद द्या आणि लीड क्लेम करा!', hi: 'एक बार जब आप अपना स्थान और सेवा श्रेणी सेट कर लेते हैं, तो जब भी पास का कोई ग्राहक आपकी सेवा चाहता है, आपको तुरंत WhatsApp नोटिफिकेशन मिलेगा। पहले जवाब दें और लीड क्लेम करें!' },
  faqQ5: { en: 'What services are available?', mr: 'कोणत्या सेवा उपलब्ध आहेत?', hi: 'कौन सी सेवाएं उपलब्ध हैं?' },
  faqA5: { en: 'We cover 11+ categories including Home Repairs, Events & Celebrations, Electronic Appliances, Academic Services, Personal Care, Cleaning, Professional & Legal Services, IT Solutions, and more.', mr: 'आम्ही 11+ श्रेण्यांमध्ये सेवा प्रदान करतो ज्यात घर दुरुस्ती, कार्यक्रम आणि उत्सव, इलेक्ट्रॉनिक उपकरणे, शैक्षणिक सेवा, वैयक्तिक काळजी, स्वच्छता, व्यावसायिक आणि कायदेशीर सेवा, आयटी उपाय आणि बरेच काही समाविष्ट आहे.', hi: 'हम 11+ श्रेणियों में सेवाएं प्रदान करते हैं जिनमें घर की मरम्मत, कार्यक्रम और उत्सव, इलेक्ट्रॉनिक उपकरण, शैक्षणिक सेवाएं, व्यक्तिगत देखभाल, सफाई, पेशेवर और कानूनी सेवाएं, आईटी समाधान और बहुत कुछ शामिल है।' },
  faqQ6: { en: 'How do I earn money?', mr: 'मी पैसे कसे कमवू?', hi: 'मैं पैसे कैसे कमाऊं?' },
  faqA6: { en: "When you receive a lead notification, accept it quickly. Meet the customer, complete the work, and get paid directly. It's that simple — no middleman, no commission on your earnings.", mr: 'लीड सूचना मिळाल्यावर, त्वरित स्वीकारा. ग्राहकाला भेटा, काम पूर्ण करा आणि थेट पैसे मिळवा. इतके सोपे आहे — कोणताही मध्यस्थ नाही, तुमच्या कमाईवर कोणताही कमिशन नाही.', hi: 'जब आपको लीड नोटिफिकेशन मिले, तुरंत स्वीकार करें। ग्राहक से मिलें, काम पूरा करें और सीधे भुगतान पाएं। बस इतना आसान है — कोई बिचौलिया नहीं, आपकी कमाई पर कोई कमीशन नहीं।' },
  faqQ7: { en: 'Is my data safe?', mr: 'माझा डेटा सुरक्षित आहे का?', hi: 'क्या मेरा डेटा सुरक्षित है?' },
  faqA7: { en: 'Absolutely. All users are verified, and we use industry-standard security practices to protect your personal information. Your data is never shared with third parties without your consent.', mr: 'होय, नक्कीच. सर्व वापरकर्ते सत्यापित आहेत, आणि आम्ही तुमची वैयक्तिक माहिती संरक्षित करण्यासाठी उद्योग-मानक सुरक्षा पद्धती वापरतो. तुमचा डेटा तुमच्या संमतीशिवाय कधीही तृतीय पक्षांसोबत सामायिक केला जात नाही.', hi: 'बिल्कुल। सभी उपयोगकर्ता सत्यापित हैं, और हम आपकी व्यक्तिगत जानकारी की सुरक्षा के लिए उद्योग-मानक सुरक्षा प्रथाओं का उपयोग करते हैं। आपका डेटा कभी भी आपकी सहमति के बिना तीसरे पक्ष के साथ साझा नहीं किया जाता।' },
  faqVideoLabel: { en: 'Watch the step-by-step registration tutorial', mr: 'चरण-दर-चरण नोंदणी ट्यूटोरियल पहा', hi: 'स्टेप-बाय-स्टेप रजिस्ट्रेशन ट्यूटोरियल देखें' },

  // ── Landing Page — Footer ──
  footerCopyright: { en: '© 2026 Bisugen Technologies. All rights reserved.', mr: '© 2026 बिसुजेन टेक्नोलॉजीज. सर्व हक्क राखीव.', hi: '© 2026 बिसुजेन टेक्नोलॉजीज। सर्वाधिकार सुरक्षित।' },
  footerPrivacy: { en: 'Privacy Policy', mr: 'गोपनीयता धोरण', hi: 'गोपनीयता नीति' },
  footerTerms: { en: 'Terms of Service', mr: 'सेवा अटी', hi: 'सेवा की शर्तें' },
  footerContactUs: { en: 'Contact Us', mr: 'आमच्याशी संपर्क साधा', hi: 'हमसे संपर्क करें' },
};

// ── Category & Subcategory name translations (keyed by English DB name) ──
const categoryTranslations: { [name: string]: { mr: string; hi: string } } = {
  // Categories
  'Events & Celebrations': { mr: 'कार्यक्रम आणि उत्सव', hi: 'इवेंट्स और उत्सव' },
  'Home Repairs & Maintenance': { mr: 'घर दुरुस्ती आणि देखभाल', hi: 'घर की मरम्मत और रखरखाव' },
  'Electronic & Home Appliances': { mr: 'इलेक्ट्रॉनिक आणि घरगुती उपकरणे', hi: 'इलेक्ट्रॉनिक और घरेलू उपकरण' },
  'Academic & College Services': { mr: 'शैक्षणिक आणि कॉलेज सेवा', hi: 'शैक्षणिक और कॉलेज सेवाएं' },
  'Logistics & Daily Labor': { mr: 'वाहतूक आणि दैनंदिन मजूर', hi: 'लॉजिस्टिक्स और दैनिक मजदूर' },
  'Personal Care & Wellness': { mr: 'वैयक्तिक काळजी आणि आरोग्य', hi: 'व्यक्तिगत देखभाल और वेलनेस' },
  'Cleaning & Sanitization': { mr: 'स्वच्छता आणि सॅनिटायझेशन', hi: 'सफाई और सैनिटाइजेशन' },
  'Professional & Legal Services': { mr: 'व्यावसायिक आणि कायदेशीर सेवा', hi: 'प्रोफेशनल और कानूनी सेवाएं' },
  'IT & Digital Solutions': { mr: 'आयटी आणि डिजिटल उपाय', hi: 'आईटी और डिजिटल समाधान' },
  'Urgent & Emergency Help': { mr: 'तातडी आणि आपत्कालीन मदत', hi: 'अर्जेंट और इमरजेंसी सहायता' },
  'Hospitality & Stay Management': { mr: 'आतिथ्य आणि निवास व्यवस्थापन', hi: 'आतिथ्य और ठहराव प्रबंधन' },

  // Subcategories — Events & Celebrations
  'Event Host / Anchor': { mr: 'कार्यक्रम होस्ट / अँकर', hi: 'इवेंट होस्ट / एंकर' },
  'Photography & Videography': { mr: 'फोटोग्राफी आणि व्हिडिओग्राफी', hi: 'फोटोग्राफी और वीडियोग्राफी' },
  'Catering & Food Service': { mr: 'केटरिंग आणि फूड सर्व्हिस', hi: 'केटरिंग और फूड सर्विस' },
  'DJ / Sound System': { mr: 'डीजे / साउंड सिस्टम', hi: 'डीजे / साउंड सिस्टम' },
  'Tent & Decoration': { mr: 'टेंट आणि सजावट', hi: 'टेंट और सजावट' },
  'Band / Dhol / Music': { mr: 'बँड / ढोल / संगीत', hi: 'बैंड / ढोल / संगीत' },
  'Mehndi Artist': { mr: 'मेहंदी आर्टिस्ट', hi: 'मेहंदी आर्टिस्ट' },
  'Makeup Artist': { mr: 'मेकअप आर्टिस्ट', hi: 'मेकअप आर्टिस्ट' },
  'Pandit / Priest / Guruji': { mr: 'पंडित / पुजारी / गुरुजी', hi: 'पंडित / पुजारी / गुरुजी' },
  'Flower Decorator': { mr: 'फुलांचा सजावटकार', hi: 'फूल सजावटकार' },
  'Stage & Lighting': { mr: 'स्टेज आणि लाइटिंग', hi: 'स्टेज और लाइटिंग' },
  'Wedding Planner': { mr: 'वेडिंग प्लॅनर', hi: 'वेडिंग प्लानर' },
  'Birthday Party Organizer': { mr: 'बर्थडे पार्टी ऑर्गनायझर', hi: 'बर्थडे पार्टी ऑर्गनाइज़र' },
  'Return Gift / Stationery Supplier': { mr: 'रिटर्न गिफ्ट / स्टेशनरी सप्लायर', hi: 'रिटर्न गिफ्ट / स्टेशनरी सप्लायर' },

  // Subcategories — Home Repairs & Maintenance
  'Electrician': { mr: 'इलेक्ट्रिशियन', hi: 'इलेक्ट्रीशियन' },
  'Plumber': { mr: 'प्लंबर', hi: 'प्लंबर' },
  'Carpenter': { mr: 'सुतार', hi: 'कारपेंटर' },
  'Painter': { mr: 'पेंटर', hi: 'पेंटर' },
  'Mason / Civil Work': { mr: 'गवंडी / सिव्हिल वर्क', hi: 'मिस्त्री / सिविल वर्क' },
  'Welder / Fabricator': { mr: 'वेल्डर / फॅब्रिकेटर', hi: 'वेल्डर / फैब्रिकेटर' },
  'Waterproofing Expert': { mr: 'वॉटरप्रूफिंग एक्सपर्ट', hi: 'वॉटरप्रूफिंग एक्सपर्ट' },
  'Glass & Aluminium Work': { mr: 'ग्लास आणि अॅल्युमिनियम वर्क', hi: 'ग्लास और एल्यूमीनियम वर्क' },
  'Tiles / Flooring': { mr: 'टाइल्स / फ्लोअरिंग', hi: 'टाइल्स / फ्लोरिंग' },
  'Bore Well / Motor Repair': { mr: 'बोअर वेल / मोटर दुरुस्ती', hi: 'बोर वेल / मोटर रिपेयर' },
  'Door / Lock Repair': { mr: 'दरवाजा / कुलूप दुरुस्ती', hi: 'दरवाज़ा / ताला रिपेयर' },
  'RO / Water Purifier Repair': { mr: 'आरओ / वॉटर प्युरिफायर दुरुस्ती', hi: 'आरओ / वॉटर प्यूरिफायर रिपेयर' },
  'Pest Control': { mr: 'कीटक नियंत्रण', hi: 'पेस्ट कंट्रोल' },
  'Interior Designer': { mr: 'इंटिरियर डिझायनर', hi: 'इंटीरियर डिज़ाइनर' },

  // Subcategories — Electronic & Home Appliances
  'AC Repair / Installation': { mr: 'एसी दुरुस्ती / इन्स्टॉलेशन', hi: 'एसी रिपेयर / इंस्टॉलेशन' },
  'Refrigerator Repair': { mr: 'फ्रिज दुरुस्ती', hi: 'फ्रिज रिपेयर' },
  'Washing Machine Repair': { mr: 'वॉशिंग मशीन दुरुस्ती', hi: 'वॉशिंग मशीन रिपेयर' },
  'TV / LED Repair': { mr: 'टीव्ही / एलईडी दुरुस्ती', hi: 'टीवी / एलईडी रिपेयर' },
  'Microwave / Oven Repair': { mr: 'मायक्रोवेव्ह / ओव्हन दुरुस्ती', hi: 'माइक्रोवेव / ओवन रिपेयर' },
  'Mixer / Grinder Repair': { mr: 'मिक्सर / ग्राइंडर दुरुस्ती', hi: 'मिक्सर / ग्राइंडर रिपेयर' },
  'Geyser / Water Heater Repair': { mr: 'गीझर / वॉटर हीटर दुरुस्ती', hi: 'गीज़र / वॉटर हीटर रिपेयर' },
  'Inverter / UPS Repair': { mr: 'इन्व्हर्टर / यूपीएस दुरुस्ती', hi: 'इन्वर्टर / यूपीएस रिपेयर' },
  'Chimney / Hob Repair': { mr: 'चिमणी / हॉब दुरुस्ती', hi: 'चिमनी / हॉब रिपेयर' },
  'Fan / Cooler Repair': { mr: 'फॅन / कूलर दुरुस्ती', hi: 'फैन / कूलर रिपेयर' },

  // Subcategories — Academic & College Services
  'Home Tutor': { mr: 'होम ट्यूटर', hi: 'होम ट्यूटर' },
  'Project / Assignment Help': { mr: 'प्रोजेक्ट / असाइनमेंट मदत', hi: 'प्रोजेक्ट / असाइनमेंट हेल्प' },
  'Photocopy / Printing / Binding': { mr: 'फोटोकॉपी / प्रिंटिंग / बाइंडिंग', hi: 'फोटोकॉपी / प्रिंटिंग / बाइंडिंग' },
  'Computer Training': { mr: 'कॉम्प्युटर ट्रेनिंग', hi: 'कंप्यूटर ट्रेनिंग' },
  'Spoken English / Language Classes': { mr: 'स्पोकन इंग्लिश / भाषा वर्ग', hi: 'स्पोकन इंग्लिश / भाषा कक्षाएं' },
  'Competitive Exam Coaching': { mr: 'स्पर्धा परीक्षा कोचिंग', hi: 'प्रतियोगी परीक्षा कोचिंग' },
  'Resume / CV Writing': { mr: 'रेझ्युमे / सीव्ही लेखन', hi: 'रिज़्यूमे / सीवी लेखन' },
  'Internship Help': { mr: 'इंटर्नशिप मदत', hi: 'इंटर्नशिप सहायता' },
  'Coding / Tech Bootcamp': { mr: 'कोडिंग / टेक बूटकॅम्प', hi: 'कोडिंग / टेक बूटकैंप' },

  // Subcategories — Logistics & Daily Labor
  'Packers & Movers': { mr: 'पॅकर्स अँड मूव्हर्स', hi: 'पैकर्स एंड मूवर्स' },
  'Auto / Tempo / Truck on Rent': { mr: 'ऑटो / टेम्पो / ट्रक भाड्याने', hi: 'ऑटो / टेम्पो / ट्रक किराए पर' },
  'Delivery Boy / Courier': { mr: 'डिलिव्हरी बॉय / कुरिअर', hi: 'डिलीवरी बॉय / कूरियर' },
  'Driver (Local / Outstation)': { mr: 'ड्रायव्हर (लोकल / आउटस्टेशन)', hi: 'ड्राइवर (लोकल / आउटस्टेशन)' },
  'Helper / Daily Labour': { mr: 'हेल्पर / दैनंदिन मजूर', hi: 'हेल्पर / दैनिक मजदूर' },
  'Watchman / Security Guard': { mr: 'वॉचमन / सिक्युरिटी गार्ड', hi: 'वॉचमैन / सिक्योरिटी गार्ड' },
  'Farm Labour': { mr: 'शेती मजूर', hi: 'खेतीहर मजदूर' },

  // Subcategories — Personal Care & Wellness
  'Salon / Barber at Home': { mr: 'सलून / बार्बर घरी', hi: 'सैलून / बार्बर घर पर' },
  'Spa / Massage Therapist': { mr: 'स्पा / मसाज थेरपिस्ट', hi: 'स्पा / मसाज थेरेपिस्ट' },
  'Yoga / Fitness Trainer': { mr: 'योगा / फिटनेस ट्रेनर', hi: 'योगा / फिटनेस ट्रेनर' },
  'Dietician / Nutritionist': { mr: 'आहारतज्ञ / पोषणतज्ञ', hi: 'डाइटीशियन / न्यूट्रिशनिस्ट' },
  'Home Nurse / Attendant': { mr: 'होम नर्स / परिचारक', hi: 'होम नर्स / अटेंडेंट' },
  'Physiotherapist': { mr: 'फिजिओथेरपिस्ट', hi: 'फिजियोथेरेपिस्ट' },
  'Bridal Makeup & Styling': { mr: 'ब्रायडल मेकअप आणि स्टायलिंग', hi: 'ब्राइडल मेकअप और स्टाइलिंग' },

  // Subcategories — Cleaning & Sanitization
  'Full Home Deep Cleaning': { mr: 'संपूर्ण घर डीप क्लीनिंग', hi: 'पूरे घर की डीप क्लीनिंग' },
  'Kitchen Cleaning': { mr: 'किचन क्लीनिंग', hi: 'किचन क्लीनिंग' },
  'Bathroom Cleaning': { mr: 'बाथरूम क्लीनिंग', hi: 'बाथरूम क्लीनिंग' },
  'Sofa / Carpet Cleaning': { mr: 'सोफा / कार्पेट क्लीनिंग', hi: 'सोफा / कार्पेट क्लीनिंग' },
  'Car / Bike Wash at Home': { mr: 'कार / बाइक वॉश घरी', hi: 'कार / बाइक वॉश घर पर' },
  'Water Tank Cleaning': { mr: 'वॉटर टँक क्लीनिंग', hi: 'वॉटर टैंक क्लीनिंग' },
  'AC Duct / Deep Cleaning': { mr: 'एसी डक्ट / डीप क्लीनिंग', hi: 'एसी डक्ट / डीप क्लीनिंग' },
  'Sanitization Service': { mr: 'सॅनिटायझेशन सर्व्हिस', hi: 'सैनिटाइजेशन सर्विस' },

  // Subcategories — Professional & Legal Services
  'Rent Agreement': { mr: 'भाडे करार', hi: 'रेंट एग्रीमेंट' },
  'Notary / Affidavit': { mr: 'नोटरी / प्रतिज्ञापत्र', hi: 'नोटरी / एफिडेविट' },
  'GST / Tax Filing': { mr: 'जीएसटी / कर भरणा', hi: 'जीएसटी / टैक्स फाइलिंग' },
  'Insurance Agent': { mr: 'विमा एजंट', hi: 'बीमा एजेंट' },
  'Loan Consultant': { mr: 'कर्ज सल्लागार', hi: 'लोन कंसल्टेंट' },
  'CA / Accountant': { mr: 'सीए / अकाउंटंट', hi: 'सीए / अकाउंटेंट' },
  'Advocate / Lawyer': { mr: 'वकील', hi: 'एडवोकेट / वकील' },
  'Property Consultant': { mr: 'प्रॉपर्टी सल्लागार', hi: 'प्रॉपर्टी कंसल्टेंट' },
  'Passport / Visa Consultant': { mr: 'पासपोर्ट / व्हिसा सल्लागार', hi: 'पासपोर्ट / वीज़ा कंसल्टेंट' },

  // Subcategories — IT & Digital Solutions
  'Computer / Laptop Repair': { mr: 'कॉम्प्युटर / लॅपटॉप दुरुस्ती', hi: 'कंप्यूटर / लैपटॉप रिपेयर' },
  'WiFi / Broadband Setup': { mr: 'वायफाय / ब्रॉडबँड सेटअप', hi: 'वाईफाई / ब्रॉडबैंड सेटअप' },
  'Mobile Phone Repair': { mr: 'मोबाइल फोन दुरुस्ती', hi: 'मोबाइल फोन रिपेयर' },
  'CCTV Installation': { mr: 'सीसीटीव्ही इन्स्टॉलेशन', hi: 'सीसीटीवी इंस्टॉलेशन' },
  'Printer / Scanner Repair': { mr: 'प्रिंटर / स्कॅनर दुरुस्ती', hi: 'प्रिंटर / स्कैनर रिपेयर' },
  'Website / App Development': { mr: 'वेबसाइट / अॅप डेव्हलपमेंट', hi: 'वेबसाइट / ऐप डेवलपमेंट' },
  'Social Media Management': { mr: 'सोशल मीडिया मॅनेजमेंट', hi: 'सोशल मीडिया मैनेजमेंट' },
  'Data Entry / Typing Work': { mr: 'डेटा एन्ट्री / टायपिंग वर्क', hi: 'डाटा एंट्री / टाइपिंग वर्क' },
  'Graphic Design / Logo': { mr: 'ग्राफिक डिझाइन / लोगो', hi: 'ग्राफिक डिज़ाइन / लोगो' },

  // Subcategories — Urgent & Emergency Help
  'Roadside Assistance': { mr: 'रस्त्यावरील मदत', hi: 'रोडसाइड सहायता' },
  'Key Maker / Locksmith': { mr: 'किमेकर / लॉकस्मिथ', hi: 'चाबी बनानेवाला / लॉकस्मिथ' },
  'Gas Cylinder / Refill': { mr: 'गॅस सिलिंडर / रिफिल', hi: 'गैस सिलेंडर / रिफिल' },
  'Ambulance / Medical Help': { mr: 'रुग्णवाहिका / वैद्यकीय मदत', hi: 'एम्बुलेंस / मेडिकल सहायता' },
  'Towing Service': { mr: 'टोइंग सर्व्हिस', hi: 'टोइंग सर्विस' },
  'Emergency Electrician / Plumber': { mr: 'आपत्कालीन इलेक्ट्रिशियन / प्लंबर', hi: 'इमरजेंसी इलेक्ट्रीशियन / प्लंबर' },
  'Fire Safety / Extinguisher': { mr: 'अग्निसुरक्षा / अग्निशामक', hi: 'फायर सेफ्टी / एक्सटिंग्विशर' },

  // Subcategories — Hospitality & Stay Management
  'Guest House / PG': { mr: 'गेस्ट हाउस / पीजी', hi: 'गेस्ट हाउस / पीजी' },
  'Homestay / Vacation Rental': { mr: 'होमस्टे / व्हेकेशन रेंटल', hi: 'होमस्टे / वेकेशन रेंटल' },
  'Hotel / Lodge Booking': { mr: 'हॉटेल / लॉज बुकिंग', hi: 'होटल / लॉज बुकिंग' },
  'Cook / Chef for Events': { mr: 'कुक / शेफ कार्यक्रमांसाठी', hi: 'कुक / शेफ इवेंट्स के लिए' },
  'Housekeeping Staff': { mr: 'हाउसकीपिंग स्टाफ', hi: 'हाउसकीपिंग स्टाफ' },
  'Concierge / Errand Runner': { mr: 'कॉन्सिएर्ज / काम करणारा', hi: 'कॉन्सीयर्ज / एरंड रनर' },

  // General / fallback
  'General': { mr: 'सामान्य', hi: 'सामान्य' },
  'Other': { mr: 'इतर', hi: 'अन्य' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tc: (name: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  // Translate a category/subcategory name from the database
  const tc = (name: string): string => {
    if (language === 'en') return name;
    const translated = categoryTranslations[name];
    return translated ? translated[language] : name;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tc }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
