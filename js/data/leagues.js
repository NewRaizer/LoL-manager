/* =============================================================
 * Legends Manager — Données : Ligues, Équipes et Joueurs (noms réels)
 *
 * tier = niveau global de l'équipe (50-99), sert à générer les
 *        attributs détaillés des joueurs au démarrage.
 * Les rosters sont basés sur des compositions réelles récentes.
 * Tout est facilement modifiable ici (c'est ta base de données).
 * ============================================================= */
(function (LM) {
  // Joueurs « superstars » : bonus d'attributs appliqué par-dessus le tier.
  // (gamertag -> bonus de note global)
  LM.SUPERSTARS = {
    Faker: 9, Chovy: 9, Caps: 7, Knight: 7, ShowMaker: 6, Zeka: 6,
    Ruler: 8, Viper: 7, Gumayusi: 6, Elk: 6, JackeyLove: 6, Peyz: 6,
    Keria: 8, BeryL: 5, Mikyx: 5, CoreJJ: 6, Meiko: 6,
    Canyon: 8, Oner: 6, Kanavi: 6, Peanut: 6, Xun: 6, Blaber: 5,
    Zeus: 6, Bin: 7, Kiin: 5, "369": 5, TheShy: 5, Impact: 4,
    Berserker: 5, Rookie: 5, Scout: 5, Xiaohu: 5, Bjergsen: 4,
    Perkz: 4, Jankos: 3, Humanoid: 4, Hans_Sama: 4, "Hans Sama": 4,
    Bo: 4, Razork: 3, Elyoya: 4, Jensen: 3, Inspired: 4, Bwipo: 3
  };

  LM.LEAGUES = [
    { id: "LEC", name: "LEC", region: "Europe", flag: "🇪🇺" },
    { id: "LCK", name: "LCK", region: "Corée", flag: "🇰🇷" },
    { id: "LPL", name: "LPL", region: "Chine", flag: "🇨🇳" },
    { id: "LCS", name: "LCS", region: "Amérique du Nord", flag: "🇺🇸" }
  ];

  // Helper pour écrire les rosters de façon compacte.
  function P(name, role, nat, age) { return { name: name, role: role, nat: nat, age: age }; }

  LM.TEAMS = [
    /* ---------------------------- LEC ---------------------------- */
    { id: "G2", name: "G2 Esports", short: "G2", league: "LEC", flag: "🇪🇺", tier: 90, players: [
      P("BrokenBlade", "TOP", "🇩🇪", 25), P("Yike", "JNG", "🇫🇷", 21),
      P("Caps", "MID", "🇩🇰", 26), P("Hans Sama", "ADC", "🇫🇷", 25), P("Mikyx", "SUP", "🇸🇮", 26) ] },
    { id: "FNC", name: "Fnatic", short: "FNC", league: "LEC", flag: "🇪🇺", tier: 84, players: [
      P("Oscarinin", "TOP", "🇪🇸", 21), P("Razork", "JNG", "🇪🇸", 23),
      P("Humanoid", "MID", "🇨🇿", 24), P("Upset", "ADC", "🇩🇪", 25), P("Jun", "SUP", "🇰🇷", 23) ] },
    { id: "VIT", name: "Team Vitality", short: "VIT", league: "LEC", flag: "🇪🇺", tier: 83, players: [
      P("Photon", "TOP", "🇰🇷", 23), P("Daglas", "JNG", "🇵🇱", 21),
      P("Vetheo", "MID", "🇫🇷", 23), P("Carzzy", "ADC", "🇨🇿", 24), P("Hylissang", "SUP", "🇧🇬", 30) ] },
    { id: "MKOI", name: "Movistar KOI", short: "MKOI", league: "LEC", flag: "🇪🇺", tier: 82, players: [
      P("Myrwn", "TOP", "🇪🇸", 21), P("Elyoya", "JNG", "🇪🇸", 23),
      P("Jojopyun", "MID", "🇨🇦", 21), P("Supa", "ADC", "🇪🇸", 21), P("Alvaro", "SUP", "🇪🇸", 22) ] },
    { id: "KC", name: "Karmine Corp", short: "KC", league: "LEC", flag: "🇫🇷", tier: 81, players: [
      P("Canna", "TOP", "🇰🇷", 25), P("Yike", "JNG", "🇫🇷", 21),
      P("Vladi", "MID", "🇵🇱", 20), P("Caliste", "ADC", "🇫🇷", 21), P("Targamas", "SUP", "🇧🇪", 24) ] },
    { id: "RGE", name: "Rogue", short: "RGE", league: "LEC", flag: "🇪🇺", tier: 80, players: [
      P("113", "TOP", "🇩🇪", 22), P("Malrang", "JNG", "🇰🇷", 25),
      P("Larssen", "MID", "🇸🇪", 25), P("Comp", "ADC", "🇩🇰", 22), P("Trymbi", "SUP", "🇵🇱", 24) ] },
    { id: "TH", name: "Team Heretics", short: "TH", league: "LEC", flag: "🇪🇺", tier: 78, players: [
      P("Wunder", "TOP", "🇩🇰", 26), P("Jankos", "JNG", "🇵🇱", 29),
      P("Perkz", "MID", "🇭🇷", 27), P("Flakked", "ADC", "🇪🇸", 23), P("Kobbe", "SUP", "🇩🇰", 26) ] },
    { id: "BDS", name: "Team BDS", short: "BDS", league: "LEC", flag: "🇪🇺", tier: 76, players: [
      P("Adam", "TOP", "🇫🇷", 23), P("Sheo", "JNG", "🇫🇷", 22),
      P("nuc", "MID", "🇦🇹", 21), P("Ice", "ADC", "🇮🇹", 22), P("Parus", "SUP", "🇫🇷", 22) ] },
    { id: "GX", name: "GIANTX", short: "GX", league: "LEC", flag: "🇪🇺", tier: 74, players: [
      P("Lot", "TOP", "🇫🇷", 21), P("Closer", "JNG", "🇹🇷", 24),
      P("Jackies", "MID", "🇵🇱", 22), P("Patrik", "ADC", "🇨🇿", 25), P("IgNar", "SUP", "🇰🇷", 28) ] },
    { id: "SK", name: "SK Gaming", short: "SK", league: "LEC", flag: "🇩🇪", tier: 70, players: [
      P("JNX", "TOP", "🇵🇱", 21), P("Isma", "JNG", "🇫🇷", 21),
      P("Nisqy", "MID", "🇧🇪", 26), P("Exakick", "ADC", "🇫🇷", 21), P("Doss", "SUP", "🇸🇪", 23) ] },

    /* ---------------------------- LCK ---------------------------- */
    { id: "GEN", name: "Gen.G", short: "GEN", league: "LCK", flag: "🇰🇷", tier: 96, players: [
      P("Kiin", "TOP", "🇰🇷", 26), P("Canyon", "JNG", "🇰🇷", 24),
      P("Chovy", "MID", "🇰🇷", 24), P("Ruler", "ADC", "🇰🇷", 26), P("Duro", "SUP", "🇰🇷", 21) ] },
    { id: "T1", name: "T1", short: "T1", league: "LCK", flag: "🇰🇷", tier: 95, players: [
      P("Zeus", "TOP", "🇰🇷", 21), P("Oner", "JNG", "🇰🇷", 23),
      P("Faker", "MID", "🇰🇷", 29), P("Gumayusi", "ADC", "🇰🇷", 23), P("Keria", "SUP", "🇰🇷", 23) ] },
    { id: "HLE", name: "Hanwha Life Esports", short: "HLE", league: "LCK", flag: "🇰🇷", tier: 92, players: [
      P("Doran", "TOP", "🇰🇷", 25), P("Peanut", "JNG", "🇰🇷", 27),
      P("Zeka", "MID", "🇰🇷", 23), P("Viper", "ADC", "🇰🇷", 25), P("Delight", "SUP", "🇰🇷", 24) ] },
    { id: "DK", name: "Dplus KIA", short: "DK", league: "LCK", flag: "🇰🇷", tier: 87, players: [
      P("Siwoo", "TOP", "🇰🇷", 20), P("Lucid", "JNG", "🇰🇷", 20),
      P("ShowMaker", "MID", "🇰🇷", 25), P("Aiming", "ADC", "🇰🇷", 25), P("BeryL", "SUP", "🇰🇷", 28) ] },
    { id: "KT", name: "KT Rolster", short: "KT", league: "LCK", flag: "🇰🇷", tier: 85, players: [
      P("PerfecT", "TOP", "🇰🇷", 21), P("Cuzz", "JNG", "🇰🇷", 26),
      P("Bdd", "MID", "🇰🇷", 27), P("Deft", "ADC", "🇰🇷", 29), P("Way", "SUP", "🇰🇷", 21) ] },
    { id: "NS", name: "Nongshim RedForce", short: "NS", league: "LCK", flag: "🇰🇷", tier: 78, players: [
      P("Kingen", "TOP", "🇰🇷", 25), P("Sylvie", "JNG", "🇰🇷", 21),
      P("Fisher", "MID", "🇰🇷", 21), P("Jiwoo", "ADC", "🇰🇷", 22), P("Lehends", "SUP", "🇰🇷", 27) ] },
    { id: "DRX", name: "DRX", short: "DRX", league: "LCK", flag: "🇰🇷", tier: 76, players: [
      P("Rich", "TOP", "🇰🇷", 27), P("Sponge", "JNG", "🇰🇷", 22),
      P("kyeahoo", "MID", "🇰🇷", 21), P("Teddy", "ADC", "🇰🇷", 27), P("Pleata", "SUP", "🇰🇷", 23) ] },
    { id: "BFX", name: "BNK FearX", short: "BFX", league: "LCK", flag: "🇰🇷", tier: 75, players: [
      P("Clear", "TOP", "🇰🇷", 23), P("Raptor", "JNG", "🇰🇷", 22),
      P("VicLa", "MID", "🇰🇷", 22), P("Diable", "ADC", "🇰🇷", 21), P("Kellin", "SUP", "🇰🇷", 26) ] },
    { id: "KDF", name: "Kwangdong Freecs", short: "KDF", league: "LCK", flag: "🇰🇷", tier: 72, players: [
      P("DuDu", "TOP", "🇰🇷", 23), P("YoungJae", "JNG", "🇰🇷", 22),
      P("BuLLDoG", "MID", "🇰🇷", 22), P("Taeyoon", "ADC", "🇰🇷", 21), P("Andil", "SUP", "🇰🇷", 22) ] },
    { id: "BRO", name: "OKSavingsBank BRION", short: "BRO", league: "LCK", flag: "🇰🇷", tier: 70, players: [
      P("Morgan", "TOP", "🇰🇷", 24), P("Gideon", "JNG", "🇰🇷", 22),
      P("Karis", "MID", "🇰🇷", 21), P("Envyy", "ADC", "🇰🇷", 21), P("Effort", "SUP", "🇰🇷", 26) ] },

    /* ---------------------------- LPL ---------------------------- */
    { id: "BLG", name: "Bilibili Gaming", short: "BLG", league: "LPL", flag: "🇨🇳", tier: 94, players: [
      P("Bin", "TOP", "🇨🇳", 23), P("Xun", "JNG", "🇨🇳", 22),
      P("Knight", "MID", "🇨🇳", 25), P("Elk", "ADC", "🇨🇳", 23), P("ON", "SUP", "🇨🇳", 23) ] },
    { id: "TES", name: "Top Esports", short: "TES", league: "LPL", flag: "🇨🇳", tier: 90, players: [
      P("Wayward", "TOP", "🇨🇳", 21), P("Tian", "JNG", "🇨🇳", 25),
      P("Rookie", "MID", "🇰🇷", 28), P("JackeyLove", "ADC", "🇨🇳", 25), P("Meiko", "SUP", "🇨🇳", 26) ] },
    { id: "JDG", name: "JD Gaming", short: "JDG", league: "LPL", flag: "🇨🇳", tier: 89, players: [
      P("369", "TOP", "🇨🇳", 25), P("Kanavi", "JNG", "🇰🇷", 25),
      P("Yagao", "MID", "🇨🇳", 26), P("Hope", "ADC", "🇨🇳", 22), P("Lvmao", "SUP", "🇨🇳", 24) ] },
    { id: "LNG", name: "LNG Esports", short: "LNG", league: "LPL", flag: "🇨🇳", tier: 87, players: [
      P("Zika", "TOP", "🇨🇳", 22), P("Tarzan", "JNG", "🇰🇷", 26),
      P("Scout", "MID", "🇰🇷", 26), P("GALA", "ADC", "🇨🇳", 24), P("Hang", "SUP", "🇨🇳", 23) ] },
    { id: "WBG", name: "Weibo Gaming", short: "WBG", league: "LPL", flag: "🇨🇳", tier: 86, players: [
      P("TheShy", "TOP", "🇰🇷", 26), P("Karsa", "JNG", "🇹🇼", 27),
      P("Xiaohu", "MID", "🇨🇳", 27), P("Light", "ADC", "🇨🇳", 23), P("Crisp", "SUP", "🇨🇳", 25) ] },
    { id: "EDG", name: "EDward Gaming", short: "EDG", league: "LPL", flag: "🇨🇳", tier: 82, players: [
      P("Ale", "TOP", "🇨🇳", 22), P("Jiejie", "JNG", "🇨🇳", 24),
      P("FoFo", "MID", "🇹🇼", 25), P("Leave", "ADC", "🇨🇳", 22), P("Wink", "SUP", "🇨🇳", 22) ] },
    { id: "AL", name: "Anyone's Legend", short: "AL", league: "LPL", flag: "🇨🇳", tier: 83, players: [
      P("Flandre", "TOP", "🇨🇳", 26), P("Tarzan2", "JNG", "🇨🇳", 22),
      P("Doinb", "MID", "🇰🇷", 27), P("Hans SamD", "ADC", "🇩🇪", 23), P("Kael", "SUP", "🇨🇳", 23) ] },
    { id: "OMG", name: "Oh My God", short: "OMG", league: "LPL", flag: "🇨🇳", tier: 79, players: [
      P("shanji", "TOP", "🇨🇳", 24), P("Aki", "JNG", "🇨🇳", 23),
      P("Creme", "MID", "🇨🇳", 22), P("Able", "ADC", "🇨🇳", 23), P("ppgod", "SUP", "🇨🇳", 27) ] },
    { id: "RNG", name: "Royal Never Give Up", short: "RNG", league: "LPL", flag: "🇨🇳", tier: 78, players: [
      P("Breathe", "TOP", "🇨🇳", 23), P("Wei", "JNG", "🇨🇳", 24),
      P("Cryin", "MID", "🇨🇳", 24), P("Assum", "ADC", "🇨🇳", 22), P("Ming", "SUP", "🇨🇳", 27) ] },
    { id: "FPX", name: "FunPlus Phoenix", short: "FPX", league: "LPL", flag: "🇨🇳", tier: 77, players: [
      P("xiaolaohu", "TOP", "🇨🇳", 22), P("h4cker", "JNG", "🇨🇳", 22),
      P("Care", "MID", "🇨🇳", 21), P("Lwx", "ADC", "🇨🇳", 25), P("QiuQiu", "SUP", "🇨🇳", 24) ] },

    /* ---------------------------- LCS ---------------------------- */
    { id: "C9", name: "Cloud9", short: "C9", league: "LCS", flag: "🇺🇸", tier: 85, players: [
      P("Thanatos", "TOP", "🇰🇷", 21), P("Blaber", "JNG", "🇺🇸", 25),
      P("Loki", "MID", "🇰🇷", 22), P("Zven", "ADC", "🇩🇰", 27), P("VULCAN", "SUP", "🇨🇦", 25) ] },
    { id: "TL", name: "Team Liquid", short: "TL", league: "LCS", flag: "🇺🇸", tier: 84, players: [
      P("Impact", "TOP", "🇰🇷", 30), P("UmTi", "JNG", "🇰🇷", 25),
      P("APA", "MID", "🇺🇸", 21), P("Yeon", "ADC", "🇺🇸", 22), P("CoreJJ", "SUP", "🇰🇷", 30) ] },
    { id: "FLY", name: "FlyQuest", short: "FLY", league: "LCS", flag: "🇺🇸", tier: 84, players: [
      P("Bwipo", "TOP", "🇧🇪", 26), P("Inspired", "JNG", "🇵🇱", 24),
      P("Quad", "MID", "🇰🇷", 22), P("Massu", "ADC", "🇧🇷", 23), P("Busio", "SUP", "🇺🇸", 23) ] },
    { id: "100", name: "100 Thieves", short: "100", league: "LCS", flag: "🇺🇸", tier: 79, players: [
      P("Sniper", "TOP", "🇺🇸", 22), P("River", "JNG", "🇰🇷", 25),
      P("Quid", "MID", "🇰🇷", 22), P("FBI", "ADC", "🇦🇺", 25), P("Eyla", "SUP", "🇺🇸", 21) ] },
    { id: "DIG", name: "Dignitas", short: "DIG", league: "LCS", flag: "🇺🇸", tier: 72, players: [
      P("Srtty", "TOP", "🇺🇸", 21), P("Sheriff", "JNG", "🇺🇸", 22),
      P("Jensen", "MID", "🇩🇰", 28), P("Tomo", "ADC", "🇺🇸", 22), P("Isles", "SUP", "🇨🇦", 22) ] },
    { id: "SR", name: "Shopify Rebellion", short: "SR", league: "LCS", flag: "🇺🇸", tier: 74, players: [
      P("FakeGod", "TOP", "🇺🇸", 23), P("Contractz", "JNG", "🇺🇸", 26),
      P("Palafox", "MID", "🇺🇸", 24), P("Bvoy", "ADC", "🇰🇷", 25), P("Zeyzal", "SUP", "🇺🇸", 26) ] },
    { id: "NRG", name: "NRG", short: "NRG", league: "LCS", flag: "🇺🇸", tier: 76, players: [
      P("Dhokla", "TOP", "🇺🇸", 27), P("IzziFye", "JNG", "🇦🇺", 23),
      P("Ablazeolive", "MID", "🇺🇸", 24), P("Luger", "ADC", "🇸🇰", 25), P("IgNar", "SUP", "🇰🇷", 28) ] },
    { id: "IMT", name: "Immortals", short: "IMT", league: "LCS", flag: "🇺🇸", tier: 68, players: [
      P("Castle", "TOP", "🇺🇸", 23), P("Armao", "JNG", "🇺🇸", 24),
      P("Mask", "MID", "🇺🇸", 22), P("Tactical", "ADC", "🇺🇸", 24), P("Fleshy", "SUP", "🇺🇸", 23) ] }
  ];

  LM.getTeam = function (id) { return LM.TEAMS.find(function (t) { return t.id === id; }); };
  LM.teamsByLeague = function (lg) { return LM.TEAMS.filter(function (t) { return t.league === lg; }); };
})(window.LM = window.LM || {});
