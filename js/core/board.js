/* =============================================================
 * Legends Manager — Direction (board) : objectifs & confiance
 * ============================================================= */
(function (LM) {
  var Board = {};

  Board.init = function (G) {
    G.board = { confidence: 66, splitObjective: null, seasonObjective: null, history: [] };
  };

  function leagueRank(G) {
    var my = LM.myTeam(G);
    var teams = LM.teamsByLeague(my.league).slice()
      .sort(function (a, b) { return b.tier - a.tier; });
    return teams.findIndex(function (t) { return t.id === my.id; }) + 1;
  }

  var TARGET_ORDER = { last: 0, midtable: 1, playoffs: 2, final: 3, champion: 4 };

  // Fixe l'objectif du split selon le standing attendu du club.
  Board.setSplitObjective = function (G, splitName) {
    var rank = leagueRank(G);
    var target, desc;
    if (rank <= 2) { target = "champion"; desc = "Remporter le " + splitName; }
    else if (rank <= 4) { target = "final"; desc = "Atteindre la finale du " + splitName; }
    else if (rank <= 6) { target = "playoffs"; desc = "Se qualifier en playoffs (Top 4)"; }
    else { target = "midtable"; desc = "Terminer dans la première moitié du classement"; }
    G.board.splitObjective = { splitName: splitName, target: target, desc: desc };
  };

  Board.setSeasonObjective = function (G) {
    var rank = leagueRank(G);
    var obj;
    if (rank <= 2) obj = { target: "WORLDS", desc: "Se qualifier pour les Worlds et viser un titre international" };
    else if (rank <= 5) obj = { target: "MSI", desc: "Se qualifier pour un événement international (First Stand / MSI)" };
    else obj = { target: "PLAYOFFS3", desc: "Se qualifier en playoffs au moins deux fois dans l'année" };
    obj.intlCount = 0; obj.playoffCount = 0;
    G.board.seasonObjective = obj;
  };

  // Place finale du joueur dans un split (champion/final/playoffs/rang).
  function placement(G, st) {
    if (st.champion === G.teamId) return { key: "champion", txt: "Champion" };
    if (st.runnerUp === G.teamId) return { key: "final", txt: "Finaliste" };
    var sorted = LM.Calendar.sortedStandings(st);
    var idx = sorted.findIndex(function (s) { return s.id === G.teamId; });
    if (idx >= 0 && idx < 4) return { key: "playoffs", txt: (idx + 1) + "e (playoffs)" };
    var rank = idx + 1, total = sorted.length;
    if (rank <= Math.ceil(total / 2)) return { key: "midtable", txt: rank + "e" };
    if (rank === total) return { key: "last", txt: "dernier" };
    return { key: "lower", txt: rank + "e" };
  }

  Board.evaluateSplit = function (G, st) {
    if (!G.board || !G.board.splitObjective) return;
    var obj = G.board.splitObjective;
    var pl = placement(G, st);
    var got = TARGET_ORDER[pl.key] != null ? TARGET_ORDER[pl.key] : 0;
    var need = TARGET_ORDER[obj.target];
    var diff = got - need;
    var delta, verdict;
    if (diff >= 1) { delta = LM.U.rint(rng(G), 8, 13); verdict = "objectif largement dépassé"; }
    else if (diff === 0) { delta = LM.U.rint(rng(G), 5, 8); verdict = "objectif atteint"; }
    else if (diff === -1) { delta = -LM.U.rint(rng(G), 4, 8); verdict = "objectif manqué de peu"; }
    else { delta = -LM.U.rint(rng(G), 8, 13); verdict = "grosse déception"; }
    if (pl.key === "playoffs" || pl.key === "final" || pl.key === "champion") G.board.seasonObjective.playoffCount++;

    G.board.confidence = LM.U.clamp(G.board.confidence + delta, 0, 100);
    if (delta > 0) LM.myTeam(G).budget += 100000 * Math.max(1, diff + 1);
    LM.addNews(G, "Direction — Bilan du " + obj.splitName,
      "Objectif : « " + obj.desc + " ». Résultat : " + pl.txt + " — " + verdict + ". " +
      "Confiance de la direction : " + G.board.confidence + "/100.");
    checkFiring(G);
    G.board.splitObjective = null;
  };

  Board.noteIntlQualification = function (G) {
    if (G.board && G.board.seasonObjective) G.board.seasonObjective.intlCount++;
  };

  Board.evaluateSeason = function (G) {
    var obj = G.board && G.board.seasonObjective;
    if (!obj) return;
    var ok;
    if (obj.target === "WORLDS") ok = obj.intlCount >= 1;
    else if (obj.target === "MSI") ok = obj.intlCount >= 1;
    else ok = obj.playoffCount >= 2;
    var delta = ok ? LM.U.rint(rng(G), 7, 12) : -LM.U.rint(rng(G), 6, 11);
    G.board.confidence = LM.U.clamp(G.board.confidence + delta, 0, 100);
    LM.addNews(G, "Direction — Bilan de la saison",
      "Objectif annuel : « " + obj.desc + " » → " + (ok ? "RÉUSSI ✅" : "ÉCHOUÉ ❌") +
      ". Confiance : " + G.board.confidence + "/100.");
    checkFiring(G);
  };

  function checkFiring(G) {
    if (G.fired) return;
    if (G.board.confidence <= 9) {
      G.fired = true;
      LM.addNews(G, "❌ Vous êtes limogé",
        "La direction de " + LM.myTeam(G).name + " met fin à votre contrat. Fin de l'aventure.");
    } else if (G.board.confidence <= 28 && !G.board.warned) {
      G.board.warned = true;
      LM.addNews(G, "⚠️ Avertissement de la direction",
        "La direction n'est pas satisfaite. Des résultats sont attendus rapidement, sous peine de licenciement.");
    } else if (G.board.confidence > 45) {
      G.board.warned = false;
    }
  }

  function rng(G) { return LM.RNG((G.seed ^ G.date.year ^ G.date.month ^ (G.patchNote || 0)) >>> 0); }

  LM.Board = Board;
})(window.LM = window.LM || {});
