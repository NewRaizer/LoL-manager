/* =============================================================
 * Legends Manager - Vie du club
 * Evenements, reputation, fans, tactiques, succes et relations.
 * ============================================================= */
(function (LM) {
  var Story = {};

  Story.STYLES = {
    BALANCED: { name: "Equilibre", desc: "Plan stable, peu de risques, bonus leger si la compo est saine." },
    EARLY: { name: "Early game", desc: "Priorite aux picks agressifs et aux escarmouches." },
    TEAMFIGHT: { name: "Teamfight", desc: "Frontline, controle et combats groupes." },
    SCALING: { name: "Scaling", desc: "Confiance aux carries, patience et late game." },
    SPLIT: { name: "Splitpush", desc: "Pression de sidelane et duels forts." }
  };
  Story.FOCUS = {
    META: { name: "Meta", desc: "Les recommandations favorisent les champions S/A." },
    COMFORT: { name: "Confort", desc: "Priorite aux champions deja maitrises." },
    COUNTER: { name: "Counter", desc: "Cherche davantage le contre-pick adverse." }
  };

  var ACH = {
    FIRST_WIN: ["Premiere victoire", "Votre premiere serie gagnee installe votre credibilite."],
    CLEAN_SERIES: ["Net et sans bavure", "Remporter une serie sans conceder de game."],
    UPSET: ["Upset", "Battre une equipe plus forte sur le papier."],
    DRAFT_GAP: ["Draft kingdom", "Gagner avec un gros avantage de draft."],
    STREAK3: ["Sur une lancee", "Enchainer trois victoires."],
    INTL_WIN: ["Respect international", "Gagner une serie sur une scene internationale."],
    TROPHY: ["Armoire ouverte", "Remporter un titre."]
  };

  Story.ensure = function (G) {
    if (!G.story) G.story = {};
    var s = G.story;
    if (s.reputation == null) s.reputation = 48;
    if (s.fanbase == null) s.fanbase = 22;
    if (s.sponsorLevel == null) s.sponsorLevel = 1;
    if (s.hype == null) s.hype = 0;
    if (s.streak == null) s.streak = 0;
    if (!s.pendingEvents) s.pendingEvents = [];
    if (!s.resolvedEvents) s.resolvedEvents = [];
    if (!s.rumors) s.rumors = [];
    if (!s.achievements) s.achievements = [];
    if (!G.tactics) G.tactics = { style: "BALANCED", focus: "META" };
    if (!Story.STYLES[G.tactics.style]) G.tactics.style = "BALANCED";
    if (!Story.FOCUS[G.tactics.focus]) G.tactics.focus = "META";
    var my = LM.myTeam(G);
    if (my) ensureRelations(my);
    Object.keys(G.teams || {}).forEach(function (tid) {
      (G.teams[tid].roster || []).forEach(fixStats);
    });
    (G.freeAgents || []).forEach(fixStats);
  };

  Story.init = function (G) {
    Story.ensure(G);
    Story.addFeed(G, "Dossier manager ouvert",
      "Votre reputation, la fanbase et les sponsors evolueront selon vos resultats, vos choix publics et l'ambiance du vestiaire.",
      "carriere");
  };

  function fixStats(p) {
    if (!p.stats) p.stats = {};
    ["games", "wins", "kills", "deaths", "assists", "mvp"].forEach(function (k) {
      if (p.stats[k] == null) p.stats[k] = 0;
    });
  }

  function ensureRelations(team) {
    if (team.relationships && team.relationships.length) return;
    var line = {};
    LM.ROLES.forEach(function (r) {
      var c = team.roster.filter(function (p) { return p.role === r; }).sort(function (a, b) { return b.ovr - a.ovr; })[0];
      if (c) line[r] = c;
    });
    team.relationships = [];
    addRelation(team, line.MID, line.JNG, "Duo mid-jungle", 56);
    addRelation(team, line.ADC, line.SUP, "Botlane", 58);
    addRelation(team, line.TOP, line.JNG, "Weakside / ganks", 52);
    addRelation(team, line.MID, line.ADC, "Leadership des carries", 50);
  }
  function addRelation(team, a, b, label, base) {
    if (!a || !b || a.id === b.id) return;
    team.relationships.push({ id: a.id + "_" + b.id, a: a.id, b: b.id, label: label, score: base });
  }

  Story.teamChemistry = function (team) {
    var rel = team.relationships || [];
    if (!rel.length) return 0;
    var avg = rel.reduce(function (s, r) { return s + r.score; }, 0) / rel.length;
    return LM.U.clamp((avg - 55) / 8, -3, 4);
  };

  Story.addFeed = function (G, title, body, tag) {
    LM.addNews(G, title, body, tag || "club");
  };

  Story.sponsorIncome = function (G) {
    Story.ensure(G);
    var s = G.story;
    return Math.round((s.sponsorLevel * 120000 + s.fanbase * 5000 + s.reputation * 3500) / 1000) * 1000;
  };

  Story.setTactic = function (G, key) {
    Story.ensure(G);
    if (!Story.STYLES[key]) return { ok: false, msg: "Plan tactique inconnu." };
    G.tactics.style = key;
    return { ok: true, msg: "Plan de match : " + Story.STYLES[key].name + "." };
  };
  Story.setFocus = function (G, key) {
    Story.ensure(G);
    if (!Story.FOCUS[key]) return { ok: false, msg: "Priorite de draft inconnue." };
    G.tactics.focus = key;
    return { ok: true, msg: "Priorite de draft : " + Story.FOCUS[key].name + "." };
  };

  Story.focusWeights = function (G, side) {
    Story.ensure(G);
    if (side !== "A") return { meta: 1, mastery: 1, counter: 1 };
    if (G.tactics.focus === "COMFORT") return { meta: .8, mastery: 1.45, counter: .9 };
    if (G.tactics.focus === "COUNTER") return { meta: .9, mastery: .9, counter: 1.55 };
    return { meta: 1.35, mastery: .9, counter: 1 };
  };

  Story.tacticBonus = function (G, team, types, roleDetail, comp) {
    Story.ensure(G);
    if (!team || team.id !== G.teamId) return 0;
    var style = G.tactics.style;
    var c = countTypes(types);
    var bonus = 0;
    if (style === "BALANCED") bonus = comp >= 2 ? 1.8 : -1.2;
    else if (style === "EARLY") bonus = (c.ASSASSIN + c.BRUISER) * 1.25 + c.TANK * .35 - c.ENCHANTER * .55;
    else if (style === "TEAMFIGHT") bonus = (c.TANK + c.MAGE + c.ENCHANTER) * 1.05 + c.MARKSMAN * .45;
    else if (style === "SCALING") bonus = (c.MARKSMAN + c.MAGE + c.ENCHANTER) * 1.05 - c.ASSASSIN * .35;
    else if (style === "SPLIT") bonus = (c.BRUISER + c.ASSASSIN) * 1.15 + topPower(roleDetail) * .03 - c.ENCHANTER * .45;
    return LM.U.clamp(bonus, -3.5, 5);
  };
  function countTypes(types) {
    var c = { TANK: 0, BRUISER: 0, ASSASSIN: 0, MAGE: 0, MARKSMAN: 0, ENCHANTER: 0 };
    types.forEach(function (t) { if (c[t] != null) c[t]++; });
    return c;
  }
  function topPower(detail) {
    var d = (detail || []).find(function (x) { return x.role === "TOP"; });
    return d ? d.power : 0;
  }

  Story.metaAlerts = function (G) {
    Story.ensure(G);
    var my = LM.myTeam(G), line = LM.Sim.lineup(my), alerts = [];
    LM.ROLES.forEach(function (r) {
      var p = line[r]; if (!p) return;
      var best = (LM.CHAMPIONS_BY_ROLE[r] || []).slice()
        .sort(function (a, b) { return LM.Meta.tier(G, b) - LM.Meta.tier(G, a); }).slice(0, 3);
      best.forEach(function (c) {
        var tier = LM.Meta.tier(G, c), mastery = Math.round(LM.Meta.masteryOf(p, c));
        if (tier >= 8 && mastery < 55) alerts.push({ role: r, player: p.name, champ: c, tier: tier, mastery: mastery });
      });
    });
    return alerts.slice(0, 5);
  };

  Story.onSplitStart = function (G, splitName) {
    Story.ensure(G);
    var alerts = Story.metaAlerts(G);
    if (alerts.length) {
      var a = alerts[0];
      pushEvent(G, {
        type: "META_BOOTCAMP",
        title: "Alerte meta : " + a.champ,
        body: a.champ + " est tres fort sur le patch, mais " + a.player + " ne le maitrise qu'a " + a.mastery + "/99.",
        subject: a
      });
    }
    Story.generateRumors(G, splitName);
  };

  Story.tick = function (G) {
    Story.ensure(G);
    if (G.story.pendingEvents.length) return;
    var rng = LM.RNG((G.seed ^ G.date.year ^ (G.date.month * 31) ^ (G.date.day * 7) ^ G.story.resolvedEvents.length) >>> 0);
    if (rng() > 0.48) return;
    var builders = [eventPlayerMood, eventSponsor, eventRivalry, eventAcademy];
    var ev = null, guard = 0;
    while (!ev && guard++ < 8) ev = LM.U.pick(rng, builders)(G, rng);
    if (ev) pushEvent(G, ev);
  };

  function pushEvent(G, ev) {
    Story.ensure(G);
    if (G.story.pendingEvents.length >= 2) return;
    ev.id = ev.id || LM.U.uid();
    ev.date = Object.assign({}, G.date);
    G.story.pendingEvents.unshift(ev);
    Story.addFeed(G, "Decision : " + ev.title, ev.body, "decision");
  }

  function eventPlayerMood(G, rng) {
    var my = LM.myTeam(G);
    var p = my.roster.slice().sort(function (a, b) {
      return (b.ambition - b.morale) - (a.ambition - a.morale);
    })[0];
    if (!p || p.morale > 72 || p.ambition < 55) return null;
    return {
      type: "PLAYER_MOOD", playerId: p.id,
      title: p.name + " veut un signal",
      body: p.name + " estime qu'il merite plus de consideration dans le projet sportif.",
      choices: [
        ["promise", "Promettre du temps de jeu", "Moral +, mais la pression monte."],
        ["firm", "Rester ferme", "La discipline prime, le joueur encaisse mal."],
        ["media", "Le mettre en avant", "Fans +, condition legerement -."]
      ]
    };
  }

  function eventSponsor(G, rng) {
    var my = LM.myTeam(G);
    return {
      type: "SPONSOR_DAY",
      title: "Activation sponsor",
      body: "Un partenaire propose une journee contenu avant le prochain match.",
      choices: [
        ["accept", "Accepter", "+" + LM.U.money(120000 + G.story.sponsorLevel * 40000) + ", fans +, condition -."],
        ["light", "Format court", "Petit bonus fans, fatigue minimale."],
        ["decline", "Refuser", "Preparation intacte, sponsor decu."]
      ]
    };
  }

  function eventRivalry(G, rng) {
    var ps = LM.Calendar.playerSeries(G);
    if (!ps) return null;
    var opp = G.teams[ps.homeId === G.teamId ? ps.awayId : ps.homeId];
    return {
      type: "RIVALRY", oppId: opp.id,
      title: "Rivalite contre " + opp.short,
      body: "La communaute chauffe le duel. Votre reponse peut galvaniser ou tendre le vestiaire.",
      choices: [
        ["spicy", "Trash talk controle", "Hype +, fans +, moral instable."],
        ["respect", "Respecter l'adversaire", "Moral +, hype neutre."],
        ["silent", "Silence radio", "Focus +, fans neutres."]
      ]
    };
  }

  function eventAcademy(G, rng) {
    var my = LM.myTeam(G);
    var p = (my.academy && my.academy.prospects || [])[0];
    if (!p) return null;
    return {
      type: "ACADEMY_SPOTLIGHT", playerId: p.id,
      title: "Scrim prometteur en academie",
      body: p.name + " a impressionne le staff pendant les scrims internes.",
      choices: [
        ["invest", "Investir du temps staff", "Cout modere, potentiel +."],
        ["promote_hype", "Faire monter la hype", "Fans +, pression sur le jeune."],
        ["wait", "Attendre", "Aucun risque, aucun effet immediat."]
      ]
    };
  }

  Story.resolveEvent = function (G, eventId, choiceId) {
    Story.ensure(G);
    var ev = G.story.pendingEvents.find(function (e) { return e.id === eventId; });
    if (!ev) return { ok: false, msg: "Decision expiree." };
    var msg = applyChoice(G, ev, choiceId);
    G.story.pendingEvents = G.story.pendingEvents.filter(function (e) { return e.id !== eventId; });
    G.story.resolvedEvents.unshift({ id: ev.id, type: ev.type, choice: choiceId, date: Object.assign({}, G.date) });
    if (G.story.resolvedEvents.length > 80) G.story.resolvedEvents.pop();
    return { ok: true, msg: msg };
  };

  function applyChoice(G, ev, choice) {
    var my = LM.myTeam(G), p, fee;
    if (ev.type === "PLAYER_MOOD") {
      p = my.roster.find(function (x) { return x.id === ev.playerId; });
      if (!p) return "Le dossier joueur n'est plus d'actualite.";
      if (choice === "promise") { p.morale = LM.U.clamp(p.morale + 13, 0, 100); p.form = Math.round(LM.U.clamp(p.form + 1, -5, 5)); G.story.hype += 2; return p.name + " se sent soutenu."; }
      if (choice === "media") { p.morale = LM.U.clamp(p.morale + 7, 0, 100); p.condition = LM.U.clamp(p.condition - 5, 0, 100); G.story.fanbase += 3; return p.name + " gagne en popularite."; }
      p.morale = LM.U.clamp(p.morale - 8, 0, 100); if (G.board) G.board.confidence = LM.U.clamp(G.board.confidence + 2, 0, 100); return "Message ferme envoye au vestiaire.";
    }
    if (ev.type === "SPONSOR_DAY") {
      fee = 120000 + G.story.sponsorLevel * 40000;
      if (choice === "accept") { my.budget += fee; G.story.fanbase += 4; my.roster.forEach(function (x) { x.condition = LM.U.clamp(x.condition - 4, 0, 100); }); return "Sponsor ravi : +" + LM.U.money(fee) + "."; }
      if (choice === "light") { my.budget += Math.round(fee * .45); G.story.fanbase += 1; return "Activation courte bouclee."; }
      G.story.sponsorLevel = Math.max(1, G.story.sponsorLevel - (G.story.sponsorLevel > 1 ? 1 : 0)); return "Preparation preservee.";
    }
    if (ev.type === "RIVALRY") {
      if (choice === "spicy") { G.story.hype += 4; G.story.fanbase += 3; my.roster.forEach(function (x) { x.morale = LM.U.clamp(x.morale + (LM.hasTrait(x, "HOTHEAD") ? 5 : -1), 0, 100); }); return "La rivalite explose sur les reseaux."; }
      if (choice === "respect") { my.roster.forEach(function (x) { x.morale = LM.U.clamp(x.morale + 2, 0, 100); }); return "Le vestiaire apprecie le ton pose."; }
      my.roster.forEach(function (x) { x.condition = LM.U.clamp(x.condition + 2, 0, 100); }); return "Focus total sur la preparation.";
    }
    if (ev.type === "ACADEMY_SPOTLIGHT") {
      p = (my.academy.prospects || []).find(function (x) { return x.id === ev.playerId; });
      if (!p) return "Le jeune n'est plus a l'academie.";
      if (choice === "invest") {
        fee = 70000;
        if (my.budget < fee) return "Budget trop court : le staff fait au mieux.";
        my.budget -= fee; p.potential = LM.U.clamp(p.potential + 1, p.ovr, 99); return p.name + " gagne en potentiel.";
      }
      if (choice === "promote_hype") { G.story.fanbase += 2; p.morale = LM.U.clamp(p.morale + 5, 0, 100); p.ambition = LM.U.clamp(p.ambition + 4, 0, 100); return p.name + " devient un nom a suivre."; }
      return "Le staff garde le dossier au chaud.";
    }
    if (ev.type === "META_BOOTCAMP") {
      var a = ev.subject || {};
      p = LM.Sim.lineup(my)[a.role];
      if (!p) return "Pas de joueur disponible pour ce poste.";
      if (choice === "bootcamp") {
        if (!p.mastery) p.mastery = {};
        p.mastery[a.champ] = LM.U.clamp((p.mastery[a.champ] || 20) + 18, 0, 99);
        p.condition = LM.U.clamp(p.condition - 8, 0, 100);
        return p.name + " travaille " + a.champ + " en bootcamp.";
      }
      if (choice === "comfort") { p.morale = LM.U.clamp(p.morale + 5, 0, 100); return "Vous assumez le confort du joueur."; }
      G.story.hype += 2; return "Pick surprise prepare en secret.";
    }
    return "Decision prise.";
  }

  Story.eventChoices = function (ev) {
    if (ev.type === "META_BOOTCAMP") return [
      ["bootcamp", "Bootcamp meta", "Maitrise +, condition -."],
      ["comfort", "Rester confort", "Moral +, pas de prise de risque."],
      ["pocket", "Preparer un pocket pick", "Hype +, effet indirect."]
    ];
    return ev.choices || [];
  };

  Story.generateRumors = function (G, context) {
    Story.ensure(G);
    var my = LM.myTeam(G);
    var rng = LM.RNG((G.seed ^ G.date.month ^ G.date.day ^ G.story.rumors.length) >>> 0);
    var market = [];
    Object.keys(G.teams).forEach(function (tid) {
      if (tid === my.id) return;
      (G.teams[tid].roster || []).forEach(function (p) {
        if (p.ovr >= 78 || p.potential >= 86 || LM.hasTrait(p, "AMBITIOUS")) market.push({ p: p, team: G.teams[tid] });
      });
    });
    if (!market.length) return;
    var e = LM.U.pick(rng, market);
    var heat = LM.U.rint(rng, 1, 5);
    var rumor = {
      id: LM.U.uid(), heat: heat, date: Object.assign({}, G.date),
      title: "Rumeur : " + e.p.name + " attire les regards",
      body: e.team.short + " pourrait ecouter les offres pour " + e.p.name + " (" + LM.ROLE_FR[e.p.role] + ", " + e.p.ovr + " OVR)."
    };
    G.story.rumors.unshift(rumor);
    G.story.rumors = G.story.rumors.slice(0, 10);
    if (heat >= 4) Story.addFeed(G, rumor.title, rumor.body, "mercato");
  };

  Story.transferRefusal = function (G, entry) {
    Story.ensure(G);
    if (!entry || entry.free) return null;
    var p = entry.p, my = LM.myTeam(G);
    var prestigeGap = p.ovr - (G.story.reputation + my.tier) / 2;
    if (prestigeGap > 18 && p.ambition > 70) {
      return p.name + " refuse d'ouvrir les discussions : le projet manque encore de prestige.";
    }
    return null;
  };

  Story.afterPlayerSeries = function (G, res) {
    Story.ensure(G);
    if (!res) return;
    var myId = G.teamId, won = res.winnerId === myId;
    var my = LM.myTeam(G), opp = G.teams[res.homeId === myId ? res.awayId : res.homeId];
    G.story.streak = won ? G.story.streak + 1 : 0;
    G.story.reputation = LM.U.clamp(G.story.reputation + (won ? 2 : -1), 0, 100);
    G.story.fanbase = LM.U.clamp(G.story.fanbase + (won ? 2 : 0) + Math.max(0, G.story.hype > 3 ? 1 : 0), 0, 100);
    if (won && G.story.streak >= 3) unlock(G, "STREAK3");
    if (won) unlock(G, "FIRST_WIN");
    if (won && Math.min(res.score[0], res.score[1]) === 0) unlock(G, "CLEAN_SERIES");
    if (won && LM.Sim.power(opp, 0) - LM.Sim.power(my, 0) >= 6) unlock(G, "UPSET");
    var g0 = res.games && res.games[0];
    if (won && g0 && g0.ratingH) {
      var myDraftPower = myId === res.homeId ? g0.ratingH.power : g0.ratingA.power;
      var opDraftPower = myId === res.homeId ? g0.ratingA.power : g0.ratingH.power;
      if (myDraftPower - opDraftPower >= 8) unlock(G, "DRAFT_GAP");
    }
    if (won && G.season && G.season.stage && G.season.stage.type === "intl") unlock(G, "INTL_WIN");
    adjustRelations(G, won);
    Story.addFeed(G, won ? "Fans en feu" : "Debat apres-match",
      won ? "La communaute salue la victoire contre " + opp.short + ". Reputation +" :
        "La defaite contre " + opp.short + " lance des discussions sur la draft et la forme du groupe.",
      "fans");
    G.story.hype = Math.max(0, G.story.hype - 1);
  };

  Story.afterTrophy = function (G) {
    Story.ensure(G);
    unlock(G, "TROPHY");
    G.story.reputation = LM.U.clamp(G.story.reputation + 5, 0, 100);
    G.story.fanbase = LM.U.clamp(G.story.fanbase + 6, 0, 100);
    G.story.sponsorLevel = LM.U.clamp(G.story.sponsorLevel + 1, 1, 5);
  };

  function adjustRelations(G, won) {
    var my = LM.myTeam(G);
    ensureRelations(my);
    (my.relationships || []).forEach(function (r) {
      var old = r.score;
      r.score = LM.U.clamp(r.score + (won ? 2 : -2), 0, 100);
      if (old < 75 && r.score >= 75) Story.addFeed(G, "Synergie : " + r.label, "Le duo fonctionne de mieux en mieux dans les moments importants.", "vestiaire");
      if (old > 32 && r.score <= 32) Story.addFeed(G, "Tension : " + r.label, "Le staff sent une friction a surveiller dans le vestiaire.", "vestiaire");
    });
  }

  function unlock(G, key) {
    if (!ACH[key] || G.story.achievements.some(function (a) { return a.key === key; })) return;
    var a = { key: key, title: ACH[key][0], body: ACH[key][1], date: Object.assign({}, G.date) };
    G.story.achievements.unshift(a);
    G.story.reputation = LM.U.clamp(G.story.reputation + 2, 0, 100);
    G.story.fanbase = LM.U.clamp(G.story.fanbase + 2, 0, 100);
    Story.addFeed(G, "Succes debloque : " + a.title, a.body, "succes");
  }

  LM.Story = Story;
})(window.LM = window.LM || {});
