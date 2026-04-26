export const translations = {
  nav: {
    brand: "ReStructify",
    home: "Pagrindinis",
    education: "Edukacija",
    createBeam: "Sukurti siją",
    myListings: "Mano skelbimai",
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
    title: "Sukurti siją",
    subtitle: "Užpildykite parduodamos konstrukcijos duomenis.",
    success: "Sija sėkmingai sukurta.",
    cancel: "Atšaukti",
    saving: "Saugoma...",
    submit: "Sukurti siją",
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
    location: "Vieta"
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
    heroSecondaryCta: "Naršyti konstrukcijas",
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
      { value: "2 450 t", label: "Sutaupyta CO₂ per paskutinius 12 mėn." },
      { value: "1 250", label: "Konstrukcijų suteikta antra gyvybė" }
    ],

    impactImageAlt: "Tvarios statybos ir gamtos fonas",

    finalTitle: "Neišmesk – panaudok dar kartą",
    finalSubtitle: "Prisijunk prie tvarių statybų judėjimo jau šiandien.",
    finalCta: "Pradėti dabar"
  }
};