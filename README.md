# HTML, ARIA et agents : même apparence, trois réalités

Une démonstration de [Bertrand Morel — Edikka](https://www.edikka.com/agence/bertrand-morel).

Trois implémentations de « Ajouter au panier » partagent le même environnement, le même style et un même gestionnaire `click` : un `div`, un `div role="button"` et un `button type="button"`. Les deux premières sont volontairement incomplètes. Ce projet rend leurs différences observables sans ajouter de gestionnaire clavier.

**Question ouverte : un agent peut-il réussir une action qui reste inaccessible au clavier ?** Les tests déterministes ne répondent pas à cette question. Les essais d’agents indépendants et de lecteurs d’écran restent **Non testé** tant qu’aucun relevé correspondant n’est publié.

[Code et historique sur GitHub](https://github.com/edikkaweb/html-aria-agent-demo).

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

Le script ajoute chaque exécution dans [observations.json](observations.json), sans effacer les exécutions précédentes, et produit deux captures locales de la présentation. La lecture des résultats est dynamique ; les preuves sont séparées du code de démonstration. Le manifeste SHA-256 identifie précisément la révision des sources et du script testés, indépendamment du commit créé lors d’un transfert par navigateur. Le script archive sa commande, sa date réelle, les versions, ses assertions et les sorties brutes pertinentes, y compris les échecs.

Les sorties comprennent le compteur après trois clics, les étapes de tabulation et de retour arrière, les activations clavier lorsqu’elles sont accessibles naturellement, les attributs DOM, la géométrie et les instantanés `locator.ariaSnapshot()` au même stade initial. La fonction `evaluate()` lit l’état ; elle ne place jamais le focus et n’active aucune commande.

## Distinguer attente et observation

Les premières exécutions du 1er octobre 2026, avec Chrome 154.0.8037.59 et Firefox 155.0 sur macOS, donnent les mêmes observations : trois clics produisent 0 → 1 → 2 → 3 sur A, B et C ; Tab ignore A et B ; C est atteinte et ajoute une unité avec Entrée comme avec Espace. B et C sont toutes deux restituées comme `button "Ajouter au panier"` par l’instantané Playwright ; A est restituée comme texte. Ces résultats concernent uniquement ces configurations. Les activations clavier de A/B sont marquées **Non testé — commande non atteinte par Tab** ; leur absence du parcours est, elle, observée.

Selon la sémantique HTML et les pratiques ARIA, un rôle exprime la nature d’un élément mais ne crée pas, à lui seul, son comportement clavier. Un bouton natif fournit le comportement adapté. Les résultats effectivement obtenus se lisent dans le tableau de la présentation et dans le JSON ; ils ne sont pas remplacés par cette attente.

`locator.ariaSnapshot()` est une représentation produite par Playwright. Elle ne représente pas nécessairement l’intégralité de l’arbre natif du navigateur, ni une annonce vocale. La navigation au lecteur d’écran peut différer de la tabulation ordinaire. Voir [TESTING.md](TESTING.md) pour les protocoles distincts.

Ce travail ne mesure ni la conformité complète d’un site, ni un classement SEO, ni une probabilité de citation par une IA. Il ne permet aucune généralisation à tous les agents, outils ou environnements.

## Organisation et réutilisation

- Démo : `index.html`, `a.html`, `b.html`, `c.html`, `styles.css`, `experiment.js`, `results.js`.
- Reproduction : `serve.mjs`, `verify.mjs`, `package.json`.
- Documentation : `README.md`, `TESTING.md` et `LICENSE`.
- Observations : `observations.json`, indépendant des attentes du protocole.

Le projet n’appelle aucune API IA, n’utilise aucun framework, cookie, stockage persistant, formulaire commercial ou code client. Le panier est local à chaque page et repart à zéro au rechargement. Sans JavaScript, un avertissement explique que les commandes métier sont indisponibles. Le dessin du carnet est réalisé en CSS original.

Pour l’intégrer sur edikka.com, conserver les trois pages isolées et leurs liens relatifs dans un répertoire dédié, puis créer un lien éditorial vers la présentation. Ne pas interpréter la réussite d’un extracteur ou d’un script comme une réussite d’agent. Toute nouvelle source ou configuration exige un nouveau relevé.

## Sources primaires

- [WHATWG : élément button](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element).
- [W3C APG : Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).
- [W3C : Using ARIA, première règle](https://www.w3.org/TR/using-aria/#rule1).
- [Playwright : ariaSnapshot](https://playwright.dev/docs/api/class-locator#locator-aria-snapshot).
- [Playwright : instantanés ARIA](https://playwright.dev/docs/aria-snapshots).

Sources consultées le 1er octobre 2026. Code original sous [licence MIT](LICENSE).

## English summary

Three visually identical “Add to cart” controls compare a clickable `div`, a `div` with `role="button"`, and a native `button`. A shared click handler adds exactly one item. Deterministic tests record pointer activation, natural keyboard traversal, keyboard activation, and Playwright ARIA snapshots. Raw results are kept separate from expected behavior. Screen-reader and independent AI-agent trials are **Not tested** until actual observations are recorded. The experiment does not measure full accessibility conformance, SEO rankings, or AI citations.
