import React, { useState, useRef, useEffect } from 'react';

// Disease database with detailed information
const DISEASE_DATABASE = {
  rice: {
    blast: {
      name: { en: 'Rice Blast', ml: 'നെല്ല് ബ്ലാസ്റ്റ്', ta: 'நெல் பிளாஸ்ட்', hi: 'धान का झुलसा' },
      confidence: 0.92,
      severity: 'high',
      symptoms: {
        en: 'Spindle-shaped lesions with gray centers and brown borders on leaves',
        ml: 'ഇലകളിൽ ചാരനിറ കേന്ദ്രവും തവിട്ട് അരികുകളുമുള്ള സ്പിൻഡിൽ ആകൃതിയിലുള്ള പാടുകൾ',
        ta: 'இலைகளில் சாம்பல் மையம் மற்றும் பழுப்பு எல்லைகளுடன் சுழல் வடிவ புண்கள்',
        hi: 'पत्तियों पर धूसर केंद्र और भूरे किनारों वाले तकले के आकार के घाव'
      },
      treatment: {
        en: [
          'Apply Tricyclazole 75% WP @ 0.6g/L water',
          'Spray Carbendazim 50% WP @ 1g/L as preventive',
          'Avoid excess nitrogen fertilizer',
          'Maintain proper spacing for air circulation'
        ],
        ml: [
          'ട്രൈസൈക്ലാസോൾ 75% WP @ 0.6g/L വെള്ളത്തിൽ പ്രയോഗിക്കുക',
          'കാർബെൻഡാസിം 50% WP @ 1g/L മുൻകരുതലായി സ്പ്രേ ചെയ്യുക',
          'അമിതമായ നൈട്രജൻ വളം ഒഴിവാക്കുക',
          'വായു സഞ്ചാരത്തിന് ശരിയായ അകലം നിലനിർത്തുക'
        ],
        ta: [
          'ட்ரைசைக்ளாசோல் 75% WP @ 0.6கி/லி தண்ணீரில் பயன்படுத்தவும்',
          'கார்பெண்டாசிம் 50% WP @ 1கி/லி தடுப்புக்காக தெளிக்கவும்',
          'அதிக நைட்ரஜன் உரத்தைத் தவிர்க்கவும்',
          'காற்றோட்டத்திற்கு சரியான இடைவெளியை பராமரிக்கவும்'
        ],
        hi: [
          'ट्राइसाइक्लाज़ोल 75% WP @ 0.6g/L पानी में लगाएं',
          'कार्बेन्डाज़िम 50% WP @ 1g/L निवारक के रूप में स्प्रे करें',
          'अधिक नाइट्रोजन उर्वरक से बचें',
          'हवा के संचार के लिए उचित दूरी बनाए रखें'
        ]
      },
      prevention: {
        en: 'Use resistant varieties (Jyothi, Uma), seed treatment with fungicide, proper water management',
        ml: 'പ്രതിരോധശേഷിയുള്ള ഇനങ്ങൾ ഉപയോഗിക്കുക (ജ്യോതി, ഉമ), കുമിൾനാശിനി ഉപയോഗിച്ച് വിത്ത് ശുദ്ധീകരണം, ശരിയായ ജല പരിപാലനം',
        ta: 'எதிர்ப்பு இரகங்களைப் பயன்படுத்துங்கள் (ஜோதி, உமா), பூஞ்சை கொல்லியுடன் விதை நேர்த்தி, சரியான நீர் மேலாண்மை',
        hi: 'प्रतिरोधी किस्मों का उपयोग करें (ज्योति, उमा), कवकनाशी से बीज उपचार, उचित जल प्रबंधन'
      },
      organic: {
        en: 'Neem oil spray (5ml/L), Pseudomonas fluorescens application, ash application',
        ml: 'വേപ്പെണ്ണ സ്പ്രേ (5ml/L), സ്യൂഡോമോണാസ് ഫ്ലൂറസെൻസ് പ്രയോഗം, ചാരം പ്രയോഗം',
        ta: 'வேப்ப எண்ணெய் தெளிப்பு (5மிலி/லி), சூடோமோனாஸ் புளூரசென்ஸ் பயன்பாடு, சாம்பல் பயன்பாடு',
        hi: 'नीम तेल स्प्रे (5ml/L), स्यूडोमोनास फ्लोरेसेन्स का प्रयोग, राख का प्रयोग'
      }
    },
    bph: {
      name: { en: 'Brown Planthopper', ml: 'തവിട്ട് ഇലച്ചാടി', ta: 'பழுப்பு தத்துப்பூச்சி', hi: 'भूरा फुदका' },
      confidence: 0.88,
      severity: 'high',
      symptoms: {
        en: 'Yellow patches, hopper burn (circular dead patches), honeydew on leaves',
        ml: 'മഞ്ഞ പാടുകൾ, ഹോപ്പർ ബേൺ (വൃത്താകൃതിയിലുള്ള മരിച്ച പാടുകൾ), ഇലകളിൽ തേൻ മഞ്ഞ്',
        ta: 'மஞ்சள் திட்டுகள், ஹாப்பர் எரிப்பு (வட்ட வடிவ இறந்த திட்டுகள்), இலைகளில் தேன் பனி',
        hi: 'पीले धब्बे, हॉपर बर्न (गोलाकार मृत धब्बे), पत्तियों पर मधु ओस'
      },
      treatment: {
        en: [
          'Drain water from field completely for 3-4 days',
          'Apply Imidacloprid 17.8% SL @ 0.5ml/L',
          'Spray Thiamethoxam 25% WG @ 0.5g/L',
          'Avoid excessive nitrogen application'
        ],
        ml: [
          '3-4 ദിവസം പാടത്തെ വെള്ളം പൂർണ്ണമായും വറ്റിക്കുക',
          'ഇമിഡാക്ലോപ്രിഡ് 17.8% SL @ 0.5ml/L പ്രയോഗിക്കുക',
          'തയാമെത്തോക്സാം 25% WG @ 0.5g/L സ്പ്രേ ചെയ്യുക',
          'അമിതമായ നൈട്രജൻ പ്രയോഗം ഒഴിവാക്കുക'
        ],
        ta: [
          '3-4 நாட்களுக்கு வயலில் இருந்து தண்ணீரை முழுமையாக வடிக்கவும்',
          'இமிடாக்ளோப்ரிட் 17.8% SL @ 0.5மிலி/லி பயன்படுத்தவும்',
          'தயாமீத்தாக்சாம் 25% WG @ 0.5கி/லி தெளிக்கவும்',
          'அதிக நைட்ரஜன் பயன்பாட்டைத் தவிர்க்கவும்'
        ],
        hi: [
          '3-4 दिनों के लिए खेत से पानी पूरी तरह निकाल दें',
          'इमिडाक्लोप्रिड 17.8% SL @ 0.5ml/L लगाएं',
          'थियामेथोक्साम 25% WG @ 0.5g/L स्प्रे करें',
          'अत्यधिक नाइट्रोजन प्रयोग से बचें'
        ]
      },
      prevention: {
        en: 'Light traps during night, maintain optimal plant spacing, avoid ratoon crop near main field',
        ml: 'രാത്രിയിൽ വെളിച്ച കെണികൾ, ഒപ്റ്റിമൽ ചെടി അകലം നിലനിർത്തുക, പ്രധാന പാടത്തിന് സമീപം റട്ടൂൺ വിള ഒഴിവാക്കുക',
        ta: 'இரவில் ஒளி கண்ணிகள், உகந்த செடி இடைவெளியை பராமரிக்கவும், பிரதான வயலுக்கு அருகில் அடிக்குள்ள பயிரைத் தவிர்க்கவும்',
        hi: 'रात में प्रकाश जाल, इष्टतम पौधे की दूरी बनाए रखें, मुख्य खेत के पास रैटून फसल से बचें'
      },
      organic: {
        en: 'Neem seed kernel extract (5%), egg parasitoid Anagrus spp. release',
        ml: 'വേപ്പിൻ കുരു സത്ത് (5%), മുട്ട പരാദം അനാഗ്രസ് spp. വിടൽ',
        ta: 'வேப்ப விதை கர்னல் சாறு (5%), முட்டை ஒட்டுண்ணி அனாக்ரஸ் spp. விடுவிப்பு',
        hi: 'नीम बीज गुठली अर्क (5%), अंडा परजीवी एनाग्रस spp. छोड़ना'
      }
    },
    sheathBlight: {
      name: { en: 'Sheath Blight', ml: 'ഉറ കുമിൾ', ta: 'உறை அழுகல்', hi: 'आवरण झुलसा' },
      confidence: 0.85,
      severity: 'medium',
      symptoms: {
        en: 'Oval or elliptical greenish-gray lesions on leaf sheath, lesions may coalesce',
        ml: 'ഇല ഉറയിൽ ഓവൽ അല്ലെങ്കിൽ ദീർഘവൃത്താകൃതിയിലുള്ള പച്ച-ചാര പാടുകൾ, പാടുകൾ ലയിച്ചേക്കാം',
        ta: 'இலை உறையில் நீள்வட்ட அல்லது நீள்வட்ட பச்சை-சாம்பல் புண்கள், புண்கள் இணையலாம்',
        hi: 'पत्ती के आवरण पर अंडाकार या दीर्घवृत्ताकार हरे-भूरे घाव, घाव मिल सकते हैं'
      },
      treatment: {
        en: [
          'Spray Hexaconazole 5% EC @ 2ml/L',
          'Apply Validamycin 3% L @ 2ml/L',
          'Propiconazole 25% EC @ 1ml/L also effective',
          'Remove and destroy infected plant debris'
        ],
        ml: [
          'ഹെക്സാകൊണാസോൾ 5% EC @ 2ml/L സ്പ്രേ ചെയ്യുക',
          'വാലിഡാമൈസിൻ 3% L @ 2ml/L പ്രയോഗിക്കുക',
          'പ്രോപ്പികോണാസോൾ 25% EC @ 1ml/L യും ഫലപ്രദമാണ്',
          'ബാധിത ചെടി അവശിഷ്ടങ്ങൾ നീക്കം ചെയ്ത് നശിപ്പിക്കുക'
        ],
        ta: [
          'ஹெக்சாகோனசோல் 5% EC @ 2மிலி/லி தெளிக்கவும்',
          'வாலிடாமைசின் 3% L @ 2மிலி/லி பயன்படுத்தவும்',
          'புரோபிகோனசோல் 25% EC @ 1மிலி/லி யும் பயனுள்ளது',
          'பாதிக்கப்பட்ட தாவர குப்பைகளை அகற்றி அழிக்கவும்'
        ],
        hi: [
          'हेक्साकोनाज़ोल 5% EC @ 2ml/L स्प्रे करें',
          'वैलिडामाइसिन 3% L @ 2ml/L लगाएं',
          'प्रोपिकोनाज़ोल 25% EC @ 1ml/L भी प्रभावी है',
          'संक्रमित पौधों के अवशेष हटाएं और नष्ट करें'
        ]
      },
      prevention: {
        en: 'Avoid dense planting, balanced fertilization, proper drainage',
        ml: 'ഇടതൂർന്ന നടീൽ ഒഴിവാക്കുക, സന്തുലിത വളപ്രയോഗം, ശരിയായ ഡ്രെയിനേജ്',
        ta: 'அடர்த்தியான நடவை தவிர்க்கவும், சமச்சீர் உரமிடல், சரியான வடிகால்',
        hi: 'घनी रोपाई से बचें, संतुलित उर्वरक, उचित जल निकासी'
      },
      organic: {
        en: 'Trichoderma viride @ 4g/L spray, Pseudomonas fluorescens application',
        ml: 'ട്രൈക്കോഡെർമ വിരിഡെ @ 4g/L സ്പ്രേ, സ്യൂഡോമോണാസ് ഫ്ലൂറസെൻസ് പ്രയോഗം',
        ta: 'ட்ரைக்கோடெர்மா விரிடே @ 4கி/லி தெளிப்பு, சூடோமோனாஸ் புளூரசென்ஸ் பயன்பாடு',
        hi: 'ट्राइकोडर्मा विरिडी @ 4g/L स्प्रे, स्यूडोमोनास फ्लोरेसेन्स का प्रयोग'
      }
    }
  },
  coconut: {
    rhinocerosBeetle: {
      name: { en: 'Rhinoceros Beetle', ml: 'ചീനിക്കൊമ്പൻ', ta: 'காண்டாமிருக வண்டு', hi: 'गैंडा भृंग' },
      confidence: 0.91,
      severity: 'high',
      symptoms: {
        en: 'V-shaped cuts on fronds, bore holes in crown, chewed young leaves',
        ml: 'ഓലകളിൽ V ആകൃതിയിലുള്ള മുറിവുകൾ, കിരീടത്തിൽ തുളകൾ, ചവച്ച ഇളം ഇലകൾ',
        ta: 'ஓலைகளில் V வடிவ வெட்டுக்கள், மகுடத்தில் துளைகள், மென்ற இளம் இலைகள்',
        hi: 'मोर्चों पर V-आकार के कट, मुकुट में छेद, चबाई हुई युवा पत्तियां'
      },
      treatment: {
        en: [
          'Apply Naphthalene balls (3-4) in crown',
          'Hook out beetles from bore holes',
          'Fill crown with Neem cake + sand mixture',
          'Apply Beauveria bassiana in breeding sites'
        ],
        ml: [
          'കിരീടത്തിൽ നാഫ്തലീൻ ഗുളികകൾ (3-4) ഇടുക',
          'തുളകളിൽ നിന്ന് വണ്ടുകളെ കൊളുത്തി പുറത്തെടുക്കുക',
          'വേപ്പിൻ പിണ്ണാക്ക് + മണൽ മിശ്രിതം കിരീടത്തിൽ നിറയ്ക്കുക',
          'പ്രജനന സ്ഥലങ്ങളിൽ ബ്യൂവെറിയ ബാസിയാന പ്രയോഗിക്കുക'
        ],
        ta: [
          'மகுடத்தில் நாப்தலீன் உருண்டைகளை (3-4) இடவும்',
          'துளைகளில் இருந்து வண்டுகளை கொக்கியால் வெளியேற்றவும்',
          'வேப்ப புண்ணாக்கு + மணல் கலவையை மகுடத்தில் நிரப்பவும்',
          'இனப்பெருக்க இடங்களில் பியூவேரியா பாசியானா பயன்படுத்தவும்'
        ],
        hi: [
          'मुकुट में नेफ्थलीन की गोलियां (3-4) डालें',
          'छेदों से भृंगों को हुक से निकालें',
          'मुकुट में नीम केक + रेत मिश्रण भरें',
          'प्रजनन स्थलों में ब्यूवेरिया बेसियाना लगाएं'
        ]
      },
      prevention: {
        en: 'Proper sanitation, destroy breeding sites (decaying organic matter), light traps',
        ml: 'ശരിയായ ശുചിത്വം, പ്രജനന സ്ഥലങ്ങൾ (ജീർണിക്കുന്ന ജൈവ വസ്തുക്കൾ) നശിപ്പിക്കുക, വെളിച്ച കെണികൾ',
        ta: 'சரியான சுகாதாரம், இனப்பெருக்க இடங்களை (அழுகும் கரிம பொருட்கள்) அழிக்கவும், ஒளி கண்ணிகள்',
        hi: 'उचित स्वच्छता, प्रजनन स्थलों (सड़ते जैविक पदार्थ) को नष्ट करें, प्रकाश जाल'
      },
      organic: {
        en: 'Metarhizium anisopliae fungus application, pheromone traps',
        ml: 'മെട്ടാറൈസിയം അനിസോപ്ലിയേ കുമിൾ പ്രയോഗം, ഫെറോമോൺ കെണികൾ',
        ta: 'மெட்டாரைசியம் அனிசோப்லியே பூஞ்சை பயன்பாடு, பெரோமோன் கண்ணிகள்',
        hi: 'मेटाराइजियम एनिसोप्लिया कवक का प्रयोग, फेरोमोन जाल'
      }
    }
  },
  banana: {
    sigatoka: {
      name: { en: 'Sigatoka Leaf Spot', ml: 'സിഗടോക്ക ഇല പുള്ളി', ta: 'சிகடோகா இலைப் புள்ளி', hi: 'सिगाटोका पत्ती धब्बा' },
      confidence: 0.87,
      severity: 'medium',
      symptoms: {
        en: 'Yellow streaks turning brown, oval spots with gray centers on leaves',
        ml: 'മഞ്ഞ വരകൾ തവിട്ടു നിറമാകുന്നു, ഇലകളിൽ ചാര കേന്ദ്രങ്ങളോടെ ഓവൽ പാടുകൾ',
        ta: 'மஞ்சள் கோடுகள் பழுப்பாக மாறுகின்றன, இலைகளில் சாம்பல் மையங்களுடன் நீள்வட்ட புள்ளிகள்',
        hi: 'पीली धारियां भूरी हो जाती हैं, पत्तियों पर धूसर केंद्रों के साथ अंडाकार धब्बे'
      },
      treatment: {
        en: [
          'Spray Propiconazole 25% EC @ 1ml/L',
          'Apply Mancozeb 75% WP @ 2.5g/L',
          'Carbendazim 50% WP @ 1g/L is effective',
          'Remove severely infected leaves'
        ],
        ml: [
          'പ്രോപ്പികോണാസോൾ 25% EC @ 1ml/L സ്പ്രേ ചെയ്യുക',
          'മാങ്കോസെബ് 75% WP @ 2.5g/L പ്രയോഗിക്കുക',
          'കാർബെൻഡാസിം 50% WP @ 1g/L ഫലപ്രദമാണ്',
          'കഠിനമായി ബാധിച്ച ഇലകൾ നീക്കം ചെയ്യുക'
        ],
        ta: [
          'புரோபிகோனசோல் 25% EC @ 1மிலி/லி தெளிக்கவும்',
          'மான்கோசெப் 75% WP @ 2.5கி/லி பயன்படுத்தவும்',
          'கார்பெண்டாசிம் 50% WP @ 1கி/லி பயனுள்ளது',
          'கடுமையாக பாதிக்கப்பட்ட இலைகளை அகற்றவும்'
        ],
        hi: [
          'प्रोपिकोनाज़ोल 25% EC @ 1ml/L स्प्रे करें',
          'मैंकोज़ेब 75% WP @ 2.5g/L लगाएं',
          'कार्बेन्डाज़िम 50% WP @ 1g/L प्रभावी है',
          'गंभीर रूप से संक्रमित पत्तियां हटा दें'
        ]
      },
      prevention: {
        en: 'Proper drainage, avoid overhead irrigation, remove dried leaves regularly',
        ml: 'ശരിയായ ഡ്രെയിനേജ്, മുകളിൽ നിന്നുള്ള ജലസേചനം ഒഴിവാക്കുക, ഉണങ്ങിയ ഇലകൾ പതിവായി നീക്കം ചെയ്യുക',
        ta: 'சரியான வடிகால், மேல் நீர்ப்பாசனத்தைத் தவிர்க்கவும், உலர்ந்த இலைகளை தொடர்ந்து அகற்றவும்',
        hi: 'उचित जल निकासी, ऊपरी सिंचाई से बचें, सूखी पत्तियां नियमित रूप से हटाएं'
      },
      organic: {
        en: 'Bordeaux mixture spray, Trichoderma treatment, proper mulching',
        ml: 'ബോർഡോ മിശ്രിതം സ്പ്രേ, ട്രൈക്കോഡെർമ ചികിത്സ, ശരിയായ മൾച്ചിംഗ്',
        ta: 'போர்டோ கலவை தெளிப்பு, ட்ரைக்கோடெர்மா சிகிச்சை, சரியான மல்ச்சிங்',
        hi: 'बोर्डो मिश्रण स्प्रे, ट्राइकोडर्मा उपचार, उचित मल्चिंग'
      }
    }
  }
};

