// Shared by the static generator and the progressive enhancement. No DOM or I/O.
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function orderedRuns(data) {
  if (!data || !Array.isArray(data.runs)) throw new Error('Archive sans tableau runs');
  return data.runs.map((run, index) => {
    if (!run || !Number.isFinite(Date.parse(run.date))) throw new Error(`Date de relevé invalide : ${index}`);
    return {run, index};
  }).sort((a,b) => Date.parse(b.run.date)-Date.parse(a.run.date) || b.index-a.index);
}
export function status(run) {
  return run.fatal ? 'Interrompu — échec' : run.passed === true ? 'Contrôles réussis' : run.passed === false ? 'Échec des contrôles' : 'Statut non renseigné';
}
export const runLabel = run => `${run.date} · ${run.browser || 'Navigateur non renseigné'} ${run.browserVersion || ''} · ${run.environment || 'Environnement non renseigné'} · ${status(run)}`;
export function metadata(run) {
  if (!run) return 'Aucune exécution archivée — non testé.';
  const checks = Array.isArray(run.checks) ? run.checks : [];
  return `${runLabel(run)}. Playwright ${run.playwright || 'non renseigné'} ; canal ${run.channel || 'non renseigné'} ; Node ${run.node || 'non renseigné'} ; ${run.platform || 'plateforme non renseignée'}. ${checks.filter(c=>c.passed===true).length}/${checks.length} contrôles réussis. Révision testée : ${run.sourceRevision || 'non renseignée'}${run.provenanceVersion===2 ? ' (sources expérimentales et outillage, provenance v2)' : ' (manifeste historique, présentation incluse)'}.${run.fatal ? ` Arrêt : ${run.fatal}.` : ''}`;
}
export function cells(run, variant) {
  const entry = run?.variants?.find(v => v.variant?.toLowerCase() === variant.toLowerCase());
  if (!entry) return [variant.toUpperCase(), ...Array(4).fill(run ? 'Non testé — relevé absent' : 'Non testé')];
  const k = entry.keyboard || {};
  const forward = Array.isArray(k.forward) && k.forward.length > 0;
  const reached = forward && k.forward.some(step=>step.id==='command');
  const complete = forward && k.forward.some(step=>step.id==='reset');
  const tab = reached ? 'Atteinte par Tab' : complete ? 'Non atteinte par Tab (parcours observé)' : 'Non testé — parcours incomplet ou absent';
  const activation = (key, delta, label) => {
    if (Number.isFinite(k[delta])) return `${label} : ${k[delta]>=0?'+':''}${k[delta]}`;
    return `${label} : ${k[key]?.status || 'Non testé'}`;
  };
  const click = Array.isArray(entry.clickCounts) && entry.clickCounts.length ? entry.clickCounts.join(' → ') + (entry.clickCounts.length<4 ? ' (relevé partiel)' : '') : 'Non testé';
  return [variant.toUpperCase(), click, tab, `${activation('Enter','enterDelta','Entrée')} ; ${activation('Space','spaceDelta','Espace')}`, entry.commandSnapshot || 'Non testé — instantané absent'];
}
export const rowsHTML = run => ['a','b','c'].map(v => {
  const [label,...values] = cells(run,v);
  return `<tr><th scope="row">${label}</th>${values.map((value,i)=>`<td>${i===3?'<code>':''}${escapeHTML(value)}${i===3?'</code>':''}</td>`).join('')}</tr>`;
}).join('\n');
export function staticHTML(data) {
  const latest = orderedRuns(data)[0];
  return `<label for="run">Exécution archivée à consulter</label><br>
<select id="run" aria-describedby="selection-rule history-status" disabled><option value="${latest?.index ?? ''}">${escapeHTML(latest ? runLabel(latest.run) : 'Aucune exécution archivée')}</option></select>
<p id="selection-rule" class="fine">Par défaut : l’exécution la plus récente par date UTC, y compris en échec. À date égale, la dernière entrée du fichier est retenue.</p>
<p id="history-status" class="fine" role="status">Historique interactif indisponible tant que le script et les données ne sont pas chargés. Le relevé archivé ci-dessous reste consultable.</p>
<p id="run-meta" class="fine">${escapeHTML(metadata(latest?.run))}</p>
<div class="table-wrap" tabindex="0" role="region" aria-label="Tableau des observations, défilable horizontalement"><table><caption>Observations des trois commandes — locator.ariaSnapshot() de Playwright ciblé sur #command</caption><thead><tr><th scope="col">Variante</th><th scope="col">Clic</th><th scope="col">Tabulation</th><th scope="col">Entrée / Espace</th><th scope="col">Instantané ARIA ciblé</th></tr></thead><tbody id="observed">
${rowsHTML(latest?.run)}
</tbody></table></div>`;
}
