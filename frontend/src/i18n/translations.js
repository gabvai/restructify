export const translations = {
  nav: {
    brand: "ReStructify",
    home: "Pagrindinis",
    education: "Edukacija",
    createBeam: "Pridėti konstrukciją",
    allListings: "Visi skelbimai",
    myListings: "Mano skelbimai",
    cart: "Krepšelis",
    logOut: "Atsijungti"
  },
  auth: {
    login: {
      title: "Prisijungti",
      subtitle: "Sveiki sugrįžę. Įveskite savo duomenis ir tęskite.",
      email: "El. paštas",
      password: "Slaptažodis",
      submit: "Prisijungti",
      submitting: "Jungiamasi...",
      noAccount: "Neturite paskyros?",
      register: "Registruotis"
    },
    register: {
      title: "Sukurti paskyrą",
      subtitle: "Registruokitės, kad galėtumėte kurti skelbimus.",
      name: "Vardas",
      email: "El. paštas",
      password: "Slaptažodis",
      phone: "Telefonas",
      optional: "Nebūtina",
      submit: "Sukurti paskyrą",
      submitting: "Kuriama paskyra...",
      alreadyRegistered: "Jau turite paskyrą?",
      logIn: "Prisijungti"
    }
  },
  createBeam: {
    title: "Pridėti konstrukciją",
    subtitle: "Užpildykite parduodamos konstrukcijos duomenis.",
    success: "Sija sėkmingai sukurta.",
    cancel: "Atšaukti",
    saving: "Saugoma...",
    submit: "Pridėti konstrukciją",
    fields: {
      title: "Pavadinimas",
      description: "Aprašymas",
      beam_name: "Sijos pavadinimas",
      beam_type: "Sijos tipas",
      profile_name: "Profilis",
      steel_grade: "Plieno klasė",
      surface_coating: "Paviršiaus padengimas",
      condition: "Būklė",
      defects: "Defektai",
      usage_history: "Naudojimo istorija",
      drawings: "Brėžiniai",
      location: "Vieta",
      length_mm: "Ilgis (mm)",
      weight_kg: "Svoris (kg)",
      height_mm: "Aukštis (mm)",
      width_mm: "Plotis (mm)",
      web_thickness_mm: "Sienelės storis (mm)",
      flange_thickness_mm: "Lentynos storis (mm)",
      quantity: "Kiekis",
      price_eur: "Kaina (EUR)"
    }
  },
  listings: {
    title: "Mano skelbimai",
    subtitle: "Visos jūsų sukurtos sijos.",
    newBeam: "Nauja sija",
    loading: "Kraunama...",
    retry: "Bandyti dar kartą",
    emptyPrefix: "Skelbimų dar nėra.",
    emptyCta: "Sukurkite pirmą siją",
    untitledBeam: "Be pavadinimo",
    profile: "Profilis",
    length: "Ilgis",
    condition: "Būklė",
    location: "Vieta",
    addToCart: "Pridėti į krepšelį",
    view: "Peržiūrėti"
  },
  allListings: {
    title: "Visi skelbimai",
    subtitle: "Peržiūrėkite visas šiuo metu paskelbtas konstrukcijas.",
    filter: "Filtruoti"
  },
  cart: {
    title: "Krepšelis",
    empty: "Krepšelis kol kas tuščias.",
    clear: "Išvalyti krepšelį",
    close: "Uždaryti",
    pay: "Apmokėti",
    remove: "Pašalinti",
    qty: "Kiekis"
  },
  common: {
    emptyValue: "—"
  },
  home: {
    welcome: "Sveiki",
    heroTitle: "Viena konstrukcija – du keliai",
    heroSubtitle:
      "Parduok. Pakartotinai naudok. Sutaupyk. Kartu mažiname atliekas ir kuriame tvaresnę statybų ateitį.",
    heroPrimaryCta: "Įkelti konstrukciją",
    heroSecondaryCta: "Ieškoti konstrukcijų",
    heroBadges: [
      "Mažina CO₂ emisijas",
      "Taupo išteklius",
      "Pratęsia konstrukcijų gyvavimo ciklą"
    ],
    heroImageAlt: "Izometrinė tvarios statybos iliustracija",

    statsSectionTitle: "Skaičiai, kurie skatina keistis",
    statsCards: [
      {
        value: "36 %",
        description: "visų atliekų ES sudaro statybos ir griovimo atliekos",
        source: "Šaltinis: European Commission"
      },
      {
        value: "~37 %",
        description: "pasaulinių CO₂ emisijų sukuria statybų sektorius",
        source: "Šaltinis: United Nations Environment Programme"
      },
      {
        value: "∞",
        description: "dauguma konstrukcijų gali būti pakartotinai naudojamos",
        source: ""
      }
    ],

    toggle: {
      problem: "Problema",
      solution: "Sprendimas",
      problemTitle: "Dabartinė situacija",
      problemPoints: [
        "Daug konstrukcijų yra išmetamos",
        "Prarandami vertingi ištekliai",
        "Didėja atliekų kiekis sąvartynuose",
        "Didėja CO₂ emisijos"
      ],
      solutionTitle: "Mūsų sprendimas",
      solutionPoints: [
        "Konstrukcijos parduodamos ir pakartotinai naudojamos",
        "Ištekliai išsaugomi",
        "Mažinamas atliekų kiekis ir tarša",
        "Kuriama tvaresnė statybų ateitis"
      ]
    },

    howTitle: "Kaip tai veikia?",
    steps: [
      {
        title: "Įkelk konstrukciją",
        description: "Įkelk konstrukcijos informaciją ir nuotraukas."
      },
      {
        title: "Sistema klasifikuoja",
        description: "Sistema patikrina duomenis ir paruošia skelbimą."
      },
      {
        title: "Kiti randa ir perka",
        description: "Pirkėjai randa tinkamas konstrukcijas ir suteikia joms antrą gyvenimą."
      }
    ],

    productsTitle: "Turimos konstrukcijos",
    products: [
      { name: "IPE 300 sija", length: "6,0 m", weight: "318 kg", quantity: "12 vnt.", price: "120 € / vnt." },
      { name: "HEA 240 sija", length: "5,2 m", weight: "274 kg", quantity: "8 vnt.", price: "145 € / vnt." },
      { name: "IPE 200 sija", length: "4,8 m", weight: "196 kg", quantity: "21 vnt.", price: "89 € / vnt." },
      { name: "HEB 280 sija", length: "7,1 m", weight: "402 kg", quantity: "5 vnt.", price: "188 € / vnt." }
    ],

    labels: {
      length: "Ilgis",
      weight: "Svoris",
      quantity: "Kiekis"
    },

    productImageAlt: "Plieninės sijos nuotrauka",

    impactTitle: "Kartu kuriame tvaresnę ateitį",
    impactItems: [
      { value: "110 t", label: "Sutaupyta CO₂ per paskutinius 12 mėn." },
      { value: "210", label: "Konstrukcijų suteikta antra gyvybė" }
    ],

    impactImageAlt: "Tvarios statybos ir gamtos fonas",

    finalTitle: "Neišmesk – panaudok dar kartą",
    finalSubtitle: "Prisijunk prie tvarių statybų judėjimo jau šiandien.",
    finalCta: "Pradėti dabar"
  },
  education: {
    title: "Edukacija",
    subtitle:
      "Sužinok, kada konstrukcijas verta pernaudoti, kaip tai daryti saugiai ir kokią vertę tai gali sukurti.",
    quoteImageAlt: "Citata apie edukaciją ir sąmoningumą",
    factsTitle: "Ar žinojai?",
    facts: [
      {
        icon: "♻",
        value: "~30%",
        title: "Statybos atliekos",
        text: "Statybos ir griovimo atliekos sudaro daugiau nei trečdalį visų Europos Sąjungoje susidarančių atliekų.",
        source: "European Commission",
        sourceUrl: "https://environment.ec.europa.eu/topics/waste-and-recycling/construction-and-demolition-waste_en"
      },
      {
        icon: "☁",
        value: "34%",
        title: "CO₂ emisijos",
        text: "Pastatų ir statybos sektorius 2024 m. sudarė apie 34 % pasaulinių CO₂ emisijų.",
        source: "UNEP Global Status Report for Buildings and Construction 2024/2025",
        sourceUrl:
          "https://www.unep.org/resources/report/global-status-report-buildings-and-construction-20242025"
      },
      {
        icon: "🧱",
        value: "11%",
        title: "Medžiagų poveikis",
        text: "Statybinės medžiagos ir statybos procesai sudaro apie 11 % pasaulinių su energija susijusių anglies emisijų.",
        source: "World Green Building Council",
        sourceUrl: "https://worldgbc.org/climate-action/embodied-carbon/"
      }
    ],
    examples: {
      title: "Realūs pavyzdžiai",
      description:
        "Tikri projektai, kurie parodo, kad net senos konstrukcijos gali būti sėkmingai pernaudotos.",
      card: {
        imageAlt: "Pernaudojamų plieninių sijų etapai: paruošimas ir pritaikymas naujai statybai",
        title: "Pernaudotos plieninės sijos Londone",
        text: "Viename Londono projekte senos plieninės sijos nebuvo išmestos – jos buvo įvertintos ir sėkmingai panaudotos naujai konstrukcijai. Nors paviršiuje buvo matoma korozija, po apdorojimo paaiškėjo, kad jų tvirtumas išlikęs.",
        processTitle: "Kaip vyko procesas:",
        process: [
          "Konstrukcijos išmontuotos iš seno pastato",
          "Rūdys ir senos dangos pašalintos (smėliavimas / shot blasting)",
          "Atliktas stiprumo ir būklės vertinimas",
          "Tinkamos sijos integruotos į naują statinį"
        ],
        impactTitle: "Ką tai parodo:",
        impact: [
          "Vizualiai pažeistos konstrukcijos nebūtinai yra netinkamos",
          "Po tinkamo įvertinimo jas galima saugiai pernaudoti",
          "Mažinamas atliekų kiekis ir CO₂ emisijos"
        ],
        source: "Springer (2023)",
        sourceUrl: "https://link.springer.com/article/10.1007/s13296-023-00778-4"
      }
    },
    quiz: {
      title: "Pasitikrink žinias",
      questions: [
        {
          id: 1,
          question: "Kada plieninė konstrukcija gali būti laikoma tinkama pakartotiniam naudojimui?",
          correctOptionId: "B",
          explanation: "Sprendimas grindžiamas inžineriniu vertinimu, ne vien išvaizda.",
          sourceLabel: "Springer (2023)",
          sourceUrl: "https://link.springer.com/article/10.1007/s13296-023-00778-4",
          options: [
            { id: "A", text: "Kai ji neturi jokių vizualių pažeidimų" },
            { id: "B", text: "Kai po patikros jos mechaninės savybės atitinka reikalavimus" },
            { id: "C", text: "Kai ji buvo naudota mažiau nei 5 metus" },
            { id: "D", text: "Kai jos paviršius yra perdažytas" }
          ]
        },
        {
          id: 2,
          question: "Kuris veiksnys dažniausiai lemia, ar konstrukciją galima pernaudoti?",
          correctOptionId: "C",
          explanation: "Svarbiausia – medžiagos savybės (stiprumas, pažeidimai, korozija).",
          sourceLabel: "DISRUPT Toolkit",
          sourceUrl:
            "https://asbp.org.uk/wp-content/uploads/2023/03/Business-considerations-for-steel-reuse-DISRUPT-Toolkit.pdf",
          options: [
            { id: "A", text: "Konstrukcijos spalva" },
            { id: "B", text: "Projekto vieta (šalis)" },
            { id: "C", text: "Medžiagos būklė ir likęs stiprumas" },
            { id: "D", text: "Statybos metai" }
          ]
        },
        {
          id: 3,
          question: "Kodėl konstrukcijų pernaudojimas laikomas tvaresniu sprendimu?",
          correctOptionId: "B",
          explanation: "Mažiau naujos gamybos reiškia mažiau emisijų ir atliekų.",
          sourceLabel: "World Green Building Council",
          sourceUrl: "https://worldgbc.org/climate-action/embodied-carbon/",
          options: [
            { id: "A", text: "Nes sumažina darbo jėgos poreikį" },
            { id: "B", text: "Nes sumažina naujų medžiagų poreikį ir CO₂ emisijas" },
            { id: "C", text: "Nes visada pagreitina statybą" },
            { id: "D", text: "Nes nereikia projektavimo" }
          ]
        }
      ]
    }
  }
};