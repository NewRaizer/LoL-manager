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
    app().innerHTML = layout(renderScreen());
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
      'style="background:var(--bg2);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:10px;width:280px" /></div>' +
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
      ["transfers", "💸", "Transferts"],
      ["training", "🎯", "Entraînement"],
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
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px;padding-top:12px">' +
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
      case "transfers": return renderTransfers();
      case "training": return renderTraining();
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
        '<div style="text-align:center;margin-top:8px">' +
        '<button class="btn primary big" data-action="play">▶ Jouer le match</button>' +
        ' <button class="btn" data-action="quicksim">⏩ Sim. rapide</button></div></div>';
    } else {
      matchCard = '<div class="card nextmatch"><h3>' + esc(desc.title) + '</h3>' +
        '<p class="muted">Votre équipe n\'est pas concernée par ce tour.</p>' +
        '<div style="text-align:center"><button class="btn primary big" data-action="simround">⏩ Simuler le tour</button></div></div>';
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

    return '<div class="page-head"><div><h1>' + esc(desc.title) + '</h1><div class="sub">' +
      esc(desc.sub) + ' · ' + LM.U.fmtDate(G.date) + ' ' + G.date.year + '</div></div>' +
      '<div class="kpi"><div class="k"><div class="v">' + LM.U.money(my.budget) + '</div><div class="l">Budget</div></div>' +
      '<div class="k"><div class="v">' + my.facilities + '/10</div><div class="l">Infrastructures</div></div>' +
      '<div class="k"><div class="v">' + my.trophies.length + '</div><div class="l">Trophées</div></div></div></div>' +
      '<div class="grid cols-2">' + matchCard + lineCard + '</div>' +
      '<div style="margin-top:16px">' + logCard + '</div>';
  }

  // ---------- Effectif ----------
  function renderRoster() {
    var my = LM.myTeam(G);
    var line = LM.Sim.lineup(my);
    var starters = {}; LM.ROLES.forEach(function (r) { if (line[r]) starters[line[r].id] = true; });
    var roster = my.roster.slice().sort(function (a, b) {
      return LM.ROLES.indexOf(a.role) - LM.ROLES.indexOf(b.role) || b.ovr - a.ovr; });
    var rows = roster.map(function (p) {
      return '<tr class="' + (p.id === G.teamId ? "" : "") + '" data-action="player" data-id="' + p.id + '" style="cursor:pointer">' +
        '<td>' + roleTag(p.role) + (starters[p.id] ? ' <span class="chip" style="border-color:var(--accent);color:var(--accent)">Titulaire</span>' : '') + '</td>' +
        '<td>' + p.nat + ' <b>' + esc(p.name) + '</b></td>' +
        '<td class="num">' + p.age + '</td>' +
        '<td class="num">' + ovrTag(p.ovr) + '</td>' +
        '<td class="num">' + ovrTag(p.potential) + '</td>' +
        '<td class="num">' + (p.form >= 0 ? "+" : "") + p.form + '</td>' +
        '<td class="num">' + p.condition + '%</td>' +
        '<td class="num">' + p.morale + '</td>' +
        '<td class="num muted">' + LM.U.money(p.value) + '</td></tr>';
    }).join("");
    return '<div class="page-head"><h1>Effectif — ' + esc(my.name) + '</h1>' +
      '<div class="sub">' + my.roster.length + ' joueurs · Masse salariale ' +
      LM.U.money(my.roster.reduce(function (s, p) { return s + p.salary; }, 0)) + '/an</div></div>' +
      '<div class="card"><table class="row-hover"><thead><tr><th>Poste</th><th>Joueur</th><th class="num">Âge</th>' +
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
    var champs = p.champs.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join(" ");
    return '<div class="page-head"><div><h1>' + p.nat + ' ' + esc(p.name) + ' ' + ovrTag(p.ovr) + '</h1>' +
      '<div class="sub">' + LM.ROLE_FR[p.role] + ' · ' + p.age + ' ans · Potentiel ' + p.potential +
      ' · Valeur ' + LM.U.money(p.value) + '</div></div>' +
      '<button class="btn" data-action="nav" data-s="roster">← Effectif</button></div>' +
      '<div class="grid cols-2"><div class="card"><h3>Attributs</h3>' + bars + '</div>' +
      '<div class="card"><h3>Pool de champions</h3><p>' + champs + '</p>' +
      '<h3 style="margin-top:16px">État</h3>' +
      '<div class="kpi"><div class="k"><div class="v">' + (p.form >= 0 ? "+" : "") + p.form + '</div><div class="l">Forme</div></div>' +
      '<div class="k"><div class="v">' + p.condition + '%</div><div class="l">Condition</div></div>' +
      '<div class="k"><div class="v">' + p.morale + '</div><div class="l">Moral</div></div></div>' +
      '<h3 style="margin-top:16px">Entraînement</h3>' +
      '<div style="display:flex;gap:8px;align-items:center">' + trainSel +
      '<button class="btn primary" data-action="train" data-id="' + p.id + '" ' + (trained ? "disabled" : "") + '>' +
      (trained ? "Déjà entraîné" : "Entraîner") + '</button></div>' +
      '<div style="margin-top:14px"><button class="btn danger sm" data-action="release" data-id="' + p.id + '">Libérer / vendre le joueur</button></div>' +
      '</div></div>';
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
      return '<tr><td>' + roleTag(p.role) + '</td><td>' + p.nat + ' <b>' + esc(p.name) + '</b></td>' +
        '<td class="num">' + p.age + '</td><td class="num">' + ovrTag(p.ovr) + '</td><td class="num">' + ovrTag(p.potential) + '</td>' +
        '<td>' + (e.free ? '<span class="chip">Libre</span>' : G.teams[e.fromTeam].short) + '</td>' +
        '<td class="num">' + LM.U.money(e.fee) + '</td>' +
        '<td><button class="btn sm primary" data-action="buy" data-id="' + p.id + '" ' +
        (my.budget < e.fee ? "disabled" : "") + '>Acheter</button></td></tr>';
    }).join("");
    return '<div class="page-head"><div><h1>Marché des transferts</h1>' +
      '<div class="sub">Budget : <b style="color:var(--gold)">' + LM.U.money(my.budget) + '</b></div></div></div>' +
      '<div class="leaguetabs">' + pills + '</div>' +
      '<div class="card"><table class="row-hover"><thead><tr><th>Poste</th><th>Joueur</th><th class="num">Âge</th>' +
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
      return '<tr><td>' + roleTag(p.role) + '</td><td>' + p.nat + ' <b>' + esc(p.name) + '</b></td>' +
        '<td class="num">' + ovrTag(p.ovr) + '→' + ovrTag(p.potential) + '</td>' +
        '<td class="num">' + p.condition + '%</td>' +
        '<td style="min-width:160px">' + sel + '</td>' +
        '<td><button class="btn sm primary" data-action="train-row" data-id="' + p.id + '" ' +
        (trained ? "disabled" : "") + '>' + (trained ? "✓" : "Entraîner") + '</button></td></tr>';
    }).join("");
    return '<div class="page-head"><div><h1>Entraînement</h1>' +
      '<div class="sub">1 séance par joueur et par tour. Infrastructures : <b>' + my.facilities + '/10</b></div></div>' +
      '<button class="btn gold" data-action="upgrade">⬆ Améliorer les infrastructures (' +
      LM.U.money(my.facilities * 250000) + ')</button></div>' +
      '<div class="card"><table><thead><tr><th>Poste</th><th>Joueur</th><th class="num">OVR/POT</th>' +
      '<th class="num">Cond.</th><th>Attribut</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
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

  // ---------- Écran de match (draft + résultat) ----------
  function renderMatch() {
    var ps = params.ps;
    if (!ps) return renderHub();
    var myId = ps.homeId === G.teamId ? ps.homeId : (ps.awayId === G.teamId ? ps.awayId : ps.homeId);
    var oppId = myId === ps.homeId ? ps.awayId : ps.homeId;
    var my = G.teams[myId], opp = G.teams[oppId];

    if (params.result) return renderMatchResult(ps, myId, oppId);

    var line = LM.Sim.lineup(my);
    var rows = LM.ROLES.map(function (r) {
      var p = line[r];
      var pool = (p && p.champs) ? p.champs : [];
      var all = LM.CHAMPIONS_BY_ROLE[r] || [];
      var opts = pool.map(function (c) { return '<option value="' + esc(c) + '">★ ' + esc(c) + '</option>'; })
        .concat(all.filter(function (c) { return pool.indexOf(c) < 0; }).map(function (c) {
          return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; })).join("");
      return '<div class="draft-row"><div>' + roleTag(r) + '</div>' +
        '<div>' + (p ? p.nat + ' <b>' + esc(p.name) + '</b> ' + ovrTag(p.ovr) : "—") + '</div>' +
        '<div><select id="pick_' + r + '">' + opts + '</select></div></div>';
    }).join("");

    return '<div class="page-head"><div><h1>' + esc(ps.label) + ' — Bo' + ps.bo + '</h1>' +
      '<div class="sub">' + my.flag + ' ' + esc(my.name) + ' vs ' + opp.flag + ' ' + esc(opp.name) + '</div></div></div>' +
      '<div class="card"><h3>Phase de draft — choisissez vos champions</h3>' +
      '<p class="muted">★ = champion maîtrisé (bonus de performance).</p>' + rows +
      '<div style="margin-top:16px;display:flex;gap:10px">' +
      '<button class="btn" data-action="auto-draft">🎲 Draft automatique</button>' +
      '<button class="btn primary big" data-action="run-match">⚔️ Lancer la série</button></div></div>';
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
    return '<div class="page-head"><h1>Résultat — ' + esc(ps.label) + '</h1></div>' +
      '<div class="card"><div class="win-banner ' + (won ? "win" : "loss") + '">' +
      (won ? "VICTOIRE 🎉" : "DÉFAITE") + '</div>' +
      '<div class="scoreboard">' + G.teams[myId].short + ' ' + myScore + ' — ' + opScore + ' ' + G.teams[oppId].short + '</div>' +
      '<div class="gamelog" style="margin-top:16px">' + games + '</div>' +
      '<div style="text-align:center;margin-top:18px"><button class="btn primary big" data-action="after-match">Continuer ▶</button></div></div>';
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

      case "play":
        var ps = LM.Calendar.playerSeries(G);
        if (ps) nav("match", { ps: ps }); break;
      case "quicksim": {
        var ps2 = LM.Calendar.playerSeries(G);
        if (!ps2) break;
        var r = LM.Sim.series(G, ps2.homeId, ps2.awayId, ps2.bo);
        finishTurn(r); break;
      }
      case "simround": lastLog = LM.Calendar.advance(G, null); save(); nav("hub"); break;

      case "auto-draft": applyAutoDraft(); break;
      case "run-match": runMatch(); break;
      case "after-match": finishTurn(params.result); break;

      case "player": nav("player", { id: d.id }); break;
      case "train": doTrain(d.id, (document.getElementById("trainattr") || {}).value); break;
      case "train-row": doTrain(d.id, (document.getElementById("ta_" + d.id) || {}).value); break;
      case "release": {
        var rr = LM.Transfers.release(G, d.id); toast(rr.msg); if (rr.ok) { save(); nav("roster"); } break;
      }
      case "upgrade": { var u = LM.Training.upgradeFacilities(G); toast(u.msg); if (u.ok) { save(); render(); } break; }

      case "buy": { var b = LM.Transfers.buy(G, d.id); toast(b.msg); if (b.ok) { save(); render(); } break; }
      case "tr-role": params.role = d.r; render(); break;
    }
  }

  function applyAutoDraft() {
    var ps = params.ps;
    var myId = ps.homeId === G.teamId ? ps.homeId : ps.awayId;
    var line = LM.Sim.lineup(G.teams[myId]);
    LM.ROLES.forEach(function (r) {
      var sel = document.getElementById("pick_" + r);
      var p = line[r];
      if (sel && p && p.champs.length) sel.value = p.champs[Math.floor(Math.random() * p.champs.length)];
    });
    toast("Draft automatique appliquée.");
  }

  function runMatch() {
    var ps = params.ps;
    var myId = ps.homeId === G.teamId ? ps.homeId : ps.awayId;
    var line = LM.Sim.lineup(G.teams[myId]);
    var picks = {};
    LM.ROLES.forEach(function (r) {
      var sel = document.getElementById("pick_" + r);
      picks[r] = sel ? sel.value : (line[r] && line[r].champs[0]);
    });
    var drafts = {}; drafts[myId] = picks;
    var res = LM.Sim.series(G, ps.homeId, ps.awayId, ps.bo, drafts);
    params.result = res;
    render();
  }

  function finishTurn(res) {
    lastLog = LM.Calendar.advance(G, res);
    save();
    nav("hub");
  }

  function doTrain(id, attr) {
    var r = LM.Training.train(G, id, attr);
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
          if (g && g.teams) { G = g; UI.G = G; LM.save(G); nav("hub"); toast("Sauvegarde importée !"); }
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
