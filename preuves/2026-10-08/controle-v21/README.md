# Contrôle complémentaire du 8 octobre 2026

Ce dossier complète les mesures MCP 0.0.68 et Lighthouse déjà publiées. Il utilise MCP **0.0.83**, Playwright Test **1.64.0**, et le même Google Chrome **155.0.8059.39** sur macOS arm64. MCP embarque Playwright **1.64.0-alpha-1790635538000**.

## Rejouer

Installer Node.js 22.19 ou plus récent et Google Chrome, puis exécuter `npm ci` et `npm run measure` dans ce dossier. Le collecteur démarre son serveur local et des sessions Chrome isolées. Les nouvelles sorties vont dans `runs/DATE/`. Un dossier de sortie existant est refusé : `results/` conserve les preuves livrées.

Le collecteur compare les observations aux résultats de la campagne. Une évolution des outils peut donc le faire échouer. Les tests clavier A/B terminent avec un code 1 : ces échecs sont conservés et attendus par le collecteur, sans être transformés en succès du parcours.

## Protocole

- Sources `original/` et `no-pointer/` identiques aux cinq fichiers correspondants du dossier initial. Le second lot ajoute seulement une surcharge CSS `cursor: default`.
- Six sessions MCP isolées : navigation, instantané, compteur initial, clic via `browser_click({target: reference})`, compteur final. La cible est choisie par un script déterministe, sans agent autonome.
- Trois comparaisons de représentations : `#command.ariaSnapshot()`, `body.ariaSnapshot()` par défaut et `Accessibility.getFullAXTree` via CDP. Le fichier conserve tous les nœuds CDP ; l’observation sur NOTES porte sur ceux dont `ignored` vaut false.
- Neuf contextes distincts : click(), press(Enter), puis deux Tab et Entrée, pour B, C et C avec le seul attribut tabindex=-1 ajouté en mémoire. Les pages originales restent inchangées.
- Six tests clavier : deux touches sur trois variantes d’origine, sans modification du test de la première campagne. A/B échouent, C réussit.

`results/measurements.json` consigne versions, empreintes, sorties résumées, assertions et dates réelles. Les fichiers MCP conservent appels et réponses. Les rapports clavier conservent les erreurs.

Le YAML complet avant interaction est identique pour B et C ; les URL situées dans les métadonnées de réponse diffèrent. La référence e14 est locale à chaque session.

Lighthouse n’a pas été relancé : les scores cités restent ceux des six rapports initiaux. Aucun test de lecteur d’écran ou d’agent autonome ; aucune conclusion de conformité générale.

---

## English summary

This separate verification uses MCP 0.0.83 and Playwright Test 1.64.0 with Chrome 155.0.8059.39. Run `npm ci` then `npm run measure`. New output goes to a fresh `runs/DATE/` directory; existing evidence is never overwritten.

The six deterministic MCP clicks succeed. B/C have identical full YAML blocks before interaction, while response URLs differ. Default body ARIA snapshots and non-ignored Chromium AX nodes omit NOTES, which MCP includes. Separate click/press/Tab cases include a native button with only tabindex=-1 added in memory. The six keyboard tests preserve four failures (A/B) and two passes (C). Lighthouse was not rerun. No autonomous-agent or screen-reader trial is included.
