# Protocole de vérification

## Variables contrôlées

Même contenu, décor, ordre des éléments, libellé, dimensions, état initial et logique métier. Seule la commande diffère. Les fichiers HTML sont comparés après remplacement de cette seule commande par un marqueur commun. Les textes visibles, styles calculés, positions et dimensions sont également comparés.

Les variantes A et B ne doivent pas recevoir de `tabindex`, de `keydown`, de `keyup` ou de correction automatique pendant les essais. Le bouton natif conserve son indicateur de focus. Le compteur utilise un `output` et la même région live dans les trois pages ; cela ne préjuge pas de son annonce réelle.

## Tests déterministes exécutables

1. Créer un contexte navigateur neuf pour une page isolée. Attendre le chargement. Observer zéro.
2. Capturer `locator.ariaSnapshot()` sur `body` et sur `#command`, avant toute interaction. Compter séparément les correspondances `getByRole('button', {name: 'Ajouter au panier', exact: true})`.
3. Envoyer trois clics physiques simulés via `locator.click()` ; relever le compteur après chacun. Cet essai est distinct du clavier.
4. Dans un nouveau contexte, envoyer `Tab` depuis le document jusqu’à « Vider le panier » ; relever `document.activeElement` après chaque touche. Envoyer `Shift+Tab` et relever le focus.
5. Repartir d’un contexte neuf pour chaque touche d’activation. Atteindre la commande uniquement par `Tab`. Si elle est atteinte, presser Entrée ou Espace et mesurer l’écart du compteur. Sinon, indiquer « Non testé — commande non atteinte par Tab ». Ne pas donner le focus par script et ne pas substituer un clic à cet essai.
6. Comparer le contexte, les textes, styles et dimensions des variantes ; vérifier l’avertissement métier sans JavaScript. Les vérifications de la page de présentation relèvent de la suite séparée ci-dessous.

`observations.json` conserve tous les relevés des exécutions, leurs assertions et leurs échecs. Une exécution incomplète peut contenir `fatal`. Les essais reproductibles enregistrent les actions déterministes du script ; ils ne sont pas un essai d’agent autonome.

**Attentes de référence, pas observations :** A ne déclare pas de rôle bouton ; B le déclare mais ne fournit pas la mise au focus par Tab ni l’activation clavier ; C apporte ces comportements natifs. Les assertions évaluent cette attente et conservent toute divergence. Un essai négatif au clavier ne devient pas un essai positif de lecteur d’écran.

## Vérifier la présentation sans créer de relevé expérimental

Exécuter `npm run build`, `npm run build:check`, `npm run test:observations`, puis `BROWSER=chromium CHANNEL=chrome npm run test:presentation` (ou `BROWSER=firefox npm run test:presentation`). La génération ne lance aucun essai. La suite de présentation vérifie le rendu avec JavaScript, sans JavaScript, avec JSON bloqué ou invalide, la sélection au clavier, les liens et les métadonnées, aux largeurs 390 et 1280 px. Certains menus natifs macOS ne reçoivent pas les flèches simulées en mode sans fenêtre. Le rapport conserve alors cette limite et contrôle la mise à jour avec `selectOption` : cela ne vaut pas une preuve clavier. Compléter par Tab, flèche bas pour ouvrir, flèche bas pour changer d’option et Entrée dans un navigateur réel. Les captures `preview-*.png` et `presentation-check.json` sont des preuves locales distinctes, exclues de l’archive comportementale. Les fixtures d’échec et d’interruption du modèle ne sont jamais ajoutées à `observations.json`.

Le relevé initial est la dernière date UTC, avec la dernière entrée en cas d’égalité, sans sélectionner uniquement les réussites. Les cellules ne confondent pas zéro mesuré, valeur manquante, commande non atteinte par Tab et parcours interrompu. Le HTML source généré reste la preuve lisible en cas de chargement échoué.

