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
6. Comparer le contexte et la présentation ; vérifier les liens locaux, le repli sans JavaScript et l’absence de débordement de la présentation à 390 et 1280 px.

`observations.json` conserve tous les relevés des exécutions, leurs assertions et leurs échecs. Une exécution incomplète peut contenir `fatal`. Les essais reproductibles enregistrent les actions déterministes du script ; ils ne sont pas un essai d’agent autonome.

**Attentes de référence, pas observations :** A ne déclare pas de rôle bouton ; B le déclare mais ne fournit pas la mise au focus par Tab ni l’activation clavier ; C apporte ces comportements natifs. Les assertions évaluent cette attente et conservent toute divergence. Un essai négatif au clavier ne devient pas un essai positif de lecteur d’écran.

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

Publier exclusivement les fichiers de ce projet dans son dépôt public. GitHub Pages peut servir la racine de la branche `main`. Vérifier d’abord l’URL réellement fournie dans les réglages Pages, puis tester `BASE_URL=<URL réelle terminée par /> npm test` et ouvrir la présentation et les trois variantes. Consigner le commit GitHub publié et rapprocher son contenu des empreintes des sources testées. Aucune URL publique ne doit être annoncée avant vérification.

## Texte factuel pour une proposition à Alsacréations

« J’ai préparé une démonstration isolant trois implémentations d’une commande identique : div cliquable, div avec rôle bouton et bouton HTML natif. Le projet distingue le code, la tabulation, l’activation clavier, les instantanés ARIA et les essais de lecteurs d’écran ou d’agents. Les vérifications sont rejouables et leurs sorties brutes sont archivées. Les protocoles manuels et les essais d’agents non exécutés sont explicitement indiqués comme non testés. L’objectif est pédagogique, sans extrapolation vers une conformité globale ou une performance SEO/IA. »

Avant envoi, joindre uniquement les liens réellement publiés et les observations effectivement obtenues. Aucun message n’est envoyé automatiquement.
