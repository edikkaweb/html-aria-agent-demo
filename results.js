import { orderedRuns, runLabel, metadata, rowsHTML } from './observations-view.js';
const select = document.getElementById('run');
const rows = document.getElementById('observed');
const meta = document.getElementById('run-meta');
const history = document.getElementById('history-status');
async function enhance() {
  try {
    const response = await fetch('observations.json', {cache:'no-store', signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const runs = orderedRuns(await response.json());
    if (!runs.length) throw new Error('Historique vide');
    const options = runs.map(({run,index}) => new Option(runLabel(run), String(index)));
    function render(index) {
      const run = runs.find(item=>String(item.index)===index)?.run;
      if (!run) return;
      // Build both representations before replacing the archived fallback.
      const html = rowsHTML(run), text = metadata(run);
      rows.innerHTML = html;
      meta.textContent = text;
    }
    render(String(runs[0].index));
    select.replaceChildren(...options);
    select.disabled = false;
    history.textContent = 'Historique disponible. Choisissez une exécution pour consulter sa date, sa configuration et ses observations.';
    select.addEventListener('change', () => {
      render(select.value);
      history.textContent = `Exécution sélectionnée : ${select.selectedOptions[0].textContent}. Métadonnées et tableau mis à jour ci-dessous.`;
    });
  } catch {
    // A transport/format failure says nothing about the archived experiment.
    history.textContent = 'Chargement de l’historique échoué ou indisponible. Le tableau statique et ses métadonnées archivées sont conservés ; les observations brutes et le protocole restent accessibles.';
  }
}
void enhance();
