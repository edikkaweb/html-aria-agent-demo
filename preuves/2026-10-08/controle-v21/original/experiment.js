// L'action et le gestionnaire click sont strictement communs aux trois variantes.
const command = document.querySelector('#command');
const counter = document.querySelector('#count');
let quantity = 0;

function addOne() {
  quantity += 1;
  counter.textContent = String(quantity);
}

command.addEventListener('click', addOne);
document.querySelector('#reset').addEventListener('click', () => {
  quantity = 0;
  counter.textContent = '0';
});
// Aucun gestionnaire keydown/keyup, aucun tabindex ajouté, aucun focus forcé.
