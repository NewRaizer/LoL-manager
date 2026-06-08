/* =============================================================
 * Legends Manager — Entraînement & infrastructures
 * ============================================================= */
(function (LM) {
  var Tr = {};

  Tr.ATTRS = {
    mechanics: "Mécanique", laning: "Phase de lane", teamfight: "Combats d'équipe",
    vision: "Vision / Macro", shotcalling: "Leadership", consistency: "Régularité"
  };

  // Entraîne un joueur sur un attribut (1 fois par tour).
  Tr.train = function (G, playerId, attr) {
    var my = LM.myTeam(G);
    var p = my.roster.find(function (x) { return x.id === playerId; });
    if (!p) return { ok: false, msg: "Joueur introuvable." };
    if (G.trainingUsed[playerId]) return { ok: false, msg: p.name + " s'est déjà entraîné ce tour-ci." };
    if (!Tr.ATTRS[attr]) return { ok: false, msg: "Attribut inconnu." };
    if (p.condition < 25) return { ok: false, msg: p.name + " est trop fatigué pour s'entraîner." };

    var rng = LM.RNG((parseInt(p.id, 36) ^ G.date.day ^ G.date.month) >>> 0);
    // Gain : meilleures infrastructures + jeunesse = progression plus rapide.
    var youth = LM.U.clamp(26 - p.age, 0, 8);
    var head = Math.max(0, p.potential - p.ovr);
    var gain = 0;
    var chance = 0.35 + my.facilities * 0.05 + youth * 0.03 + (head > 0 ? 0.15 : 0);
    if (rng() < chance && p.attrs[attr] < 99 && head >= 0) {
      gain = 1 + (rng() < 0.2 ? 1 : 0);
      p.attrs[attr] = LM.U.clamp(p.attrs[attr] + gain, 30, 99);
    }
    p.condition = LM.U.clamp(p.condition - 6, 0, 100);
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
