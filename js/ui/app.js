/* =============================================================
 * Legends Manager — Interface (application monopage)
 * ============================================================= */
(function (LM) {
  var UI = {};
  var G = null;
  var screen = "menu";
  var params = {};
  var lastLog = [];

  // ---------- Helpers ----------
  function app() { return document.getElementById("app"); }
  function h(strings) { return strings; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function ovrTag(o) { return '<span class="ovr ' + LM.ratingColor(o) + '">' + o + '</span>'; }
  function roleTag(r) { return '<span class="role-tag">' + r + '</span>'; }
  function teamMini(id) { var t = G.teams[id]; return t.flag + ' <b>' + esc(t.short) + '</b>'; }

  function nav(s, p) { screen = s; params = p || {}; render(); window.scrollTo(0, 0); }
  UI.nav = nav;

  function save() { LM.save(G); }

  // ---------- Rendu principal ----------
  function render() {
    if (screen === "menu") { app().innerHTML = renderMenu(); return; }
    if (screen === "newgame") { app().innerHTML = renderNewGame(); return; }
    if (G && G.fired) { app().innerHTML = renderFired(); return; }
    app().innerHTML = layout(renderScreen());
  }

  function renderFired() {
    var my = LM.myTeam(G);
    return '<div class="menu"><div class="logo" style="font-size:34px">Fin de l\'aventure</div>' +
      '<p>La direction de ' + my.flag + ' ' + esc(my.name) + ' vous a limogé.</p>' +
      '<div class="kpi" style="justify-content:center;margin:18px 0">' +
      '<div class="k"><div class="v">' + my.trophies.length + '</div><div class="l">Trophées</div></div>' +
      '<div class="k"><div class="v">' + G.history.length + '</div><div class="l">Saisons</div></div></div>' +
      '<button class="btn primary big" data-action="to-menu">Retour au menu principal</button>' +
      '<button class="btn big" data-action="export">⬇ Exporter la sauvegarde</button></div>';
  }

  // ---------- Menu ----------
  function renderMenu() {
    var cont = LM.hasSave() ? '<button class="btn primary big" data-action="continue">▶ Continuer la partie</button>' : '';
    return '' +
      '<div class="menu">' +
      '<div class="logo">LEGENDS MANAGER</div>' +
      '<div class="tag">Le manager d\'esport League of Legends — 100% hors-ligne, en français</div>' +
      cont +
      '<button class="btn big" data-action="newgame">＋ Nouvelle carrière</button>' +
      '<button class="btn big" data-action="import-trigger">📂 Importer une sauvegarde (.json)</button>' +
      '<input type="file" id="importfile" accept="application/json" style="display:none" />' +
      '<p class="muted" style="margin-top:30px;font-size:12px">' +
      'Sauvegarde automatique dans le navigateur. Utilisez « Exporter » pour garder un fichier sur votre PC.</p>' +
      '</div>';
  }

  // ---------- Nouvelle partie ----------
  function renderNewGame() {
    var lg = params.league || "LEC";
    var tabs = LM.LEAGUES.map(function (l) {
      return '<div class="pill ' + (l.id === lg ? "active" : "") + '" data-action="ng-league" data-lg="' + l.id + '">' +
        l.flag + ' ' + l.name + '</div>';
    }).join("");
    var cards = LM.teamsByLeague(lg).map(function (t) {
      var sel = params.selTeam === t.id ? "sel" : "";
      var avg = Math.round(t.players.reduce(function (s, p) { return s + (LM.SUPERSTARS[p.name] || 0); }, 0) / 5 + t.tier - 8);
      return '<div class="teamcard ' + sel + '" data-action="ng-pick" data-id="' + t.id + '">' +
        '<div class="flag">' + t.flag + '</div><div class="nm">' + esc(t.name) + '</div>' +
        '<div class="meta">' + t.league + ' · Niveau ' + t.tier + '</div>' +
        '<div class="meta" style="margin-top:6px">' + t.players.map(function (p) {
          return p.name; }).join(" · ") + '</div></div>';
    }).join("");
    var chosen = params.selTeam ? G_TEAM(params.selTeam) : null;
    return '<div class="content" style="max-width:1100px;margin:auto">' +
      '<div class="page-head"><h1>Nouvelle carrière</h1>' +
      '<button class="btn" data-action="to-menu">← Retour</button></div>' +
      '<div class="card"><h3>1. Votre nom de manager</h3>' +
      '<input id="mgrname" placeholder="Votre nom" value="' + esc(params.mgr || "") + '" ' +
      'style="background:var(--bg-2);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:10px;width:280px" /></div>' +
      '<div class="card" style="margin-top:16px"><h3>2. Choisissez votre équipe</h3>' +
      '<div class="leaguetabs">' + tabs + '</div>' +
      '<div class="teamgrid">' + cards + '</div></div>' +
      '<div style="margin-top:18px;text-align:center">' +
      '<button class="btn primary big" data-action="ng-start" ' + (chosen ? "" : "disabled") + '>' +
      (chosen ? '🚀 Démarrer avec ' + esc(chosen.name) : 'Sélectionnez une équipe') + '</button></div></div>';
  }
  function G_TEAM(id) { return LM.TEAMS.find(function (t) { return t.id === id; }); }

  // ---------- Layout (sidebar + contenu) ----------
  function layout(inner) {
    var my = LM.myTeam(G);
    var unread = G.inbox.filter(function (n) { return !n.read; }).length;
    var items = [
      ["hub", "🏠", "Accueil"],
      ["roster", "👥", "Effectif"],
      ["competition", "🏆", "Compétition"],
      ["meta", "📊", "Méta"],
      ["transfers", "💸", "Transferts"],
      ["training", "🎯", "Entraînement"],
      ["jeunes", "🎓", "Jeunes"],
      ["direction", "📋", "Direction" + (G.offers && G.offers.length ? '<span class="badge">' + G.offers.length + '</span>' : "")],
      ["club", "🏟️", "Club & Palmarès"],
      ["inbox", "📨", "Messages" + (unread ? '<span class="badge">' + unread + '</span>' : "")]
    ];
    var nav = items.map(function (it) {
      return '<div class="navitem ' + (screen === it[0] ? "active" : "") + '" data-action="nav" data-s="' + it[0] + '">' +
        '<span class="ico">' + it[1] + '</span><span>' + it[2] + '</span></div>';
    }).join("");
    return '<div class="layout"><div class="sidebar">' +
      '<div class="club"><div class="flag">' + my.flag + '</div><div class="nm">' + esc(my.short) + '</div>' +
      '<div class="lg">' + my.league + ' · ' + esc(G.manager) + '</div>' +
      '<div class="bud">💰 ' + LM.U.money(my.budget) + '</div></div>' +
      nav +
      '<div class="sidebar-actions">' +
      '<button class="btn sm" data-action="export">⬇ Exporter sauvegarde</button>' +
      '<button class="btn sm" data-action="to-menu">⏏ Menu principal</button></div>' +
      '</div><div class="content">' + inner + '</div></div>';
  }

  function renderScreen() {
    switch (screen) {
      case "hub": return renderHub();
      case "roster": return renderRoster();
      case "player": return renderPlayer();
      case "competition": return renderCompetition();
      case "meta": return renderMeta();
      case "transfers": return renderTransfers();
      case "training": return renderTraining();
      case "jeunes": return renderJeunes();
      case "direction": return renderDirection();
      case "club": return renderClub();
      case "inbox": return renderInbox();
      case "match": return renderMatch();
      default: return renderHub();
    }
  }

  // ---------- Accueil ----------
  function renderHub() {
    var desc = LM.Calendar.describe(G);
    var ps = LM.Calendar.playerSeries(G);
    var my = LM.myTeam(G);
    var matchCard;
    if (ps) {
      matchCard = '<div class="card nextmatch"><h3>Prochain match — ' + esc(ps.label) + ' (Bo' + ps.bo + ')</h3>' +
        '<div class="vs"><div class="team"><div class="flag">' + G.teams[ps.homeId].flag + '</div>' +
        '<div class="nm">' + esc(G.teams[ps.homeId].short) + '</div></div>' +
        '<div class="mid">VS</div>' +
        '<div class="team"><div class="flag">' + G.teams[ps.awayId].flag + '</div>' +
        '<div class="nm">' + esc(G.teams[ps.awayId].short) + '</div></div></div>' +
        '<div class="match-actions">' +
        '<button class="btn primary big" data-action="play">▶ Jouer le match</button>' +
        ' <button class="btn" data-action="quicksim">⏩ Sim. rapide</button></div></div>';
    } else {
      matchCard = '<div class="card nextmatch"><h3>' + esc(desc.title) + '</h3>' +
        '<p class="muted">Votre équipe n\'est pas concernée par ce tour.</p>' +
        '<div class="match-actions"><button class="btn primary big" data-action="simround">⏩ Simuler le tour</button></div></div>';
    }
    var logCard = lastLog.length ? '<div class="card"><h3>Derniers résultats</h3>' +
      lastLog.map(function (r) {
        var mine = r.winnerId === G.teamId || r.loserId === G.teamId;
        return '<div style="padding:4px 0;border-bottom:1px solid var(--line)' + (mine ? ';color:#fff;font-weight:700' : ';color:var(--muted)') + '">' +
          (mine ? "▶ " : "") + esc(r.text) + '</div>';
      }).join("") + '</div>' : "";

    var line = LM.Sim.lineup(my);
    var lineCard = '<div class="card"><h3>Votre cinq titulaire</h3><table><tbody>' +
      LM.ROLES.map(function (rr) { var p = line[rr]; if (!p) return "";
        return '<tr><td>' + roleTag(rr) + '</td><td>' + p.nat + ' <b>' + esc(p.name) + '</b></td>' +
          '<td class="num">' + ovrTag(p.ovr) + '</td><td class="num muted">Forme ' + (p.form >= 0 ? "+" : "") + p.form +
          '</td></tr>'; }).join("") +
      '</tbody></table></div>';

    var conf = G.board ? G.board.confidence : 60;
    var confCol = conf >= 60 ? "var(--green)" : conf >= 30 ? "var(--gold)" : "var(--red)";
    var obj = G.board && G.board.splitObjective ? G.board.splitObjective.desc : "";
    var injured = my.roster.filter(function (p) { return p.injury; });
    var injCard = injured.length ? '<div class="card" style="border-color:var(--red)"><h3>🩹 Infirmerie</h3>' +
      injured.map(function (p) { return '<div style="padding:3px 0">' + roleTag(p.role) + ' <b>' + esc(p.name) +
        '</b> — ' + esc(p.injury.type) + ' (' + p.injury.weeks + ' sem.)</div>'; }).join("") + '</div>' : "";

    return '<div class="page-head"><div><h1>' + esc(desc.title) + '</h1><div class="sub">' +
      esc(desc.sub) + ' · ' + LM.U.fmtDate(G.date) + ' ' + G.date.year + (obj ? ' · 🎯 ' + esc(obj) : "") + '</div></div>' +
      '<div class="kpi"><div class="k"><div class="v">' + LM.U.money(my.budget) + '</div><div class="l">Budget</div></div>' +
      '<div class="k"><div class="v" style="color:' + confCol + '">' + conf + '</div><div class="l">Confiance</div></div>' +
      '<div class="k"><div class="v">' + my.facilities + '/10</div><div class="l">Infrastructures</div></div>' +
      '<div class="k"><div class="v">' + my.trophies.length + '</div><div class="l">Trophées</div></div></div></div>' +
      '<div class="grid cols-2">' + matchCard + lineCard + '</div>' +
      '<div class="grid cols-2" style="margin-top:16px">' + logCard + injCard + '</div>';
  }

  // ---------- Effectif ----------
  function renderRoster() {
    var my = LM.myTeam(G);
    var line = LM.Sim.lineup(my);
    var starters = {}; LM.ROLES.forEach(function (r) { if (line[r]) starters[line[r].id] = true; });
    var roster = my.roster.slice().sort(function (a, b) {
      return LM.ROLES.indexOf(a.role) - LM.ROLES.indexOf(b.role) || b.ovr - a.ovr; });
    var rows = roster.map(function (p) {
      var tmini = (p.traits || []).map(function (k) { return LM.TRAITS[k] ? LM.TRAITS[k].emoji : ""; }).join("");
      return '<tr data-action="player" data-id="' + p.id + '" style="cursor:pointer">' +
        '<td data-label="Poste">' + roleTag(p.role) + (starters[p.id] ? ' <span class="chip" style="border-color:var(--accent);color:var(--accent)">Titulaire</span>' : '') + '</td>' +
        '<td data-label="Joueur">' + p.nat + ' <b>' + esc(p.name) + '</b> ' + tmini + (p.injury ? ' 🩹' : '') + '</td>' +
        '<td data-label="Âge" class="num">' + p.age + '</td>' +
        '<td data-label="OVR" class="num">' + ovrTag(p.ovr) + '</td>' +
        '<td data-label="POT" class="num">' + ovrTag(p.potential) + '</td>' +
        '<td data-label="Forme" class="num">' + (p.form >= 0 ? "+" : "") + p.form + '</td>' +
        '<td data-label="Cond." class="num">' + p.condition + '%</td>' +
        '<td data-label="Moral" class="num">' + p.morale + '</td>' +
        '<td data-label="Valeur" class="num muted">' + LM.U.money(p.value) + '</td></tr>';
    }).join("");
    return '<div class="page-head"><h1>Effectif — ' + esc(my.name) + '</h1>' +
      '<div class="sub">' + my.roster.length + ' joueurs · Masse salariale ' +
      LM.U.money(my.roster.reduce(function (s, p) { return s + p.salary; }, 0)) + '/an</div></div>' +
      '<div class="card"><table class="row-hover stack-table"><thead><tr><th>Poste</th><th>Joueur</th><th class="num">Âge</th>' +
      '<th class="num">OVR</th><th class="num">POT</th><th class="num">Forme</th><th class="num">Cond.</th>' +
      '<th class="num">Moral</th><th class="num">Valeur</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="muted" style="margin-top:8px">Cliquez sur un joueur pour voir sa fiche détaillée.</p></div>';
  }

  // ---------- Fiche joueur ----------
  function renderPlayer() {
    var my = LM.myTeam(G);
    var p = my.roster.find(function (x) { return x.id === params.id; });
    if (!p) return renderRoster();
    var attrs = LM.Training.ATTRS;
    var bars = Object.keys(attrs).map(function (k) {
      return '<div class="attr"><div class="lab"><span>' + attrs[k] + '</span><span>' + p.attrs[k] + '</span></div>' +
        '<div class="bar"><span style="width:' + p.attrs[k] + '%"></span></div></div>'; }).join("");
    var trained = G.trainingUsed[p.id];
    var trainSel = '<select id="trainattr">' + Object.keys(attrs).map(function (k) {
      return '<option value="' + k + '">' + attrs[k] + '</option>'; }).join("") + '</select>';
    var pool = p.champs.slice().sort(function (a, b) {
      return ((p.mastery[b] || 0) - (p.mastery[a] || 0)); });
    var champBars = pool.map(function (c) {
      var m = Math.round((p.mastery && p.mastery[c]) || 0);
      return '<div class="attr"><div class="lab"><span>' + esc(c) + ' ' + clsTag(LM.CLS[c]) +
        ' <span class="muted">méta ' + LM.Meta.tierLetter(LM.Meta.tier(G, c)) + '</span></span><span>' + m + '</span></div>' +
        '<div class="bar"><span style="width:' + m + '%"></span></div></div>'; }).join("");
    var champSel = '<select id="champtrain">' + (LM.CHAMPIONS_BY_ROLE[p.role] || []).map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + ' — ' + LM.CLASSES[LM.CLS[c]] +
        ' (méta ' + LM.Meta.tierLetter(LM.Meta.tier(G, c)) + ')</option>'; }).join("") + '</select>';
    return '<div class="page-head"><div><h1>' + p.nat + ' ' + esc(p.name) + ' ' + ovrTag(p.ovr) + '</h1>' +
      '<div class="sub">' + LM.ROLE_FR[p.role] + ' · ' + p.age + ' ans · Potentiel ' +
      (p.potentialKnown ? p.potential : "?") + ' · Valeur ' + LM.U.money(p.value) +
      ' · Contrat ' + (p.contract || 0) + ' an(s) · Salaire ' + LM.U.money(p.salary) + '/an</div>' +
      '<div style="margin-top:6px">' + (LM.traitBadges(p) || '<span class="muted" style="font-size:12px">Aucun trait marquant</span>') +
      (p.injury ? ' <span class="chip" style="border-color:var(--red);color:var(--red)">🩹 ' + esc(p.injury.type) + ' (' + p.injury.weeks + " sem.)</span>" : "") +
      '</div></div>' +
      '<button class="btn" data-action="nav" data-s="roster">← Effectif</button></div>' +
      '<div class="grid cols-2"><div class="card"><h3>Attributs</h3>' + bars +
      '<h3 style="margin-top:16px">État</h3>' +
      '<div class="kpi"><div class="k"><div class="v">' + (p.form >= 0 ? "+" : "") + p.form + '</div><div class="l">Forme</div></div>' +
      '<div class="k"><div class="v">' + p.condition + '%</div><div class="l">Condition</div></div>' +
      '<div class="k"><div class="v">' + p.morale + '</div><div class="l">Moral</div></div></div></div>' +
      '<div class="card"><h3>Maîtrise des champions</h3>' + (champBars || '<p class="muted">Aucun champion maîtrisé.</p>') +
      '<h3 style="margin-top:16px">Entraînement (1 séance / tour)</h3>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">' + trainSel +
      '<button class="btn primary" data-action="train" data-id="' + p.id + '" ' + (trained ? "disabled" : "") + '>' +
      (trained ? "Fait" : "Attribut") + '</button></div>' +
      '<div style="display:flex;gap:8px;align-items:center">' + champSel +
      '<button class="btn" data-action="train-champ" data-id="' + p.id + '" ' + (trained ? "disabled" : "") + '>Champion</button></div>' +
      '<h3 style="margin-top:16px">Contrat & mental</h3>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<select id="renewYears"><option value="1">+1 an</option><option value="2">+2 ans</option><option value="3">+3 ans</option></select>' +
      '<button class="btn" data-action="renew" data-id="' + p.id + '">Prolonger</button>' +
      '<button class="btn" data-action="work-trait" data-id="' + p.id + '" ' + (trained ? "disabled" : "") + '>🧠 Psychologue</button></div>' +
      '<div style="margin-top:14px"><button class="btn danger sm" data-action="release" data-id="' + p.id + '">Libérer / vendre le joueur</button></div>' +
      '</div></div>';
  }

  // ---------- Méta (tier list) ----------
  function renderMeta() {
    var my = LM.myTeam(G);
    var cols = LM.ROLES.map(function (r) {
      var line = LM.Sim.lineup(my)[r];
      var champs = (LM.CHAMPIONS_BY_ROLE[r] || []).slice()
        .sort(function (a, b) { return LM.Meta.tier(G, b) - LM.Meta.tier(G, a); }).slice(0, 14);
      var rows = champs.map(function (c) {
        var t = LM.Meta.tier(G, c);
        var mast = line && line.mastery && line.mastery[c] ? Math.round(line.mastery[c]) : 0;
        return '<tr><td><b>' + esc(c) + '</b><br><span style="font-size:11px">' + clsTag(LM.CLS[c]) + '</span></td>' +
          '<td class="num"><span class="ovr ' + (t >= 8 ? "ovr-elite" : t >= 6 ? "ovr-great" : t >= 4 ? "ovr-good" : "ovr-low") +
          '">' + LM.Meta.tierLetter(t) + '</span></td>' +
          '<td class="num muted">' + (mast || "·") + '</td></tr>'; }).join("");
      return '<div class="card"><h3>' + LM.ROLE_FR[r] + '</h3>' +
        '<table><thead><tr><th>Champion</th><th class="num">Tier</th><th class="num">Maît.</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>';
    }).join("");
    return '<div class="page-head"><div><h1>Méta — Patch 15.' + G.patchNote + '</h1>' +
      '<div class="sub">Tier list du moment. Elle change à chaque split : adaptez vos drafts et entraînements.</div></div></div>' +
      '<p class="muted">Contres : Assassin ▶ Mage/Tireur · Tireur/Mage ▶ Tank/Combattant · Tank/Combattant ▶ Assassin · Enchanteur protège des Assassins.</p>' +
      '<div class="grid meta-grid">' + cols + '</div>';
  }

  // ---------- Compétition (classement + bracket) ----------
  function renderCompetition() {
    var st = G.season.stage;
    var desc = LM.Calendar.describe(G);
    var html = '<div class="page-head"><div><h1>' + esc(desc.title) + '</h1><div class="sub">' + esc(desc.sub) + '</div></div></div>';
    if (st && st.type === "split") {
      var sorted = LM.Calendar.sortedStandings(st);
      html += '<div class="card"><h3>Classement — ' + st.league + '</h3><table><thead><tr><th>#</th><th>Équipe</th>' +
        '<th class="num">V</th><th class="num">D</th><th class="num">Parties</th><th class="num">Diff</th></tr></thead><tbody>' +
        sorted.map(function (s, i) {
          var t = G.teams[s.id];
          return '<tr class="' + (s.id === G.teamId ? "me" : "") + '"><td class="num">' + (i + 1) + '</td>' +
            '<td>' + t.flag + ' ' + esc(t.name) + '</td><td class="num">' + s.w + '</td><td class="num">' + s.l + '</td>' +
            '<td class="num">' + s.gw + '-' + s.gl + '</td><td class="num">' + (s.gw - s.gl >= 0 ? "+" : "") + (s.gw - s.gl) + '</td></tr>';
        }).join("") + '</tbody></table></div>';
    }
    if (st && st.bracket) html += '<div class="card" style="margin-top:16px"><h3>Tableau final</h3>' + renderBracket(st.bracket) + '</div>';
    if (st && st.type === "intl") {
      html += '<div class="card" style="margin-top:16px"><h3>Équipes qualifiées</h3><p>' +
        st.qualified.map(function (id) { return '<span class="chip">' + G.teams[id].flag + ' ' + esc(G.teams[id].short) + '</span>'; }).join(" ") + '</p></div>';
    }
    return html;
  }

  function renderBracket(br) {
    var cols = br.rounds.map(function (round, ri) {
      var matches = round.map(function (m) {
        return bteamMatch(m); }).join("");
      return '<div class="bcol"><h4>' + (br.labels[ri] || ("Tour " + (ri + 1))) + '</h4>' + matches + '</div>';
    });
    if (br.champion) {
      cols.push('<div class="bcol"><h4>Champion</h4><div class="bmatch"><div class="bteam win mine' +
        (br.champion === G.teamId ? "" : "") + '">' + teamMini(br.champion) + ' 🏆</div></div></div>');
    }
    return '<div class="bracket">' + cols.join("") + '</div>';
  }
  function bteamMatch(m) {
    function side(id) {
      if (!id) return '<div class="bteam muted">—</div>';
      var win = m.winner === id ? "win" : "";
      var mine = id === G.teamId ? "mine" : "";
      var sc = m.res ? (id === m.res.homeId ? m.res.score[0] : m.res.score[1]) : "";
      return '<div class="bteam ' + win + ' ' + mine + '">' + teamMini(id) + '<span>' + sc + '</span></div>';
    }
    return '<div class="bmatch">' + side(m.a) + side(m.b) + '</div>';
  }

  // ---------- Transferts ----------
  function renderTransfers() {
    var my = LM.myTeam(G);
    var roleFilter = params.role || "ALL";
    var pills = ["ALL"].concat(LM.ROLES).map(function (r) {
      return '<div class="pill ' + (roleFilter === r ? "active" : "") + '" data-action="tr-role" data-r="' + r + '">' +
        (r === "ALL" ? "Tous" : r) + '</div>'; }).join("");
    var market = LM.Transfers.market(G).filter(function (e) {
      return roleFilter === "ALL" || e.p.role === roleFilter; })
      .sort(function (a, b) { return b.p.ovr - a.p.ovr; }).slice(0, 60);
    var rows = market.map(function (e) {
      var p = e.p;
      return '<tr><td data-label="Poste">' + roleTag(p.role) + '</td><td data-label="Joueur">' + p.nat + ' <b>' + esc(p.name) + '</b></td>' +
        '<td data-label="Âge" class="num">' + p.age + '</td><td data-label="OVR" class="num">' + ovrTag(p.ovr) + '</td><td data-label="POT" class="num">' + ovrTag(p.potential) + '</td>' +
        '<td data-label="Club">' + (e.free ? '<span class="chip">Libre</span>' : G.teams[e.fromTeam].short) + '</td>' +
        '<td data-label="Prix" class="num">' + LM.U.money(e.fee) + '</td>' +
        '<td data-label="Action" class="action-cell"><button class="btn sm primary" data-action="buy" data-id="' + p.id + '" ' +
        (my.budget < e.fee ? "disabled" : "") + '>Acheter</button></td></tr>';
    }).join("");
    return '<div class="page-head"><div><h1>Marché des transferts</h1>' +
      '<div class="sub">Budget : <b style="color:var(--gold)">' + LM.U.money(my.budget) + '</b></div></div></div>' +
      '<div class="leaguetabs">' + pills + '</div>' +
      '<div class="card"><table class="row-hover stack-table"><thead><tr><th>Poste</th><th>Joueur</th><th class="num">Âge</th>' +
      '<th class="num">OVR</th><th class="num">POT</th><th>Club</th><th class="num">Prix</th><th></th></tr></thead><tbody>' +
      rows + '</tbody></table></div>';
  }

  // ---------- Entraînement ----------
  function renderTraining() {
    var my = LM.myTeam(G);
    var attrs = LM.Training.ATTRS;
    var rows = my.roster.slice().sort(function (a, b) {
      return LM.ROLES.indexOf(a.role) - LM.ROLES.indexOf(b.role); }).map(function (p) {
      var trained = G.trainingUsed[p.id];
      var sel = '<select id="ta_' + p.id + '">' + Object.keys(attrs).map(function (k) {
        return '<option value="' + k + '">' + attrs[k] + '</option>'; }).join("") + '</select>';
      var st = p.injury ? '<span class="chip" style="border-color:var(--red);color:var(--red)">🩹 blessé</span>' : (p.condition + "%");
      return '<tr><td data-label="Poste">' + roleTag(p.role) + '</td><td data-label="Joueur">' + p.nat + ' <b>' + esc(p.name) + '</b></td>' +
        '<td data-label="OVR/POT" class="num">' + ovrTag(p.ovr) + '→' + ovrTag(p.potential) + '</td>' +
        '<td data-label="Cond." class="num">' + st + '</td>' +
        '<td data-label="Attribut">' + sel + '</td>' +
        '<td data-label="Action" class="action-cell"><button class="btn sm primary" data-action="train-row" data-id="' + p.id + '" ' +
        (trained || p.injury ? "disabled" : "") + '>' + (trained ? "✓" : "Entraîner") + '</button></td></tr>';
    }).join("");

    // Staff
    var staff = Object.keys(LM.Club.STAFF).map(function (k) {
      var lvl = my.staff[k], cost = lvl * 200000;
      return '<tr><td data-label="Staff">' + LM.Club.STAFF[k] + '</td><td data-label="Niveau" class="num">' + lvl + '/10</td>' +
        '<td data-label="Action" class="action-cell"><button class="btn sm" data-action="upg-staff" data-key="' + k + '" ' +
        (lvl >= 10 || my.budget < cost ? "disabled" : "") + '>' + (lvl >= 10 ? "Max" : "⬆ " + LM.U.money(cost)) + '</button></td></tr>';
    }).join("");
    var intens = [[1, "Léger"], [2, "Normal"], [3, "Intensif"]].map(function (o) {
      return '<div class="pill ' + (my.intensity === o[0] ? "active" : "") + '" data-action="set-intensity" data-v="' + o[0] + '">' + o[1] + '</div>';
    }).join("");

    // Mentorat
    var ment = (my.mentorships || []).map(function (m) {
      var me = my.roster.find(function (x) { return x.id === m.mentorId; });
      var yo = my.roster.find(function (x) { return x.id === m.menteeId; });
      if (!me || !yo) return "";
      return '<tr><td data-label="Mentor">' + esc(me.name) + ' 🎓</td><td data-label="Jeune">→ ' + esc(yo.name) + '</td>' +
        '<td data-label="Action" class="action-cell"><button class="btn sm danger" data-action="clear-mentor" data-id="' + yo.id + '">×</button></td></tr>';
    }).join("");
    var opts = my.roster.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + ' (' + p.age + ' ans)</option>'; }).join("");

    return '<div class="page-head"><div><h1>Entraînement & Staff</h1>' +
      '<div class="sub">1 séance par joueur et par tour. Infrastructures <b>' + my.facilities + '/10</b> · Intensité ↑ = gains ↑ mais fatigue & blessures ↑</div></div>' +
      '<button class="btn gold" data-action="upgrade">⬆ Infrastructures (' + LM.U.money(my.facilities * 250000) + ')</button></div>' +
      '<div class="card" style="margin-bottom:16px"><h3>Intensité d\'entraînement</h3><div class="leaguetabs">' + intens + '</div></div>' +
      '<div class="card"><table class="stack-table"><thead><tr><th>Poste</th><th>Joueur</th><th class="num">OVR/POT</th>' +
      '<th class="num">Cond.</th><th>Attribut</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="grid cols-2" style="margin-top:16px">' +
      '<div class="card"><h3>Staff technique</h3><table class="stack-table"><tbody>' + staff + '</tbody></table></div>' +
      '<div class="card"><h3>Mentorat (progression passive des jeunes)</h3>' +
      '<table class="stack-table"><tbody>' + (ment || '<tr><td data-label="Mentorat" class="muted">Aucun binôme.</td></tr>') + '</tbody></table>' +
      '<div style="display:flex;gap:6px;align-items:center;margin-top:10px;flex-wrap:wrap">' +
      '<select id="mentorSel" style="flex:1">' + opts + '</select><span>encadre</span>' +
      '<select id="menteeSel" style="flex:1">' + opts + '</select>' +
      '<button class="btn sm primary" data-action="set-mentor">OK</button></div>' +
      '<p class="muted" style="font-size:12px;margin-top:6px">Un mentor avec le trait 🎓 Mentor est bien plus efficace.</p></div></div>';
  }

  // ---------- Jeunes (académie + scouting) ----------
  function renderJeunes() {
    var my = LM.myTeam(G);
    var acad = (my.academy.prospects || []).map(function (p) {
      return '<tr><td data-label="Poste">' + roleTag(p.role) + '</td><td data-label="Nom"><b>' + esc(p.name) + '</b></td>' +
        '<td data-label="Âge" class="num">' + p.age + '</td><td data-label="OVR/POT" class="num">' + ovrTag(p.ovr) + '→' + ovrTag(p.potential) + '</td>' +
        '<td data-label="Traits">' + LM.traitBadges(p) + '</td>' +
        '<td data-label="Action" class="action-cell"><button class="btn sm primary" data-action="promote" data-id="' + p.id + '">Promouvoir</button> ' +
        '<button class="btn sm danger" data-action="release-prospect" data-id="' + p.id + '">×</button></td></tr>';
    }).join("") || '<tr><td data-label="Académie" colspan="6" class="muted">Aucun jeune. Améliorez l\'académie ; de nouveaux talents arrivent chaque intersaison.</td></tr>';

    var scout = (G.scoutPool || []).slice().sort(function (a, b) {
      return (b.potentialKnown ? b.potential : 0) - (a.potentialKnown ? a.potential : 0); }).map(function (p) {
      var pot = p.potentialKnown ? (ovrTag(p.ovr) + '→' + ovrTag(p.potential)) : (ovrTag(p.ovr) + '→<span class="muted">?</span>');
      var traits = p.potentialKnown ? LM.traitBadges(p) : '<span class="muted">non scouté</span>';
      var fee = Math.round(p.value * 0.5) + 30000;
      return '<tr><td data-label="Poste">' + roleTag(p.role) + '</td><td data-label="Nom"><b>' + esc(p.name) + '</b></td><td data-label="Âge" class="num">' + p.age + '</td>' +
        '<td data-label="OVR/POT" class="num">' + pot + '</td><td data-label="Traits">' + traits + '</td>' +
        '<td data-label="Action" class="action-cell">' + (p.potentialKnown ? "" : '<button class="btn sm" data-action="scout" data-id="' + p.id + '">🔭 Scouter (40 k€)</button> ') +
        '<button class="btn sm primary" data-action="sign-prospect" data-id="' + p.id + '" ' +
        (my.budget < fee ? "disabled" : "") + '>Signer ' + LM.U.money(fee) + '</button></td></tr>';
    }).join("");

    return '<div class="page-head"><div><h1>Jeunes & Scouting</h1>' +
      '<div class="sub">Budget : <b style="color:var(--gold)">' + LM.U.money(my.budget) + '</b></div></div>' +
      '<button class="btn gold" data-action="upgrade-academy">⬆ Académie niv. ' + my.academy.level + '/10 (' +
      LM.U.money(my.academy.level * 300000) + ')</button></div>' +
      '<div class="card"><h3>🎓 Académie — vos jeunes formés</h3><table class="stack-table"><thead><tr><th>Poste</th><th>Nom</th>' +
      '<th class="num">Âge</th><th class="num">OVR/POT</th><th>Traits</th><th></th></tr></thead><tbody>' + acad + '</tbody></table></div>' +
      '<div class="card" style="margin-top:16px"><h3>🔭 Scouting — talents à découvrir</h3>' +
      '<p class="muted">Scoutez pour révéler le potentiel et les traits réels avant de signer.</p>' +
      '<table class="stack-table"><thead><tr><th>Poste</th><th>Nom</th><th class="num">Âge</th><th class="num">OVR/POT</th><th>Traits</th><th></th></tr></thead>' +
      '<tbody>' + scout + '</tbody></table></div>';
  }

  // ---------- Direction (board) ----------
  function renderDirection() {
    var b = G.board;
    var conf = b.confidence;
    var col = conf >= 60 ? "var(--green)" : conf >= 30 ? "var(--gold)" : "var(--red)";
    var offers = (G.offers || []).map(function (o) {
      var p = LM.myTeam(G).roster.find(function (x) { return x.id === o.playerId; });
      if (!p) return "";
      return '<tr><td data-label="Poste">' + roleTag(p.role) + '</td><td data-label="Joueur"><b>' + esc(p.name) + '</b> ' + ovrTag(p.ovr) + '</td>' +
        '<td data-label="De">' + G.teams[o.fromTeam].flag + ' ' + esc(G.teams[o.fromTeam].short) + '</td>' +
        '<td data-label="Montant" class="num gold">' + LM.U.money(o.fee) + '</td>' +
        '<td data-label="Action" class="action-cell"><button class="btn sm primary" data-action="accept-bid" data-id="' + o.id + '">Vendre</button> ' +
        '<button class="btn sm" data-action="reject-bid" data-id="' + o.id + '">Refuser</button></td></tr>';
    }).join("") || '<tr><td data-label="Offres" colspan="5" class="muted">Aucune offre en cours.</td></tr>';

    return '<div class="page-head"><h1>Direction du club</h1></div>' +
      '<div class="grid cols-2"><div class="card"><h3>Confiance de la direction</h3>' +
      '<div style="font-size:46px;font-weight:900;color:' + col + '">' + conf + '<span style="font-size:18px">/100</span></div>' +
      '<div class="bar" style="height:12px"><span style="width:' + conf + '%;background:' + col + '"></span></div>' +
      (b.warned ? '<p style="color:var(--red);margin-top:10px">⚠️ Vous êtes sous pression : des résultats sont attendus.</p>' : '') +
      '<h3 style="margin-top:16px">Objectifs</h3>' +
      (b.splitObjective ? '<div class="news"><div class="t">Split en cours</div><div class="b">' + esc(b.splitObjective.desc) + '</div></div>' : '') +
      (b.seasonObjective ? '<div class="news"><div class="t">Saison</div><div class="b">' + esc(b.seasonObjective.desc) + '</div></div>' : '') +
      '</div>' +
      '<div class="card"><h3>💼 Offres reçues pour vos joueurs</h3>' +
      '<table class="stack-table"><thead><tr><th>Poste</th><th>Joueur</th><th>De</th><th class="num">Montant</th><th></th></tr></thead>' +
      '<tbody>' + offers + '</tbody></table></div></div>';
  }

  // ---------- Club & palmarès ----------
  function renderClub() {
    var my = LM.myTeam(G);
    var tro = my.trophies.length ? my.trophies.slice().reverse().map(function (t) {
      return '<div class="news"><div class="t">' + (t.major ? "🌍 " : "🏆 ") + esc(t.title) + ' ' + t.year + '</div></div>';
    }).join("") : '<p class="muted">Aucun trophée pour le moment. À vous de jouer !</p>';
    // Classement de tous les clubs par puissance
    var ranking = LM.TEAMS.map(function (t) { return { id: t.id, pw: LM.Sim.power(G.teams[t.id], 0) }; })
      .sort(function (a, b) { return b.pw - a.pw; }).slice(0, 12);
    var rk = ranking.map(function (r, i) {
      var t = G.teams[r.id];
      return '<tr class="' + (r.id === G.teamId ? "me" : "") + '"><td class="num">' + (i + 1) + '</td>' +
        '<td>' + t.flag + ' ' + esc(t.name) + '</td><td>' + t.league + '</td>' +
        '<td class="num">' + Math.round(r.pw) + '</td></tr>'; }).join("");
    return '<div class="page-head"><h1>' + my.flag + ' ' + esc(my.name) + '</h1></div>' +
      '<div class="grid cols-2"><div class="card"><h3>Palmarès</h3>' + tro + '</div>' +
      '<div class="card"><h3>Classement mondial des clubs (puissance)</h3><table><tbody>' + rk + '</tbody></table></div></div>';
  }

  // ---------- Messages ----------
  function renderInbox() {
    G.inbox.forEach(function (n) { n.read = true; });
    save();
    var list = G.inbox.length ? G.inbox.map(function (n) {
      return '<div class="news"><div class="t">' + esc(n.title) + '</div>' +
        '<div class="d">' + LM.U.fmtDate(n.date) + ' ' + n.date.year + '</div>' +
        '<div class="b">' + esc(n.body) + '</div></div>'; }).join("") : '<p class="muted">Aucun message.</p>';
    return '<div class="page-head"><h1>Messages</h1></div>' + list;
  }

  // ---------- Écran de match (draft pick & ban + résultat) ----------
  function clsTag(cls) {
    var col = { TANK: "#8bd3ff", BRUISER: "#ffb46b", ASSASSIN: "#ff6b8b",
      MAGE: "#c08bff", MARKSMAN: "#6dffb0", ENCHANTER: "#ffe08b" }[cls] || "#aaa";
    return '<span class="role-tag" style="border-color:' + col + ';color:' + col + '">' +
      (LM.CLASSES[cls] || cls) + '</span>';
  }

  function renderMatch() {
    var ps = params.ps;
    if (!ps) return renderHub();
    var myId = ps.homeId === G.teamId ? ps.homeId : (ps.awayId === G.teamId ? ps.awayId : ps.homeId);
    var oppId = myId === ps.homeId ? ps.awayId : ps.homeId;
    if (params.result) return renderMatchResult(ps, myId, oppId);
    var draft = params.draft;
    if (draft && draft.phase === "DONE") return renderDraftReview(ps, draft);
    return renderDraftBoard(ps, draft);
  }

  // Bandeau des deux compos pendant/après le draft.
  function draftPanels(draft) {
    function side(label, teamId, picks, bans, mine) {
      var t = G.teams[teamId];
      var rows = LM.ROLES.map(function (r) {
        var c = picks[r];
        var p = LM.Sim.lineup(t)[r];
        return '<tr><td>' + roleTag(r) + '</td><td>' + (p ? esc(p.name) : "—") + '</td>' +
          '<td>' + (c ? '<b>' + esc(c) + '</b> ' + clsTag(LM.CLS[c]) : '<span class="muted">…</span>') + '</td></tr>';
      }).join("");
      var bansTxt = bans.length ? bans.map(function (b) { return '<span class="chip" style="opacity:.6;text-decoration:line-through">' + esc(b) + '</span>'; }).join(" ") : '<span class="muted">—</span>';
      return '<div class="card ' + (mine ? "draft-panel-player" : "draft-panel-enemy") + '">' +
        '<h3>' + label + ' — ' + t.flag + ' ' + esc(t.short) + '</h3>' +
        '<table><tbody>' + rows + '</tbody></table>' +
        '<div style="margin-top:8px"><span class="muted" style="font-size:12px">Bans :</span> ' + bansTxt + '</div></div>';
    }
    return '<div class="grid cols-2">' +
      side("🔵 Vous", draft.aId, draft.picks.A, draft.bans.A, true) +
      side("🔴 Adversaire", draft.bId, draft.picks.B, draft.bans.B, false) + '</div>';
  }

  function renderDraftBoard(ps, draft) {
    var head = '<div class="page-head"><div><h1>Draft — ' + esc(ps.label) + ' (Bo' + ps.bo + ')</h1>' +
      '<div class="sub">' + G.teams[draft.aId].flag + ' ' + esc(G.teams[draft.aId].name) +
      ' vs ' + G.teams[draft.bId].flag + ' ' + esc(G.teams[draft.bId].name) + '</div></div></div>';
    var panel = '';
    if (draft.phase === "BAN") {
      var recs = LM.Draft.recommendBans(G, draft, "A").slice(0, 10);
      var bansLeft = 3 - draft.bans.A.length;
      panel = '<div class="card"><h3>⛔ Phase de bans — bannissez un champion adverse (' +
        (draft.bans.A.length + 1) + '/3)</h3>' +
        '<p class="muted">Bannissez les champions forts ou maîtrisés par l\'adversaire. ' +
        'Indices : tier méta + maîtrise du joueur en face.</p>' +
        '<table class="row-hover stack-table"><thead><tr><th>Champion</th><th>Classe</th><th class="num">Méta</th>' +
        '<th class="num">Maîtrise adv.</th><th>Poste</th><th></th></tr></thead><tbody>' +
        recs.map(function (b) {
          return '<tr><td data-label="Champion"><b>' + esc(b.champ) + '</b></td><td data-label="Classe">' + clsTag(b.cls) + '</td>' +
            '<td data-label="Méta" class="num">' + LM.Meta.tierLetter(b.meta) + '</td>' +
            '<td data-label="Maîtrise adv." class="num">' + b.mastery + '</td><td data-label="Poste">' + roleTag(b.role) + '</td>' +
            '<td data-label="Action" class="action-cell"><button class="btn sm danger" data-action="ban" data-champ="' + esc(b.champ) + '">Bannir</button></td></tr>';
        }).join("") + '</tbody></table>' +
        '<div style="margin-top:10px"><button class="btn sm" data-action="ban-skip">Passer ce ban</button></div></div>';
    } else if (draft.phase === "PICK") {
      var role = LM.Draft.curRole(draft);
      var p = LM.Sim.lineup(G.teams[draft.aId])[role];
      var recs2 = LM.Draft.recommendPicks(G, draft, role).slice(0, 16);
      panel = '<div class="card"><h3>✅ À vous de choisir — ' + LM.ROLE_FR[role] + ' (' +
        (p ? esc(p.name) : "") + ')</h3>' +
        '<p class="muted">Triés par pertinence : méta forte, bonne maîtrise et contre de la compo adverse. ' +
        '★ = champion du pool du joueur.</p>' +
        '<table class="row-hover stack-table"><thead><tr><th>Champion</th><th>Classe</th><th class="num">Méta</th>' +
        '<th class="num">Maîtrise</th><th class="num">Note</th><th></th></tr></thead><tbody>' +
        recs2.map(function (rc) {
          var star = (p && p.champs.indexOf(rc.champ) >= 0) ? "★ " : "";
          return '<tr><td data-label="Champion">' + star + '<b>' + esc(rc.champ) + '</b></td><td data-label="Classe">' + clsTag(rc.cls) + '</td>' +
            '<td data-label="Méta" class="num">' + LM.Meta.tierLetter(rc.meta) + '</td>' +
            '<td data-label="Maîtrise" class="num">' + rc.mastery + '</td>' +
            '<td data-label="Note" class="num">' + (rc.score >= 0 ? "+" : "") + rc.score.toFixed(1) + '</td>' +
            '<td data-label="Action" class="action-cell"><button class="btn sm primary" data-action="pick" data-champ="' + esc(rc.champ) + '">Choisir</button></td></tr>';
        }).join("") + '</tbody></table></div>';
    }
    return head + draftPanels(draft) + '<div style="margin-top:16px">' + panel + '</div>';
  }

  function renderDraftReview(ps, draft) {
    var picks = LM.Draft.toPicks(draft);
    var rA = LM.Meta.draftRating(G, G.teams[draft.aId], draft.picks.A, draft.picks.B);
    var rB = LM.Meta.draftRating(G, G.teams[draft.bId], draft.picks.B, draft.picks.A);
    return '<div class="page-head"><div><h1>Draft terminée — ' + esc(ps.label) + '</h1>' +
      '<div class="sub">Vérifiez vos contres puis lancez la série.</div></div></div>' +
      draftPanels(draft) +
      '<div class="card" style="margin-top:16px"><h3>Analyse des compositions</h3>' +
      '<div class="grid cols-2">' + ratingBox("🔵 Vous", rA) + ratingBox("🔴 Adversaire", rB) + '</div>' +
      '<div style="text-align:center;margin-top:16px">' +
      '<button class="btn primary big" data-action="run-series">⚔️ Lancer la série (Bo' + ps.bo + ')</button></div></div>';
  }

  function ratingBox(label, r) {
    function sgn(v) { return (v >= 0 ? "+" : "") + v.toFixed(1); }
    return '<div class="analysis-box"><h3>' + label + '</h3>' +
      '<div class="kpi"><div class="k"><div class="v">' + Math.round(r.power) + '</div><div class="l">Puissance</div></div>' +
      '<div class="k"><div class="v">' + sgn(r.comp) + '</div><div class="l">Compo</div></div>' +
      '<div class="k"><div class="v" style="color:' + (r.counter >= 0 ? "var(--green)" : "var(--red)") + '">' +
      sgn(r.counter) + '</div><div class="l">Contres</div></div></div>' +
      '<table style="margin-top:8px"><tbody>' + r.roleDetail.map(function (d) {
        return '<tr><td>' + roleTag(d.role) + '</td><td><b>' + esc(d.champ) + '</b> ' + clsTag(d.cls) + '</td>' +
      '<td class="num muted">M ' + d.mastery + '</td><td class="num muted">Méta ' + LM.Meta.tierLetter(d.meta) + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function renderMatchResult(ps, myId, oppId) {
    var res = params.result;
    var won = res.winnerId === myId;
    var myScore = myId === res.homeId ? res.score[0] : res.score[1];
    var opScore = myId === res.homeId ? res.score[1] : res.score[0];
    var games = res.games.map(function (g, i) {
      var hw = g.homeWin;
      var winId = hw ? res.homeId : res.awayId;
      return '<div class="g">Partie ' + (i + 1) + ' — <b>' + esc(G.teams[winId].short) + '</b> gagne · ' +
        g.kills[0] + '/' + g.kills[1] + ' kills · ' + g.duration + ' min</div>'; }).join("");
    var g0 = res.games[0];
    var analysis = "";
    if (g0 && g0.ratingH) {
      var myR = myId === res.homeId ? g0.ratingH : g0.ratingA;
      var opR = myId === res.homeId ? g0.ratingA : g0.ratingH;
      analysis = '<div class="card" style="margin-top:16px"><h3>Analyse du draft</h3>' +
        '<div class="grid cols-2">' + ratingBox("🔵 Vous", myR) + ratingBox("🔴 Adversaire", opR) + '</div></div>';
    }
    return '<div class="page-head"><h1>Résultat — ' + esc(ps.label) + '</h1></div>' +
      '<div class="card"><div class="win-banner ' + (won ? "win" : "loss") + '">' +
      (won ? "VICTOIRE 🎉" : "DÉFAITE") + '</div>' +
      '<div class="scoreboard">' + G.teams[myId].short + ' ' + myScore + ' — ' + opScore + ' ' + G.teams[oppId].short + '</div>' +
      '<div class="gamelog" style="margin-top:16px">' + games + '</div>' +
      '<div style="text-align:center;margin-top:18px"><button class="btn primary big" data-action="after-match">Continuer ▶</button></div></div>' +
      analysis;
  }

  // ---------- Gestion des actions ----------
  function handle(action, d, e) {
    switch (action) {
      case "newgame": nav("newgame", { league: "LEC" }); break;
      case "to-menu": screen = "menu"; render(); break;
      case "continue": G = LM.load(); if (G) { UI.G = G; nav("hub"); } else toast("Aucune sauvegarde."); break;
      case "import-trigger": document.getElementById("importfile").click(); break;
      case "export": LM.exportSave(G); toast("Sauvegarde exportée."); break;

      case "ng-league": params.league = d.lg; render(); break;
      case "ng-pick": params.selTeam = d.id; render(); break;
      case "ng-start":
        var mgr = (document.getElementById("mgrname") || {}).value || "Manager";
        if (!params.selTeam) return;
        G = LM.newGame(params.selTeam, mgr.trim() || "Manager"); UI.G = G; save();
        nav("hub"); break;

      case "nav": nav(d.s); break;

      case "play": {
        var ps = LM.Calendar.playerSeries(G);
        if (!ps) break;
        var draft = LM.Draft.create(G, ps.homeId, ps.awayId);
        LM.Draft.runAIUntilPlayer(G, draft);
        nav("match", { ps: ps, draft: draft }); break;
      }
      case "quicksim": {
        var ps2 = LM.Calendar.playerSeries(G);
        if (!ps2) break;
        var r = LM.Sim.series(G, ps2.homeId, ps2.awayId, ps2.bo);
        finishTurn(r); break;
      }
      case "simround": lastLog = LM.Calendar.advance(G, null); save(); nav("hub"); break;

      case "ban": doDraftAction(function (dr) { LM.Draft.applyBan(dr, "A", d.champ); }); break;
      case "ban-skip": doDraftAction(function (dr) { LM.Draft.applyBan(dr, "A", null); }); break;
      case "pick": doDraftAction(function (dr) { LM.Draft.applyPick(dr, "A", d.champ); }); break;
      case "run-series": runSeries(); break;
      case "after-match": finishTurn(params.result); break;

      case "player": nav("player", { id: d.id }); break;
      case "train": doTrain(d.id, (document.getElementById("trainattr") || {}).value); break;
      case "train-row": doTrain(d.id, (document.getElementById("ta_" + d.id) || {}).value); break;
      case "train-champ": doTrainChamp(d.id, (document.getElementById("champtrain") || {}).value); break;
      case "release": {
        var rr = LM.Transfers.release(G, d.id); toast(rr.msg); if (rr.ok) { save(); nav("roster"); } break;
      }
      case "upgrade": act(function () { return LM.Training.upgradeFacilities(G); }); break;
      case "buy": act(function () { return LM.Transfers.buy(G, d.id); }); break;
      case "tr-role": params.role = d.r; render(); break;

      case "upg-staff": act(function () { return LM.Club.upgradeStaff(G, d.key); }); break;
      case "set-intensity": LM.Club.setIntensity(G, +d.v); save(); render(); break;
      case "upgrade-academy": act(function () { return LM.Club.upgradeAcademy(G); }); break;
      case "scout": act(function () { return LM.Club.scout(G, d.id); }); break;
      case "sign-prospect": act(function () { return LM.Club.signProspect(G, d.id); }); break;
      case "promote": act(function () { return LM.Club.promote(G, d.id); }); break;
      case "release-prospect": act(function () { return LM.Club.releaseProspect(G, d.id); }); break;
      case "set-mentor": act(function () {
        return LM.Club.setMentorship(G, (document.getElementById("mentorSel") || {}).value, (document.getElementById("menteeSel") || {}).value); }); break;
      case "clear-mentor": LM.Club.clearMentorship(G, d.id); save(); render(); break;
      case "accept-bid": act(function () { return LM.Transfers.acceptBid(G, d.id); }); break;
      case "reject-bid": act(function () { return LM.Transfers.rejectBid(G, d.id); }); break;
      case "renew": act(function () { return LM.Transfers.renew(G, d.id, +((document.getElementById("renewYears") || {}).value || 1)); }); break;
      case "work-trait": act(function () { return LM.Club.workOnTrait(G, d.id); }); break;
    }
  }

  function doDraftAction(fn) {
    var draft = params.draft;
    if (!draft) return;
    fn(draft);
    LM.Draft.runAIUntilPlayer(G, draft);
    render();
  }

  function runSeries() {
    var ps = params.ps, draft = params.draft;
    var drafts = LM.Draft.toPicks(draft);
    var res = LM.Sim.series(G, ps.homeId, ps.awayId, ps.bo, drafts);
    params.result = res;
    render();
  }

  function finishTurn(res) {
    lastLog = LM.Calendar.advance(G, res);
    save();
    nav("hub");
  }

  // Exécute une action de gestion, affiche le message et rafraîchit si réussie.
  function act(fn) {
    var r = fn();
    toast(r.msg); if (r.ok) { save(); render(); }
  }

  function doTrain(id, attr) {
    var r = LM.Training.train(G, id, attr);
    toast(r.msg); if (r.ok) { save(); render(); }
  }

  function doTrainChamp(id, champ) {
    var r = LM.Training.trainChampion(G, id, champ);
    toast(r.msg); if (r.ok) { save(); render(); }
  }

  // ---------- Init ----------
  function init() {
    app().addEventListener("click", function (e) {
      var t = e.target.closest("[data-action]");
      if (!t) return;
      handle(t.getAttribute("data-action"), t.dataset, e);
    });
    document.addEventListener("change", function (e) {
      if (e.target && e.target.id === "importfile" && e.target.files[0]) {
        LM.importSave(e.target.files[0], function (g) {
          if (g && g.teams) { G = LM.migrate(g); UI.G = G; LM.save(G); nav("hub"); toast("Sauvegarde importée !"); }
          else toast("Fichier de sauvegarde invalide.");
        });
      }
    });
    nav("menu");
  }

  UI.init = init;
  LM.UI = UI;
  document.addEventListener("DOMContentLoaded", init);
})(window.LM = window.LM || {});
