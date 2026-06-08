/* =============================================================
 * Legends Manager — Traits de personnalité
 * Chaque trait a des effets RÉELS lus par le moteur (clé -> logique).
 * ============================================================= */
(function (LM) {
  LM.TRAITS = {
    CLUTCH:    { name: "Clutch", emoji: "🧊", type: "pos", desc: "Surperforme en playoffs et en finale." },
    PRESSURE:  { name: "Sous pression", emoji: "😰", type: "neg", desc: "Sous-performe dans les gros matchs." },
    LEADER:    { name: "Leader", emoji: "🧭", type: "pos", desc: "Améliore le moral et la régularité de l'équipe." },
    MENTOR:    { name: "Mentor", emoji: "🎓", type: "pos", desc: "Accélère la progression de son protégé." },
    PRODIGY:   { name: "Prodige", emoji: "🌟", type: "pos", desc: "Progresse plus vite, plafond de potentiel élevé." },
    WORKHORSE: { name: "Bourreau de travail", emoji: "💪", type: "pos", desc: "Gains d'entraînement accrus, moins de blessures." },
    FRAGILE:   { name: "Fragile", emoji: "🩹", type: "neg", desc: "Risque de blessure plus élevé." },
    LAZY:      { name: "Nonchalant", emoji: "😴", type: "neg", desc: "Progresse plus lentement à l'entraînement." },
    HOTHEAD:   { name: "Tête brûlée", emoji: "🔥", type: "neg", desc: "Moral instable, risque de conflits." },
    LOYAL:     { name: "Loyal", emoji: "🤝", type: "pos", desc: "Reste fidèle au club, salaire raisonnable." },
    AMBITIOUS: { name: "Ambitieux", emoji: "🚀", type: "neg", desc: "Exige titres et temps de jeu, salaire gourmand." }
  };

  var OPPOSITES = { CLUTCH: "PRESSURE", PRESSURE: "CLUTCH", LOYAL: "AMBITIOUS", AMBITIOUS: "LOYAL" };

  LM.hasTrait = function (p, key) { return p.traits && p.traits.indexOf(key) >= 0; };

  // Attribue 0 à 2 traits selon le niveau et l'âge.
  LM.assignTraits = function (rng, ovr, age) {
    var keys = Object.keys(LM.TRAITS);
    var traits = [];
    var n = rng() < 0.25 ? 0 : (rng() < 0.7 ? 1 : 2);
    var posBias = LM.U.clamp((ovr - 60) / 40, 0, 1); // meilleurs joueurs = plus de traits positifs
    var attempts = 0;
    while (traits.length < n && attempts++ < 20) {
      var k = LM.U.pick(rng, keys);
      var t = LM.TRAITS[k];
      if (traits.indexOf(k) >= 0) continue;
      if (OPPOSITES[k] && traits.indexOf(OPPOSITES[k]) >= 0) continue;
      var wantPos = rng() < (0.45 + posBias * 0.4);
      if (t.type === "pos" && !wantPos) continue;
      if (t.type === "neg" && wantPos) continue;
      if (k === "PRODIGY" && age > 22) continue; // prodige réservé aux jeunes
      traits.push(k);
    }
    return traits;
  };

  LM.traitBadges = function (p) {
    if (!p.traits) return "";
    return p.traits.map(function (k) {
      var t = LM.TRAITS[k]; if (!t) return "";
      return '<span class="chip" title="' + t.desc + '" style="border-color:' +
        (t.type === "pos" ? "var(--green)" : "var(--red)") + '">' + t.emoji + " " + t.name + '</span>';
    }).join(" ");
  };
})(window.LM = window.LM || {});
