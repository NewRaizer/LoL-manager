/* =============================================================
 * Legends Manager — Méta, contres & valeur de draft
 * (inspiré de Teamfight Manager : le draft décide du match)
 * ============================================================= */
(function (LM) {
  var Meta = {};

  // Matrice de contres : qui est FORT contre qui (type -> types battus).
  // Pierre-feuille-ciseaux étendu :
  //  - Assassin perce les carries (Mage/Tireur)
  //  - Tireur/Mage déchirent la frontline (Tank/Combattant)
  //  - Tank & Combattant collent et tuent les Assassins
  //  - Enchanteur protège les carries -> contre l'Assassin
  Meta.BEATS = {
    ASSASSIN: ["MAGE", "MARKSMAN"],
    MARKSMAN: ["TANK", "BRUISER"],
    MAGE: ["TANK", "BRUISER"],
    TANK: ["ASSASSIN"],
    BRUISER: ["ASSASSIN", "MAGE"],
    ENCHANTER: ["ASSASSIN"]
  };

  // +1 si a bat b, -1 si b bat a, 0 sinon.
  function duel(a, b) {
    var ab = Meta.BEATS[a] && Meta.BEATS[a].indexOf(b) >= 0;
    var ba = Meta.BEATS[b] && Meta.BEATS[b].indexOf(a) >= 0;
    return (ab ? 1 : 0) - (ba ? 1 : 0);
  }

  // Score de contre d'une compo (types) face à l'ennemie (5v5 croisé).
  Meta.counterScore = function (myTypes, enemyTypes) {
    if (!enemyTypes) return 0;
    var s = 0;
    myTypes.forEach(function (a) { enemyTypes.forEach(function (b) { s += duel(a, b); }); });
    // 25 duels possibles -> on ramène à une échelle ~ ±8 points de puissance.
    return LM.U.clamp(s * 0.65, -9, 9);
  };

  // Équilibre de composition : il faut de la frontline, des dégâts, de l'engage.
  Meta.compScore = function (types) {
    var c = { TANK: 0, BRUISER: 0, ASSASSIN: 0, MAGE: 0, MARKSMAN: 0, ENCHANTER: 0 };
    types.forEach(function (t) { c[t]++; });
    var front = c.TANK + c.BRUISER;
    var damage = c.MAGE + c.MARKSMAN + c.ASSASSIN;
    var s = 0;
    // Frontline
    if (front === 0) s -= 7; else if (front === 1) s += 2; else if (front <= 3) s += 4; else s += 1;
    // Sources de dégâts
    if (damage < 2) s -= 6; else if (damage <= 4) s += 3; else s += 1;
    // Un peu de portée à distance (mage/tireur) appréciée
    if (c.MAGE + c.MARKSMAN === 0) s -= 4;
    // Trop d'assassins = compo fragile
    if (c.ASSASSIN >= 3) s -= 3;
    // Mélange équilibré bonus
    var kinds = Object.keys(c).filter(function (k) { return c[k] > 0; }).length;
    s += kinds >= 4 ? 2 : 0;
    return s;
  };

  // --- Méta / patchs --------------------------------------------------
  // Chaque champion a une force de méta 1..10 (5 = neutre).
  Meta.init = function (G) {
    var rng = LM.RNG((G.seed ^ 0x9e37) >>> 0);
    G.meta = {};
    LM.CHAMPIONS.forEach(function (c) { G.meta[c.n] = LM.U.rint(rng, 3, 7); });
    boost(rng, G, 14); // quelques champions très forts au départ
  };

  function boost(rng, G, n) {
    for (var i = 0; i < n; i++) {
      var c = LM.U.pick(rng, LM.CHAMPIONS);
      G.meta[c.n] = LM.U.clamp(G.meta[c.n] + LM.U.rint(rng, 1, 3), 1, 10);
    }
  }

  // Nouveau patch : on rééquilibre, on remonte la liste des changements notables.
  Meta.repatch = function (G, patchLabel) {
    var rng = LM.RNG((G.seed ^ G.patchNote ^ G.date.month) >>> 0);
    var ups = [], downs = [];
    LM.CHAMPIONS.forEach(function (c) {
      if (rng() < 0.22) {
        var d = LM.U.rint(rng, -3, 3);
        if (d === 0) return;
        var old = G.meta[c.n];
        G.meta[c.n] = LM.U.clamp(old + d, 1, 10);
        if (G.meta[c.n] - old >= 2) ups.push(c.n);
        else if (old - G.meta[c.n] >= 2) downs.push(c.n);
      }
    });
    var msg = "";
    if (ups.length) msg += "🔼 Buff : " + ups.slice(0, 6).join(", ") + ". ";
    if (downs.length) msg += "🔽 Nerf : " + downs.slice(0, 6).join(", ") + ".";
    LM.addNews(G, "Patch " + (patchLabel || ("15." + G.patchNote)) + " — nouvelle méta",
      (msg || "Ajustements mineurs.") + " Adaptez vos drafts et vos entraînements !");
  };

  Meta.tier = function (G, champ) { return (G.meta && G.meta[champ]) || 5; };
  Meta.tierLetter = function (v) {
    if (v >= 9) return "S"; if (v >= 8) return "A"; if (v >= 6) return "B";
    if (v >= 4) return "C"; return "D";
  };

  // --- Maîtrise -------------------------------------------------------
  // Effet de la maîtrise d'un joueur sur un champion (delta de puissance).
  Meta.masteryOf = function (p, champ) {
    if (p.mastery && p.mastery[champ] != null) return p.mastery[champ];
    // Champion jamais joué : maîtrise faible.
    return 25;
  };
  Meta.masteryDelta = function (p, champ) {
    var m = Meta.masteryOf(p, champ);
    return LM.U.clamp((m - 60) / 7, -7, 6);
  };

  // --- Valeur de draft d'une équipe ----------------------------------
  // picks : { ROLE: champ }. enemyPicks : idem (ou null).
  Meta.draftRating = function (G, team, picks, enemyPicks) {
    var line = LM.Sim.lineup(team);
    var types = [], roleDetail = [], sum = 0, n = 0;
    LM.ROLES.forEach(function (r) {
      var p = line[r]; if (!p) return;
      var champ = picks[r] || (p.champs[0] || "?");
      var cls = LM.CLS[champ] || "BRUISER";
      types.push(cls);
      var skill = LM.Sim.effective(p);
      var md = Meta.masteryDelta(p, champ);
      var meta = (Meta.tier(G, champ) - 5) * 0.8;
      var rp = skill + md + meta;
      sum += rp; n++;
      roleDetail.push({ role: r, player: p.name, champ: champ, cls: cls,
        mastery: Math.round(Meta.masteryOf(p, champ)), meta: Meta.tier(G, champ), power: rp });
    });
    var base = n ? sum / n : 40;
    var enemyTypes = enemyPicks ? LM.ROLES.map(function (r) {
      return LM.CLS[enemyPicks[r]] || null; }).filter(Boolean) : null;
    var comp = Meta.compScore(types);
    var counter = Meta.counterScore(types, enemyTypes);
    // Bonus d'équipe : analyste (staff) + présence d'un leader.
    var teamBonus = LM.Club ? LM.Club.analystBonus(team) : 0;
    var hasLeader = LM.ROLES.some(function (r) { return line[r] && LM.hasTrait(line[r], "LEADER"); });
    if (hasLeader) teamBonus += 2.5;
    return {
      power: base + comp + counter + teamBonus,
      base: base, comp: comp, counter: counter, teamBonus: teamBonus,
      types: types, roleDetail: roleDetail
    };
  };

  LM.Meta = Meta;
})(window.LM = window.LM || {});
