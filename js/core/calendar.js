/* =============================================================
 * Legends Manager — Calendrier de saison
 * Enchaînement : Winter Split → First Stand → Spring Split → MSI
 *                → Summer Split → EWC → Worlds → intersaison
 * ============================================================= */
(function (LM) {
  var Cal = {};

  // Définition des étapes d'une saison.
  var STAGES = [
    { type: "split", key: "WINTER", name: "Winter Split" },
    { type: "intl", key: "FIRST_STAND", name: "First Stand", from: "WINTER", slots: 1 },
    { type: "split", key: "SPRING", name: "Spring Split" },
    { type: "intl", key: "MSI", name: "MSI", from: "SPRING", slots: 2 },
    { type: "split", key: "SUMMER", name: "Summer Split" },
    { type: "intl", key: "EWC", name: "Esports World Cup", from: "RANK", slots: 8 },
    { type: "intl", key: "WORLDS", name: "Worlds", from: "SUMMER", slots: 3 }
  ];
  Cal.STAGES = STAGES;

  // -------------------- Round robin (méthode du cercle) --------------------
  function roundRobin(ids) {
    var a = ids.slice();
    if (a.length % 2) a.push(null);
    var n = a.length, rounds = [];
    for (var r = 0; r < n - 1; r++) {
      var pairs = [];
      for (var i = 0; i < n / 2; i++) {
        var h = a[i], aw = a[n - 1 - i];
        if (h !== null && aw !== null) pairs.push(r % 2 ? [aw, h] : [h, aw]);
      }
      rounds.push(pairs);
      a.splice(1, 0, a.pop()); // rotation
    }
    return rounds;
  }

  // -------------------- Démarrage de saison --------------------
  Cal.startSeason = function (G) {
    G.season = { year: G.date.year, stageIdx: -1, splitResults: {}, ranking: {} };
    nextStage(G);
  };

  function nextStage(G) {
    var s = G.season;
    s.stageIdx++;
    if (s.stageIdx >= STAGES.length) { offseason(G); return; }
    var def = STAGES[s.stageIdx];
    if (def.type === "split") setupSplit(G, def);
    else setupIntl(G, def);
  }

  // -------------------- SPLIT --------------------
  function setupSplit(G, def) {
    var myLeague = LM.myTeam(G).league;
    var ids = LM.teamsByLeague(myLeague).map(function (t) { return t.id; });
    var rounds = roundRobin(ids);
    var standings = {};
    ids.forEach(function (id) { standings[id] = { id: id, w: 0, l: 0, gw: 0, gl: 0, pts: 0 }; });
    G.season.stage = {
      type: "split", key: def.key, name: def.name, league: myLeague,
      phase: "RS", rounds: rounds, roundIdx: 0,
      standings: standings, champion: null, runnerUp: null, third: null,
      bracket: null
    };
    // Nouveau patch à chaque split : la méta change, à vous d'adapter vos drafts.
    G.patchNote++;
    LM.Meta.repatch(G);
    LM.Board.setSplitObjective(G, def.name);
    LM.Transfers.generateBids(G);
    LM.addNews(G, def.name + " — c'est parti !",
      "Le " + def.name + " commence. " + rounds.length + " journées de saison régulière vous attendent. " +
      "Objectif de la direction : " + G.board.splitObjective.desc + ".");
  }

  // Série du joueur dans le tour courant (ou null s'il n'est pas concerné).
  Cal.playerSeries = function (G) {
    var st = G.season.stage;
    if (!st) return null;
    if (st.type === "split" && st.phase === "RS") {
      var round = st.rounds[st.roundIdx];
      var pair = round && round.find(function (p) { return p[0] === G.teamId || p[1] === G.teamId; });
      if (!pair) return null;
      return { homeId: pair[0], awayId: pair[1], bo: 3, label: "Journée " + (st.roundIdx + 1) };
    }
    // Phases à élimination (playoffs / international) : voir bracket.
    if (st.bracket) {
      var m = curBracketMatch(st.bracket, G.teamId);
      if (m) return { homeId: m.a, awayId: m.b, bo: m.bo, label: st.bracket.labels[st.bracket.roundIdx] };
    }
    return null;
  };

  // Description haut-niveau pour l'UI.
  Cal.describe = function (G) {
    var st = G.season.stage;
    if (!st) return { title: "Intersaison", sub: "" };
    if (st.type === "split") {
      if (st.phase === "RS")
        return { title: st.name + " — Saison régulière", sub: "Journée " + (st.roundIdx + 1) + " / " + st.rounds.length };
      return { title: st.name + " — Playoffs", sub: st.bracket ? st.bracket.labels[st.bracket.roundIdx] : "" };
    }
    return { title: st.name, sub: st.bracket ? st.bracket.labels[st.bracket.roundIdx] : "" };
  };

  // -------------------- Avancement d'un tour --------------------
  // playerRes : résultat de la série du joueur (objet Sim.series) ou null.
  Cal.advance = function (G, playerRes) {
    var st = G.season.stage;
    var log = [];
    if (st.type === "split" && st.phase === "RS") {
      advanceRSRound(G, st, playerRes, log);
      if (playerRes && LM.Story) LM.Story.afterPlayerSeries(G, playerRes);
    } else if (st.bracket) {
      advanceBracketRound(G, st.bracket, playerRes, log);
      if (playerRes && LM.Story) LM.Story.afterPlayerSeries(G, playerRes);
      if (st.bracket.done) finishBracket(G, st, log);
    }
    tickDay(G);
    return log;
  };

  function advanceRSRound(G, st, playerRes, log) {
    var round = st.rounds[st.roundIdx];
    round.forEach(function (pair) {
      var isPlayer = pair[0] === G.teamId || pair[1] === G.teamId;
      var res;
      if (isPlayer && playerRes) res = normalizeRes(playerRes, pair);
      else res = LM.Sim.series(G, pair[0], pair[1], 3);
      recordStanding(st.standings, res);
      log.push(seriesLog(G, res));
    });
    st.roundIdx++;
    if (st.roundIdx >= st.rounds.length) startSplitPlayoffs(G, st, log);
  }

  function normalizeRes(playerRes, pair) {
    // Le joueur a pu jouer à domicile/extérieur ; on garde tel quel.
    return playerRes;
  }

  function recordStanding(standings, res) {
    var w = standings[res.winnerId], l = standings[res.loserId];
    if (!w || !l) return;
    w.w++; l.l++; w.pts++;
    w.gw += Math.max(res.score[0], res.score[1]);
    w.gl += Math.min(res.score[0], res.score[1]);
    l.gw += Math.min(res.score[0], res.score[1]);
    l.gl += Math.max(res.score[0], res.score[1]);
  }

  Cal.sortedStandings = function (st) {
    return Object.keys(st.standings).map(function (k) { return st.standings[k]; })
      .sort(function (a, b) { return b.pts - a.pts || (b.gw - b.gl) - (a.gw - a.gl) || b.gw - a.gw; });
  };

  // -------------------- Playoffs du split --------------------
  function startSplitPlayoffs(G, st, log) {
    st.phase = "PO";
    var sorted = Cal.sortedStandings(st);
    var top4 = sorted.slice(0, 4).map(function (s) { return s.id; });
    LM.addNews(G, st.name + " — Playoffs",
      "Saison régulière terminée. Les 4 meilleures équipes s'affrontent : " +
      top4.map(function (id) { return G.teams[id].short; }).join(", ") + ".");
    st.bracket = makeBracket(top4, 5, "split");
  }

  // -------------------- Bracket générique (élimination) --------------------
  // seeds : ids triés par tête de série. bo : format. kind: "split"|"intl"
  function makeBracket(seeds, bo, kind) {
    var n = seeds.length;
    var size = 1; while (size < n) size *= 2;
    var slots = seeds.slice();
    while (slots.length < size) slots.push(null); // byes
    // Appariement tête de série : 1 vs N, 2 vs N-1, ...
    var first = [];
    for (var i = 0; i < size / 2; i++) {
      var a = slots[i], b = slots[size - 1 - i];
      first.push({ a: a, b: b, bo: bo, res: null, winner: byeWinner(a, b) });
    }
    var labels = bracketLabels(size, kind);
    var br = { rounds: [first], roundIdx: 0, labels: labels, bo: bo, kind: kind, done: false, third: null };
    autoResolveByes(br);
    return br;
  }

  function byeWinner(a, b) {
    if (a && !b) return a;
    if (b && !a) return b;
    return null;
  }
  function autoResolveByes(br) {
    var round = br.rounds[br.roundIdx];
    if (round.every(function (m) { return m.winner; })) buildNextRound(br);
  }

  function bracketLabels(size, kind) {
    var map = { 2: ["Finale"], 4: ["Demi-finales", "Finale"], 8: ["Quarts de finale", "Demi-finales", "Finale"],
      16: ["Huitièmes", "Quarts de finale", "Demi-finales", "Finale"] };
    return map[size] || ["Tour 1", "Tour 2", "Tour 3", "Finale"];
  }

  // Match courant du bracket impliquant teamId (ou null).
  function curBracketMatch(br, teamId) {
    var round = br.rounds[br.roundIdx];
    return round.find(function (m) { return !m.winner && (m.a === teamId || m.b === teamId); }) || null;
  }
  Cal.curBracketMatch = curBracketMatch;

  function advanceBracketRound(G, br, playerRes, log) {
    var round = br.rounds[br.roundIdx];
    round.forEach(function (m) {
      if (m.winner) return; // bye déjà résolu
      var isPlayer = m.a === G.teamId || m.b === G.teamId;
      var res;
      if (isPlayer && playerRes) res = playerRes;
      else res = LM.Sim.series(G, m.a, m.b, m.bo);
      m.res = res; m.winner = res.winnerId; m.loser = res.loserId;
      log.push(seriesLog(G, res));
    });
    buildNextRound(br);
  }

  function buildNextRound(br) {
    var round = br.rounds[br.roundIdx];
    if (round.some(function (m) { return !m.winner; })) return; // pas fini
    if (round.length === 1) {
      // Finale terminée
      var f = round[0];
      br.champion = f.winner; br.runnerUp = f.loser;
      br.done = true;
      return;
    }
    var next = [];
    for (var i = 0; i < round.length; i += 2) {
      next.push({ a: round[i].winner, b: round[i + 1].winner, bo: br.bo, res: null, winner: null });
    }
    // Petite finale (3e place) au tour des demies pour les internationaux Worlds.
    if (round.length === 2 && br.kind === "intl_third") {
      br.thirdMatch = { a: round[0].loser, b: round[1].loser, bo: br.bo, res: null, winner: null };
    }
    br.rounds.push(next);
    br.roundIdx++;
    autoResolveByes(br);
  }

  function finishBracket(G, st, log) {
    var br = st.bracket;
    if (st.type === "split") {
      st.champion = br.champion; st.runnerUp = br.runnerUp;
      // 3e place = perdant de demie le mieux classé (approché)
      st.third = bracketThird(br);
      G.season.splitResults[st.key] = { champion: st.champion, runnerUp: st.runnerUp, third: st.third, league: st.league };
      awardSplitTitle(G, st);
      LM.Board.evaluateSplit(G, st);
      nextStage(G);
    } else {
      finishIntl(G, st, log);
    }
  }

  function bracketThird(br) {
    if (br.rounds.length < 2) return null;
    var semis = br.rounds[br.rounds.length - 2];
    if (!semis || semis.length !== 2) return null;
    return semis[0].loser; // approximation
  }

  function awardSplitTitle(G, st) {
    var champ = G.teams[st.champion];
    champ.trophies.push({ title: st.name, year: G.season.year });
    var prize = 200000;
    champ.budget += prize;
    LM.addNews(G, "🏆 " + champ.name + " champion du " + st.name + " !",
      champ.name + " remporte le " + st.name + " " + G.season.year + " en battant " +
      G.teams[st.runnerUp].name + ". Prize money : " + LM.U.money(prize) + ".");
    if (st.champion === G.teamId)
      LM.addNews(G, "Félicitations !", "Votre équipe est championne du " + st.name + " ! 🎉");
    if (st.champion === G.teamId && LM.Story) LM.Story.afterTrophy(G);
  }

  // -------------------- INTERNATIONAL --------------------
  function setupIntl(G, def) {
    var qualified = qualifyTeams(G, def);
    // Tête de série par puissance d'équipe.
    qualified.sort(function (a, b) { return LM.Sim.power(G.teams[b], 0) - LM.Sim.power(G.teams[a], 0); });
    var kind = def.key === "WORLDS" ? "intl_third" : "intl";
    var bo = qualified.length > 4 ? 3 : 5;
    G.season.stage = {
      type: "intl", key: def.key, name: def.name,
      bracket: makeBracket(qualified, bo, kind),
      qualified: qualified
    };
    G.season.stage.bracket.finalBo = 5;
    LM.addNews(G, def.name + " — Qualifiés",
      def.name + " réunit " + qualified.length + " équipes : " +
      qualified.map(function (id) { return G.teams[id].short; }).join(", ") + ".");
    if (qualified.indexOf(G.teamId) >= 0) {
      LM.Board.noteIntlQualification(G);
      LM.addNews(G, "Vous êtes qualifié !", "Votre équipe participe au " + def.name + " ! 🌍");
    }
  }

  function qualifyTeams(G, def) {
    var teams = [];
    if (def.from === "RANK") {
      // EWC : meilleures équipes du moment, toutes ligues confondues.
      teams = LM.TEAMS.map(function (t) { return t.id; })
        .sort(function (a, b) { return LM.Sim.power(G.teams[b], 0) - LM.Sim.power(G.teams[a], 0); })
        .slice(0, def.slots);
      return teams;
    }
    var sr = G.season.splitResults[def.from];
    // Pour First Stand/MSI/Worlds : on prend les meilleurs de CHAQUE ligue.
    // Le joueur a simulé son split ; on génère des qualifiés plausibles pour les autres ligues.
    LM.LEAGUES.forEach(function (lg) {
      var leagueTeams = LM.teamsByLeague(lg.id).map(function (t) { return t.id; })
        .sort(function (a, b) { return LM.Sim.power(G.teams[b], 0) - LM.Sim.power(G.teams[a], 0); });
      if (sr && sr.league === lg.id) {
        // Ligue du joueur : qualifiés réels issus des playoffs.
        var picks = [sr.champion, sr.runnerUp, sr.third].filter(Boolean).slice(0, def.slots);
        picks.forEach(function (id) { if (teams.indexOf(id) < 0) teams.push(id); });
      } else {
        leagueTeams.slice(0, def.slots).forEach(function (id) { teams.push(id); });
      }
    });
    return teams;
  }

  function finishIntl(G, st, log) {
    var br = st.bracket;
    // Petite finale (3e place) résolue automatiquement.
    if (br.thirdMatch && !br.thirdMatch.winner) {
      var tr = LM.Sim.series(G, br.thirdMatch.a, br.thirdMatch.b, br.bo);
      br.thirdMatch.winner = tr.winnerId; br.third = tr.winnerId;
    }
    var champ = G.teams[br.champion];
    var prizes = { FIRST_STAND: 300000, MSI: 500000, EWC: 600000, WORLDS: 1500000 };
    var prize = prizes[st.key] || 300000;
    champ.budget += prize;
    champ.trophies.push({ title: st.name, year: G.season.year, major: true });
    LM.addNews(G, "🏆 " + champ.name + " remporte le " + st.name + " !",
      champ.name + " est sacré au " + st.name + " " + G.season.year + " face à " +
      G.teams[br.runnerUp].name + " ! Prize money : " + LM.U.money(prize) + ".");
    if (br.champion === G.teamId)
      LM.addNews(G, "TITRE INTERNATIONAL ! 🌍🏆", "Votre équipe gagne le " + st.name + " ! Un exploit historique.");
    if (br.champion === G.teamId && LM.Story) LM.Story.afterTrophy(G);
    nextStage(G);
  }

  // -------------------- Temps & intersaison --------------------
  function tickDay(G) {
    // Avance d'environ une semaine par tour.
    G.date.day += 7;
    while (G.date.day > 28) { G.date.day -= 28; G.date.month++; }
    while (G.date.month > 12) { G.date.month -= 12; G.date.year++; }
    // Récupération de condition entre les matchs (le médical accélère).
    Object.keys(G.teams).forEach(function (tid) {
      var team = G.teams[tid];
      var rec = 5 + (LM.Club ? (team.staff ? team.staff.medic : 5) - 5 : 0) * 0.6;
      var pm = (tid === G.teamId && LM.Club) ? LM.Club.psychoMorale(team) * 0.25 : 0;
      team.roster.forEach(function (p) {
        p.condition = LM.U.clamp(p.condition + rec, 0, 100);
        p.morale = LM.U.clamp(p.morale + 1 + pm, 0, 100);
      });
    });
    LM.Club.tickInjuries(G);
    LM.Club.applyMentorship(G);
    G.trainingUsed = {};
    if (LM.Story) LM.Story.tick(G);
  }

  function offseason(G) {
    var year = G.season.year;
    LM.Board.evaluateSeason(G);
    LM.addNews(G, "Intersaison " + year,
      "La saison " + year + " est terminée ! Bilan financier, vieillissement et fins de contrat.");
    Object.keys(G.teams).forEach(function (tid) {
      G.teams[tid].roster.forEach(function (p) { agePlayer(G, p); });
    });
    G.freeAgents.forEach(function (p) { agePlayer(G, p); });
    // Vieillissement des jeunes (académie + scouting).
    var my = LM.myTeam(G);
    (my.academy.prospects || []).forEach(function (p) { agePlayer(G, p); });
    (G.scoutPool || []).forEach(function (p) { agePlayer(G, p); });

    var rng = LM.RNG((G.seed ^ year) >>> 0);
    finances(G, my, year);
    contractExpiries(G, my);
    LM.Club.academyIntake(G, rng);
    LM.Club.refreshScoutPool(G, rng);
    // Nouveaux talents sur le marché + offres entrantes.
    G.freeAgents = G.freeAgents.concat(LM.genFreeAgents(rng)).slice(-40);

    G.history.push({ year: year, results: G.season.splitResults });
    G.date.year = year + 1; G.date.month = 1; G.date.day = 6;
    G.patchNote++;
    LM.Board.setSeasonObjective(G);
    LM.Calendar.startSeason(G);
  }

  // Bilan financier annuel : salaires versés + revenus sponsors.
  function finances(G, my, year) {
    var wages = my.roster.reduce(function (s, p) { return s + (p.salary || 0); }, 0);
    var storySponsor = LM.Story ? LM.Story.sponsorIncome(G) : 0;
    var sponsor = 1200000 + my.tier * 22000 + (G.board ? G.board.confidence * 8000 : 0) + storySponsor;
    my.budget = Math.max(0, my.budget - wages + sponsor);
    LM.addNews(G, "Bilan financier " + year,
      "Salaires versés : -" + LM.U.money(wages) + " · Revenus sponsors : +" + LM.U.money(sponsor) +
      ". Budget actuel : " + LM.U.money(my.budget) + ".");
  }

  // Fins de contrat : les joueurs non prolongés quittent le club.
  function contractExpiries(G, my) {
    var leaving = my.roster.filter(function (p) { return (p.contract || 0) <= 0; });
    leaving.forEach(function (p) {
      // Ne pas vider totalement un poste : on garde au moins un joueur par rôle.
      var sameRole = my.roster.filter(function (x) { return x.role === p.role; });
      if (sameRole.length <= 1) { p.contract = 1; return; } // prolongation d'office d'un an
      my.roster = my.roster.filter(function (x) { return x.id !== p.id; });
      p.teamId = null;
      G.freeAgents.unshift(p);
      LM.addNews(G, "Fin de contrat : " + p.name,
        p.name + " arrive en fin de contrat et quitte le club faute de prolongation.");
    });
  }

  function agePlayer(G, p) {
    p.age++;
    var rng = LM.RNG((parseInt(p.id, 36) ^ G.date.year) >>> 0);
    var dir;
    if (p.age <= 23 && p.ovr < p.potential) {
      dir = LM.U.rint(rng, 0, 3);                                             // progression
      if (LM.hasTrait(p, "PRODIGY")) dir += 1;
      if (LM.hasTrait(p, "WORKHORSE")) dir += 1;
      if (LM.hasTrait(p, "LAZY")) dir -= 1;
    } else if (p.age >= 28) dir = -LM.U.rint(rng, 0, 2);                       // déclin
    else dir = LM.U.rint(rng, -1, 1);
    for (var k in p.attrs) p.attrs[k] = LM.U.clamp(p.attrs[k] + dir + LM.U.rint(rng, -1, 1), 30, 99);
    p.ovr = LM.computeOVR(p);
    p.value = LM.playerValue(p);
    p.form = 0; p.morale = LM.U.clamp(p.morale, 50, 90); p.condition = 100;
    if (p.contract > 0) p.contract--;
  }

  Cal.curBracketMatch = curBracketMatch;
  Cal.seriesLogShort = function (G, res) { return seriesLog(G, res); };

  function seriesLog(G, res) {
    var ws = Math.max(res.score[0], res.score[1]);
    var ls = Math.min(res.score[0], res.score[1]);
    return {
      winnerId: res.winnerId, loserId: res.loserId, score: [ws, ls],
      text: G.teams[res.winnerId].short + " " + ws + "-" + ls + " " + G.teams[res.loserId].short
    };
  }

  LM.Calendar = Cal;
})(window.LM = window.LM || {});
