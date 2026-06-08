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
    var refusal = LM.Story ? LM.Story.transferRefusal(G, entry) : null;
    if (refusal) {
      LM.addNews(G, "Agent : " + p.name, refusal, "mercato");
      return { ok: false, msg: refusal };
    }

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

  // -------- Offres entrantes (l'IA veut vos joueurs) --------
  T.generateBids = function (G) {
    var my = LM.myTeam(G);
    var rng = LM.RNG((G.seed ^ G.date.year ^ G.date.month ^ G.patchNote) >>> 0);
    var targets = my.roster.slice().sort(function (a, b) { return b.value - a.value; }).slice(0, 4);
    targets.forEach(function (p) {
      if (rng() > 0.33) return;
      var buyers = Object.keys(G.teams).filter(function (t) { return t !== my.id; });
      var fromId = LM.U.pick(rng, buyers);
      var from = G.teams[fromId];
      var fee = Math.round(p.value * (0.9 + rng() * 0.8) / 1000) * 1000;
      if (from.budget < fee) return;
      if (G.offers.some(function (o) { return o.playerId === p.id && o.fromTeam === fromId; })) return;
      var off = { id: LM.U.uid(), playerId: p.id, playerName: p.name, fromTeam: fromId, fee: fee };
      G.offers.push(off);
      LM.addNews(G, "💼 Offre pour " + p.name,
        from.name + " propose " + LM.U.money(fee) + " pour " + p.name + " (" + LM.ROLE_FR[p.role] +
        "). Acceptez ou refusez dans l'onglet Direction.", "mercato");
    });
    if (G.offers.length > 12) G.offers = G.offers.slice(-12);
    if (LM.Story) LM.Story.generateRumors(G, "mercato");
  };

  T.acceptBid = function (G, offerId) {
    var my = LM.myTeam(G);
    var off = G.offers.find(function (o) { return o.id === offerId; });
    if (!off) return { ok: false, msg: "Offre expirée." };
    var p = my.roster.find(function (x) { return x.id === off.playerId; });
    if (!p) { G.offers = G.offers.filter(function (o) { return o.id !== offerId; }); return { ok: false, msg: "Joueur introuvable." }; }
    var from = G.teams[off.fromTeam];
    my.roster = my.roster.filter(function (x) { return x.id !== p.id; });
    my.budget += off.fee;
    from.budget = Math.max(0, from.budget - off.fee);
    p.teamId = from.id; p.contract = 3;
    from.roster.push(p);
    G.offers = G.offers.filter(function (o) { return o.playerId !== p.id; });
    LM.addNews(G, "Vente : " + p.name + " → " + from.name,
      p.name + " est vendu à " + from.name + " pour " + LM.U.money(off.fee) + ".");
    return { ok: true, msg: p.name + " vendu pour " + LM.U.money(off.fee) + " !" };
  };

  T.rejectBid = function (G, offerId) {
    G.offers = G.offers.filter(function (o) { return o.id !== offerId; });
    return { ok: true, msg: "Offre refusée." };
  };

  // -------- Prolongation de contrat --------
  T.renew = function (G, playerId, years) {
    var my = LM.myTeam(G);
    var p = my.roster.find(function (x) { return x.id === playerId; });
    if (!p) return { ok: false, msg: "Joueur introuvable." };
    years = LM.U.clamp(years || 1, 1, 3);
    var mult = 0.5 * years;
    if (LM.hasTrait(p, "AMBITIOUS")) mult *= 1.4;
    if (LM.hasTrait(p, "LOYAL")) mult *= 0.7;
    mult *= 1 + Math.max(0, p.ambition - 60) * 0.01;
    var cost = Math.round(p.salary * mult / 1000) * 1000;
    if (my.budget < cost) return { ok: false, msg: "Budget insuffisant (" + LM.U.money(cost) + " de prime requise)." };
    my.budget -= cost;
    p.contract = LM.U.clamp((p.contract || 0) + years, 1, 4);
    // Légère hausse de salaire (revalorisation).
    p.salary = Math.round(p.salary * (1 + 0.05 * years) / 1000) * 1000;
    p.morale = LM.U.clamp(p.morale + 8, 0, 100);
    LM.addNews(G, "Prolongation : " + p.name,
      p.name + " prolonge de " + years + " an(s). Prime : " + LM.U.money(cost) + ".");
    return { ok: true, msg: p.name + " prolongé jusqu'à " + p.contract + " an(s) de contrat." };
  };

  LM.Transfers = T;
})(window.LM = window.LM || {});
