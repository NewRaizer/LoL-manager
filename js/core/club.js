/* =============================================================
 * Legends Manager — Gestion du club
 * Staff, blessures & surmenage, scouting, académie, mentorat.
 * ============================================================= */
(function (LM) {
  var Club = {};

  Club.STAFF = { coach: "Coach", medic: "Préparateur / Médical", analyst: "Analyste", psychologist: "Psychologue" };
  var INJURIES = ["Tendinite du poignet", "Syndrome du canal carpien", "Fatigue oculaire",
    "Douleurs dorsales", "Entorse du poignet"];

  var PNAMES = ["Spark", "Nova", "Zephyr", "Kairos", "Onyx", "Vortex", "Lumen", "Specter", "Frost",
    "Echo", "Pulse", "Wraith", "Sable", "Quartz", "Jett", "Cyclone", "Ronin", "Saber", "Volt",
    "Cinder", "Crow", "Aero", "Dusk", "Halo", "Riven", "Nyx", "Drift", "Ember", "Sage", "Talon"];

  // -------- Initialisation par équipe --------
  Club.initTeam = function (G, team, rng) {
    var base = LM.U.clamp(Math.round(team.tier / 12), 2, 8);
    team.staff = {
      coach: LM.U.clamp(base + LM.U.rint(rng, -1, 1), 1, 10),
      medic: LM.U.clamp(base + LM.U.rint(rng, -1, 1), 1, 10),
      analyst: LM.U.clamp(base + LM.U.rint(rng, -1, 1), 1, 10),
      psychologist: LM.U.clamp(base + LM.U.rint(rng, -1, 1), 1, 10)
    };
    team.academy = { level: LM.U.clamp(base, 1, 8), prospects: [] };
    team.intensity = 2;            // 1 léger · 2 normal · 3 intensif
    team.mentorships = [];         // [{mentorId, menteeId}]
  };

  // -------- Effets du staff --------
  Club.coachMult = function (team) { return 1 + ((team.staff ? team.staff.coach : 5) - 5) * 0.08; };
  Club.medicFactor = function (team) { return LM.U.clamp(1 - ((team.staff ? team.staff.medic : 5)) * 0.06, 0.3, 1); };
  Club.analystBonus = function (team) { return ((team.staff ? team.staff.analyst : 5) - 5) * 0.35; };
  Club.psychoMorale = function (team) { return (team.staff ? team.staff.psychologist : 5) * 0.4; };

  Club.upgradeStaff = function (G, key) {
    var my = LM.myTeam(G);
    if (!my.staff || my.staff[key] == null) return { ok: false, msg: "Inconnu." };
    if (my.staff[key] >= 10) return { ok: false, msg: "Déjà au maximum." };
    var cost = my.staff[key] * 200000;
    if (my.budget < cost) return { ok: false, msg: "Budget insuffisant (" + LM.U.money(cost) + ")." };
    my.budget -= cost; my.staff[key]++;
    LM.addNews(G, "Staff renforcé", Club.STAFF[key] + " niveau " + my.staff[key] + "/10.");
    return { ok: true, msg: Club.STAFF[key] + " → niveau " + my.staff[key] + "/10." };
  };

  Club.upgradeAcademy = function (G) {
    var my = LM.myTeam(G);
    if (my.academy.level >= 10) return { ok: false, msg: "Académie déjà au maximum." };
    var cost = my.academy.level * 300000;
    if (my.budget < cost) return { ok: false, msg: "Budget insuffisant (" + LM.U.money(cost) + ")." };
    my.budget -= cost; my.academy.level++;
    LM.addNews(G, "Académie améliorée", "Centre de formation niveau " + my.academy.level + "/10.");
    return { ok: true, msg: "Académie niveau " + my.academy.level + "/10." };
  };

  Club.setIntensity = function (G, v) {
    LM.myTeam(G).intensity = LM.U.clamp(v, 1, 3);
  };

  // -------- Blessures & surmenage --------
  Club.injuredAtRole = function (team, role) {
    return team.roster.some(function (p) { return p.role === role && p.injury; });
  };

  // Tirage de blessures après une série (appelé depuis Sim.applyStats).
  Club.rollInjuries = function (G, team, starters, seriesLen) {
    var intensity = team.intensity || 2;
    starters.forEach(function (p) {
      if (!p || p.injury) return;
      var risk = 0.015 + LM.U.clamp((80 - p.condition) / 100, 0, 0.55);
      risk *= (0.7 + intensity * 0.18);
      risk *= Club.medicFactor(team);
      if (LM.hasTrait(p, "FRAGILE")) risk *= 1.7;
      if (LM.hasTrait(p, "WORKHORSE")) risk *= 0.5;
      var rng = LM.RNG((parseInt(p.id, 36) ^ G.date.day ^ G.date.month ^ seriesLen) >>> 0);
      // Surmenage : condition très basse + moral bas.
      if (p.condition < 33 && p.morale < 48 && rng() < 0.5) {
        p.injury = { type: "Surmenage (burnout)", weeks: LM.U.rint(rng, 2, 5) };
        p.morale = LM.U.clamp(p.morale - 15, 10, 100);
        notifyInjury(G, team, p);
        return;
      }
      if (rng() < risk) {
        var weeks = LM.U.rint(rng, 1, 4);
        if (LM.hasTrait(p, "FRAGILE")) weeks = Math.min(6, weeks + 1);
        p.injury = { type: LM.U.pick(rng, INJURIES), weeks: weeks };
        notifyInjury(G, team, p);
      }
    });
  };

  function notifyInjury(G, team, p) {
    if (team.id !== G.teamId) return;
    LM.addNews(G, "🩹 Blessure : " + p.name,
      p.name + " (" + LM.ROLE_FR[p.role] + ") est indisponible ~" + p.injury.weeks +
      " semaine(s) — " + p.injury.type + ". Prévoyez un remplaçant.");
  }

  // Décrémente les blessures (1 tour ≈ 1 semaine).
  Club.tickInjuries = function (G) {
    Object.keys(G.teams).forEach(function (tid) {
      var team = G.teams[tid];
      team.roster.forEach(function (p) {
        if (!p.injury) return;
        p.injury.weeks--;
        if (p.injury.weeks <= 0) {
          p.injury = null;
          p.condition = LM.U.clamp(p.condition, 60, 100);
          if (tid === G.teamId) LM.addNews(G, "✅ Retour de blessure : " + p.name, p.name + " est de nouveau disponible.");
        }
      });
    });
  };

  // -------- Mentorat --------
  Club.setMentorship = function (G, mentorId, menteeId) {
    var my = LM.myTeam(G);
    if (mentorId === menteeId) return { ok: false, msg: "Choisissez deux joueurs différents." };
    my.mentorships = my.mentorships.filter(function (m) { return m.menteeId !== menteeId; });
    my.mentorships.push({ mentorId: mentorId, menteeId: menteeId });
    var me = my.roster.find(function (p) { return p.id === mentorId; });
    var yo = my.roster.find(function (p) { return p.id === menteeId; });
    return { ok: true, msg: (me ? me.name : "?") + " encadre désormais " + (yo ? yo.name : "?") + "." };
  };
  Club.clearMentorship = function (G, menteeId) {
    var my = LM.myTeam(G);
    my.mentorships = my.mentorships.filter(function (m) { return m.menteeId !== menteeId; });
  };

  // Progression passive via mentorat (appelée chaque tour).
  Club.applyMentorship = function (G) {
    var my = LM.myTeam(G);
    if (!my.mentorships) return;
    my.mentorships.forEach(function (m) {
      var mentor = my.roster.find(function (p) { return p.id === m.mentorId; });
      var mentee = my.roster.find(function (p) { return p.id === m.menteeId; });
      if (!mentor || !mentee) return;
      if (mentee.ovr >= mentee.potential) return;
      var power = LM.hasTrait(mentor, "MENTOR") ? 1.0 : 0.45;
      if (LM.hasTrait(mentee, "PRODIGY")) power *= 1.5;
      if (Math.random() < power * 0.5) {
        var keys = Object.keys(mentee.attrs);
        var k = keys[Math.floor(Math.random() * keys.length)];
        mentee.attrs[k] = LM.U.clamp(mentee.attrs[k] + 1, 30, 99);
        mentee.ovr = LM.computeOVR(mentee);
        mentee.value = LM.playerValue(mentee);
      }
    });
  };

  // -------- Travail sur les traits (psychologue) --------
  Club.workOnTrait = function (G, playerId) {
    var my = LM.myTeam(G);
    var p = my.roster.find(function (x) { return x.id === playerId; });
    if (!p) return { ok: false, msg: "Joueur introuvable." };
    if (G.trainingUsed[playerId]) return { ok: false, msg: p.name + " est déjà occupé ce tour-ci." };
    G.trainingUsed[playerId] = true;
    var rng = LM.RNG((parseInt(p.id, 36) ^ G.date.day) >>> 0);
    var chance = 0.2 + (my.staff ? my.staff.psychologist : 5) * 0.05;
    var neg = (p.traits || []).filter(function (k) { return LM.TRAITS[k].type === "neg"; });
    if (neg.length && rng() < chance) {
      var rem = LM.U.pick(rng, neg);
      p.traits = p.traits.filter(function (k) { return k !== rem; });
      return { ok: true, msg: p.name + " s'est débarrassé du trait « " + LM.TRAITS[rem].name + " » !" };
    }
    // Sinon, petit boost de moral.
    p.morale = LM.U.clamp(p.morale + 6, 0, 100);
    return { ok: true, msg: p.name + " : séance avec le psychologue (+moral). Pas de changement de trait cette fois." };
  };

  // -------- Génération de jeunes talents --------
  Club.genProspect = function (rng, role, quality, known) {
    var age = LM.U.rint(rng, 15, 18);
    var name = LM.U.pick(rng, PNAMES) + LM.U.rint(rng, 1, 99);
    var def = { name: name, role: role, nat: "🌍", age: age };
    var p = LM.makePlayer(rng, def, quality);
    // Fort potentiel caché, niveau actuel faible (c'est un jeune).
    p.potential = LM.U.clamp(p.ovr + LM.U.rint(rng, 6, 24), p.ovr, 99);
    p.potentialKnown = !!known;
    p.potentialEst = known ? p.potential : null;
    p.contract = 0; p.teamId = null;
    return p;
  };

  Club.refreshScoutPool = function (G, rng) {
    if (!G.scoutPool) G.scoutPool = [];
    for (var i = 0; i < 10; i++) {
      var role = LM.ROLES[LM.U.rint(rng, 0, 4)];
      G.scoutPool.push(Club.genProspect(rng, role, LM.U.rint(rng, 52, 70), false));
    }
    G.scoutPool = G.scoutPool.slice(-24);
  };

  Club.scout = function (G, id) {
    var my = LM.myTeam(G);
    var p = (G.scoutPool || []).find(function (x) { return x.id === id; });
    if (!p) return { ok: false, msg: "Prospect introuvable." };
    if (p.potentialKnown) return { ok: false, msg: "Déjà scouté." };
    var cost = 40000;
    if (my.budget < cost) return { ok: false, msg: "Budget insuffisant (" + LM.U.money(cost) + ")." };
    my.budget -= cost;
    p.potentialKnown = true; p.potentialEst = p.potential;
    return { ok: true, msg: p.name + " scouté : potentiel " + p.potential + ", traits révélés." };
  };

  Club.signProspect = function (G, id) {
    var my = LM.myTeam(G);
    var p = (G.scoutPool || []).find(function (x) { return x.id === id; });
    if (!p) return { ok: false, msg: "Prospect introuvable." };
    var fee = Math.round(p.value * 0.5) + 30000;
    if (my.budget < fee) return { ok: false, msg: "Budget insuffisant (" + LM.U.money(fee) + ")." };
    my.budget -= fee;
    G.scoutPool = G.scoutPool.filter(function (x) { return x.id !== id; });
    p.teamId = my.id; p.contract = 3;
    my.roster.push(p);
    LM.addNews(G, "Signature jeune : " + p.name, my.name + " engage le talent " + p.name + " (" + LM.ROLE_FR[p.role] + ").");
    return { ok: true, msg: p.name + " rejoint l'effectif !" };
  };

  // Recrutement annuel via l'académie.
  Club.academyIntake = function (G, rng) {
    var my = LM.myTeam(G);
    var n = 1 + Math.floor(my.academy.level / 4);
    for (var i = 0; i < n; i++) {
      var role = LM.ROLES[LM.U.rint(rng, 0, 4)];
      var q = 48 + my.academy.level * 2 + LM.U.rint(rng, 0, 8);
      var p = Club.genProspect(rng, role, q, true); // l'académie connaît ses jeunes
      my.academy.prospects.push(p);
    }
    if (n > 0) LM.addNews(G, "Académie : nouveaux jeunes",
      n + " jeune(s) viennent d'intégrer le centre de formation. Promouvez-les si vous y croyez.");
  };

  Club.promote = function (G, id) {
    var my = LM.myTeam(G);
    var p = my.academy.prospects.find(function (x) { return x.id === id; });
    if (!p) return { ok: false, msg: "Introuvable." };
    my.academy.prospects = my.academy.prospects.filter(function (x) { return x.id !== id; });
    p.teamId = my.id; p.contract = 3;
    my.roster.push(p);
    LM.addNews(G, "Promotion : " + p.name, p.name + " passe pro et rejoint l'effectif principal !");
    return { ok: true, msg: p.name + " promu en équipe première !" };
  };

  Club.releaseProspect = function (G, id) {
    var my = LM.myTeam(G);
    my.academy.prospects = my.academy.prospects.filter(function (x) { return x.id !== id; });
    return { ok: true, msg: "Jeune libéré." };
  };

  LM.Club = Club;
})(window.LM = window.LM || {});