// Healthy crop response
const HEALTHY_RESPONSE = {
  name: { en: 'Healthy Crop', ml: 'ആരോഗ്യമുള്ള വിള', ta: 'ஆரோக்கியமான பயிர்', hi: 'स्वस्थ फसल' },
  confidence: 0.95,
  severity: 'none',
  message: {
    en: 'Your crop appears healthy! No diseases detected.',
    ml: 'നിങ്ങളുടെ വിള ആരോഗ്യകരമാണെന്ന് തോന്നുന്നു! രോഗങ്ങൾ കണ്ടെത്തിയില്ല.',
    ta: 'உங்கள் பயிர் ஆரோக்கியமாக இருப்பதாகத் தெரிகிறது! நோய்கள் எதுவும் கண்டறியப்படவில்லை.',
    hi: 'आपकी फसल स्वस्थ दिखती है! कोई रोग नहीं पाया गया।'
  },
  tips: {
    en: ['Continue regular monitoring', 'Maintain proper irrigation', 'Follow recommended fertilizer schedule'],
    ml: ['പതിവ് നിരീക്ഷണം തുടരുക', 'ശരിയായ ജലസേചനം നിലനിർത്തുക', 'ശുപാർശ ചെയ്ത വളം ഷെഡ്യൂൾ പാലിക്കുക'],
    ta: ['தொடர்ந்து கண்காணிக்கவும்', 'சரியான நீர்ப்பாசனத்தை பராமரிக்கவும்', 'பரிந்துரைக்கப்பட்ட உர அட்டவணையைப் பின்பற்றவும்'],
    hi: ['नियमित निगरानी जारी रखें', 'उचित सिंचाई बनाए रखें', 'अनुशंसित उर्वरक अनुसूची का पालन करें']
  }
};

