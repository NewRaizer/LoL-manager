/* =============================================================
 * Legends Manager — Entraînement & infrastructures
 * ============================================================= */
(function (LM) {
  var Tr = {};

  Tr.ATTRS = {
    mechanics: "Mécanique", laning: "Phase de lane", teamfight: "Combats d'équipe",
    vision: "Vision / Macro", shotcalling: "Leadership", consistency: "Régularité"
  };

  Tr.DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  Tr.DRILLS = {
    REST: {
      name: "Repos complet", kind: "recup", load: 0, recovery: 13, morale: 2, form: 0,
      desc: "Récupération, prévention des blessures et reset mental."
    },
    ACTIVE: {
      name: "Repos actif", kind: "recup", load: 1, recovery: 7, morale: 2, form: 1,
      attrs: ["consistency"], desc: "Routine légère, sommeil, étirements et soloQ limitée."
    },
    VOD: {
      name: "Review VOD", kind: "analyse", load: 1, recovery: 2, morale: 1, form: 0,
      attrs: ["vision", "shotcalling", "consistency"], desc: "Macro, erreurs de draft et plans de jeu."
    },
    SOLOQ: {
      name: "SoloQ ciblée", kind: "indiv", load: 2, recovery: 0, morale: 0, form: 1,
      attrs: ["mechanics", "laning"], desc: "Mécanique individuelle et automatisme de lane."
    },
    SCRIM: {
      name: "Bloc scrims", kind: "team", load: 3, recovery: -1, morale: 1, form: 1,
      attrs: ["laning", "teamfight", "vision"], chemistry: 1, desc: "Séries d'entraînement contre d'autres équipes."
    },
    TEAMFIGHT: {
      name: "Teamfight lab", kind: "team", load: 2, recovery: 0, morale: 1, form: 1,
      attrs: ["teamfight", "shotcalling"], chemistry: 2, desc: "Setups objectifs, engages et calls en combat."
    },
    CHAMP_POOL: {
      name: "Champion pool", kind: "meta", load: 2, recovery: 0, morale: 0, form: 0,
      mastery: 6, desc: "Travail des picks forts du patch et champions mal maîtrisés."
    },
    BOOTCAMP: {
      name: "Bootcamp intensif", kind: "rush", load: 4, recovery: -3, morale: -1, form: 2,
      attrs: ["mechanics", "teamfight", "consistency"], mastery: 4, chemistry: 1,
      desc: "Gros volume. Efficace mais dangereux si l'équipe est fatiguée."
    }
  };

  Tr.defaultPlan = function () {
    return [
      { drill: "VOD", intensity: 2 },
      { drill: "SCRIM", intensity: 2 },
      { drill: "SOLOQ", intensity: 2 },
      { drill: "ACTIVE", intensity: 1 },
      { drill: "TEAMFIGHT", intensity: 2 },
      { drill: "CHAMP_POOL", intensity: 2 },
      { drill: "REST", intensity: 1 }
    ];
  };

  Tr.ensurePlan = function (G) {
    var my = LM.myTeam(G);
    if (!my.trainingPlan || my.trainingPlan.length !== 7) my.trainingPlan = Tr.defaultPlan();
    my.trainingPlan = my.trainingPlan.map(function (d) {
      var drill = d && Tr.DRILLS[d.drill] ? d.drill : "REST";
      return { drill: drill, intensity: LM.U.clamp(+(d.intensity || 1), 1, 3) };
    });
    if (!my.trainingReport) my.trainingReport = null;
    return my.trainingPlan;
  };

  Tr.setPlanDay = function (G, day, drill, intensity) {
    var plan = Tr.ensurePlan(G);
    day = LM.U.clamp(+day || 0, 0, 6);
    if (drill && !Tr.DRILLS[drill]) return { ok: false, msg: "Format inconnu." };
    if (drill) plan[day].drill = drill;
    if (intensity) plan[day].intensity = LM.U.clamp(+intensity, 1, 3);
    return { ok: true, msg: Tr.DAYS[day] + " : " + Tr.DRILLS[plan[day].drill].name + "." };
  };

  Tr.applyPreset = function (G, key) {
    var presets = {
      balanced: Tr.defaultPlan(),
      recovery: [
        { drill: "REST", intensity: 1 }, { drill: "ACTIVE", intensity: 1 }, { drill: "VOD", intensity: 1 },
        { drill: "REST", intensity: 1 }, { drill: "ACTIVE", intensity: 1 }, { drill: "VOD", intensity: 1 },
        { drill: "REST", intensity: 1 }
      ],
      match: [
        { drill: "VOD", intensity: 2 }, { drill: "SCRIM", intensity: 2 }, { drill: "TEAMFIGHT", intensity: 2 },
        { drill: "CHAMP_POOL", intensity: 2 }, { drill: "VOD", intensity: 1 }, { drill: "ACTIVE", intensity: 1 },
        { drill: "REST", intensity: 1 }
      ],
      bootcamp: [
        { drill: "BOOTCAMP", intensity: 3 }, { drill: "SCRIM", intensity: 3 }, { drill: "CHAMP_POOL", intensity: 3 },
        { drill: "ACTIVE", intensity: 1 }, { drill: "BOOTCAMP", intensity: 2 }, { drill: "TEAMFIGHT", intensity: 2 },
        { drill: "REST", intensity: 1 }
      ]
    };
    if (!presets[key]) return { ok: false, msg: "Modèle inconnu." };
    LM.myTeam(G).trainingPlan = presets[key].map(function (d) { return { drill: d.drill, intensity: d.intensity }; });
    return { ok: true, msg: "Planning appliqué." };
  };

  Tr.planSummary = function (G) {
    var my = LM.myTeam(G), plan = Tr.ensurePlan(G);
    var load = 0, recovery = 0, restDays = 0;
    plan.forEach(function (d) {
      var drill = Tr.DRILLS[d.drill];
      load += drill.load * d.intensity;
      recovery += Math.max(0, drill.recovery);
      if (drill.kind === "recup") restDays++;
    });
    var avgCond = avg(my.roster, "condition");
    var avgMorale = avg(my.roster, "morale");
    var projected = LM.U.clamp(Math.round(avgCond + recovery - load * 1.9 + ((my.staff ? my.staff.medic : 5) - 5) * 0.8), 0, 100);
    var risk = load >= 42 || projected < 45 ? "Élevé" : (load >= 30 || projected < 60 ? "Surveillé" : "Maîtrisé");
    return { load: Math.round(load), recovery: Math.round(recovery), restDays: restDays,
      avgCond: Math.round(avgCond), avgMorale: Math.round(avgMorale), projected: projected, risk: risk };
  };

  Tr.dayDate = function (G, offset) {
    var d = { year: G.date.year, month: G.date.month, day: G.date.day + offset };
    while (d.day > 28) { d.day -= 28; d.month++; }
    while (d.month > 12) { d.month -= 12; d.year++; }
    return d;
  };

  Tr.applyWeeklyPlan = function (G) {
    var my = LM.myTeam(G), plan = Tr.ensurePlan(G);
    var rng = LM.RNG((G.seed ^ G.date.year ^ (G.date.month * 37) ^ (G.date.day * 97) ^ (G.patchNote || 0)) >>> 0);
    var report = { date: Object.assign({}, G.date), load: 0, progress: 0, mastery: 0, injuries: 0, morale: 0, days: [] };
    plan.forEach(function (day, idx) {
      var drill = Tr.DRILLS[day.drill] || Tr.DRILLS.REST;
      var res = applyDay(G, my, drill, day.intensity, rng);
      report.load += res.load; report.progress += res.progress; report.mastery += res.mastery;
      report.injuries += res.injuries; report.morale += res.morale;
      report.days.push({ day: idx, drill: day.drill, intensity: day.intensity, summary: res.summary });
    });
    report.load = Math.round(report.load);
    report.morale = Math.round(report.morale);
    my.trainingReport = report;
    if (report.progress || report.mastery || report.injuries) {
      LM.addNews(G, "Bilan entraînement hebdo",
        report.progress + " progression(s) attribut · " + report.mastery + " gain(s) maîtrise · charge " +
        report.load + (report.injuries ? " · " + report.injuries + " blessure(s)" : "") + ".", "vestiaire");
    }
    return report;
  };

  function applyDay(G, team, drill, intensity, rng) {
    var load = drill.load * intensity;
    var rec = drill.recovery + (team.staff ? (team.staff.medic - 5) * 0.35 : 0);
    var progress = 0, mastery = 0, injuries = 0, morale = 0;
    team.roster.forEach(function (p) {
      if (p.injury) return;
      var beforeMorale = p.morale;
      p.condition = LM.U.clamp(p.condition + rec - load * 2.2, 0, 100);
      p.morale = LM.U.clamp(p.morale + drill.morale - (load >= 9 && p.condition < 55 ? 2 : 0), 0, 100);
      p.form = Math.round(LM.U.clamp(p.form + drill.form - (p.condition < 35 ? 1 : 0), -5, 5));
      morale += p.morale - beforeMorale;
      if (drill.attrs) progress += trainAttrsFromDay(G, team, p, drill, intensity, rng);
      if (drill.mastery) mastery += trainMetaChampion(G, p, drill.mastery * intensity, rng);
      if (rollTrainingInjury(G, team, p, load, rng)) injuries++;
      p.ovr = LM.computeOVR(p);
      p.value = LM.playerValue(p);
    });
    if (drill.chemistry && team.relationships) {
      team.relationships.forEach(function (r) { r.score = LM.U.clamp(r.score + drill.chemistry * intensity - (load >= 10 ? 1 : 0), 0, 100); });
    }
    return { load: load, progress: progress, mastery: mastery, injuries: injuries, morale: morale,
      summary: drill.name + " · charge " + load };
  }

  function trainAttrsFromDay(G, team, p, drill, intensity, rng) {
    var gained = 0;
    var youth = LM.U.clamp(26 - p.age, 0, 8);
    var chance = (0.06 + team.facilities * 0.012 + (team.staff ? team.staff.coach * 0.008 : 0) + youth * 0.006) * intensity;
    if (LM.hasTrait(p, "PRODIGY")) chance += 0.06;
    if (LM.hasTrait(p, "WORKHORSE")) chance += 0.04;
    if (LM.hasTrait(p, "LAZY")) chance -= 0.05;
    if (p.condition < 35) chance *= 0.45;
    drill.attrs.forEach(function (attr) {
      if (p.attrs[attr] >= 99) return;
      if (rng() < chance) { p.attrs[attr] = LM.U.clamp(p.attrs[attr] + 1, 30, 99); gained++; }
    });
    return gained;
  }

  function trainMetaChampion(G, p, gain, rng) {
    var c = bestTrainingChampion(G, p);
    if (!c) return 0;
    if (!p.mastery) p.mastery = {};
    var cur = p.mastery[c] != null ? p.mastery[c] : 18;
    var realGain = gain * (cur > 82 ? 0.35 : (cur > 65 ? 0.65 : 1));
    p.mastery[c] = LM.U.clamp(cur + realGain, 0, 99);
    if (p.mastery[c] >= 55 && p.champs.indexOf(c) < 0) p.champs.push(c);
    return realGain >= 1 ? 1 : 0;
  }

  function bestTrainingChampion(G, p) {
    var pool = (LM.CHAMPIONS_BY_ROLE[p.role] || []).slice();
    if (!pool.length) return null;
    pool.sort(function (a, b) {
      var sa = LM.Meta.tier(G, a) * 12 - LM.Meta.masteryOf(p, a);
      var sb = LM.Meta.tier(G, b) * 12 - LM.Meta.masteryOf(p, b);
      return sb - sa;
    });
    return pool[0];
  }

  function rollTrainingInjury(G, team, p, load, rng) {
    if (load < 8 || p.condition > 48) return false;
    var risk = (load - 7) * 0.018 + Math.max(0, 42 - p.condition) * 0.004;
    risk *= LM.Club ? LM.Club.medicFactor(team) : 1;
    if (LM.hasTrait(p, "FRAGILE")) risk *= 1.5;
    if (LM.hasTrait(p, "WORKHORSE")) risk *= 0.55;
    if (rng() >= risk) return false;
    p.injury = { type: "Surmenage à l'entraînement", weeks: LM.U.rint(rng, 1, 3) };
    if (team.id === G.teamId) LM.addNews(G, "🩹 Entraînement : " + p.name,
      p.name + " se blesse pendant la semaine de préparation (" + p.injury.weeks + " sem.).", "vestiaire");
    return true;
  }

  function avg(players, key) {
    if (!players.length) return 0;
    return players.reduce(function (s, p) { return s + (p[key] || 0); }, 0) / players.length;
  }

  // Entraîne un joueur sur un attribut (1 fois par tour).
  Tr.train = function (G, playerId, attr) {
    var my = LM.myTeam(G);
    var p = my.roster.find(function (x) { return x.id === playerId; });
    if (!p) return { ok: false, msg: "Joueur introuvable." };
    if (G.trainingUsed[playerId]) return { ok: false, msg: p.name + " s'est déjà entraîné ce tour-ci." };
    if (!Tr.ATTRS[attr]) return { ok: false, msg: "Attribut inconnu." };
    if (p.injury) return { ok: false, msg: p.name + " est blessé (" + p.injury.type + ")." };
    if (p.condition < 25) return { ok: false, msg: p.name + " est trop fatigué pour s'entraîner." };

    var rng = LM.RNG((parseInt(p.id, 36) ^ G.date.day ^ G.date.month) >>> 0);
    var intensity = my.intensity || 2;
    // Gain : infrastructures + coach + jeunesse + traits.
    var youth = LM.U.clamp(26 - p.age, 0, 8);
    var head = Math.max(0, p.potential - p.ovr);
    var gain = 0;
    var chance = (0.30 + my.facilities * 0.05 + youth * 0.03 + (head > 0 ? 0.15 : 0)) * LM.Club.coachMult(my);
    chance += (intensity - 2) * 0.08;
    if (LM.hasTrait(p, "PRODIGY")) chance += 0.15;
    if (LM.hasTrait(p, "WORKHORSE")) chance += 0.10;
    if (LM.hasTrait(p, "LAZY")) chance -= 0.15;
    if (rng() < chance && p.attrs[attr] < 99 && head >= 0) {
      gain = 1 + ((rng() < (LM.hasTrait(p, "PRODIGY") ? 0.35 : 0.18)) ? 1 : 0);
      p.attrs[attr] = LM.U.clamp(p.attrs[attr] + gain, 30, 99);
    }
    p.condition = LM.U.clamp(p.condition - (4 + intensity * 1.5), 0, 100);
    p.morale = LM.U.clamp(p.morale + 1, 0, 100);
    var oldOvr = p.ovr;
    p.ovr = LM.computeOVR(p);
    p.value = LM.playerValue(p);
    G.trainingUsed[playerId] = true;
    if (gain > 0) {
      var msg = p.name + " : " + Tr.ATTRS[attr] + " +" + gain;
      if (p.ovr > oldOvr) msg += " (OVR " + oldOvr + " → " + p.ovr + ")";
      return { ok: true, msg: msg, gain: gain };
    }
    return { ok: true, msg: p.name + " s'est entraîné mais n'a pas progressé cette fois.", gain: 0 };
  };

  // Entraîne un joueur sur un CHAMPION précis (monte sa maîtrise).
  Tr.trainChampion = function (G, playerId, champ) {
    var my = LM.myTeam(G);
    var p = my.roster.find(function (x) { return x.id === playerId; });
    if (!p) return { ok: false, msg: "Joueur introuvable." };
    if (G.trainingUsed[playerId]) return { ok: false, msg: p.name + " s'est déjà entraîné ce tour-ci." };
    if (!champ || (LM.CHAMPIONS_BY_ROLE[p.role] || []).indexOf(champ) < 0)
      return { ok: false, msg: "Champion non jouable à ce poste." };
    if (!p.mastery) p.mastery = {};
    var cur = p.mastery[champ] != null ? p.mastery[champ] : 12;
    var youth = LM.U.clamp(26 - p.age, 0, 8);
    var gain = 4 + my.facilities * 0.6 + youth * 0.3;
    if (cur > 80) gain *= 0.4;
    p.mastery[champ] = LM.U.clamp(cur + gain, 0, 99);
    // Au-delà de 55 de maîtrise, le champion entre dans le pool favori.
    if (p.mastery[champ] >= 55 && p.champs.indexOf(champ) < 0) p.champs.push(champ);
    p.condition = LM.U.clamp(p.condition - 6, 0, 100);
    G.trainingUsed[playerId] = true;
    return { ok: true, msg: p.name + " : maîtrise " + champ + " → " + Math.round(p.mastery[champ]) + "/99" };
  };

  // Améliore les infrastructures du club (coût croissant).
  Tr.upgradeFacilities = function (G) {
    var my = LM.myTeam(G);
    if (my.facilities >= 10) return { ok: false, msg: "Infrastructures déjà au maximum." };
    var cost = my.facilities * 250000;
    if (my.budget < cost) return { ok: false, msg: "Budget insuffisant (" + LM.U.money(cost) + " requis)." };
    my.budget -= cost; my.facilities++;
    LM.addNews(G, "Infrastructures améliorées",
      "Le centre d'entraînement passe au niveau " + my.facilities + "/10.");
    return { ok: true, msg: "Infrastructures niveau " + my.facilities + "/10 !" };
  };

  LM.Training = Tr;
})(window.LM = window.LM || {});
