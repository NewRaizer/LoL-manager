# 🎮 Legends Manager — Manager d'esport League of Legends

Un jeu de gestion d'équipe esport **type Football Manager, version League of Legends**.
100 % **en français**, 100 % **hors-ligne**, avec **sauvegarde locale sur ton PC**.
Vrais noms de **champions Riot**, vraies **équipes** et vrais **joueurs** des ligues majeures.

---

## ▶️ Comment lancer le jeu (aucune installation)

1. Télécharge / récupère le dossier du projet sur ton PC.
2. **Double-clique sur `index.html`** → le jeu s'ouvre dans ton navigateur (Chrome, Edge ou Firefox).

C'est tout. Pas d'internet requis, pas de logiciel à installer.

> 💡 Astuce : tu peux mettre `index.html` en favori ou créer un raccourci sur le bureau.

---

## 💾 Les sauvegardes

- **Sauvegarde automatique** : ta partie est enregistrée toute seule dans le navigateur après chaque action.
  Au prochain lancement, clique sur **« Continuer la partie »**.
- **Fichier de sauvegarde sur le PC** : dans le menu de gauche, **« ⬇ Exporter sauvegarde »**
  télécharge un fichier `.json` que tu peux garder, copier sur une clé USB, etc.
- Pour reprendre un fichier exporté : menu principal → **« 📂 Importer une sauvegarde »**.

---

## 🏆 Ce que tu peux faire

- **Choisir ton équipe** parmi 4 ligues majeures : **LEC** (Europe), **LCK** (Corée), **LPL** (Chine), **LCS** (Amérique du Nord).
- **Disputer la saison complète** comme dans la vraie vie :
  - **Winter Split** → **First Stand**
  - **Spring Split** → **MSI**
  - **Summer Split** → **EWC (Esports World Cup)** → **Worlds**
- **Jouer tes matchs** avec une **phase de draft** (choix des champions par poste, bonus si le joueur maîtrise le champion).
- **Gérer ton effectif** : attributs détaillés (mécanique, lane, teamfight, vision, leadership, régularité), forme, condition, moral, potentiel.
- **Entraîner tes joueurs** et **améliorer tes infrastructures** pour les faire progresser.
- **Marché des transferts** : recruter des agents libres ou des joueurs d'autres équipes, vendre les tiens.
- **Faire progresser ta carrière** sur plusieurs saisons : les joueurs vieillissent, progressent ou déclinent, les contrats évoluent, de nouveaux talents apparaissent.
- **Remporter des trophées** nationaux et internationaux et viser le titre mondial.

---

## ⚔️ Mécaniques de draft (inspirées de Teamfight Manager)

Le **draft est le cœur du jeu** : un bon draft peut battre une équipe plus forte sur le papier.

- **Classes de champions** : chaque champion est un **Tank, Combattant, Assassin, Mage, Tireur ou Enchanteur**.
- **Système de contres** (pierre-feuille-ciseaux) :
  - 🗡️ **Assassin** ▶ bat **Mage / Tireur** (plonge les carries fragiles)
  - 🏹 **Tireur / Mage** ▶ battent **Tank / Combattant** (déchirent la frontline)
  - 🛡️ **Tank / Combattant** ▶ battent **Assassin** (collent et protègent)
  - 💚 **Enchanteur** ▶ protège les carries des **Assassins**
- **Pick & Ban réel** : tu bannis 3 champions, puis tu drafts rôle par rôle pendant que **l'IA adverse réagit et contre-pick**.
- **Équilibre de composition** : il te faut une frontline, des sources de dégâts et de la portée — une compo déséquilibrée est pénalisée.
- **Méta & patchs** : à **chaque split, un patch** buff/nerf des champions → la **tier list (écran « Méta »)** change, à toi d'adapter tes picks.
- **Maîtrise des champions** : chaque joueur a une **maîtrise par champion** qui monte en jouant, et que tu peux **entraîner** (fiche du joueur). Forcer un joueur sur un champion qu'il ne maîtrise pas affaiblit ta puissance.

Après chaque match, l'écran **« Analyse du draft »** te montre pourquoi tu as gagné ou perdu (puissance, bonus de compo, bonus/malus de contres).

## 🗂️ Structure du projet (pour modifier le jeu)

```
index.html              ← le fichier à ouvrir
css/style.css           ← thème graphique
js/data/champions.js    ← champions Riot + leur classe (Tank/Mage/…)
js/data/leagues.js      ← ÉQUIPES & JOUEURS (modifie ici pour mettre à jour les rosters)
js/core/meta.js         ← méta/patchs, contres, valeur de draft
js/core/draft.js        ← draft pick & ban + IA adverse
js/core/                ← moteur (simulation, calendrier, transferts, entraînement, sauvegarde)
js/ui/app.js            ← interface
```

### Modifier les équipes / joueurs
Tout est dans **`js/data/leagues.js`**. Chaque équipe ressemble à ça :

```js
{ id: "G2", name: "G2 Esports", short: "G2", league: "LEC", flag: "🇪🇺", tier: 92, players: [
  P("BrokenBlade", "TOP", "🇩🇪", 26), P("SkewMond", "JNG", "🇫🇷", 21),
  P("Caps", "MID", "🇩🇰", 26), P("Hans Sama", "ADC", "🇫🇷", 26), P("Labrov", "SUP", "🇬🇷", 23) ] },
```

- `tier` = niveau global de l'équipe (50–99), il détermine la force des joueurs générés.
- `P(nom, poste, drapeau, âge)` = un joueur. Postes possibles : `TOP`, `JNG`, `MID`, `ADC`, `SUP`.
- Pour booster une superstar précise, ajoute son pseudo dans `LM.SUPERSTARS` en haut du fichier.

> ⚠️ Les rosters sont basés sur des compositions réelles récentes et peuvent être ajustés librement.
> Les transferts réels du jeu vidéo bougeant souvent, considère ce fichier comme **ta base de données à éditer**.

---

## ❓ FAQ

**Le jeu marche sans connexion ?** Oui, totalement.
**Mes données partent sur internet ?** Non, rien ne quitte ton PC.
**Je peux jouer plusieurs carrières ?** Une sauvegarde automatique à la fois, mais tu peux exporter/importer autant de fichiers `.json` que tu veux.

Bon jeu, et que le meilleur manager gagne ! 🏆
