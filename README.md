# HTML, ARIA et agents : même apparence, trois réalités

Une démonstration de [Bertrand Morel — Edikka](https://www.edikka.com/agence/bertrand-morel).

Trois implémentations de « Ajouter au panier » partagent le même environnement, le même style et un même gestionnaire `click` : un `div`, un `div role="button"` et un `button type="button"`. Les deux premières sont volontairement incomplètes. Ce projet rend leurs différences observables sans ajouter de gestionnaire clavier.

**Question ouverte : un agent peut-il réussir une action qui reste inaccessible au clavier ?** Les tests déterministes ne répondent pas à cette question. Les essais d’agents indépendants et de lecteurs d’écran restent **Non testé** tant qu’aucun relevé correspondant n’est publié.

[Essayer la démonstration en ligne](https://edikkaweb.github.io/html-aria-agent-demo/) · [Code et historique sur GitHub](https://github.com/edikkaweb/html-aria-agent-demo).

Cette expérience est un complément du [Socle accessibilité d’un site professionnel](https://www.edikka.com/bibliotheque#instrument-professional-website-accessibility-foundation). L’instrument conserve sa propre version (voir sa fiche) ; la version déclarée de la démo est **1.0.0** dans `package.json`. Les changements de présentation ne créent pas une nouvelle édition scientifique ni une nouvelle validation des variantes. Le catalogue est sous CC BY 4.0 ; le code original de ce dépôt reste sous **MIT**.

## Essayer

La [page de présentation](index.html) mène aux trois pages isolées : [A](a.html), [B](b.html) et [C](c.html). Leurs titres et leurs textes sont neutres. Aucun résultat attendu n’y est expliqué.

```sh
node serve.mjs
```

Ouvrir `http://127.0.0.1:4173/html-aria-agent-demo/`. Node 22 ou ultérieur suffit pour le serveur ; aucune dépendance n’est nécessaire au fonctionnement de la démo. Le chemin de projet reproduit celui d’un hébergement GitHub Pages. Les liens des pages sont relatifs.

## Rejouer les vérifications

```sh
npm install
npx playwright install chromium
npm test
```

Playwright est fixé à **1.63.0**. Pour un autre moteur, installer son binaire et utiliser `BROWSER=firefox npm test` ou `BROWSER=webkit npm test`. Avec Google Chrome déjà installé : `BROWSER=chromium CHANNEL=chrome npm test`. Le binaire et sa version sont consignés dans chaque relevé ; Chrome local ne doit pas être appelé « Chromium fourni par Playwright ».

Le script ajoute chaque exécution dans [observations.json](observations.json), sans effacer les exécutions précédentes, puis régénère la présentation statique. Les contrôles de présentation sont séparés : `npm run test:presentation` ne crée aucun relevé comportemental. Le contrat de provenance est décrit ci-dessous. Le champ `command` donne la commande de reproduction équivalente (`npm test` appelle `node verify.mjs`). Le script archive sa date réelle, les versions, ses assertions et les sorties brutes pertinentes, y compris les échecs.

Les sorties comprennent le compteur après trois clics, les étapes de tabulation et de retour arrière, les activations clavier lorsqu’elles sont accessibles naturellement, les attributs DOM, la géométrie et les instantanés `locator.ariaSnapshot()` au même stade initial. La fonction `evaluate()` lit l’état ; elle ne place jamais le focus et n’active aucune commande.

## Distinguer attente et observation

Contrôle de cette édition sur GitHub Pages le 1er octobre 2026 : Chrome 154.0.8037.59 à 05:31:38.835 UTC et Firefox 155.0 à 05:33:02.114 UTC, **51/51 contrôles réussis par navigateur** (33 contrôles comportementaux et 18 contrôles HTTP/empreintes des neuf sources expérimentales et de test). Les deux relevés de production sont ajoutés aux huit relevés existants, sans les modifier. Révision expérimentale `f38d21693c8f355db5692b9cfdc0f8b8aa102903357c8cf4e7b38ae7a02e93d1`, publiée par le commit [4f55faf](https://github.com/edikkaweb/html-aria-agent-demo/commit/4f55faff131a99bc68a0ba64160395332e306481). Les contrôles de présentation sont distincts et ne créent pas de relevé expérimental.

**État historique publié, avant les améliorations de présentation ci-dessous.** Vérifiée localement puis sur GitHub Pages le 1er octobre 2026 : 65 contrôles locaux et 85 contrôles de production par navigateur, tous réussis. Les contrôles en ligne incluent les empreintes SHA-256 des 10 fichiers sources et de test. Les observations brutes identifient la révision `182c07eaee4d8cc466d59d1dc09d9dc252021052584ac062edb804ba54373c82` du candidat publié.

Les premières exécutions du 1er octobre 2026, avec Chrome 154.0.8037.59 et Firefox 155.0 sur macOS, donnent les mêmes observations : trois clics produisent 0 → 1 → 2 → 3 sur A, B et C ; Tab ignore A et B ; C est atteinte et ajoute une unité avec Entrée comme avec Espace. B et C sont toutes deux restituées comme `button "Ajouter au panier"` par `locator.ariaSnapshot()` de Playwright **ciblé sur `#command`** ; A est restituée comme texte. L’égalité concerne cette commande dans ces configurations archivées, pas les pages entières ni tous les agents. Playwright MCP n’est pas testé. Ces résultats concernent uniquement ces configurations. Les activations clavier de A/B sont marquées **Non testé — commande non atteinte par Tab** ; leur absence du parcours est, elle, observée.

Selon la sémantique HTML et les pratiques ARIA, un rôle exprime la nature d’un élément mais ne crée pas, à lui seul, son comportement clavier. Un bouton natif fournit le comportement adapté. Les résultats effectivement obtenus se lisent dans le tableau de la présentation et dans le JSON ; ils ne sont pas remplacés par cette attente.

`locator.ariaSnapshot()` est une représentation produite par Playwright. Elle ne représente pas nécessairement l’intégralité de l’arbre natif du navigateur, ni une annonce vocale. La navigation au lecteur d’écran peut différer de la tabulation ordinaire. Voir [TESTING.md](TESTING.md) pour les protocoles distincts.

Ce travail ne mesure ni la conformité complète d’un site, ni un classement SEO, ni une probabilité de citation par une IA. Il ne permet aucune généralisation à tous les agents, outils ou environnements.

## Présentation statique et provenance

```sh
npm run build
npm run build:check
npm run test:observations
BROWSER=chromium CHANNEL=chrome npm run test:presentation
```

`index.template.html` est la source éditoriale ; `index.html` est généré par `render-observations.mjs` depuis `observations.json`. Ne pas recopier les observations à la main. Le même modèle `observations-view.js` alimente le HTML statique et l’historique amélioré par `results.js`. La sélection est déterministe : date UTC décroissante, puis dernière position dans le fichier en cas d’égalité, **sans filtrer les échecs**. Une archive invalide arrête le build au lieu d’effacer une preuve. `build:check` vérifie les octets des dérivés sans écrire.

Sans JavaScript ou si l’historique ne peut pas être chargé, le tableau, la date, la configuration et le statut générés restent visibles. Une panne de chargement n’est ni un échec du comportement testé ni un test non réalisé. Les variantes absentes et activations non effectuées sont explicitement signalées. Aucun nouvel essai n’est lancé à la consultation.

- Les relevés historiques **sans `provenanceVersion`** gardent leur `sourceHashes` et leur `sourceRevision` d’origine : leur manifeste inclut alors `index.html` et `results.js`. Ce sont les empreintes des fichiers testés à leur date, pas une validation des fichiers actuels.
- Les nouveaux relevés **`provenanceVersion: 2`** identifient les pages expérimentales A/B/C, `experiment.js`, `styles.css`, `verify.mjs`, `serve.mjs`, `package.json` et `package-lock.json`. `sourceRevision` est le SHA-256 de leur manifeste ordonné sérialisé en JSON. La présentation et l’archive sont exclues : régénérer le tableau ne change pas cette révision.
- `presentation-manifest.json` identifie séparément le template, le générateur, le modèle, le script de lecture, les styles de présentation, les observations consommées et le HTML généré. Le manifeste s’exclut lui-même et n’entre jamais dans un relevé expérimental. Pas d’horodatage variable au build : deux générations sans changement ont les mêmes octets.
- `npm test` est une **exécution réelle des variantes** et ajoute une entrée, réussie ou échouée. Ne pas le lancer en parallèle ; il refuse d’écraser une archive changée pendant les essais. `npm run test:presentation` produit un compte rendu distinct, ignoré par Git, avec les empreintes des fichiers de présentation contrôlés.

## Organisation et réutilisation

- Expérience inchangée : `a.html`, `b.html`, `c.html`, `styles.css`, `experiment.js`.
- Présentation : `index.template.html`, `observations-view.js`, `results.js`, `presentation.css` ; dérivés `index.html` et `presentation-manifest.json`.
- Reproduction : `serve.mjs`, `verify.mjs`, `render-observations.mjs`, `observations-view.test.mjs`, `verify-presentation.mjs`, `package.json` et lockfile.
- Documentation : `README.md`, `TESTING.md`, `LICENSE`. Preuves comportementales : `observations.json`.

Le projet n’appelle aucune API IA et n’utilise aucun framework, cookie, stockage persistant ou formulaire commercial. Le panier est local à chaque page et repart à zéro au rechargement. Sans JavaScript, un avertissement explique que les commandes métier sont indisponibles. Le dessin du carnet est réalisé en CSS original. L’intégration Edikka utilise des liens éditoriaux ordinaires vers la démo, le code et le protocole ; aucune iframe. Toute nouvelle source expérimentale ou configuration demande un nouveau relevé avant d’en revendiquer les résultats.

## Sources primaires

- [WHATWG : élément button](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element).
- [W3C APG : Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).
- [W3C : Using ARIA, première règle](https://www.w3.org/TR/using-aria/#rule1).
- [Playwright : ariaSnapshot](https://playwright.dev/docs/api/class-locator#locator-aria-snapshot).
- [Playwright : instantanés ARIA](https://playwright.dev/docs/aria-snapshots).

Sources consultées le 1er octobre 2026. Code original sous [licence MIT](LICENSE).

## English summary

Three visually identical “Add to cart” controls compare a clickable `div`, a `div` with `role="button"`, and a native `button`. A shared click handler adds exactly one item. Deterministic tests record pointer activation, natural keyboard traversal, keyboard activation, and Playwright ARIA snapshots. Raw results are kept separate from expected behavior. Screen-reader and independent AI-agent trials are **Not tested** until actual observations are recorded. The experiment does not measure full accessibility conformance, SEO rankings, or AI citations.

The static presentation keeps archived observations available without JavaScript or when JSON loading fails. It defaults to the latest dated run, including failures. This is a practical companion to the [Professional website accessibility foundation](https://www.edikka.com/en/library#instrument-professional-website-accessibility-foundation); the demonstration itself is in French. Its MIT code licence and package version remain separate from the catalogue’s CC BY 4.0 licence and instrument version.
