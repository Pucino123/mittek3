export type DeviceType = 'iphone' | 'ipad' | 'mac';

export interface HardcodedGuideStep {
  step_number: number;
  title: string;
  instruction: string;
  instructionByDevice?: Record<DeviceType, string>;
  image_url?: string;
  tip_text?: string;
  warning_text?: string;
}

export interface HardcodedGuide {
  id: string;
  title: string;
  titleByDevice?: Record<DeviceType, string>;
  description: string;
  category: 'hverdag' | 'sikkerhed' | 'batteri' | 'icloud' | 'beskeder' | 'apps';
  icon: 'update' | 'popup' | 'text' | 'security' | 'battery' | 'cloud' | 'message' | 'apps';
  supportsDevices?: boolean;
  steps: HardcodedGuideStep[];
  stepsByDevice?: Record<DeviceType, HardcodedGuideStep[]>;
}

export const hardcodedGuides: HardcodedGuide[] = [
  // ============================================
  // KATEGORI: HVERDAG
  // ============================================
  {
    id: 'update-ios',
    title: 'Opdater din enhed sikkert',
    titleByDevice: {
      iphone: 'Opdater din iPhone sikkert',
      ipad: 'Opdater din iPad sikkert',
      mac: 'Opdater din Mac sikkert',
    },
    description: 'Sørg for at din enhed har den nyeste software',
    category: 'hverdag',
    icon: 'update',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn Indstillinger',
          instruction: 'Find det grå tandhjul-ikon på din startskærm, og tryk på det. Det hedder "Indstillinger".',
          image_url: '/src/assets/guide-icloud-settings.png',
          tip_text: 'Indstillinger-ikonet ligner et gråt tandhjul og ligger som regel på din første skærm.',
        },
        {
          step_number: 2,
          title: 'Tryk på "Generelt"',
          instruction: 'Rul lidt ned på siden og find "Generelt". Det har et tandhjul-ikon. Tryk på det.',
        },
        {
          step_number: 3,
          title: 'Find "Softwareopdatering"',
          instruction: 'I menuen "Generelt", find og tryk på "Softwareopdatering". Den er ofte øverst.',
        },
        {
          step_number: 4,
          title: 'Installer opdateringen',
          instruction: 'Hvis der er en opdatering tilgængelig, tryk på "Hent og installer". Sørg for at din telefon har mindst 50% batteri, eller sæt den til opladning først. Opdateringen kan tage 10-30 minutter.',
          warning_text: 'Afbryd ALDRIG opdateringen, mens den er i gang. Din telefon kan gå i stykker.',
          tip_text: 'Det er en god idé at opdatere om aftenen, så telefonen er klar næste morgen.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn Indstillinger',
          instruction: 'Find det grå tandhjul-ikon på din startskærm, og tryk på det. Det hedder "Indstillinger".',
        },
        {
          step_number: 2,
          title: 'Tryk på "Generelt"',
          instruction: 'I sidebaren til venstre, find og tryk på "Generelt".',
        },
        {
          step_number: 3,
          title: 'Find "Softwareopdatering"',
          instruction: 'I menuen "Generelt", find og tryk på "Softwareopdatering". Den er øverst på listen.',
        },
        {
          step_number: 4,
          title: 'Installer opdateringen',
          instruction: 'Hvis der er en opdatering tilgængelig, tryk på "Hent og installer". Sørg for at din iPad har mindst 50% batteri, eller sæt den til opladning først.',
          warning_text: 'Afbryd ALDRIG opdateringen, mens den er i gang.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Klik på Æblet',
          instruction: 'Klik på Æble-ikonet () i øverste venstre hjørne af din skærm.',
        },
        {
          step_number: 2,
          title: 'Åbn Systemindstillinger',
          instruction: 'Klik på "Systemindstillinger" i menuen der kommer frem.',
        },
        {
          step_number: 3,
          title: 'Find Softwareopdatering',
          instruction: 'Klik på "Generelt" i sidebaren, og derefter på "Softwareopdatering".',
        },
        {
          step_number: 4,
          title: 'Installer opdateringen',
          instruction: 'Hvis der er en opdatering tilgængelig, klik på "Opdater nu". Din Mac skal være tilsluttet strøm. Opdateringen kan tage 30-60 minutter.',
          warning_text: 'Luk IKKE computeren, mens opdateringen kører. Sørg for at den er tilsluttet strøm.',
        },
      ],
    },
  },
  {
    id: 'stop-popups',
    title: 'Stop irriterende popups (Safari)',
    description: 'Blokér uønskede vinduer og advarsler i Safari',
    category: 'hverdag',
    icon: 'popup',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn Indstillinger',
          instruction: 'Find det grå tandhjul-ikon på din startskærm, og tryk på det.',
        },
        {
          step_number: 2,
          title: 'Find Safari',
          instruction: 'Rul ned i Indstillinger indtil du finder "Safari" (den har et kompas-ikon). Tryk på den.',
        },
        {
          step_number: 3,
          title: 'Slå "Bloker vinduer" til',
          instruction: 'Find sektionen "Generelt" og sørg for at "Bloker vinduer" er slået TIL (den skal være grøn). Dette stopper de fleste irriterende popup-vinduer.',
          image_url: '/src/assets/guide-safari-popups.png',
          tip_text: 'En grøn knap betyder "tændt" - det er det du vil have her.',
        },
        {
          step_number: 4,
          title: 'Aktiver svindelbeskyttelse',
          instruction: 'Rul ned til "Anonymitet og sikkerhed" og sørg for at "Advarsel om svindelwebsted" er slået TIL (grøn). Dette advarer dig hvis du besøger et farligt websted.',
          warning_text: 'Ignorer ALDRIG denne advarsel. Hvis Safari siger et websted er farligt, så luk det med det samme.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn Indstillinger',
          instruction: 'Find det grå tandhjul-ikon på din startskærm, og tryk på det.',
        },
        {
          step_number: 2,
          title: 'Find Safari i sidebaren',
          instruction: 'Rul ned i venstre sidepanel indtil du finder "Safari". Tryk på den.',
        },
        {
          step_number: 3,
          title: 'Slå "Bloker vinduer" til',
          instruction: 'I højre side, find "Bloker vinduer" og sørg for den er slået TIL (grøn).',
        },
        {
          step_number: 4,
          title: 'Aktiver svindelbeskyttelse',
          instruction: 'Find "Advarsel om svindelwebsted" og sørg for den er slået TIL (grøn).',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn Safari',
          instruction: 'Klik på Safari-ikonet i din Dock (kompas-ikonet) eller find det i Programmer.',
        },
        {
          step_number: 2,
          title: 'Åbn Indstillinger',
          instruction: 'Klik på "Safari" i menulinjen øverst, og vælg "Indstillinger..." (eller tryk ⌘+, )',
        },
        {
          step_number: 3,
          title: 'Gå til Websteder',
          instruction: 'Klik på fanen "Websteder" øverst i vinduet.',
        },
        {
          step_number: 4,
          title: 'Blokér popups',
          instruction: 'Klik på "Pop-up vinduer" i venstre kolonne. Sæt "Når du besøger andre websteder" til "Bloker og giv besked".',
        },
        {
          step_number: 5,
          title: 'Aktiver svindelbeskyttelse',
          instruction: 'Gå til fanen "Sikkerhed" og sørg for at "Advar ved svindelwebsted" er markeret.',
        },
      ],
    },
  },
  {
    id: 'bigger-text',
    title: 'Gør teksten større',
    description: 'Gør det lettere at læse på din skærm',
    category: 'hverdag',
    icon: 'text',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn Indstillinger',
          instruction: 'Find det grå tandhjul-ikon på din startskærm, og tryk på det.',
        },
        {
          step_number: 2,
          title: 'Find "Skærm & Lysstyrke"',
          instruction: 'Rul ned og find "Skærm & Lysstyrke". Tryk på den.',
        },
        {
          step_number: 3,
          title: 'Tryk på "Tekststørrelse"',
          instruction: 'Find og tryk på "Tekststørrelse". Her kan du justere hvor stor teksten skal være.',
        },
        {
          step_number: 4,
          title: 'Træk skyderen',
          instruction: 'I bunden af skærmen ser du en skyder med et "A" i hver ende. Træk skyderen mod HØJRE for at gøre teksten STØRRE. Prøv dig frem indtil teksten er behagelig at læse.',
          image_url: '/src/assets/guide-text-size.png',
          tip_text: 'Du kan altid ændre det igen senere, hvis det bliver for stort eller for småt.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn Indstillinger',
          instruction: 'Find det grå tandhjul-ikon på din startskærm, og tryk på det.',
        },
        {
          step_number: 2,
          title: 'Find "Skærm & Lysstyrke"',
          instruction: 'I sidebaren til venstre, find og tryk på "Skærm & Lysstyrke".',
        },
        {
          step_number: 3,
          title: 'Tryk på "Tekststørrelse"',
          instruction: 'I højre side, find og tryk på "Tekststørrelse".',
        },
        {
          step_number: 4,
          title: 'Træk skyderen',
          instruction: 'Træk skyderen mod højre for at gøre teksten større. Se på eksempelteksten øverst for at finde den rigtige størrelse.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn Systemindstillinger',
          instruction: 'Klik på Æble-ikonet () øverst til venstre og vælg "Systemindstillinger".',
        },
        {
          step_number: 2,
          title: 'Find "Tilgængelighed"',
          instruction: 'Klik på "Tilgængelighed" i sidebaren.',
        },
        {
          step_number: 3,
          title: 'Vælg "Skærm"',
          instruction: 'Under Tilgængelighed, klik på "Skærm".',
        },
        {
          step_number: 4,
          title: 'Juster tekststørrelsen',
          instruction: 'Find "Tekststørrelse" og træk skyderen mod højre for at gøre teksten større i menuer og vinduer. Du kan også aktivere "Zoom" for at forstørre hele skærmen.',
          tip_text: 'Zoom-funktionen er super praktisk til at forstørre specifikke områder på skærmen.',
        },
      ],
    },
  },

  // ============================================
  // KATEGORI: BATTERI
  // ============================================
  {
    id: 'extend-battery-life',
    title: 'Forlæng din batteritid',
    titleByDevice: {
      iphone: 'Forlæng din iPhones batteritid',
      ipad: 'Forlæng din iPads batteritid',
      mac: 'Forlæng din Macs batteritid',
    },
    description: 'Få din enhed til at holde strøm hele dagen',
    category: 'batteri',
    icon: 'battery',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Tjek din batteritilstand',
          instruction: 'Før vi starter, skal vi se, om dit batteri er slidt. Gå til **Indstillinger** ⚙️ > **Batteri** > **Batteritilstand & Opladning**.',
          image_url: '/src/assets/guide-battery-settings.png',
          tip_text: 'Hvis tallet er under 80%, bør du overveje at få skiftet batteriet hos Apple eller en godkendt reparatør.',
        },
        {
          step_number: 2,
          title: 'Slå strømbesparelse til',
          instruction: 'Hvis du har lidt strøm tilbage, kan du aktivere det gule batteri-ikon. Swipe ned fra højre hjørne af skærmen for at åbne Kontrolcenter, og tryk på **batteri-ikonet**.',
          tip_text: 'Strømbesparelse stopper baggrunds-aktiviteter, så telefonen holder meget længere.',
        },
        {
          step_number: 3,
          title: 'Find strømslugerne',
          instruction: 'Gå til **Indstillinger** > **Batteri** og rul ned. Her ser du en liste over alle apps, sorteret efter hvor meget strøm de bruger.',
          warning_text: 'Hvis Facebook, Instagram eller Maps ligger i toppen, bruger de MEGET strøm. Luk dem helt, når du ikke bruger dem.',
        },
        {
          step_number: 4,
          title: 'Sluk for unødvendige funktioner',
          instruction: 'Gå til **Indstillinger** > **Generelt** > **Opdater i baggrunden** og slå det fra for apps, du ikke bruger så tit.',
          tip_text: 'Jo færre apps der opdaterer i baggrunden, jo længere holder batteriet.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Tjek din batteritilstand',
          instruction: 'Gå til **Indstillinger** > **Batteri** > **Batteritilstand** for at se, hvor sundt dit batteri er.',
          tip_text: 'Et tal over 80% betyder at batteriet stadig er i god stand.',
        },
        {
          step_number: 2,
          title: 'Aktiver strømbesparelse',
          instruction: 'Åbn Kontrolcenter ved at swipe ned fra øverste højre hjørne. Tryk på batteri-ikonet for at aktivere strømbesparelse.',
        },
        {
          step_number: 3,
          title: 'Se batteriforbruget',
          instruction: 'I **Indstillinger** > **Batteri** kan du se hvilke apps der bruger mest strøm de sidste 24 timer eller 10 dage.',
          warning_text: 'Spil og video-apps bruger typisk mest strøm. Brug dem med måde, hvis batteriet er lavt.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Tjek batteritilstanden',
          instruction: 'Klik på **Æble-menuen** > **Om denne Mac** > **Flere oplysninger** > **Systemrapport** > **Strøm**. Her kan du se batteriets "cyklustal" og tilstand.',
          tip_text: 'Et MacBook-batteri holder typisk 1000 opladningscyklusser, før det skal skiftes.',
        },
        {
          step_number: 2,
          title: 'Aktiver strømbesparelse',
          instruction: 'Gå til **Systemindstillinger** > **Batteri** og slå **Lavt strømforbrug** til.',
        },
        {
          step_number: 3,
          title: 'Reducer skærmens lysstyrke',
          instruction: 'Brug tasterne F1 og F2 på dit tastatur til at justere lysstyrken. En dæmpet skærm sparer meget strøm.',
          tip_text: 'Automatisk lysstyrke tilpasser sig rummet og sparer også batteri.',
        },
      ],
    },
  },
  {
    id: 'battery-health-tips',
    title: 'Pas på dit batteri',
    description: 'Lær at oplade rigtigt og forlæng batteriets levetid',
    category: 'batteri',
    icon: 'battery',
    supportsDevices: false,
    steps: [
      {
        step_number: 1,
        title: 'Undgå at oplade til 100% hver gang',
        instruction: 'Det er faktisk bedst for batteriet at holde det mellem 20% og 80%. Du behøver ikke oplade det helt fuldt hver gang.',
        tip_text: 'Moderne batterier har det bedst, når de ikke er helt fulde eller helt tomme.',
      },
      {
        step_number: 2,
        title: 'Brug optimeret opladning',
        instruction: 'Din enhed lærer dine vaner og venter med at oplade de sidste procent til lige før du vågner. Gå til **Indstillinger** > **Batteri** > **Batteritilstand** og sørg for at **Optimeret batteriopladning** er slået til.',
        tip_text: 'Denne smarte funktion betyder at batteriet slides langsommere over tid.',
      },
      {
        step_number: 3,
        title: 'Hold enheden kølig',
        instruction: 'Varme er batteriets værste fjende. Undgå at lægge din telefon i direkte sollys eller i en varm bil.',
        warning_text: 'Hvis din telefon bliver meget varm, så tag den væk fra varmekilden med det samme. Ekstrem varme kan permanent skade batteriet.',
      },
      {
        step_number: 4,
        title: 'Brug originale opladere',
        instruction: 'Brug helst den oplader og det kabel, der fulgte med din enhed, eller køb Apple-certificerede tilbehør.',
        warning_text: 'Billige kopier kan skade batteriet eller i værste fald være farlige.',
      },
    ],
  },

  // ============================================
  // KATEGORI: SIKKERHED
  // ============================================
  {
    id: 'block-unknown-calls',
    title: 'Undgå falske opkald',
    description: 'Stop svindlere i at ringe til dig',
    category: 'sikkerhed',
    icon: 'security',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn Telefon-indstillinger',
          instruction: 'Din iPhone kan automatisk afvise folk, du ikke kender. Gå til **Indstillinger** > **Telefon**.',
        },
        {
          step_number: 2,
          title: 'Find funktionen',
          instruction: 'Rul helt ned i bunden af listen og find **Gør ukendte opkald lydløse**.',
        },
        {
          step_number: 3,
          title: 'Slå det til',
          instruction: 'Skub knappen, så den bliver **grøn**. Nu ringer telefonen kun, hvis det er nogen fra dine kontakter.',
          image_url: '/src/assets/guide-silence-calls.png',
          tip_text: 'Opkald fra andre ryger direkte på telefonsvareren, så vigtige beskeder går ikke tabt.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Tjek FaceTime-indstillinger',
          instruction: 'På iPad kan du blokere ukendte FaceTime-opkald. Gå til **Indstillinger** > **FaceTime**.',
        },
        {
          step_number: 2,
          title: 'Begræns opkald',
          instruction: 'Du kan slå FaceTime fra helt, eller kun tillade opkald fra dine kontakter ved at bruge Skærmtid-indstillinger.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn FaceTime',
          instruction: 'Åbn FaceTime-appen på din Mac.',
        },
        {
          step_number: 2,
          title: 'Juster indstillinger',
          instruction: 'Klik på **FaceTime** i menulinjen > **Indstillinger**. Her kan du styre, hvem der må ringe til dig.',
        },
      ],
    },
  },
  {
    id: 'enable-2fa',
    title: 'Beskyt din Apple-konto',
    description: 'Aktiver to-faktor-godkendelse for ekstra sikkerhed',
    category: 'sikkerhed',
    icon: 'security',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn dit Apple ID',
          instruction: 'Gå til **Indstillinger** og tryk på **dit navn** helt øverst (der hvor dit billede eller dine initialer vises).',
        },
        {
          step_number: 2,
          title: 'Find sikkerhedsindstillinger',
          instruction: 'Tryk på **Log ind og sikkerhed**.',
        },
        {
          step_number: 3,
          title: 'Aktiver to-faktor-godkendelse',
          instruction: 'Hvis du ser "To-faktor-godkendelse" sat til "Slået fra", så tryk på den og følg vejledningen for at slå den til.',
          image_url: '/src/assets/guide-two-factor.png',
          tip_text: 'Med to-faktor-godkendelse skal en svindler have BÅDE din adgangskode OG din telefon for at logge ind. Det gør det næsten umuligt for dem.',
          warning_text: 'Skriv din Apple ID-adgangskode ned et sikkert sted. Hvis du glemmer den OG mister din telefon, kan det være svært at komme ind igen.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn dit Apple ID',
          instruction: 'Gå til **Indstillinger** og tryk på **dit navn** øverst i sidebaren.',
        },
        {
          step_number: 2,
          title: 'Gå til sikkerhed',
          instruction: 'Tryk på **Log ind og sikkerhed** og find to-faktor-godkendelse.',
        },
        {
          step_number: 3,
          title: 'Slå det til',
          instruction: 'Følg trinene på skærmen for at aktivere to-faktor-godkendelse.',
          tip_text: 'Du får en bekræftelseskode på din enhed, hver gang nogen forsøger at logge ind fra en ny enhed.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn Systemindstillinger',
          instruction: 'Klik på **Æble-menuen** > **Systemindstillinger**.',
        },
        {
          step_number: 2,
          title: 'Klik på dit Apple ID',
          instruction: 'Øverst i vinduet ser du dit navn og billede. Klik på det.',
        },
        {
          step_number: 3,
          title: 'Find sikkerhed',
          instruction: 'Klik på **Log ind og sikkerhed** i sidebaren og aktiver to-faktor-godkendelse, hvis den ikke allerede er slået til.',
        },
      ],
    },
  },
  {
    id: 'recognize-scam-messages',
    title: 'Genkend svindelbeskeder',
    description: 'Lær at spotte falske SMS\'er og emails',
    category: 'sikkerhed',
    icon: 'security',
    supportsDevices: false,
    steps: [
      {
        step_number: 1,
        title: 'Tjek afsenderen',
        instruction: 'Svindlere udgiver sig tit for at være din bank, Post Nord eller Skat. Men kig godt på afsenderens adresse eller nummer - det er ofte mærkeligt eller udenlandsk.',
        image_url: '/src/assets/guide-scam-sms.png',
        warning_text: 'Din bank vil ALDRIG bede dig om at klikke på et link i en SMS for at "bekræfte" noget.',
      },
      {
        step_number: 2,
        title: 'Pas på "haster"-beskeder',
        instruction: 'Svindlere prøver at skræmme dig: "Din konto lukkes om 24 timer!" eller "Betal nu eller...". Ægte virksomheder giver dig altid god tid.',
        tip_text: 'Hvis noget føles presserende, så tag en dyb indånding og ring selv til virksomheden på deres officielle nummer.',
      },
      {
        step_number: 3,
        title: 'Klik ALDRIG på links',
        instruction: 'Hvis du er i tvivl, så klik ALDRIG på links i beskeden. Åbn i stedet din browser og gå selv til virksomhedens hjemmeside.',
        warning_text: 'Links kan se ægte ud, men føre til falske sider, der stjæler dine oplysninger.',
      },
      {
        step_number: 4,
        title: 'Rapporter svindel',
        instruction: 'Du kan hjælpe andre ved at rapportere svindelbeskeder. Hold fingeren på beskeden og vælg "Rapporter som uønsket".',
        tip_text: 'Ved at rapportere hjælper du Apple med at blokere svindlerne for alle andre også.',
      },
    ],
  },
  {
    id: 'hard-reset',
    title: 'Genstart en frosset enhed',
    titleByDevice: {
      iphone: 'Genstart din frosne iPhone',
      ipad: 'Genstart din frosne iPad',
      mac: 'Genstart din frosne Mac',
    },
    description: 'Sådan tvinger du enheden til at genstarte, når skærmen er frosset',
    category: 'sikkerhed',
    icon: 'security',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Find knapperne',
          instruction: 'Du skal bruge to knapper: **Lydstyrke op** (på venstre side) og **Sideknappen** (på højre side).',
          image_url: '/src/assets/guide-hard-reset.png',
          tip_text: 'Dette virker på iPhone 8 og nyere modeller. Ældre modeller bruger Hjem-knappen i stedet.',
        },
        {
          step_number: 2,
          title: 'Tryk og slip hurtigt',
          instruction: 'Tryk kortvarigt på **Lydstyrke op**, slip igen. Tryk derefter kortvarigt på **Lydstyrke ned**, slip igen.',
        },
        {
          step_number: 3,
          title: 'Hold sideknappen inde',
          instruction: 'Hold nu **Sideknappen** (tænd/sluk-knappen) inde og bliv ved med at holde, indtil du ser Apple-logoet på skærmen. Det tager ca. 10-15 sekunder.',
          warning_text: 'Slip IKKE knappen, før Apple-logoet vises. Hvis du slipper for tidligt, virker det ikke.',
        },
        {
          step_number: 4,
          title: 'Vent på genstart',
          instruction: 'Når Apple-logoet vises, kan du slippe knappen. Din iPhone genstarter nu. Dette tager typisk 1-2 minutter.',
          tip_text: 'Du mister ingen data ved en tvungen genstart. Det er helt sikkert at gøre.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Find knapperne',
          instruction: 'På nyere iPads (uden Hjem-knap): Find **Lydstyrke op** (øverst) og **Top-knappen** (tænd/sluk).',
          tip_text: 'Hvis din iPad har en Hjem-knap, skal du holde Hjem og Top-knappen inde samtidigt.',
        },
        {
          step_number: 2,
          title: 'Tryk og slip hurtigt',
          instruction: 'Tryk kortvarigt på **Lydstyrke op**, slip. Tryk kortvarigt på **Lydstyrke ned**, slip.',
        },
        {
          step_number: 3,
          title: 'Hold top-knappen inde',
          instruction: 'Hold **Top-knappen** inde i ca. 10-15 sekunder, indtil Apple-logoet vises.',
          warning_text: 'Bliv ved med at holde, selvom skærmen først bliver sort.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Tving nedlukning',
          instruction: 'Hvis din Mac er helt frosset, skal du holde **Afbryderknappen** inde i ca. 10 sekunder, indtil Mac\'en slukker.',
          warning_text: 'Brug kun denne metode, hvis din Mac er helt frosset og ikke reagerer på noget.',
        },
        {
          step_number: 2,
          title: 'Vent og tænd igen',
          instruction: 'Vent 10-15 sekunder, og tryk derefter på **Afbryderknappen** igen for at tænde din Mac.',
          tip_text: 'Hvis problemet gentager sig ofte, bør du tjekke for softwareopdateringer eller kontakte Apple Support.',
        },
      ],
    },
  },

  // ============================================
  // KATEGORI: ICLOUD
  // ============================================
  {
    id: 'icloud-backup',
    title: 'Sikkerhedskopier til iCloud',
    titleByDevice: {
      iphone: 'Sikkerhedskopier din iPhone til iCloud',
      ipad: 'Sikkerhedskopier din iPad til iCloud',
      mac: 'Synkroniser din Mac med iCloud',
    },
    description: 'Beskyt dine billeder og data, så du aldrig mister noget',
    category: 'icloud',
    icon: 'cloud',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn iCloud-indstillinger',
          instruction: 'Gå til **Indstillinger** og tryk på **dit navn** øverst. Tryk derefter på **iCloud**.',
          image_url: '/src/assets/guide-icloud-settings.png',
        },
        {
          step_number: 2,
          title: 'Slå iCloud-sikkerhedskopiering til',
          instruction: 'Tryk på **iCloud-sikkerhedskopiering** og sørg for, at knappen er **grøn**.',
          tip_text: 'Når dette er slået til, sikkerhedskopierer din telefon automatisk hver nat, når den er tilsluttet strøm og WiFi.',
        },
        {
          step_number: 3,
          title: 'Lav en sikkerhedskopi nu',
          instruction: 'Tryk på **Sikkerhedskopier nu** for at tage en kopi med det samme. Sørg for at være på WiFi.',
          warning_text: 'Afbryd IKKE sikkerhedskopieringen, mens den kører. Det kan tage flere minutter første gang.',
        },
        {
          step_number: 4,
          title: 'Tjek hvad der sikkerhedskopieres',
          instruction: 'Gå tilbage til iCloud og tryk på **Administrer kontolager**. Her kan du se, hvad der bruger plads.',
          tip_text: 'Hvis du løber tør for plads, kan du slette gamle sikkerhedskopier fra gamle enheder, du ikke bruger mere.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn iCloud-indstillinger',
          instruction: 'Gå til **Indstillinger** > tryk på **dit navn** > **iCloud**.',
        },
        {
          step_number: 2,
          title: 'Aktiver sikkerhedskopiering',
          instruction: 'Tryk på **iCloud-sikkerhedskopiering** og slå det til.',
        },
        {
          step_number: 3,
          title: 'Start en sikkerhedskopi',
          instruction: 'Tryk på **Sikkerhedskopier nu** for at tage backup med det samme.',
          tip_text: 'Din iPad sikkerhedskopierer automatisk hver nat, når den er tilsluttet WiFi og strøm.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn iCloud-indstillinger',
          instruction: 'Klik på **Æble-menuen** > **Systemindstillinger** > **dit navn** > **iCloud**.',
        },
        {
          step_number: 2,
          title: 'Vælg hvad der skal synkroniseres',
          instruction: 'Her kan du vælge, hvad der skal gemmes i iCloud: Fotos, Dokumenter, og mere.',
          tip_text: 'iCloud Drive lader dig gemme filer, så du kan åbne dem på alle dine enheder.',
        },
        {
          step_number: 3,
          title: 'Aktiver iCloud Drive',
          instruction: 'Sørg for at **iCloud Drive** er slået til. Du kan derefter gemme filer i iCloud Drive-mappen i Finder.',
        },
      ],
    },
  },
  {
    id: 'find-my-iphone',
    title: 'Find min iPhone',
    titleByDevice: {
      iphone: 'Opsæt Find min iPhone',
      ipad: 'Opsæt Find min iPad',
      mac: 'Opsæt Find min Mac',
    },
    description: 'Find din enhed hvis du mister den - eller lås den fra afstand',
    category: 'icloud',
    icon: 'cloud',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn Find min-indstillinger',
          instruction: 'Gå til **Indstillinger** > tryk på **dit navn** > **Find min**.',
        },
        {
          step_number: 2,
          title: 'Slå Find min iPhone til',
          instruction: 'Tryk på **Find min iPhone** og sørg for, at knappen er **grøn**.',
          image_url: '/src/assets/guide-find-my.png',
          tip_text: 'Denne funktion lader dig finde din telefon på et kort, afspille en lyd, eller slette den hvis den er stjålet.',
        },
        {
          step_number: 3,
          title: 'Aktiver "Send sidste placering"',
          instruction: 'Slå også **Send sidste placering** til. Så sender din telefon sin position, lige før batteriet løber tørt.',
          warning_text: 'Hvis en tyv slukker telefonen med det samme, kan du stadig se, hvor den sidst var.',
        },
        {
          step_number: 4,
          title: 'Aktiver "Find min-netværk"',
          instruction: 'Slå **Find min-netværk** til. Dette lader din telefon findes, selv når den er offline, ved hjælp af andre Apple-enheder i nærheden.',
          tip_text: 'Apples netværk af enheder kan hjælpe med at finde din telefon, selv på steder uden WiFi eller mobilnetværk.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn Find min',
          instruction: 'Gå til **Indstillinger** > **dit navn** > **Find min**.',
        },
        {
          step_number: 2,
          title: 'Aktiver Find min iPad',
          instruction: 'Slå **Find min iPad** til, samt **Send sidste placering** og **Find min-netværk**.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn Systemindstillinger',
          instruction: 'Klik på **Æble-menuen** > **Systemindstillinger** > **dit navn** > **iCloud**.',
        },
        {
          step_number: 2,
          title: 'Aktiver Find min Mac',
          instruction: 'Find **Find min Mac** og sørg for, at den er slået til.',
          tip_text: 'Du kan finde din Mac på icloud.com/find fra enhver computer eller telefon.',
        },
      ],
    },
  },
  {
    id: 'icloud-photos',
    title: 'Gem dine billeder i iCloud',
    description: 'Aldrig mist et minde - dine fotos gemmes automatisk',
    category: 'icloud',
    icon: 'cloud',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn Fotos-indstillinger',
          instruction: 'Gå til **Indstillinger** > **dit navn** > **iCloud** > **Fotos**.',
        },
        {
          step_number: 2,
          title: 'Slå iCloud Fotos til',
          instruction: 'Sørg for, at **Synkroniser denne iPhone** er slået **til** (grøn).',
          tip_text: 'Alle dine billeder og videoer bliver nu gemt i iCloud og synkroniseret til alle dine enheder.',
        },
        {
          step_number: 3,
          title: 'Vælg lagringsmulighed',
          instruction: 'Vælg **Optimer iPhone-lagring** for at spare plads på telefonen. De fulde billeder ligger i iCloud og hentes, når du har brug for dem.',
          tip_text: 'Dette er perfekt hvis din telefon ofte løber tør for plads.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn iCloud Fotos',
          instruction: 'Gå til **Indstillinger** > **dit navn** > **iCloud** > **Fotos**.',
        },
        {
          step_number: 2,
          title: 'Aktiver synkronisering',
          instruction: 'Slå **Synkroniser denne iPad** til for at gemme alle billeder i iCloud.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn Fotos-appen',
          instruction: 'Åbn **Fotos**-appen på din Mac.',
        },
        {
          step_number: 2,
          title: 'Gå til indstillinger',
          instruction: 'Klik på **Fotos** i menulinjen > **Indstillinger** > fanen **iCloud**.',
        },
        {
          step_number: 3,
          title: 'Aktiver iCloud Fotos',
          instruction: 'Sæt flueben ved **iCloud Fotos** for at synkronisere alle billeder.',
          tip_text: 'Nu kan du se alle dine iPhone-billeder på din Mac, og omvendt.',
        },
      ],
    },
  },

  // ============================================
  // KATEGORI: BESKEDER
  // ============================================
  {
    id: 'imessage-setup',
    title: 'Kom i gang med iMessage',
    description: 'Send gratis beskeder, billeder og videoer til andre iPhone-brugere',
    category: 'beskeder',
    icon: 'message',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn Beskeder-indstillinger',
          instruction: 'Gå til **Indstillinger** > **Beskeder**.',
          image_url: '/src/assets/guide-messages-list.png',
        },
        {
          step_number: 2,
          title: 'Slå iMessage til',
          instruction: 'Sørg for, at **iMessage** er slået **til** (grøn knap).',
          tip_text: 'iMessage er Apples gratis besked-tjeneste. Beskeder til andre iPhones vises med blå bobler i stedet for grønne.',
        },
        {
          step_number: 3,
          title: 'Vælg hvordan folk kan kontakte dig',
          instruction: 'Tryk på **Send & modtag** og vælg dit telefonnummer og/eller email som kontaktmetoder.',
        },
        {
          step_number: 4,
          title: 'Aktiver læsekvitteringer (valgfrit)',
          instruction: 'Slå **Send læsekvitteringer** til, hvis du vil, at andre kan se, når du har læst deres besked.',
          tip_text: 'Du kan slå dette fra, hvis du hellere vil have privatliv omkring, hvornår du læser beskeder.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn Beskeder-indstillinger',
          instruction: 'Gå til **Indstillinger** > **Beskeder** og slå **iMessage** til.',
        },
        {
          step_number: 2,
          title: 'Tilføj din email',
          instruction: 'Tryk på **Send & modtag** for at tilføje din Apple ID-email, så folk kan sende beskeder til din iPad.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn Beskeder',
          instruction: 'Åbn **Beskeder**-appen på din Mac.',
        },
        {
          step_number: 2,
          title: 'Log ind',
          instruction: 'Klik på **Beskeder** > **Indstillinger** > **iMessage**. Log ind med dit Apple ID.',
        },
        {
          step_number: 3,
          title: 'Aktiver beskeder',
          instruction: 'Sæt flueben ved **Slå beskeder til i iCloud** for at se alle dine beskeder på din Mac.',
          tip_text: 'Nu kan du skrive og læse beskeder på din Mac, selv når din telefon ligger et andet sted.',
        },
      ],
    },
  },
  {
    id: 'block-spam-messages',
    title: 'Bloker uønskede beskeder',
    description: 'Stop spam og ukendte afsendere i at kontakte dig',
    category: 'beskeder',
    icon: 'message',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Filtrer ukendte afsendere',
          instruction: 'Gå til **Indstillinger** > **Beskeder** og slå **Filtrer ukendte afsendere** til.',
          image_url: '/src/assets/guide-messages-list.png',
          tip_text: 'Beskeder fra folk, der ikke er i dine kontakter, havner nu i en separat liste og giver ingen notifikation.',
        },
        {
          step_number: 2,
          title: 'Bloker en specifik person',
          instruction: 'Åbn en besked fra en person, du vil blokere. Tryk på deres navn øverst, tryk på **info**-knappen, og vælg **Bloker denne person**.',
          warning_text: 'Blokerede personer kan stadig sende beskeder, men du modtager dem ikke.',
        },
        {
          step_number: 3,
          title: 'Rapporter som uønsket',
          instruction: 'For spam-beskeder: Hold fingeren på beskeden og vælg **Rapporter som uønsket**. Dette hjælper Apple med at stoppe svindlere.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Filtrer beskeder',
          instruction: 'Gå til **Indstillinger** > **Beskeder** > **Filtrer ukendte afsendere**.',
        },
        {
          step_number: 2,
          title: 'Bloker afsendere',
          instruction: 'Åbn en uønsket besked, tryk på afsenderens navn, og vælg **Bloker denne person**.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Bloker i Beskeder',
          instruction: 'Højreklik på en samtale og vælg **Bloker person**.',
        },
        {
          step_number: 2,
          title: 'Administrer blokerede',
          instruction: 'Gå til **Beskeder** > **Indstillinger** > **iMessage** > **Blokeret** for at se og administrere blokerede kontakter.',
        },
      ],
    },
  },

  // ============================================
  // KATEGORI: APPS
  // ============================================
  {
    id: 'download-apps',
    title: 'Hent nye apps',
    description: 'Lær at finde og installere apps fra App Store',
    category: 'apps',
    icon: 'apps',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn App Store',
          instruction: 'Find det blå ikon med et hvidt "A" på din startskærm. Det hedder **App Store**. Tryk på det.',
        },
        {
          step_number: 2,
          title: 'Søg efter en app',
          instruction: 'Tryk på **Søg** i bunden af skærmen (forstørrelsesglas-ikonet). Skriv navnet på den app, du leder efter.',
          tip_text: 'Du kan søge efter ting som "vejr", "spil" eller navnet på en bestemt app som "Facebook".',
        },
        {
          step_number: 3,
          title: 'Installer appen',
          instruction: 'Tryk på **Hent**-knappen ud for appen. Du skal måske bekræfte med Face ID, Touch ID eller din adgangskode.',
          warning_text: 'Pas på apps, der beder om betaling. Kig altid på prisen, før du trykker "Køb".',
        },
        {
          step_number: 4,
          title: 'Find din nye app',
          instruction: 'Når appen er hentet, finder du den på din startskærm. Tryk på den for at åbne.',
          tip_text: 'Hvis du ikke kan finde den, så swipe ned på startskærmen og søg efter appens navn.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn App Store',
          instruction: 'Tryk på det blå **App Store**-ikon på din startskærm.',
        },
        {
          step_number: 2,
          title: 'Find apps',
          instruction: 'Brug søgefeltet øverst til højre, eller udforsk kategorier og anbefalinger.',
        },
        {
          step_number: 3,
          title: 'Installer',
          instruction: 'Tryk på **Hent** og bekræft med Face ID eller adgangskode.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn App Store',
          instruction: 'Klik på **App Store**-ikonet i Dock, eller find det via Spotlight (⌘+Mellemrum).',
        },
        {
          step_number: 2,
          title: 'Søg og installer',
          instruction: 'Brug søgefeltet øverst til venstre. Klik på **Hent** for at installere gratis apps.',
        },
      ],
    },
  },
  {
    id: 'delete-apps',
    title: 'Slet apps du ikke bruger',
    description: 'Frigør plads ved at fjerne gamle apps',
    category: 'apps',
    icon: 'apps',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Find appen',
          instruction: 'Find ikonet for den app, du vil slette, på din startskærm.',
        },
        {
          step_number: 2,
          title: 'Hold fingeren på ikonet',
          instruction: 'Tryk og **hold fingeren** på app-ikonet i et par sekunder. En menu dukker op.',
        },
        {
          step_number: 3,
          title: 'Vælg "Fjern app"',
          instruction: 'Tryk på **Fjern app** og derefter **Slet app** for at fjerne den helt.',
          tip_text: 'Du kan altid hente appen igen gratis fra App Store, hvis du fortryder.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Hold på app-ikonet',
          instruction: 'Tryk og hold på app-ikonet, indtil menuen vises.',
        },
        {
          step_number: 2,
          title: 'Slet appen',
          instruction: 'Tryk på **Fjern app** > **Slet app**.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn Finder',
          instruction: 'Klik på **Finder**-ikonet i Dock og gå til **Programmer** i sidebaren.',
        },
        {
          step_number: 2,
          title: 'Slet appen',
          instruction: 'Find appen, højreklik på den, og vælg **Flyt til papirkurv**.',
          tip_text: 'Tøm papirkurven bagefter for at frigøre pladsen helt.',
        },
      ],
    },
  },
  {
    id: 'update-apps',
    title: 'Opdater dine apps',
    description: 'Hold dine apps sikre og opdaterede',
    category: 'apps',
    icon: 'apps',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn App Store',
          instruction: 'Tryk på **App Store**-ikonet på din startskærm.',
        },
        {
          step_number: 2,
          title: 'Find opdateringer',
          instruction: 'Tryk på dit **profilbillede** øverst til højre. Rul ned for at se tilgængelige opdateringer.',
        },
        {
          step_number: 3,
          title: 'Opdater alle',
          instruction: 'Tryk på **Opdater alle** for at hente alle opdateringer på én gang.',
          tip_text: 'Du kan også opdatere apps enkeltvis ved at trykke på "Opdater" ud for hver app.',
        },
        {
          step_number: 4,
          title: 'Slå automatiske opdateringer til',
          instruction: 'Gå til **Indstillinger** > **App Store** og slå **App-opdateringer** til under "Automatiske overførsler".',
          tip_text: 'Med automatiske opdateringer behøver du aldrig tænke på det - dine apps er altid opdaterede.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn App Store',
          instruction: 'Tryk på **App Store** og derefter på dit profilbillede.',
        },
        {
          step_number: 2,
          title: 'Opdater apps',
          instruction: 'Tryk på **Opdater alle** eller opdater individuelle apps.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn App Store',
          instruction: 'Åbn **App Store** fra Dock eller Programmer.',
        },
        {
          step_number: 2,
          title: 'Klik på Opdateringer',
          instruction: 'Klik på **Opdateringer** i sidebaren for at se og installere tilgængelige opdateringer.',
        },
      ],
    },
  },
  {
    id: 'organize-apps',
    title: 'Organiser dine apps',
    description: 'Ryd op på din startskærm med mapper og bibliotek',
    category: 'apps',
    icon: 'apps',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Flyt apps rundt',
          instruction: 'Hold fingeren på en app, indtil alle apps begynder at "ryste". Nu kan du trække apps rundt.',
          tip_text: 'Træk en app til kanten af skærmen for at flytte den til en anden side.',
        },
        {
          step_number: 2,
          title: 'Opret en mappe',
          instruction: 'Træk en app oven på en anden app. Der oprettes automatisk en mappe med begge apps.',
          tip_text: 'Du kan omdøbe mappen ved at trykke på dens navn.',
        },
        {
          step_number: 3,
          title: 'Brug App-biblioteket',
          instruction: 'Swipe helt til højre på din startskærm for at finde **App-biblioteket**. Her organiserer iPhone automatisk alle dine apps i kategorier.',
          tip_text: 'Du kan søge efter apps i App-biblioteket ved at trykke på søgefeltet øverst.',
        },
        {
          step_number: 4,
          title: 'Skjul hele sider',
          instruction: 'Mens apps ryster, tryk på prikkerne i bunden af skærmen. Her kan du fjerne flueben fra sider for at skjule dem.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Flyt og organiser',
          instruction: 'Hold på en app for at flytte den. Træk apps over hinanden for at lave mapper.',
        },
        {
          step_number: 2,
          title: 'Brug App-biblioteket',
          instruction: 'Swipe til den sidste side for at finde App-biblioteket med alle apps organiseret.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Organiser i Dock',
          instruction: 'Træk ofte brugte apps ned til **Dock** for hurtig adgang.',
        },
        {
          step_number: 2,
          title: 'Brug Launchpad',
          instruction: 'Klik på **Launchpad** i Dock for at se alle apps. Træk apps over hinanden for at lave mapper.',
          tip_text: 'Du kan også bruge Spotlight (⌘+Mellemrum) til hurtigt at finde og åbne apps.',
        },
      ],
    },
  },

  // ============================================
  // KATEGORI: iCLOUD - Ryd op
  // ============================================
  {
    id: 'icloud-cleanup',
    title: 'Ryd op i iCloud',
    titleByDevice: {
      iphone: 'Ryd op i iCloud på din iPhone',
      ipad: 'Ryd op i iCloud på din iPad',
      mac: 'Ryd op i iCloud på din Mac',
    },
    description: 'Find dubletter og få mere plads i iCloud',
    category: 'icloud',
    icon: 'cloud',
    supportsDevices: true,
    steps: [],
    stepsByDevice: {
      iphone: [
        {
          step_number: 1,
          title: 'Åbn Fotos-appen',
          instruction: 'Find og tryk på **Fotos**-appen på din startskærm. Det er ikonet med den farverige blomst.',
          tip_text: 'Sørg for at din iPhone er opdateret til iOS 16 eller nyere for at få adgang til dubletter-funktionen.',
        },
        {
          step_number: 2,
          title: 'Find Dubletter-albummet',
          instruction: 'Tryk på **Album** i bunden af skærmen. Rul helt ned til sektionen **Hjælpeprogrammer**, og tryk på **Dubletter**.',
          image_url: '/src/assets/guide-duplicates.png',
          tip_text: 'Hvis du ikke kan se "Dubletter", betyder det at din iPhone ikke har fundet nogen endnu. Vent et par dage efter første synkronisering.',
        },
        {
          step_number: 3,
          title: 'Gennemgå dubletterne',
          instruction: 'Du ser nu alle billeder, som ligner hinanden. Tryk på **Flet** ved siden af hver gruppe for at beholde det bedste billede og slette resten.',
          tip_text: 'iPhone vælger automatisk den version med højest kvalitet at beholde.',
        },
        {
          step_number: 4,
          title: 'Flet alle på én gang',
          instruction: 'Hvis du vil spare tid, tryk på **Vælg** øverst til højre, derefter **Vælg alle**, og til sidst **Flet** nederst.',
          warning_text: 'Gennemgå altid dubletterne først for at sikre, at det virkelig er dubletter og ikke lignende billeder, du vil beholde begge af.',
        },
        {
          step_number: 5,
          title: 'Tøm Senest slettet',
          instruction: 'Gå tilbage til **Album** og find **Senest slettet** under Hjælpeprogrammer. Tryk på **Vælg**, derefter **Slet alle** for at frigøre pladsen permanent.',
          warning_text: 'Når du sletter fra "Senest slettet" kan billederne IKKE gendannes. Vær helt sikker!',
        },
        {
          step_number: 6,
          title: 'Tjek din iCloud-lagerplads',
          instruction: 'Gå til **Indstillinger** > **dit navn** > **iCloud** > **Administrer kontolager** for at se, hvor meget plads du har frigjort.',
          tip_text: 'Det kan tage op til 24 timer, før iCloud opdaterer din ledige plads.',
        },
      ],
      ipad: [
        {
          step_number: 1,
          title: 'Åbn Fotos-appen',
          instruction: 'Tryk på **Fotos**-appen på din startskærm.',
          tip_text: 'iPad skal have iPadOS 16 eller nyere for dubletter-funktionen.',
        },
        {
          step_number: 2,
          title: 'Find Dubletter',
          instruction: 'Tryk på **Album** i sidebaren til venstre. Rul ned og find **Dubletter** under Hjælpeprogrammer.',
        },
        {
          step_number: 3,
          title: 'Flet dubletterne',
          instruction: 'Tryk på **Flet** ved hver dublet-gruppe, eller brug **Vælg alle** og **Flet** for at gøre det hurtigt.',
          tip_text: 'iPad bevarer automatisk den bedste version.',
        },
        {
          step_number: 4,
          title: 'Tøm papirkurven',
          instruction: 'Gå til **Senest slettet** og tryk på **Slet alle** for at frigøre pladsen permanent.',
          warning_text: 'Sletning herfra er permanent - tjek at du ikke mangler noget først.',
        },
      ],
      mac: [
        {
          step_number: 1,
          title: 'Åbn Fotos-appen',
          instruction: 'Klik på **Fotos** i din Dock, eller find den i Programmer-mappen.',
          tip_text: 'Sørg for at din Mac kører macOS Ventura eller nyere for dubletter-funktionen.',
        },
        {
          step_number: 2,
          title: 'Find Dubletter i sidebaren',
          instruction: 'Kig i venstre sidebar under sektionen **Hjælpeprogrammer**. Klik på **Dubletter**.',
          tip_text: 'Hvis Dubletter ikke vises, kan det tage tid for Fotos at analysere dit bibliotek efter første synkronisering.',
        },
        {
          step_number: 3,
          title: 'Gennemgå og flet',
          instruction: 'Klik på **Flet** ved hver dublet-gruppe. Din Mac beholder automatisk billedet med højest opløsning.',
        },
        {
          step_number: 4,
          title: 'Flet alle dubletter',
          instruction: 'For at spare tid: Klik på **Vælg alle** i menulinjen (Rediger > Vælg alle) og klik derefter på **Flet [antal] dubletter**.',
          warning_text: 'Gennemse altid nogle af dubletterne manuelt først for at sikre, det virkelig er kopier.',
        },
        {
          step_number: 5,
          title: 'Tøm papirkurven',
          instruction: 'Klik på **Senest slettet** i sidebaren og klik derefter på **Slet alle** øverst til højre.',
          warning_text: 'Dette er permanent! Tjek at du ikke har slettet noget vigtigt ved en fejl.',
        },
        {
          step_number: 6,
          title: 'Tjek iCloud-lageret',
          instruction: 'Klik på **Æble-menuen** > **Systemindstillinger** > **dit navn** > **iCloud** for at se din ledige plads.',
          tip_text: 'Vent op til 24 timer på at iCloud synkroniserer ændringerne fuldt ud.',
        },
      ],
    },
  },
];
