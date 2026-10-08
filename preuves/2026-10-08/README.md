# Mesures du 8 octobre 2026 — Playwright MCP, Lighthouse et clavier

Trois variantes visuelles de « Ajouter au panier » : un div, un div avec role=button, un bouton natif. Les deux premières sont volontairement incomplètes.

1. Installer Node.js **22.19 ou plus récent** et Google Chrome. La série livrée utilise Node 24.19.0 et Chrome 155.0.8059.39 sur macOS arm64.
2. Dans ce dossier : `npm ci`.
3. Lancer `npm run serve`, puis ouvrir http://127.0.0.1:8765/.
4. Essayer Tab depuis le début de chaque page. Seule C place l’ajout au panier au deuxième arrêt.
5. Dans un autre terminal, `npm run test:keyboard` : deux tests réussissent sur C.
6. `VARIANT=b npm run test:keyboard` : les deux tests échouent sur le focus, avec un code de sortie 1. Même code avec `VARIANT=a` : aucun bouton portant le nom demandé.
7. `npm run measure` démarre son propre serveur, appelle réellement MCP, exécute les tests clavier et lance six audits Lighthouse. Les nouvelles sorties vont dans `runs/DATE/` ; les preuves initiales dans `results/` sont préservées.

Sur un autre système, fournir `CHROME_PATH` à `npm run measure` si chrome-launcher ne reçoit pas le chemin adapté. Les versions du navigateur et du système sont enregistrées ; un nouveau passage n’est pas une reproduction des anciens binaires.

## Trois séries distinctes

- `original/` : fichiers archivés de la révision ae880251a7e8b40ceaed41e4eca2b7b82137d762 du dépôt https://github.com/edikkaweb/html-aria-agent-demo. Les cinq fichiers servis sont a.html, b.html, c.html, styles.css, experiment.js. Les autres documents conservent le contexte historique et leur licence.
- `contrast/` : mêmes cinq fichiers ; seul le fond du carnet change de #687b40 à #647640 dans styles.css. Aucun changement du bouton, du compteur ou du script.
- `no-pointer/` : mêmes cinq fichiers d’origine ; ajout d’une règle `.command { cursor: default; }`. Aucun changement de contraste. Cette série sert uniquement au contre-essai MCP.

Le serveur fournit un index local séparé à la place du lien « Retour à la présentation » ; cet index ne participe pas aux mesures. Les fichiers expérimentaux restent inchangés.

## Lire les preuves

- `results/measurements.json` : environnement, empreintes SHA-256 et synthèse.
- `results/mcp-*.json` : paramètres et réponses complets des appels du serveur MCP. La cible est choisie par un script. Aucun modèle autonome ne participe à cette mesure.
- `results/keyboard-*.json` : rapports Playwright bruts. Les échecs A/B sont conservés, sans test marqué « échec attendu ».
- `results/lighthouse-*.json` et `.html` : six rapports complets. Il faut distinguer le score d’accessibilité de l’audit agent-accessibility-tree.
- `package-lock.json` : arbre exact des dépendances. MCP 0.0.68 embarque Playwright 1.59.0-alpha-1771104257000 ; le test clavier emploie @playwright/test 1.63.0.

`measure.mjs` consigne les codes de sortie des tests : il termine normalement quand toutes les mesures ont été recueillies, y compris les échecs clavier. Ce script est un collecteur expérimental. **Le contrôle de régression est `npm run test:keyboard`**, qui doit échouer si le comportement attendu manque.

La série n’inclut ni lecteur d’écran, ni agent autonome, ni audit complet WCAG/RGAA. Les annonces du compteur ne sont pas déduites du HTML. Aucun fichier du site publié n’est modifié par ces commandes.


## Lire les résultats

[Page française](index.html) · [English evidence guide](index-en.html). Les mesures du 8 octobre ont été exécutées localement sur les sources figées, puis publiées ici. L’hébergement de ces rapports ne constitue pas une nouvelle campagne de mesure.
