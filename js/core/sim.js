/* =============================================================
 * Legends Manager — Simulation de matchs (draft, parties, séries)
 * ============================================================= */
(function (LM) {
  var Sim = {};

  // Renvoie le 5 titulaire d'une équipe : meilleur joueur DISPONIBLE par rôle.
  Sim.lineup = function (team) {
    var line = {};
    LM.ROLES.forEach(function (r) {
      var cands = team.roster.filter(function (p) { return p.role === r && !p.injury; });
      cands.sort(function (a, b) { return b.ovr - a.ovr; });
      line[r] = cands[0] || null;
    });
    return line;
  };

  // Note effective d'un joueur sur un match (OVR + forme + moral + condition + traits).
  Sim.effective = function (p) {
    if (!p) return 38; // poste laissé vacant (tous blessés) -> grosse faiblesse
    var f = p.form * 1.4;
    var m = (p.morale - 70) * 0.08;
    var c = (p.condition - 80) * 0.10;
    var t = 0;
    if (Sim._ctx && Sim._ctx.big) {
      if (LM.hasTrait(p, "CLUTCH")) t += 4;
      if (LM.hasTrait(p, "PRESSURE")) t -= 4;
    }
    return p.ovr + f + m + c + t;
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
    if (LM.Story) synergy += LM.Story.teamChemistry(team);
    return avg + synergy + (draftBonus || 0);
  };

  // Draft automatique (IA) : meilleur champion par rôle selon méta + maîtrise.
  Sim.autoDraft = function (G, rng, team) {
    var line = Sim.lineup(team), picks = {};
    LM.ROLES.forEach(function (r) {
      var p = line[r];
      var pool = (p && p.champs && p.champs.length) ? p.champs : (LM.CHAMPIONS_BY_ROLE[r] || ["?"]);
      var best = pool[0], bestS = -1e9;
      pool.forEach(function (c) {
        var s = LM.Meta.tier(G, c) + (p ? LM.Meta.masteryDelta(p, c) : 0) + rng() * 1.5;
        if (s > bestS) { bestS = s; best = c; }
      });
      picks[r] = best;
    });
    return picks;
  };

  // Simule UNE partie : la puissance dépend du draft (compo, contres, méta, maîtrise).
  Sim.game = function (G, rng, home, away, picksH, picksA) {
    var rH = LM.Meta.draftRating(G, home, picksH, picksA);
    var rA = LM.Meta.draftRating(G, away, picksA, picksH);
    var diff = rH.power - rA.power;
    var prob = 1 / (1 + Math.pow(10, -diff / 12)); // logistique
    var homeWin = rng() < prob;
    var margin = LM.U.clamp(Math.abs(diff) * 0.5 + LM.U.rint(rng, 0, 8), 1, 28);
    var loserK = LM.U.clamp(LM.U.rint(rng, 2, 14) - Math.round(margin / 4), 0, 20);
    var winnerK = loserK + Math.round(margin) + LM.U.rint(rng, 1, 4);
    var duration = LM.U.rint(rng, 22, 41);
    var winner = homeWin ? home : away;
    var winnerPicks = homeWin ? picksH : picksA;
    var mvpRole = pickMvpRole(rng, winner, winnerPicks);
    var mvp = playerForRole(winner, mvpRole);
    var timeline = buildTimeline(G, rng, home, away, picksH, picksA, homeWin, duration, winnerK, loserK, mvpRole);
    return {
      homeWin: homeWin,
      kills: homeWin ? [winnerK, loserK] : [loserK, winnerK],
      duration: duration,
      mvpRole: mvpRole,
      mvp: mvp ? { teamId: winner.id, playerId: mvp.id, name: mvp.name, role: mvp.role, champ: winnerPicks[mvp.role] } : null,
      timeline: timeline,
      headline: timeline.length ? timeline[timeline.length - 1].text : "",
      ratingH: rH, ratingA: rA
    };
  };

  function playerForRole(team, role) {
    return Sim.lineup(team)[role] || null;
  }

  function lineupIds(team) {
    var line = Sim.lineup(team), out = {};
    LM.ROLES.forEach(function (r) { out[r] = line[r] ? line[r].id : null; });
    return out;
  }

  function pickMvpRole(rng, team, picks) {
    var line = Sim.lineup(team);
    var best = "MID", bestScore = -1e9;
    LM.ROLES.forEach(function (r) {
      var p = line[r]; if (!p) return;
      var champ = picks[r] || (p.champs && p.champs[0]);
      var s = Sim.effective(p) + (champ ? LM.Meta.masteryDelta(p, champ) : 0);
      if (r === "MID" || r === "ADC") s += 2;
      if (r === "JNG") s += 1.2;
      s += rng() * 6;
      if (s > bestScore) { bestScore = s; best = r; }
    });
    return best;
  }

  function buildTimeline(G, rng, home, away, picksH, picksA, homeWin, duration, winnerK, loserK, mvpRole) {
    var win = homeWin ? home : away;
    var lose = homeWin ? away : home;
    var wp = homeWin ? picksH : picksA;
    var lp = homeWin ? picksA : picksH;
    var out = [];
    function push(min, text, tone) { out.push({ minute: min, text: text, tone: tone || "neutral" }); }
    var earlyRole = LM.U.pick(rng, ["JNG", "MID", "BOT", "TOP"]);
    var first = earlyRole === "BOT" ? "la botlane" : LM.ROLE_FR[earlyRole] || earlyRole;
    push(LM.U.rint(rng, 3, 8), win.short + " prend le premier tempo via " + first + ".", "good");
    if (loserK > 6) {
      push(LM.U.rint(rng, 10, 16), lose.short + " repond et ralentit la partie autour du dragon.", "swing");
    } else {
      push(LM.U.rint(rng, 10, 15), win.short + " verrouille les objectifs neutres et etouffe la carte.", "good");
    }
    var mvp = playerForRole(win, mvpRole);
    var champ = wp[mvpRole] || "?";
    push(LM.U.rint(rng, 17, 25), (mvp ? mvp.name : win.short) + " trouve le fight cle sur " + champ + ".", "good");
    if (duration > 34) {
      push(LM.U.rint(rng, 29, 36), lose.short + " force un Baron et relance le suspense.", "swing");
    }
    var close = winnerK - loserK <= 8;
    push(Math.max(22, duration - LM.U.rint(rng, 2, 5)),
      close ? win.short + " gagne le dernier fight de justesse." : win.short + " termine proprement apres un Nashor maitrise.",
      close ? "swing" : "good");
    return out.sort(function (a, b) { return a.minute - b.minute; });
  }

  // Progression de la maîtrise : jouer un champion l'améliore peu à peu.
  Sim.growMastery = function (team, picks) {
    var line = Sim.lineup(team);
    LM.ROLES.forEach(function (r) {
      var p = line[r], c = picks[r]; if (!p || !c) return;
      if (!p.mastery) p.mastery = {};
      var cur = p.mastery[c] != null ? p.mastery[c] : 20;
      var gain = cur < 70 ? 1.4 : (cur < 90 ? 0.5 : 0.15);
      p.mastery[c] = LM.U.clamp(cur + gain, 0, 99);
    });
  };

  // Simule une SÉRIE (Bo1/Bo3/Bo5).
  // drafts : { teamId: picks } pour forcer la draft d'une équipe (sinon auto).
  Sim.series = function (G, homeId, awayId, bo, drafts) {
    drafts = drafts || {};
    // Contexte : les gros matchs (playoffs / international) activent les traits Clutch / Pression.
    var st = G.season && G.season.stage;
    Sim._ctx = { big: !!(st && (st.type === "intl" || (st.type === "split" && st.phase === "PO"))) };
    var rng = LM.RNG((G.seed ^ Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
    var home = G.teams[homeId], away = G.teams[awayId];
    var seriesLineups = { home: lineupIds(home), away: lineupIds(away) };
    var need = Math.ceil(bo / 2);
    var hW = 0, aW = 0, games = [];
    while (hW < need && aW < need) {
      var dH = drafts[homeId] || Sim.autoDraft(G, rng, home);
      var dA = drafts[awayId] || Sim.autoDraft(G, rng, away);
      var g = Sim.game(G, rng, home, away, dH, dA);
      g.draftH = dH; g.draftA = dA;
      Sim.growMastery(home, dH); Sim.growMastery(away, dA);
      if (g.homeWin) hW++; else aW++;
      games.push(g);
    }
    var homeWon = hW > aW;
    var res = {
      homeId: homeId, awayId: awayId, bo: bo,
      score: [hW, aW], homeWon: homeWon,
      winnerId: homeWon ? homeId : awayId,
      loserId: homeWon ? awayId : homeId,
      lineups: seriesLineups,
      games: games
    };
    Sim.applyStats(G, res);
    return res;
  };

  // Met à jour les statistiques des joueurs après une série.
  Sim.applyStats = function (G, res) {
    applyBoxScore(G, res);
    [res.homeId, res.awayId].forEach(function (tid) {
      var team = G.teams[tid];
      var won = res.winnerId === tid;
      var line = Sim.lineup(team);
      var hasLeader = LM.ROLES.some(function (r) { return line[r] && LM.hasTrait(line[r], "LEADER"); });
      var intensity = team.intensity || 2;
      var starters = [];
      LM.ROLES.forEach(function (r) {
        var p = line[r]; if (!p) return;
        starters.push(p);
        p.stats.games += res.games.length;
        if (won) p.stats.wins += res.games.length;
        // Condition : usure proportionnelle aux parties et à l'intensité.
        var loss = res.games.length * (2.4 + intensity * 0.6);
        p.condition = LM.U.clamp(p.condition - loss, 0, 100);
        p.form = Math.round(LM.U.clamp(p.form + (won ? 1 : -1), -5, 5));
        var dm = won ? 3 : -3;
        if (hasLeader) dm += won ? 1 : 2;                 // un leader soutient le moral
        if (LM.hasTrait(p, "HOTHEAD")) dm *= 1.6;          // tête brûlée = moral instable
        p.morale = LM.U.clamp(p.morale + dm, 15, 100);
      });
      if (LM.Club) LM.Club.rollInjuries(G, team, starters, res.games.length);
    });
  };

  function applyBoxScore(G, res) {
    res.games.forEach(function (g, gi) {
      addTeamStats(G.teams[res.homeId], g.kills[0], g.kills[1], g.mvp && g.mvp.teamId === res.homeId ? g.mvp.role : null, gi);
      addTeamStats(G.teams[res.awayId], g.kills[1], g.kills[0], g.mvp && g.mvp.teamId === res.awayId ? g.mvp.role : null, gi + 13);
    });
    var mvp = seriesMvp(G, res);
    res.mvp = mvp;
    if (mvp) {
      var p = findPlayer(G.teams[mvp.teamId], mvp.playerId);
      if (p) { fixStats(p); p.stats.mvp++; }
    }
  }

  function addTeamStats(team, kills, deaths, mvpRole, salt) {
    var line = Sim.lineup(team);
    var roles = LM.ROLES.filter(function (r) { return line[r]; });
    var kDist = distribute(kills, roles, mvpRole, { TOP: .15, JNG: .17, MID: .25, ADC: .31, SUP: .12 }, salt);
    var dDist = distribute(deaths, roles, null, { TOP: .20, JNG: .19, MID: .19, ADC: .22, SUP: .20 }, salt + 7);
    var aDist = distribute(Math.round(kills * 1.85), roles, "SUP", { TOP: .13, JNG: .24, MID: .19, ADC: .17, SUP: .27 }, salt + 17);
    roles.forEach(function (r) {
      var p = line[r]; fixStats(p);
      p.stats.kills += kDist[r] || 0;
      p.stats.deaths += dDist[r] || 0;
      p.stats.assists += aDist[r] || 0;
    });
  }

  function distribute(total, roles, boostRole, weights, salt) {
    var out = {}, sum = 0;
    roles.forEach(function (r) { sum += (weights[r] || .2) + (r === boostRole ? .1 : 0); });
    var left = total;
    roles.forEach(function (r, idx) {
      var v = idx === roles.length - 1 ? left : Math.floor(total * ((weights[r] || .2) + (r === boostRole ? .1 : 0)) / sum);
      out[r] = Math.max(0, v); left -= out[r];
    });
    return out;
  }

  function seriesMvp(G, res) {
    var best = null;
    res.games.forEach(function (g) {
      if (!g.mvp) return;
      var p = findPlayer(G.teams[g.mvp.teamId], g.mvp.playerId);
      if (!p) return;
      var score = p.ovr + (g.mvp.teamId === res.winnerId ? 8 : 0) + (g.kills[g.mvp.teamId === res.homeId ? 0 : 1] || 0);
      if (!best || score > best.score) best = {
        teamId: g.mvp.teamId, playerId: p.id, name: p.name, role: p.role, champ: g.mvp.champ, score: score
      };
    });
    return best;
  }

  function findPlayer(team, id) {
    return (team.roster || []).find(function (p) { return p.id === id; });
  }

  function fixStats(p) {
    if (!p.stats) p.stats = {};
    ["games", "wins", "kills", "deaths", "assists", "mvp"].forEach(function (k) {
      if (p.stats[k] == null) p.stats[k] = 0;
    });
  }

  LM.Sim = Sim;
})(window.LM = window.LM || {});
