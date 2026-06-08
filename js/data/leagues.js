/* =============================================================
 * Legends Manager - Données : Ligues, Équipes et Joueurs
 *
 * Mise à jour 2026 basée sur les rosters compétitifs actuels :
 * LEC Spring, LCK Rounds 1-2, LPL Split 2 et LCS Spring.
 *
 * tier = niveau global de l'équipe (50-99), sert à générer les
 *        attributs détaillés des joueurs au démarrage.
 * ============================================================= */
(function (LM) {
  // Joueurs "superstars" : bonus d'attributs appliqué par-dessus le tier.
  // (gamertag -> bonus de note global)
  LM.SUPERSTARS = {
    Chovy: 10, Faker: 9, Canyon: 9, Ruler: 8, Keria: 8,
    Bin: 8, Knight: 8, Viper: 8, Kiin: 7, Kanavi: 7,
    Zeka: 7, Gumayusi: 7, Zeus: 7, Xun: 6, Oner: 6,
    Peyz: 6, Delight: 6, ShowMaker: 6, ON: 6, Tarzan: 6,
    GALA: 6, Elk: 6, Meiko: 6, Bdd: 5, Aiming: 5,
    Scout: 5, Lehends: 5, JackeyLove: 5, Tian: 5, Creme: 5,
    Xiaohu: 5, Jiejie: 5, Flandre: 4, Hope: 4, Kael: 4,

    Caps: 8, "Hans Sama": 5, BrokenBlade: 4, SkewMond: 5, Labrov: 4,
    Caliste: 6, Canna: 5, Yike: 5, Busio: 4, kyeahoo: 4,
    Elyoya: 5, Jojopyun: 4, Naak_Nako: 5, "Naak Nako": 5,
    Lyncas: 5, Humanoid: 4, Carzzy: 4, Fleshy: 3,
    Razork: 4, Upset: 4, Mikyx: 4, Trymbi: 3,

    Inspired: 5, Berserker: 5, Quid: 5, CoreJJ: 5,
    Blaber: 4, APA: 4, Impact: 4, Vulcan: 4, Thanatos: 4,
    Yeon: 4, Massu: 4, Rahel: 4, HamBak: 4
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
    { id: "G2", name: "G2 Esports", short: "G2", league: "LEC", flag: "🇪🇺", tier: 92, players: [
      P("BrokenBlade", "TOP", "🇩🇪", 26), P("SkewMond", "JNG", "🇫🇷", 21),
      P("Caps", "MID", "🇩🇰", 26), P("Hans Sama", "ADC", "🇫🇷", 26), P("Labrov", "SUP", "🇬🇷", 23) ] },
    { id: "KC", name: "Karmine Corp", short: "KC", league: "LEC", flag: "🇫🇷", tier: 90, players: [
      P("Canna", "TOP", "🇰🇷", 26), P("Yike", "JNG", "🇸🇪", 24),
      P("kyeahoo", "MID", "🇰🇷", 21), P("Caliste", "ADC", "🇫🇷", 19), P("Busio", "SUP", "🇺🇸", 23) ] },
    { id: "VIT", name: "Team Vitality", short: "VIT", league: "LEC", flag: "🇪🇺", tier: 88, players: [
      P("Naak Nako", "TOP", "🇹🇷", 20), P("Lyncas", "JNG", "🇱🇹", 22),
      P("Humanoid", "MID", "🇨🇿", 26), P("Carzzy", "ADC", "🇨🇿", 24), P("Fleshy", "SUP", "🇹🇷", 23) ] },
    { id: "MKOI", name: "Movistar KOI", short: "MKOI", league: "LEC", flag: "🇪🇸", tier: 86, players: [
      P("Myrwn", "TOP", "🇪🇸", 22), P("Elyoya", "JNG", "🇪🇸", 26),
      P("Jojopyun", "MID", "🇨🇦", 21), P("Supa", "ADC", "🇪🇸", 25), P("Alvaro", "SUP", "🇪🇸", 23) ] },
    { id: "NAVI", name: "Natus Vincere", short: "NAVI", league: "LEC", flag: "🇺🇦", tier: 80, players: [
      P("Maynter", "TOP", "🇺🇦", 23), P("Rhilech", "JNG", "🇹🇷", 22),
      P("Poby", "MID", "🇰🇷", 21), P("SamD", "ADC", "🇰🇷", 25), P("Parus", "SUP", "🇹🇷", 23) ] },
    { id: "GX", name: "GIANTX", short: "GX", league: "LEC", flag: "🇪🇺", tier: 78, players: [
      P("Lot", "TOP", "🇹🇷", 20), P("ISMA", "JNG", "🇫🇷", 22),
      P("Jackies", "MID", "🇨🇿", 22), P("Noah", "ADC", "🇰🇷", 24), P("Jun", "SUP", "🇰🇷", 24) ] },
    { id: "FNC", name: "Fnatic", short: "FNC", league: "LEC", flag: "🇪🇺", tier: 76, players: [
      P("Empyros", "TOP", "🇬🇷", 20), P("Razork", "JNG", "🇪🇸", 25),
      P("Vladi", "MID", "🇬🇷", 20), P("Upset", "ADC", "🇩🇪", 26), P("Lospa", "SUP", "🇰🇷", 23) ] },
    { id: "SHFT", name: "Shifters", short: "SHFT", league: "LEC", flag: "🇨🇭", tier: 72, players: [
      P("Rooster", "TOP", "🇰🇷", 20), P("Boukada", "JNG", "🇫🇷", 20),
      P("nuc", "MID", "🇫🇷", 24), P("Paduck", "ADC", "🇰🇷", 22), P("Trymbi", "SUP", "🇵🇱", 26) ] },
    { id: "SK", name: "SK Gaming", short: "SK", league: "LEC", flag: "🇩🇪", tier: 71, players: [
      P("Wunder", "TOP", "🇩🇰", 27), P("Skeanz", "JNG", "🇫🇷", 25),
      P("LIDER", "MID", "🇳🇴", 26), P("Jopa", "ADC", "🇭🇷", 20), P("Mikyx", "SUP", "🇸🇮", 27) ] },
    { id: "TH", name: "Team Heretics", short: "TH", league: "LEC", flag: "🇪🇸", tier: 70, players: [
      P("Tracyn", "TOP", "🇵🇱", 21), P("Sheo", "JNG", "🇫🇷", 23),
      P("Serin", "MID", "🇹🇷", 23), P("Ice", "ADC", "🇰🇷", 24), P("Way", "SUP", "🇰🇷", 22) ] },

    /* ---------------------------- LCK ---------------------------- */
    { id: "GEN", name: "Gen.G", short: "GEN", league: "LCK", flag: "🇰🇷", tier: 97, players: [
      P("Kiin", "TOP", "🇰🇷", 26), P("Canyon", "JNG", "🇰🇷", 25),
      P("Chovy", "MID", "🇰🇷", 25), P("Ruler", "ADC", "🇰🇷", 27), P("Duro", "SUP", "🇰🇷", 22) ] },
    { id: "T1", name: "T1", short: "T1", league: "LCK", flag: "🇰🇷", tier: 96, players: [
      P("Doran", "TOP", "🇰🇷", 25), P("Oner", "JNG", "🇰🇷", 24),
      P("Faker", "MID", "🇰🇷", 30), P("Peyz", "ADC", "🇰🇷", 21), P("Keria", "SUP", "🇰🇷", 24) ] },
    { id: "HLE", name: "Hanwha Life Esports", short: "HLE", league: "LCK", flag: "🇰🇷", tier: 94, players: [
      P("Zeus", "TOP", "🇰🇷", 22), P("Kanavi", "JNG", "🇰🇷", 25),
      P("Zeka", "MID", "🇰🇷", 24), P("Gumayusi", "ADC", "🇰🇷", 24), P("Delight", "SUP", "🇰🇷", 24) ] },
    { id: "DK", name: "Dplus KIA", short: "DK", league: "LCK", flag: "🇰🇷", tier: 88, players: [
      P("Siwoo", "TOP", "🇰🇷", 20), P("Lucid", "JNG", "🇰🇷", 21),
      P("ShowMaker", "MID", "🇰🇷", 25), P("Smash", "ADC", "🇰🇷", 20), P("Career", "SUP", "🇰🇷", 20) ] },
    { id: "KT", name: "KT Rolster", short: "KT", league: "LCK", flag: "🇰🇷", tier: 84, players: [
      P("PerfecT", "TOP", "🇰🇷", 22), P("Cuzz", "JNG", "🇰🇷", 26),
      P("Bdd", "MID", "🇰🇷", 27), P("Aiming", "ADC", "🇰🇷", 25), P("Effort", "SUP", "🇰🇷", 26) ] },
    { id: "BFX", name: "BNK FEARX", short: "BFX", league: "LCK", flag: "🇰🇷", tier: 80, players: [
      P("Clear", "TOP", "🇰🇷", 23), P("Raptor", "JNG", "🇰🇷", 22),
      P("VicLa", "MID", "🇰🇷", 23), P("Diable", "ADC", "🇰🇷", 20), P("Kellin", "SUP", "🇰🇷", 25) ] },
    { id: "DRX", name: "Kiwoom DRX", short: "DRX", league: "LCK", flag: "🇰🇷", tier: 78, players: [
      P("Rich", "TOP", "🇰🇷", 28), P("Willer", "JNG", "🇰🇷", 23),
      P("Ucal", "MID", "🇰🇷", 25), P("Jiwoo", "ADC", "🇰🇷", 22), P("Andil", "SUP", "🇰🇷", 23) ] },
    { id: "NS", name: "Nongshim RedForce", short: "NS", league: "LCK", flag: "🇰🇷", tier: 77, players: [
      P("Kingen", "TOP", "🇰🇷", 26), P("Sponge", "JNG", "🇰🇷", 22),
      P("Scout", "MID", "🇰🇷", 28), P("Taeyoon", "ADC", "🇰🇷", 24), P("Lehends", "SUP", "🇰🇷", 27) ] },
    { id: "BRO", name: "HANJIN BRION", short: "BRO", league: "LCK", flag: "🇰🇷", tier: 74, players: [
      P("Casting", "TOP", "🇰🇷", 20), P("GIDEON", "JNG", "🇰🇷", 23),
      P("Loki", "MID", "🇰🇷", 21), P("Teddy", "ADC", "🇰🇷", 28), P("Namgung", "SUP", "🇰🇷", 21) ] },
    { id: "DNS", name: "DN SOOPers", short: "DNS", league: "LCK", flag: "🇰🇷", tier: 70, players: [
      P("DuDu", "TOP", "🇰🇷", 25), P("Pyosik", "JNG", "🇰🇷", 26),
      P("Clozer", "MID", "🇰🇷", 23), P("deokdam", "ADC", "🇰🇷", 26), P("Life", "SUP", "🇰🇷", 25) ] },

    /* ---------------------------- LPL ---------------------------- */
    { id: "BLG", name: "Bilibili Gaming", short: "BLG", league: "LPL", flag: "🇨🇳", tier: 96, players: [
      P("Bin", "TOP", "🇨🇳", 23), P("Xun", "JNG", "🇨🇳", 23),
      P("Knight", "MID", "🇨🇳", 25), P("Viper", "ADC", "🇰🇷", 25), P("ON", "SUP", "🇨🇳", 23) ] },
    { id: "AL", name: "Anyone's Legend", short: "AL", league: "LPL", flag: "🇨🇳", tier: 91, players: [
      P("Flandre", "TOP", "🇨🇳", 27), P("Tarzan", "JNG", "🇰🇷", 26),
      P("Shanks", "MID", "🇨🇳", 25), P("Hope", "ADC", "🇨🇳", 25), P("Kael", "SUP", "🇰🇷", 23) ] },
    { id: "LNG", name: "LNG Esports", short: "LNG", league: "LPL", flag: "🇨🇳", tier: 90, players: [
      P("sheer", "TOP", "🇨🇳", 20), P("Croco", "JNG", "🇰🇷", 25),
      P("BuLLDoG", "MID", "🇰🇷", 23), P("1xn", "ADC", "🇨🇳", 22), P("MISSING", "SUP", "🇨🇳", 22) ] },
    { id: "TES", name: "Top Esports", short: "TES", league: "LPL", flag: "🇨🇳", tier: 89, players: [
      P("ZUIAN", "TOP", "🇨🇳", 20), P("Tian", "JNG", "🇨🇳", 26),
      P("Creme", "MID", "🇨🇳", 23), P("JackeyLove", "ADC", "🇨🇳", 25), P("fengyue", "SUP", "🇨🇳", 22) ] },
    { id: "JDG", name: "JD Gaming", short: "JDG", league: "LPL", flag: "🇨🇳", tier: 86, players: [
      P("Xiaoxu", "TOP", "🇨🇳", 22), P("JunJia", "JNG", "🇹🇼", 24),
      P("HongQ", "MID", "🇹🇼", 21), P("GALA", "ADC", "🇨🇳", 25), P("Vampire", "SUP", "🇨🇳", 20) ] },
    { id: "NIP", name: "Ninjas in Pyjamas", short: "NIP", league: "LPL", flag: "🇨🇳", tier: 84, players: [
      P("HOYA", "TOP", "🇰🇷", 25), P("Guwon", "JNG", "🇰🇷", 22),
      P("Care", "MID", "🇨🇳", 22), P("Assum", "ADC", "🇨🇳", 24), P("Zhuo", "SUP", "🇨🇳", 25) ] },
    { id: "WBG", name: "Weibo Gaming", short: "WBG", league: "LPL", flag: "🇨🇳", tier: 83, players: [
      P("Zika", "TOP", "🇨🇳", 23), P("Jiejie", "JNG", "🇨🇳", 25),
      P("Xiaohu", "MID", "🇨🇳", 28), P("Elk", "ADC", "🇨🇳", 25), P("Hang", "SUP", "🇨🇳", 24) ] },
    { id: "EDG", name: "EDward Gaming", short: "EDG", league: "LPL", flag: "🇨🇳", tier: 80, players: [
      P("Zdz", "TOP", "🇨🇳", 24), P("Xiaohao", "JNG", "🇨🇳", 23),
      P("Angel", "MID", "🇨🇳", 26), P("Leave", "ADC", "🇨🇳", 23), P("Jwei", "SUP", "🇨🇳", 23) ] },
    { id: "LGD", name: "LGD Gaming", short: "LGD", league: "LPL", flag: "🇨🇳", tier: 79, players: [
      P("Burdol", "TOP", "🇰🇷", 23), P("Heng", "JNG", "🇨🇳", 22),
      P("Tangyuan", "MID", "🇨🇳", 23), P("Shaoye", "ADC", "🇨🇳", 21), P("Ycx", "SUP", "🇨🇳", 22) ] },
    { id: "IG", name: "Invictus Gaming", short: "IG", league: "LPL", flag: "🇨🇳", tier: 77, players: [
      P("Breathe", "TOP", "🇨🇳", 25), P("Wei", "JNG", "🇨🇳", 24),
      P("Nia", "MID", "🇨🇳", 21), P("JiaQi", "ADC", "🇨🇳", 20), P("Meiko", "SUP", "🇨🇳", 27) ] },
    { id: "WE", name: "Team WE", short: "WE", league: "LPL", flag: "🇨🇳", tier: 76, players: [
      P("Cube", "TOP", "🇨🇳", 25), P("Monki", "JNG", "🇨🇳", 21),
      P("Karis", "MID", "🇰🇷", 23), P("About", "ADC", "🇰🇷", 22), P("Erha", "SUP", "🇨🇳", 21) ] },
    { id: "TT", name: "ThunderTalk Gaming", short: "TT", league: "LPL", flag: "🇨🇳", tier: 75, players: [
      P("Keshi", "TOP", "🇨🇳", 22), P("Junhao", "JNG", "🇨🇳", 24),
      P("Heru", "MID", "🇰🇷", 22), P("Ahn", "ADC", "🇨🇳", 22), P("Feather", "SUP", "🇨🇳", 21) ] },
    { id: "UP", name: "Ultra Prime", short: "UP", league: "LPL", flag: "🇨🇳", tier: 74, players: [
      P("sasi", "TOP", "🇨🇳", 21), P("Climber", "JNG", "🇨🇳", 22),
      P("Saber", "MID", "🇨🇳", 21), P("Hena", "ADC", "🇰🇷", 26), P("Xiaoxia", "SUP", "🇨🇳", 21) ] },
    { id: "OMG", name: "Oh My God", short: "OMG", league: "LPL", flag: "🇨🇳", tier: 73, players: [
      P("Hery", "TOP", "🇨🇳", 23), P("Juhan", "JNG", "🇰🇷", 25),
      P("haichao", "MID", "🇨🇳", 23), P("Photic", "ADC", "🇨🇳", 24), P("Moham", "SUP", "🇰🇷", 22) ] },

    /* ---------------------------- LCS ---------------------------- */
    { id: "C9", name: "Cloud9", short: "C9", league: "LCS", flag: "🇺🇸", tier: 86, players: [
      P("Thanatos", "TOP", "🇰🇷", 21), P("Blaber", "JNG", "🇺🇸", 26),
      P("APA", "MID", "🇺🇸", 23), P("Zven", "ADC", "🇩🇰", 29), P("Vulcan", "SUP", "🇨🇦", 26) ] },
    { id: "TL", name: "Team Liquid", short: "TL", league: "LCS", flag: "🇺🇸", tier: 85, players: [
      P("Morgan", "TOP", "🇰🇷", 25), P("Josedeodo", "JNG", "🇦🇷", 25),
      P("Quid", "MID", "🇰🇷", 23), P("Yeon", "ADC", "🇺🇸", 25), P("CoreJJ", "SUP", "🇰🇷", 31) ] },
    { id: "LYON", name: "LYON", short: "LYON", league: "LCS", flag: "🇲🇽", tier: 84, players: [
      P("Dhokla", "TOP", "🇺🇸", 27), P("Inspired", "JNG", "🇵🇱", 24),
      P("Saint", "MID", "🇰🇷", 21), P("Berserker", "ADC", "🇰🇷", 23), P("Isles", "SUP", "🇦🇺", 25) ] },
    { id: "FLY", name: "FlyQuest", short: "FLY", league: "LCS", flag: "🇺🇸", tier: 82, players: [
      P("Gakgos", "TOP", "🇹🇷", 23), P("Gryffinn", "JNG", "🇺🇸", 21),
      P("Quad", "MID", "🇰🇷", 23), P("Massu", "ADC", "🇨🇦", 22), P("Cryogen", "SUP", "🇨🇦", 21) ] },
    { id: "SEN", name: "Sentinels", short: "SEN", league: "LCS", flag: "🇺🇸", tier: 80, players: [
      P("Impact", "TOP", "🇰🇷", 31), P("HamBak", "JNG", "🇰🇷", 21),
      P("DARKWINGS", "MID", "🇺🇸", 25), P("Rahel", "ADC", "🇰🇷", 23), P("huhi", "SUP", "🇰🇷", 31) ] },
    { id: "DSG", name: "Disguised", short: "DSG", league: "LCS", flag: "🇺🇸", tier: 76, players: [
      P("Castle", "TOP", "🇰🇷", 22), P("KryRa", "JNG", "🇨🇦", 21),
      P("Callme", "MID", "🇰🇷", 21), P("sajed", "ADC", "🇺🇸", 22), P("Lyonz", "SUP", "🇦🇷", 24) ] },
    { id: "SR", name: "Shopify Rebellion", short: "SR", league: "LCS", flag: "🇺🇸", tier: 72, players: [
      P("Fudge", "TOP", "🇦🇺", 24), P("Contractz", "JNG", "🇺🇸", 27),
      P("Zinie", "MID", "🇰🇷", 21), P("Bvoy", "ADC", "🇰🇷", 27), P("Ceos", "SUP", "🇧🇷", 26) ] },
    { id: "DIG", name: "Dignitas", short: "DIG", league: "LCS", flag: "🇺🇸", tier: 70, players: [
      P("Photon", "TOP", "🇰🇷", 24), P("eXyu", "JNG", "🇺🇸", 23),
      P("Palafox", "MID", "🇺🇸", 25), P("FBI", "ADC", "🇦🇺", 26), P("Ignar", "SUP", "🇰🇷", 29) ] }
  ];

  LM.getTeam = function (id) { return LM.TEAMS.find(function (t) { return t.id === id; }); };
  LM.teamsByLeague = function (lg) { return LM.TEAMS.filter(function (t) { return t.league === lg; }); };
})(window.LM = window.LM || {});
