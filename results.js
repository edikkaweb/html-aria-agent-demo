const select = document.querySelector('#run');
const rows = document.querySelector('#observed');
const meta = document.querySelector('#run-meta');

fetch('observations.json').then(response => {
  if (!response.ok) throw new Error('Observations indisponibles');
  return response.json();
}).then(data => {
  if (!data.runs?.length) return;
  const runs = [...data.runs].reverse();
  select.replaceChildren();
  runs.forEach((run, index) => select.add(new Option(`${run.channel === 'chrome' ? 'Chrome' : run.browser} ${run.browserVersion} · ${run.date.slice(0,16)} · ${run.environment}`, String(index))));
  select.disabled = false;
  function render() {
    const run = runs[Number(select.value)];
    meta.textContent = `${run.date} · Playwright ${run.playwright} · ${run.platform} · révision des sources ${run.sourceRevision.slice(0, 16)}. ${run.passed ? 'Contrôles du protocole réussis.' : 'Au moins un contrôle a échoué : consulter les données brutes.'}`;
    rows.replaceChildren();
    if (!run.variants.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.textContent = 'Non testé — exécution interrompue avant les observations. Consulter le fichier brut.';
      row.append(cell);
      rows.append(row);
    }
    for (const entry of run.variants) {
      const row = document.createElement('tr');
      const cells = [entry.variant.toUpperCase(),entry.clickCounts.join(' → '),entry.keyboard.reached ? 'Commande atteinte' : 'Commande non atteinte',entry.keyboard.reached ? `+${entry.keyboard.enterDelta} / +${entry.keyboard.spaceDelta}` : 'Non testé — commande non atteinte',entry.commandSnapshot.trim() || 'Aucun nœud restitué'];
      for (let i=0;i<cells.length;i++) {
        const cell = document.createElement(i===0 ? 'th' : 'td');
        if (i===0) cell.scope='row';
        cell.textContent=cells[i];
        row.append(cell);
      }
      rows.append(row);
    }
  }
  select.addEventListener('change',render);
  render();
}).catch(() => { meta.textContent = 'Observations non chargées. Consultez le fichier JSON ou relancez les vérifications ; aucun résultat ne peut être déduit de cet affichage.'; });
