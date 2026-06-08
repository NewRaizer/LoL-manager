/* =============================================================
 * Legends Manager — Marché des transferts
 * ============================================================= */
(function (LM) {
  var T = {};

  // Liste tous les joueurs achetables (agents libres + joueurs des autres équipes).
  T.market = function (G) {
    var list = G.freeAgents.map(function (p) {
      return { p: p, fee: Math.round(p.value * 0.6), free: true, fromTeam: null };
    });
    Object.keys(G.teams).forEach(function (tid) {
      if (tid === G.teamId) return;
      G.teams[tid].roster.forEach(function (p) {
        list.push({ p: p, fee: Math.round(p.value * 1.5), free: false, fromTeam: tid });
      });
    });
    return list;
  };

  // Tente d'acheter un joueur. Renvoie {ok, msg}.
  T.buy = function (G, playerId) {
    var my = LM.myTeam(G);
    var entry = T.market(G).find(function (e) { return e.p.id === playerId; });
    if (!entry) return { ok: false, msg: "Joueur introuvable sur le marché." };
    if (my.budget < entry.fee) return { ok: false, msg: "Budget insuffisant (" + LM.U.money(entry.fee) + " requis)." };
    var p = entry.p;

    if (entry.free) {
      G.freeAgents = G.freeAgents.filter(function (x) { return x.id !== p.id; });
    } else {
      var from = G.teams[entry.fromTeam];
      // L'équipe vendeuse refuse de descendre sous 4 joueurs à un poste critique.
      var sameRole = from.roster.filter(function (x) { return x.role === p.role; });
      if (sameRole.length <= 1 && entry.fee < p.value * 2) {
        return { ok: false, msg: from.short + " refuse : c'est leur seul " + LM.ROLE_FR[p.role] + ". Offrez plus." };
      }
      from.roster = from.roster.filter(function (x) { return x.id !== p.id; });
      from.budget += entry.fee;
    }
    my.budget -= entry.fee;
    p.teamId = my.id;
    p.contract = 2;
    p.morale = LM.U.clamp(p.morale + 5, 0, 100);
    my.roster.push(p);
    LM.addNews(G, "Transfert : " + p.name + " rejoint " + my.name,
      my.name + " recrute " + p.name + " (" + LM.ROLE_FR[p.role] + ", " + p.ovr + " OVR) pour " + LM.U.money(entry.fee) + ".");
    return { ok: true, msg: p.name + " a signé chez vous !" };
  };

  // Vend / libère un joueur de votre équipe.
  T.release = function (G, playerId) {
    var my = LM.myTeam(G);
    var p = my.roster.find(function (x) { return x.id === playerId; });
    if (!p) return { ok: false, msg: "Joueur introuvable." };
    var sameRole = my.roster.filter(function (x) { return x.role === p.role; });
    if (sameRole.length <= 1) return { ok: false, msg: "Impossible : c'est votre seul " + LM.ROLE_FR[p.role] + "." };
    var fee = Math.round(p.value * 0.5);
    my.roster = my.roster.filter(function (x) { return x.id !== p.id; });
    my.budget += fee;
    p.teamId = null; p.contract = 0;
    G.freeAgents.unshift(p);
    LM.addNews(G, "Départ : " + p.name + " quitte " + my.name,
      p.name + " est transféré. " + my.name + " récupère " + LM.U.money(fee) + ".");
    return { ok: true, msg: p.name + " a quitté l'équipe (+" + LM.U.money(fee) + ")." };
  };

  LM.Transfers = T;
})(window.LM = window.LM || {});
