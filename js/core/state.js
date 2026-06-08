/* =============================================================
 * Legends Manager — État du jeu, génération des joueurs,
 * sauvegarde / chargement locaux.
 * ============================================================= */
(function (LM) {
  var SAVE_KEY = "legends-manager-save-v1";

  // Poids des attributs par rôle pour calculer la note globale (OVR).
  var WEIGHTS = {
    TOP: { mechanics: .22, laning: .24, teamfight: .24, vision: .10, shotcalling: .07, consistency: .13 },
    JNG: { mechanics: .18, laning: .08, teamfight: .20, vision: .24, shotcalling: .18, consistency: .12 },
    MID: { mechanics: .28, laning: .20, teamfight: .20, vision: .12, shotcalling: .08, consistency: .12 },
    ADC: { mechanics: .30, laning: .18, teamfight: .28, vision: .08, shotcalling: .04, consistency: .12 },
    SUP: { mechanics: .12, laning: .12, teamfight: .24, vision: .26, shotcalling: .14, consistency: .12 }
  };

  LM.computeOVR = function (p) {
    var w = WEIGHTS[p.role], s = 0;
    for (var k in w) s += p.attrs[k] * w[k];
    return Math.round(s);
  };

  // Génère les attributs détaillés d'un joueur à partir du tier de l'équipe.
  function genPlayer(rng, def, teamTier) {
    var base = teamTier - 8 + LM.U.rint(rng, -4, 6);
    var boost = LM.SUPERSTARS[def.name] || 0;
    function a() { return LM.U.clamp(base + boost + LM.U.rint(rng, -6, 7), 35, 99); }
    var attrs = {
      mechanics: a(), laning: a(), teamfight: a(),
      vision: a(), shotcalling: a(), consistency: a()
    };
    // Potentiel : plus élevé quand le joueur est jeune.
    var age = def.age;
    var ovrTmp = 0, w = WEIGHTS[def.role];
    for (var k in w) ovrTmp += attrs[k] * w[k];
    ovrTmp = Math.round(ovrTmp);
    var growth = Math.max(0, 24 - age);
    var potential = LM.U.clamp(ovrTmp + LM.U.rint(rng, 0, growth + 3), ovrTmp, 99);

    var champPool = pickChampPool(rng, def.role);
    // Maîtrise par champion (0-99) : élevée sur le pool favori.
    var mastery = {};
    champPool.forEach(function (c, i) { mastery[c] = LM.U.rint(rng, i === 0 ? 78 : 55, i === 0 ? 95 : 86); });
    var p = {
      id: LM.U.uid(),
      name: def.name, role: def.role, nat: def.nat, age: age,
      attrs: attrs, potential: potential,
      form: LM.U.rint(rng, -2, 3),       // forme du moment (-5 à +5)
      morale: LM.U.rint(rng, 60, 85),    // moral (0-100)
      condition: 100,                    // condition physique (0-100)
      champs: champPool,                 // pool de champions favoris
      mastery: mastery,                  // maîtrise par champion
      traits: LM.assignTraits(rng, ovrTmp, age),
      injury: null,                      // {type, weeks} ou null
      potentialKnown: true,
      teamId: null,
      stats: { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 }
    };
    p.ovr = LM.computeOVR(p);
    // Contrat & valeur marchande dérivés de l'OVR.
    p.value = playerValue(p);
    p.salary = Math.round(p.value * 0.18 / 1000) * 1000;
    p.contract = LM.U.rint(rng, 1, 3); // années restantes
    p.ambition = LM.U.clamp(LM.U.rint(rng, 30, 75) + (LM.hasTrait(p, "AMBITIOUS") ? 22 : 0), 10, 99);
    p.loyalty = LM.U.clamp(LM.U.rint(rng, 35, 75) + (LM.hasTrait(p, "LOYAL") ? 22 : 0), 10, 99);
    return p;
  }
  LM.makePlayer = genPlayer;

  function playerValue(p) {
    var o = p.ovr;
    var v = Math.pow(Math.max(0, o - 45), 2.2) * 90;
    // Les jeunes à fort potentiel valent plus cher.
    v *= 1 + Math.max(0, p.potential - o) * 0.03;
    v *= 1 + Math.max(0, 26 - p.age) * 0.02;
    return Math.round(v / 1000) * 1000;
  }
  LM.playerValue = playerValue;

  function pickChampPool(rng, role) {
    var pool = LM.CHAMPIONS_BY_ROLE[role] || [];
    var n = LM.U.rint(rng, 4, 7);
    return LM.U.shuffle(rng, pool).slice(0, Math.min(n, pool.length));
  }
  LM.pickChampPool = pickChampPool;

  // --- Création d'une nouvelle partie ---------------------------------
  LM.newGame = function (chosenTeamId, managerName) {
    var seed = (Date.now() & 0xffffffff) >>> 0;
    var rng = LM.RNG(seed);
    var teams = {};
    LM.TEAMS.forEach(function (def) {
      var roster = def.players.map(function (pd) {
        var p = genPlayer(rng, pd, def.tier);
        p.teamId = def.id;
        return p;
      });
      teams[def.id] = {
        id: def.id, name: def.name, short: def.short, league: def.league, flag: def.flag,
        tier: def.tier,
        roster: roster,
        budget: Math.round((def.tier * 60000 + 1500000) / 1000) * 1000,
        facilities: LM.U.clamp(Math.round(def.tier / 12), 3, 8), // qualité infrastructures 1-10
        trophies: []
      };
    });

    var G = {
      version: 1,
      seed: seed,
      manager: managerName || "Manager",
      teamId: chosenTeamId,
      date: { year: 2026, month: 1, day: 6 },
      teams: teams,
      freeAgents: genFreeAgents(rng),
      season: null,        // rempli par calendar.startSeason
      phaseIndex: 0,
      history: [],         // palmarès des saisons passées
      inbox: [],           // messages / actualités
      trainingUsed: {},    // joueurId -> bool (1 entraînement par étape)
      patchNote: 1,
      meta: {},            // force méta par champion (rempli ci-dessous)
      offers: [],          // offres entrantes pour vos joueurs
      scoutPool: [],       // jeunes talents à scouter
      fired: false
    };
    // Staff, académie et intensité pour chaque club.
    Object.keys(teams).forEach(function (tid) { LM.Club.initTeam(G, teams[tid], rng); });
    LM.Board.init(G);
    LM.Board.setSeasonObjective(G);
    LM.Club.refreshScoutPool(G, rng);
    if (LM.Story) LM.Story.init(G);
    if (LM.Training) LM.Training.ensurePlan(G);
    LM.Meta.init(G);
    LM.Calendar.startSeason(G);
    LM.addNews(G, "Bienvenue", "Bienvenue " + G.manager + " ! Vous prenez la tête de " +
      teams[chosenTeamId].name + ". Menez votre équipe vers le titre mondial.");
    return G;
  };

  function genFreeAgents(rng) {
    var fa = [];
    var first = ["Spark", "Nova", "Riftwalker", "Zephyr", "Kairos", "Onyx", "Vortex", "Lumen",
      "Specter", "Drake", "Frost", "Ranger", "Echo", "Titan", "Pulse", "Wraith", "Sable", "Quartz",
      "Jett", "Cyclone", "Ronin", "Saber", "Hawk", "Volt", "Cinder", "Blitz", "Crow", "Aero"];
    for (var i = 0; i < 24; i++) {
      var role = LM.ROLES[i % 5];
      var name = LM.U.pick(rng, first) + LM.U.rint(rng, 1, 99);
      var tier = LM.U.rint(rng, 58, 82);
      var p = genPlayer(rng, { name: name, role: role, nat: "🌍", age: LM.U.rint(rng, 17, 28) }, tier);
      p.teamId = null;
      p.contract = 0;
      fa.push(p);
    }
    return fa;
  }
  LM.genFreeAgents = genFreeAgents;

  LM.addNews = function (G, title, body, tag) {
    G.inbox.unshift({ id: LM.U.uid(), date: Object.assign({}, G.date), title: title, body: body, tag: tag || "club", read: false });
    if (G.inbox.length > 120) G.inbox.pop();
  };

  LM.myTeam = function (G) { return G.teams[G.teamId]; };

  // --- Sauvegarde / chargement locaux ---------------------------------
  LM.save = function (G) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(G));
      return true;
    } catch (e) { console.error(e); return false; }
  };
  LM.hasSave = function () { return !!localStorage.getItem(SAVE_KEY); };
  LM.load = function () {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try { return LM.migrate(JSON.parse(raw)); } catch (e) { return null; }
  };

  // Compatibilité : complète les sauvegardes d'anciennes versions.
  LM.migrate = function (G) {
    if (!G || !G.teams) return G;
    if (!G.offers) G.offers = [];
    if (!G.scoutPool) G.scoutPool = [];
    if (typeof G.fired !== "boolean") G.fired = false;
    var rng = LM.RNG((G.seed || 1) >>> 0);
    Object.keys(G.teams).forEach(function (tid) {
      var t = G.teams[tid];
      if (!t.staff) LM.Club.initTeam(G, t, rng);
      t.roster.forEach(fixPlayer);
    });
    (G.freeAgents || []).forEach(fixPlayer);
    if (!G.meta || !Object.keys(G.meta).length) { G.meta = {}; LM.Meta.init(G); }
    if (LM.Story) LM.Story.ensure(G);
    if (LM.Training) LM.Training.ensurePlan(G);
    if (!G.board) {
      LM.Board.init(G); LM.Board.setSeasonObjective(G);
      if (G.season && G.season.stage && G.season.stage.type === "split")
        LM.Board.setSplitObjective(G, G.season.stage.name);
    }
    return G;
    function fixPlayer(p) {
      if (!p.traits) p.traits = [];
      if (p.injury === undefined) p.injury = null;
      if (p.potentialKnown === undefined) p.potentialKnown = true;
      if (p.ambition == null) p.ambition = 60;
      if (p.loyalty == null) p.loyalty = 60;
      if (!p.mastery) { p.mastery = {}; (p.champs || []).forEach(function (c) { p.mastery[c] = 70; }); }
    }
  };
  LM.deleteSave = function () { localStorage.removeItem(SAVE_KEY); };

  // Export vers un fichier .json sur le PC.
  LM.exportSave = function (G) {
    var blob = new Blob([JSON.stringify(G)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "legends-manager-" + G.teams[G.teamId].short + "-" + G.date.year + ".json";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 100);
  };

  LM.importSave = function (file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      try { cb(JSON.parse(fr.result)); }
      catch (e) { cb(null); }
    };
    fr.readAsText(file);
  };
})(window.LM = window.LM || {});
