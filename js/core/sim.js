/* =============================================================
 * Legends Manager — Simulation de matchs (draft, parties, séries)
 * ============================================================= */
(function (LM) {
  var Sim = {};

  // Renvoie le 5 titulaire d'une équipe : meilleur joueur par rôle.
  Sim.lineup = function (team) {
    var line = {};
    LM.ROLES.forEach(function (r) {
      var cands = team.roster.filter(function (p) { return p.role === r; });
      cands.sort(function (a, b) { return b.ovr - a.ovr; });
      line[r] = cands[0] || null;
    });
    return line;
  };

  // Note effective d'un joueur sur un match (OVR + forme + moral + condition).
  Sim.effective = function (p) {
    if (!p) return 40;
    var f = p.form * 1.4;
    var m = (p.morale - 70) * 0.08;
    var c = (p.condition - 80) * 0.10;
    return p.ovr + f + m + c;
  };

  // Puissance d'une équipe à partir de son line-up + bonus draft.
  Sim.power = function (team, draftBonus) {
    var line = Sim.lineup(team), sum = 0, n = 0;
    LM.ROLES.forEach(function (r) {
      if (line[r]) { sum += Sim.effective(line[r]); n++; }
    });
    var avg = n ? sum / n : 40;
    // Synergie d'équipe : bonus si écart faible entre joueurs (équipe homogène).
    var vals = LM.ROLES.map(function (r) { return line[r] ? line[r].ovr : avg; });
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    var synergy = LM.U.clamp(8 - (max - min) * 0.4, -2, 6);
    return avg + synergy + (draftBonus || 0);
  };

  // Draft automatique : choisit un champion par rôle pour chaque joueur.
  Sim.autoDraft = function (rng, team) {
    var line = Sim.lineup(team), picks = {};
    LM.ROLES.forEach(function (r) {
      var p = line[r];
      if (p && p.champs && p.champs.length) picks[r] = LM.U.pick(rng, p.champs);
      else picks[r] = (LM.CHAMPIONS_BY_ROLE[r] || ["?"])[0];
    });
    return picks;
  };

  // Bonus de draft : +1.5 par champion issu du pool favori du joueur.
  Sim.draftBonus = function (team, picks) {
    var line = Sim.lineup(team), bonus = 0;
    LM.ROLES.forEach(function (r) {
      var p = line[r];
      if (p && picks[r] && p.champs.indexOf(picks[r]) >= 0) bonus += 1.5;
    });
    return bonus;
  };

  // Simule UNE partie. Renvoie le détail (vainqueur + score de kills + mvp).
  Sim.game = function (rng, home, away, draftH, draftA) {
    var pH = Sim.power(home, Sim.draftBonus(home, draftH));
    var pA = Sim.power(away, Sim.draftBonus(away, draftA));
    var diff = pH - pA;
    var prob = 1 / (1 + Math.pow(10, -diff / 12)); // logistique
    var homeWin = rng() < prob;
    // Score de kills : l'équipe la plus forte tend à gagner plus large.
    var margin = LM.U.clamp(Math.abs(diff) * 0.5 + LM.U.rint(rng, 0, 8), 1, 28);
    var loserK = LM.U.clamp(LM.U.rint(rng, 2, 14) - Math.round(margin / 4), 0, 20);
    var winnerK = loserK + Math.round(margin) + LM.U.rint(rng, 1, 4);
    var duration = LM.U.rint(rng, 22, 41);
    return {
      homeWin: homeWin,
      kills: homeWin ? [winnerK, loserK] : [loserK, winnerK],
      duration: duration,
      mvpRole: LM.U.pick(rng, LM.ROLES)
    };
  };

  // Simule une SÉRIE (Bo1/Bo3/Bo5).
  // drafts : { teamId: picks } pour forcer la draft d'une équipe (sinon auto).
  Sim.series = function (G, homeId, awayId, bo, drafts) {
    drafts = drafts || {};
    var rng = LM.RNG((G.seed ^ Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
    var home = G.teams[homeId], away = G.teams[awayId];
    var need = Math.ceil(bo / 2);
    var hW = 0, aW = 0, games = [];
    while (hW < need && aW < need) {
      var dH = drafts[homeId] || Sim.autoDraft(rng, home);
      var dA = drafts[awayId] || Sim.autoDraft(rng, away);
      var g = Sim.game(rng, home, away, dH, dA);
      g.draftH = dH; g.draftA = dA;
      if (g.homeWin) hW++; else aW++;
      games.push(g);
    }
    var homeWon = hW > aW;
    var res = {
      homeId: homeId, awayId: awayId, bo: bo,
      score: [hW, aW], homeWon: homeWon,
      winnerId: homeWon ? homeId : awayId,
      loserId: homeWon ? awayId : homeId,
      games: games
    };
    Sim.applyStats(G, res);
    return res;
  };

  // Met à jour les statistiques des joueurs après une série.
  Sim.applyStats = function (G, res) {
    [res.homeId, res.awayId].forEach(function (tid, i) {
      var team = G.teams[tid];
      var won = res.winnerId === tid;
      var line = Sim.lineup(team);
      LM.ROLES.forEach(function (r) {
        var p = line[r]; if (!p) return;
        p.stats.games += res.games.length;
        if (won) p.stats.wins += res.games.length;
        // Forme & condition évoluent légèrement.
        p.condition = LM.U.clamp(p.condition - res.games.length * 2 - (won ? 0 : 1), 40, 100);
        p.form = LM.U.clamp(p.form + (won ? 1 : -1), -5, 5);
        p.morale = LM.U.clamp(p.morale + (won ? 3 : -3), 20, 100);
      });
    });
  };

  LM.Sim = Sim;
})(window.LM = window.LM || {});