Le contrat de provenance v2 et l’interprétation des anciens manifestes sont détaillés dans le [README](https://github.com/edikkaweb/html-aria-agent-demo/blob/main/README.md#présentation-statique-et-provenance). La génération de la présentation ne change pas les empreintes expérimentales. Les anciens relevés conservent leurs dates, versions, résultats et manifestes, même si ceux-ci incluaient alors la présentation. L’égalité de `locator.ariaSnapshot()` concerne uniquement la commande ciblée dans les configurations archivées ; ce test ne couvre pas Playwright MCP.

## VoiceOver et Safari — Non testé

Consigner date, modèle de machine, version macOS, Safari, VoiceOver, langue, voix, réglage de navigation clavier et état de la navigation rapide. Activer la navigation clavier complète de Safari/macOS et le document dans une nouvelle fenêtre par variante, compteur zéro.

Séparer deux passages : (1) Tab/Maj+Tab ordinaires avec leurs réglages ; (2) navigation VoiceOver avec VO+flèches et activation VO+Espace. Relever exactement le rôle et le nom annoncés, l’accès à la commande, l’effet sur le compteur et l’annonce éventuelle de la mise à jour. Une activation via VoiceOver ne prouve pas une activation via Tab. Conserver l’enregistrement ou la transcription réellement observée et noter tout ajustement de réglage.

## NVDA et Firefox — Non testé

Consigner Windows, Firefox, NVDA, modules complémentaires, langue, voix et profil de réglages. Nouveau navigateur/contexte sans état préalable par variante, compteur zéro. Distinguer mode navigation (flèches, navigation rapide par bouton si disponible) et mode formulaire/focus, puis la tabulation ordinaire.

Noter le mode à chaque action, les touches exactes, le nom/rôle annoncé, l’accès à la commande et le compteur après activation. Si l’observateur de parole NVDA est utilisé, conserver sa sortie brute. Ne pas compléter de mémoire une annonce manquante.

## Agent IA indépendant — Non testé

L’auteur de la démo connaît les variantes : cette conversation de construction ne constitue pas un essai indépendant. N’utiliser ni son inspection ni un script Playwright comme résultat d’agent.

Pour une campagne, préenregistrer le nombre de répétitions (par exemple trois par variante), les permutations de l’ordre, la limite de temps/actions, l’agent, le modèle, sa version et son outil de navigation. Affecter à chaque essai une nouvelle session de conversation et un nouveau contexte navigateur. Ne fournir ni code, ni documentation, ni nom de variante interprétable ; seulement l’URL isolée et la même instruction : **« Ajoute une unité au panier. »**

Déclarer les outils autorisés : par exemple observation écran/DOM/arbre de l’outil et actions d’interface, sans exécution arbitraire de JavaScript, modification de fichiers ni requête directe contournant la commande. Tout autre outillage doit former une configuration séparée. Enregistrer les observations que le modèle a reçues et la trace de ses actions. Une page qui révèle le protocole, un contexte réutilisé ou l’accès aux résultats doit être signalé comme contamination.

Un observateur vérifie le compteur : zéro au départ, exactement un à la fin. « J’ai ajouté » ne constitue pas une preuve. Conserver chaque essai, échec, abandon, dépassement de temps et répétition ; ne pas sélectionner uniquement les réussites. Relever le chemin de réussite (coordonnées, rôle/nom, autre), sans l’assimiler à un accès clavier humain. Formuler les résultats par configuration et effectif, sans généralisation à tous les agents.

Gabarit de relevé manuel : date et fuseau ; URL et empreinte des sources ; configuration ; session ; consigne ; outils ; actions et modes ; compteur initial/final ; annonce brute ou capture ; résultat ; limites ; motif d’arrêt.

## Publication et contrôle

Publier exclusivement les fichiers de ce projet dans son dépôt public. GitHub Pages peut servir la racine de la branche `main`. Vérifier d’abord l’URL réellement fournie dans les réglages Pages, générer et contrôler le HTML statique avant transfert (`npm run build && npm run build:check`), puis tester `BASE_URL=<URL réelle terminée par /> npm test` et ouvrir la présentation et les trois variantes. Consigner le commit GitHub publié et rapprocher son contenu des empreintes des sources testées. Après ajout des nouveaux relevés, republier les observations et la présentation régénérée, puis exécuter `BASE_URL=<URL réelle terminée par /> npm run test:presentation` sans créer encore un relevé expérimental. Rapprocher les fichiers servis du manifeste de présentation. Le dépôt utilise actuellement `main`, vérifiée le 1er octobre 2026 ; les liens lecteur pointent vers `/blob/main/TESTING.md` et `/blob/main/README.md`. Aucune mise à jour locale ne doit être annoncée comme publiée avant contrôle des octets réellement servis.

## Texte factuel pour une proposition à Alsacréations

« J’ai préparé une démonstration isolant trois implémentations d’une commande identique : div cliquable, div avec rôle bouton et bouton HTML natif. Le projet distingue le code, la tabulation, l’activation clavier, les instantanés ARIA et les essais de lecteurs d’écran ou d’agents. Les vérifications sont rejouables et leurs sorties brutes sont archivées. Les protocoles manuels et les essais d’agents non exécutés sont explicitement indiqués comme non testés. L’objectif est pédagogique, sans extrapolation vers une conformité globale ou une performance SEO/IA. »

Avant envoi, joindre uniquement les liens réellement publiés et les observations effectivement obtenues. Aucun message n’est envoyé automatiquement.
