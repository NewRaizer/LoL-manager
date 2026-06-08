/* =============================================================
 * Legends Manager — Draft Pick & Ban (cœur stratégique TFM)
 * Bleu (A) = votre équipe. Rouge (B) = adversaire (IA).
 * Bans : 3 par équipe en alternance. Picks : ordre type compétitif.
 * ============================================================= */
(function (LM) {
  var Draft = {};

  var BAN_ORDER = ["A", "B", "A", "B", "A", "B"];
  // Ordre des picks (équipe, rôle) — crée des situations de contre-pick.
  var PICK_SLOTS = [
    ["A", "TOP"], ["B", "TOP"], ["B", "JNG"], ["A", "JNG"], ["A", "MID"],
    ["B", "MID"], ["B", "ADC"], ["A", "ADC"], ["A", "SUP"], ["B", "SUP"]
  ];

  Draft.create = function (G, homeId, awayId) {
    var aId = (homeId === G.teamId) ? homeId : (awayId === G.teamId ? awayId : homeId);
    var bId = aId === homeId ? awayId : homeId;
    return {
      aId: aId, bId: bId,
      bans: { A: [], B: [] }, picks: { A: {}, B: {} },
      phase: "BAN", banStep: 0, pickStep: 0
    };
  };

  Draft.teamId = function (draft, side) { return side === "A" ? draft.aId : draft.bId; };
  Draft.curSide = function (draft) {
    return draft.phase === "BAN" ? BAN_ORDER[draft.banStep] : (PICK_SLOTS[draft.pickStep] || [])[0];
  };
  Draft.curRole = function (draft) {
    return draft.phase === "PICK" ? (PICK_SLOTS[draft.pickStep] || [])[1] : null;
  };
  Draft.isPlayerTurn = function (draft) { return Draft.curSide(draft) === "A"; };

  function used(draft) {
    var u = {};
    draft.bans.A.concat(draft.bans.B).forEach(function (c) { u[c] = 1; });
    ["A", "B"].forEach(function (s) {
      LM.ROLES.forEach(function (r) { if (draft.picks[s][r]) u[draft.picks[s][r]] = 1; });
    });
    return u;
  }
  Draft.used = used;

  Draft.available = function (G, draft, role) {
    var u = used(draft);
    return (LM.CHAMPIONS_BY_ROLE[role] || []).filter(function (c) { return !u[c]; });
  };

  function enemyTypes(G, draft, side) {
    var other = side === "A" ? "B" : "A";
    return LM.ROLES.map(function (r) {
      var c = draft.picks[other][r]; return c ? LM.CLS[c] : null; }).filter(Boolean);
  }

  // Score d'un pick pour une équipe (méta + maîtrise + contre partiel).
  Draft.pickScore = function (G, draft, side, role, champ) {
    var team = G.teams[Draft.teamId(draft, side)];
    var p = LM.Sim.lineup(team)[role];
    var meta = (LM.Meta.tier(G, champ) - 5) * 1.0;
    var mast = p ? LM.Meta.masteryDelta(p, champ) : 0;
    var cls = LM.CLS[champ] || "BRUISER";
    var counter = LM.Meta.counterScore([cls], enemyTypes(G, draft, side)) * 0.6;
    return meta + mast + counter;
  };

  // Recommandations de pick (triées) pour l'UI joueur.
  Draft.recommendPicks = function (G, draft, role) {
    var av = Draft.available(G, draft, role);
    var team = G.teams[draft.aId];
    var p = LM.Sim.lineup(team)[role];
    return av.map(function (c) {
      return {
        champ: c, cls: LM.CLS[c], meta: LM.Meta.tier(G, c),
        mastery: p ? Math.round(LM.Meta.masteryOf(p, c)) : 0,
        score: Draft.pickScore(G, draft, "A", role, c)
      };
    }).sort(function (a, b) { return b.score - a.score; });
  };

  // Cible de ban : champions ennemis dangereux (maîtrise + méta élevées).
  Draft.recommendBans = function (G, draft, side) {
    var other = side === "A" ? "B" : "A";
    var enemy = G.teams[Draft.teamId(draft, other)];
    var u = used(draft);
    var cands = {};
    LM.ROLES.forEach(function (r) {
      var p = LM.Sim.lineup(enemy)[r]; if (!p) return;
      (p.champs || []).forEach(function (c) {
        if (u[c]) return;
        var v = LM.Meta.masteryOf(p, c) * 0.6 + LM.Meta.tier(G, c) * 4;
        if (!cands[c] || v > cands[c].v) cands[c] = { champ: c, role: r, v: v, cls: LM.CLS[c],
          meta: LM.Meta.tier(G, c), mastery: Math.round(LM.Meta.masteryOf(p, c)) };
      });
    });
    return Object.keys(cands).map(function (k) { return cands[k]; })
      .sort(function (a, b) { return b.v - a.v; });
  };

  Draft.applyBan = function (draft, side, champ) {
    if (!champ) { draft.banStep++; checkPhase(draft); return; }
    draft.bans[side].push(champ);
    draft.banStep++;
    checkPhase(draft);
  };

  Draft.applyPick = function (draft, side, champ) {
    var role = (PICK_SLOTS[draft.pickStep] || [])[1];
    draft.picks[side][role] = champ;
    draft.pickStep++;
    checkPhase(draft);
  };

  function checkPhase(draft) {
    if (draft.phase === "BAN" && draft.banStep >= BAN_ORDER.length) draft.phase = "PICK";
    if (draft.phase === "PICK" && draft.pickStep >= PICK_SLOTS.length) draft.phase = "DONE";
  }

  // L'IA joue son coup courant (ban ou pick).
  Draft.aiStep = function (G, draft) {
    var side = Draft.curSide(draft);
    if (draft.phase === "BAN") {
      var recs = Draft.recommendBans(G, draft, side);
      Draft.applyBan(draft, side, recs.length ? recs[0].champ : null);
    } else if (draft.phase === "PICK") {
      var role = Draft.curRole(draft);
      var av = Draft.available(G, draft, role);
      var best = null, bestS = -1e9;
      // Candidats : pool du joueur + meilleurs champions méta du rôle.
      var team = G.teams[Draft.teamId(draft, side)];
      var p = LM.Sim.lineup(team)[role];
      var pool = (p ? p.champs : []).filter(function (c) { return av.indexOf(c) >= 0; });
      var metaTop = av.slice().sort(function (a, b) { return LM.Meta.tier(G, b) - LM.Meta.tier(G, a); }).slice(0, 8);
      var cands = pool.concat(metaTop);
      cands.forEach(function (c) {
        var s = Draft.pickScore(G, draft, side, role, c);
        if (s > bestS) { bestS = s; best = c; }
      });
      Draft.applyPick(draft, side, best || av[0]);
    }
  };

  // Fait jouer l'IA jusqu'au prochain tour du joueur (ou la fin).
  Draft.runAIUntilPlayer = function (G, draft) {
    var guard = 0;
    while (draft.phase !== "DONE" && Draft.curSide(draft) === "B" && guard++ < 30) {
      Draft.aiStep(G, draft);
    }
  };

  // Convertit en picks utilisables par la simulation.
  Draft.toPicks = function (draft) {
    var out = {};
    out[draft.aId] = draft.picks.A;
    out[draft.bId] = draft.picks.B;
    return out;
  };

  LM.Draft = Draft;
})(window.LM = window.LM || {});