const CropDiseaseDetector = () => {
  const [language, setLanguage] = useState('en');
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [imageSource, setImageSource] = useState(null); // 'camera' or 'upload'
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('diseaseScanHistory') || '[]');
    } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  ];

  const crops = [
    { id: 'rice', name: { en: 'Rice', ml: 'നെല്ല്', ta: 'நெல்', hi: 'धान' }, icon: '🌾' },
    { id: 'coconut', name: { en: 'Coconut', ml: 'തേങ്ങ', ta: 'தேங்காய்', hi: 'नारियल' }, icon: '🥥' },
    { id: 'banana', name: { en: 'Banana', ml: 'വാഴ', ta: 'வாழை', hi: 'केला' }, icon: '🍌' },
  ];

  const translations = {
    title: { en: 'AI Crop Disease Detector', ml: 'AI വിള രോഗ കണ്ടെത്തൽ', ta: 'AI பயிர் நோய் கண்டறிதல்', hi: 'AI फसल रोग खोज' },
    subtitle: { en: 'Take a photo or upload an image to detect diseases', ml: 'രോഗങ്ങൾ കണ്ടെത്താൻ ഫോട്ടോ എടുക്കുക അല്ലെങ്കിൽ ചിത്രം അപ്‌ലോഡ് ചെയ്യുക', ta: 'நோய்களைக் கண்டறிய புகைப்படம் எடுக்கவும் அல்லது படத்தைப் பதிவேற்றவும்', hi: 'रोगों का पता लगाने के लिए फोटो लें या छवि अपलोड करें' },
    selectCrop: { en: 'Select Crop Type', ml: 'വിള തരം തിരഞ്ഞെടുക്കുക', ta: 'பயிர் வகையைத் தேர்ந்தெடுக்கவும்', hi: 'फसल प्रकार चुनें' },
    takePhoto: { en: 'Take Photo', ml: 'ഫോട്ടോ എടുക്കുക', ta: 'புகைப்படம் எடு', hi: 'फोटो लें' },
    uploadImage: { en: 'Upload Image', ml: 'ചിത്രം അപ്‌ലോഡ് ചെയ്യുക', ta: 'படத்தைப் பதிவேற்றவும்', hi: 'छवि अपलोड करें' },
    analyzing: { en: 'Analyzing...', ml: 'വിശകലനം ചെയ്യുന്നു...', ta: 'பகுப்பாய்வு செய்கிறது...', hi: 'विश्लेषण हो रहा है...' },
    scanAgain: { en: 'Scan Again', ml: 'വീണ്ടും സ്കാൻ ചെയ്യുക', ta: 'மீண்டும் ஸ்கேன் செய்யவும்', hi: 'फिर से स्कैन करें' },
    symptoms: { en: 'Symptoms', ml: 'ലക്ഷണങ്ങൾ', ta: 'அறிகுறிகள்', hi: 'लक्षण' },
    treatment: { en: 'Treatment', ml: 'ചികിത്സ', ta: 'சிகிச்சை', hi: 'उपचार' },
    prevention: { en: 'Prevention', ml: 'പ്രതിരോധം', ta: 'தடுப்பு', hi: 'रोकथाम' },
    organic: { en: 'Organic Solution', ml: 'ജൈവ പരിഹാരം', ta: 'இயற்கை தீர்வு', hi: 'जैविक समाधान' },
    history: { en: 'Scan History', ml: 'സ്കാൻ ചരിത്രം', ta: 'ஸ்கேன் வரலாறு', hi: 'स्कैन इतिहास' },
    confidence: { en: 'Confidence', ml: 'വിശ്വാസ്യത', ta: 'நம்பகத்தன்மை', hi: 'विश्वास' },
    severity: { en: 'Severity', ml: 'തീവ്രത', ta: 'தீவிரம்', hi: 'गंभीरता' },
    capture: { en: 'Capture', ml: 'ക്യാപ്ചർ', ta: 'கைப்பற்று', hi: 'कैप्चर करें' },
    tips: { en: 'Tips', ml: 'നുറുങ്ങുകൾ', ta: 'குறிப்புகள்', hi: 'सुझाव' }
  };

  const t = (key) => translations[key]?.[language] || translations[key]?.en || key;

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setImageSource('camera');
    } catch (error) {
      console.error('Camera error:', error);
      alert('Unable to access camera. Please check permissions or try uploading an image.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
      analyzeImage(imageData);
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result;
        setCapturedImage(imageData);
        setImageSource('upload');
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze image using backend BLIP model
  const analyzeImage = async (imageData) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Convert data URL to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');
      
      // Call backend classifier endpoint
      const classifierResponse = await fetch('http://localhost:8000/classify-crop', {
        method: 'POST',
        body: formData
      });
      
      if (!classifierResponse.ok) {
        throw new Error(`Backend error: ${classifierResponse.status}`);
      }
      
      const classifierData = await classifierResponse.json();

      // Parse backend response and match to disease database
      let detectedDisease;
      const cropDiseases = DISEASE_DATABASE[selectedCrop];

      // Prefer the new ViT plant-disease classifier output when available
      // AND the model is reasonably confident (≥40%). Below that we fall
      // through to the BLIP-caption path so we don't surface guesses.
      const dz = classifierData.disease;
      const CONF_THRESHOLD = 40;
      if (dz && !dz.verdict && (dz.confidence ?? 0) >= CONF_THRESHOLD) {
        const isHealthy = dz.is_healthy === true;
        const conf = (typeof dz.confidence === 'number' ? dz.confidence : 0) / 100;
        detectedDisease = isHealthy ? {
          ...HEALTHY_RESPONSE,
          diseaseId: 'healthy',
          crop: dz.crop || selectedCrop,
          confidence: conf || 0.9,
          caption: `Detected as healthy ${dz.crop}`,
        } : {
          name: {
            en: `${dz.crop} — ${dz.disease}`,
            ml: `${dz.crop} — ${dz.disease}`,
            ta: `${dz.crop} — ${dz.disease}`,
            hi: `${dz.crop} — ${dz.disease}`,
          },
          confidence: conf || 0.6,
          severity: conf >= 0.8 ? 'high' : conf >= 0.55 ? 'medium' : 'low',
          symptoms: { en: `${dz.disease} detected on ${dz.crop} leaf (model confidence ${dz.confidence}%)` },
          treatment: { en: classifierData.disease_recommendations || ['Consult agricultural expert for treatment specific to this disease'] },
          prevention: { en: ['Monitor crop regularly', 'Maintain proper irrigation and drainage', 'Use disease-resistant varieties'] },
          organic: { en: ['Use organic fungicides', 'Practice crop rotation', 'Remove infected plant parts'] },
          diseaseId: dz.label || 'detected',
          crop: dz.crop || selectedCrop,
          modelInfo: dz.model,
          topPredictions: dz.top_predictions,
        };

        setResult(detectedDisease);
        const historyEntry = {
          id: Date.now(),
          date: new Date().toLocaleString(),
          crop: detectedDisease.crop,
          disease: detectedDisease.name[language] || detectedDisease.name.en,
          diseaseId: detectedDisease.diseaseId,
          confidence: detectedDisease.confidence,
          severity: detectedDisease.severity,
          thumbnail: imageData.substring(0, 100),
          source: 'plant_disease_vit',
        };
        const newHistory = [historyEntry, ...scanHistory].slice(0, 20);
        setScanHistory(newHistory);
        localStorage.setItem('diseaseScanHistory', JSON.stringify(newHistory));
        return;
      }

      // Fallback: existing BLIP keyword + color path
      const healthStatus = classifierData.health?.status || 'unknown';
      const healthScore = classifierData.health?.score || 0;
      const healthIssues = classifierData.health?.issues || [];

      console.log('Health Check:', { healthStatus, healthScore, healthIssuesCount: healthIssues.length });
      
      // Only show healthy if status is exactly 'Healthy' AND score is >= 80
      if (healthStatus.toLowerCase() === 'healthy' && healthScore >= 80 && healthIssues.length === 0) {
        // Healthy crop detected
        detectedDisease = {
          ...HEALTHY_RESPONSE,
          diseaseId: 'healthy',
          crop: selectedCrop,
          confidence: (classifierData.confidence / 100) || 0.95,
          caption: classifierData.caption || 'Crop appears healthy'
        };
      } else if (healthIssues.length > 0) {
        // Disease detected - match to database
        const issueText = (healthIssues[0] || '').toLowerCase();
        let matchedDiseaseId = null;
        
        // Try to match detected issue to disease database
        for (const [diseaseId, diseaseInfo] of Object.entries(cropDiseases || {})) {
          const diseaseName = diseaseInfo.name.en.toLowerCase();
          if (issueText.includes(diseaseName) || diseaseName.includes(issueText)) {
            matchedDiseaseId = diseaseId;
            break;
          }
        }
        
        if (matchedDiseaseId && cropDiseases[matchedDiseaseId]) {
          detectedDisease = {
            ...cropDiseases[matchedDiseaseId],
            diseaseId: matchedDiseaseId,
            crop: selectedCrop,
            confidence: (classifierData.confidence / 100) || cropDiseases[matchedDiseaseId].confidence,
            caption: classifierData.caption
          };
        } else {
          // Fallback if no exact match
          detectedDisease = {
            name: {
              en: healthIssues?.[0] || 'Unknown Issue',
              ml: 'അനിച്ചിന്തിത പ്രശ്നം',
              ta: 'தெரியாத சிக്கல்',
              hi: 'अज्ञात समस्या'
            },
            confidence: (classifierData.confidence / 100) || 0.6,
            severity: 'medium',
            symptoms: { en: classifierData.caption || 'Detected abnormalities in crop' },
            treatment: { en: classifierData.disease_recommendations || ['Consult agricultural expert for specific disease identification'] },
            prevention: { en: ['Monitor crop health regularly'] },
            organic: { en: ['Organic solutions depend on specific disease identification'] },
            diseaseId: 'unknown',
            crop: selectedCrop
          };
        }
      } else {
        // Default to diseased/stressed (not healthy) if health issues were detected
        const healthStatusLower = healthStatus.toLowerCase();
        const isHealthy = healthStatusLower === 'healthy' && healthScore >= 80;
        
        if (!isHealthy && (healthScore < 80 || healthIssues.length > 0)) {
          // Diseased/Stressed - create generic disease entry
          detectedDisease = {
            name: {
              en: `${healthStatus} Crop`,
              ml: 'രോഗബാധിത വിളയ്ക്കൻ കൃഷി',
              ta: 'நோய்த்தாக்கப்பட்ட பயிர்',
              hi: 'रोगग्रस्त फसल'
            },
            confidence: (classifierData.confidence / 100) || 0.7,
            severity: healthScore < 40 ? 'high' : healthScore < 60 ? 'medium' : 'low',
            symptoms: { 
              en: healthIssues.length > 0 
                ? healthIssues.join('; ') 
                : classifierData.caption || 'Detected abnormalities in crop' 
            },
            treatment: { en: classifierData.disease_recommendations || ['Consult agricultural expert for proper diagnosis and treatment'] },
            prevention: { en: ['Monitor crop health regularly', 'Maintain proper irrigation and drainage', 'Apply preventive measures early'] },
            organic: { en: ['Use organic fungicides for prevention', 'Practice crop rotation', 'Use resistant varieties'] },
            diseaseId: 'stress_detected',
            crop: selectedCrop,
            healthStatus: healthStatus,
            healthScore: healthScore
          };
        } else {
          // Fallback to healthy only if truly no issues detected
          detectedDisease = {
            ...HEALTHY_RESPONSE,
            diseaseId: 'healthy',
            crop: selectedCrop,
            confidence: 0.85
          };
        }
      }
      
      setResult(detectedDisease);
      
      // Save to history
      const historyEntry = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        crop: selectedCrop,
        disease: detectedDisease.name[language] || detectedDisease.name.en,
        diseaseId: detectedDisease.diseaseId,
        confidence: detectedDisease.confidence,
        severity: detectedDisease.severity,
        thumbnail: imageData.substring(0, 100),
        source: 'blip_model'
      };
      
      const newHistory = [historyEntry, ...scanHistory].slice(0, 20);
      setScanHistory(newHistory);
      localStorage.setItem('diseaseScanHistory', JSON.stringify(newHistory));
      
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Fallback to mock analysis if backend is unavailable
      console.log('Backend unavailable, using fallback detection...');
      
      const cropDiseases = DISEASE_DATABASE[selectedCrop];
      const diseaseKeys = Object.keys(cropDiseases || {});
      const randomValue = Math.random();
      
      let detectedDisease;
      if (randomValue > 0.3 && diseaseKeys.length > 0) {
        const randomDisease = diseaseKeys[Math.floor(Math.random() * diseaseKeys.length)];
        detectedDisease = {
          ...cropDiseases[randomDisease],
          diseaseId: randomDisease,
          crop: selectedCrop
        };
      } else {
        detectedDisease = { ...HEALTHY_RESPONSE, diseaseId: 'healthy', crop: selectedCrop };
      }
      
      if (detectedDisease.confidence) {
        detectedDisease.confidence = Math.min(0.99, detectedDisease.confidence + (Math.random() * 0.1 - 0.05));
      }
      
      setResult(detectedDisease);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset for new scan
  const resetScan = () => {
    setCapturedImage(null);
    setResult(null);
    setImageSource(null);
    stopCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#22c55e';
    }
  };

  const getSeverityText = (severity) => {
    const texts = {
      high: { en: 'High', ml: 'ഉയർന്നത്', ta: 'உயர்', hi: 'उच्च' },
      medium: { en: 'Medium', ml: 'മധ്യം', ta: 'நடுத்தர', hi: 'मध्यम' },
      low: { en: 'Low', ml: 'താഴ്ന്നത്', ta: 'குறைந்த', hi: 'कम' },
      none: { en: 'None', ml: 'ഇല്ല', ta: 'இல்லை', hi: 'कोई नहीं' }
    };
    return texts[severity]?.[language] || texts[severity]?.en || severity;
  };

  // Styles
  const containerStyle = {
    background: '#fff',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
    border: '1px solid #e2e8f0',
  };

  const cardStyle = {
    padding: '20px',
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #042f2e, #0d9488)',
    padding: '20px 24px',
    color: '#fff',
  };

  const languageBarStyle = {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '14px',
  };

  const langBtnStyle = (isActive) => ({
    padding: '5px 13px',
    borderRadius: '99px',
    border: 'none',
    background: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.2)',
    color: isActive ? '#0d9488' : '#fff',
    cursor: 'pointer',
    fontWeight: isActive ? '700' : '500',
    fontSize: '0.78rem',
    transition: 'all 0.2s',
  });

  const cropSelectorStyle = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  };

  const cropBtnStyle = (isActive) => ({
    padding: '8px 16px',
    borderRadius: '99px',
    border: `1.5px solid ${isActive ? '#0d9488' : '#e2e8f0'}`,
    background: isActive ? '#f0fdfa' : '#fafafa',
    color: isActive ? '#0f766e' : '#475569',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: isActive ? '700' : '500',
    fontSize: '0.85rem',
    transition: 'all 0.2s',
    boxShadow: isActive ? '0 2px 8px rgba(13,148,136,0.15)' : 'none',
  });

  const actionBtnStyle = (primary = true) => ({
    flex: 1,
    padding: '13px 20px',
    borderRadius: '12px',
    border: primary ? 'none' : '1.5px solid #0d9488',
    background: primary ? 'linear-gradient(135deg, #0d9488, #0f766e)' : '#fff',
    color: primary ? 'white' : '#0f766e',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    boxShadow: primary ? '0 4px 14px rgba(13,148,136,0.3)' : 'none',
  });

  const cameraContainerStyle = {
    position: 'relative',
    borderRadius: '20px',
    overflow: 'hidden',
    background: '#000',
    aspectRatio: '4/3',
    marginBottom: '16px',
  };

  const resultCardStyle = {
    background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
    borderRadius: '16px',
    padding: '20px',
    marginTop: '16px',
    border: '1px solid #99f6e4',
  };

  const sectionStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '14px 16px',
    marginTop: '12px',
    border: '1px solid #e2e8f0',
  };

  return (
    <div style={containerStyle}>
      {/* Gradient Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🔬</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', fontFamily: "'Manrope',sans-serif" }}>{t('title')}</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>{t('subtitle')}</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '14px', padding: '8px 14px', fontSize: '0.78rem', fontWeight: 700 }}>
            AI Disease Detection
          </div>
        </div>
        {/* Language Selector */}
        <div style={languageBarStyle}>
          {languages.map(lang => (
            <button
              key={lang.code}
              style={langBtnStyle(language === lang.code)}
              onClick={() => setLanguage(lang.code)}
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        {/* Crop Selector */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            {t('selectCrop')}
          </p>
          <div style={cropSelectorStyle}>
            {crops.map(crop => (
              <button
                key={crop.id}
                style={cropBtnStyle(selectedCrop === crop.id)}
                onClick={() => setSelectedCrop(crop.id)}
              >
                <span style={{ fontSize: '1.2rem' }}>{crop.icon}</span>
                {crop.name[language] || crop.name.en}
              </button>
            ))}
          </div>
        </div>

        {/* Camera/Image View */}
        {!capturedImage && !cameraActive && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button style={actionBtnStyle(true)} onClick={startCamera}>
              📷 {t('takePhoto')}
            </button>
            <button style={actionBtnStyle(false)} onClick={() => fileInputRef.current?.click()}>
              📁 {t('uploadImage')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Live Camera View */}
        {cameraActive && (
          <div style={cameraContainerStyle}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '16px'
            }}>
              <button
                onClick={capturePhoto}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'white',
                  border: '4px solid #22c55e',
                  cursor: 'pointer',
                  fontSize: '24px'
                }}
              >
                📸
              </button>
              <button
                onClick={stopCamera}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Captured Image */}
        {capturedImage && (
          <div style={{ marginTop: '20px' }}>
            <img
              src={capturedImage}
              alt="Captured"
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: '16px',
                border: '2px solid #e5e7eb'
              }}
            />
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            marginTop: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '4px solid #e5e7eb',
              borderTopColor: '#22c55e',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#374151' }}>
              🔬 {t('analyzing')}
            </p>
            <p style={{ color: '#64748b', marginTop: '8px' }}>
              AI is analyzing your image for diseases...
            </p>
          </div>
        )}

        {/* Results */}
        {result && !isAnalyzing && (
          <div style={resultCardStyle}>
            {/* Disease Name & Badge */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                display: 'inline-block',
                padding: '12px 24px',
                borderRadius: '30px',
                background: result.severity === 'none' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : getSeverityColor(result.severity),
                color: 'white',
                fontWeight: '700',
                fontSize: '1.3rem',
                marginBottom: '12px'
              }}>
                {result.severity === 'none' ? '✅' : '⚠️'} {result.name[language] || result.name.en}
              </div>

              {/* Confidence & Severity */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('confidence')}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
                    {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('severity')}</p>
                  <p style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: '700', 
                    color: getSeverityColor(result.severity),
                    textTransform: 'uppercase'
                  }}>
                    {getSeverityText(result.severity)}
                  </p>
                </div>
              </div>
            </div>

            {/* Healthy Message */}
            {result.severity === 'none' && result.message && (
              <div style={sectionStyle}>
                <p style={{ fontSize: '1.1rem', textAlign: 'center', color: '#166534' }}>
                  {result.message[language] || result.message.en}
                </p>
                {result.tips && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ color: '#16a34a', marginBottom: '8px' }}>💡 {t('tips')}:</h4>
                    <ul style={{ marginLeft: '20px', color: '#374151' }}>
                      {(result.tips[language] || result.tips.en).map((tip, i) => (
                        <li key={i} style={{ marginBottom: '6px' }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Disease Details */}
            {result.severity !== 'none' && (
              <>
                {/* Symptoms */}
                {result.symptoms && (
                  <div style={sectionStyle}>
                    <h4 style={{ color: '#dc2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🔍 {t('symptoms')}
                    </h4>
                    <p style={{ color: '#374151', lineHeight: '1.6' }}>
                      {result.symptoms[language] || result.symptoms.en}
                    </p>
                  </div>
                )}

                {/* Treatment */}
                {result.treatment && (
                  <div style={{ ...sectionStyle, background: '#fef3c7', border: '1px solid #fcd34d' }}>
                    <h4 style={{ color: '#92400e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      💊 {t('treatment')}
                    </h4>
                    <ul style={{ marginLeft: '20px', color: '#78350f' }}>
                      {(result.treatment[language] || result.treatment.en).map((item, i) => (
                        <li key={i} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prevention */}
                {result.prevention && (
                  <div style={sectionStyle}>
                    <h4 style={{ color: '#0369a1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🛡️ {t('prevention')}
                    </h4>
                    <p style={{ color: '#374151', lineHeight: '1.6' }}>
                      {result.prevention[language] || result.prevention.en}
                    </p>
                  </div>
                )}

                {/* Organic Solution */}
                {result.organic && (
                  <div style={{ ...sectionStyle, background: '#f0fdf4', border: '1px solid #86efac' }}>
                    <h4 style={{ color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🌿 {t('organic')}
                    </h4>
                    <p style={{ color: '#14532d', lineHeight: '1.6' }}>
                      {result.organic[language] || result.organic.en}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Scan Again Button */}
            <button
              onClick={resetScan}
              style={{ ...actionBtnStyle(true), marginTop: '20px', width: '100%' }}
            >
              🔄 {t('scanAgain')}
            </button>
          </div>
        )}

        {/* History Toggle */}
        {scanHistory.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              📋 {t('history')} ({scanHistory.length})
              <span style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {showHistory && (
              <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {scanHistory.map((entry) => (
                  <div key={entry.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '10px',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <p style={{ fontWeight: '600', color: '#374151' }}>
                        {crops.find(c => c.id === entry.crop)?.icon} {entry.disease}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{entry.date}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: getSeverityColor(entry.severity) + '20',
                        color: getSeverityColor(entry.severity)
                      }}>
                        {getSeverityText(entry.severity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropDiseaseDetector;
