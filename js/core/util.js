/* =============================================================
 * Legends Manager — Utilitaires
 * ============================================================= */
(function (LM) {
  // Générateur pseudo-aléatoire à graine (déterministe -> sauvegardes reproductibles).
  LM.RNG = function (seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return (s >>> 0) / 4294967296;
    };
  };

  LM.U = {
    clamp: function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
    rint: function (rng, lo, hi) { return Math.floor(rng() * (hi - lo + 1)) + lo; },
    pick: function (rng, arr) { return arr[Math.floor(rng() * arr.length)]; },
    shuffle: function (rng, arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    uid: function () { return Math.random().toString(36).slice(2, 10); },
    // Formatte un nombre en €.
    money: function (n) {
      if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + " M€";
      if (n >= 1e3) return Math.round(n / 1e3) + " k€";
      return n + " €";
    },
    fmtDate: function (d) {
      var mois = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];
      return d.day + " " + mois[d.month - 1];
    }
  };

  // Couleur d'une note (vert/jaune/rouge) pour l'UI.
  LM.ratingColor = function (r) {
    if (r >= 85) return "ovr-elite";
    if (r >= 75) return "ovr-great";
    if (r >= 65) return "ovr-good";
    if (r >= 55) return "ovr-avg";
    return "ovr-low";
  };

  LM.ROLES = ["TOP", "JNG", "MID", "ADC", "SUP"];
  LM.ROLE_FR = { TOP: "Toplane", JNG: "Jungle", MID: "Midlane", ADC: "ADC", SUP: "Support" };
})(window.LM = window.LM || {});
