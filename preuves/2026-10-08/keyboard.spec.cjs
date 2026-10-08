const {test, expect} = require('@playwright/test');

const variant = process.env.VARIANT || 'c';

for (const key of ['Enter', 'Space']) {
  test(`Tab atteint le bouton ; ${key} ajoute un article`, async ({page}) => {
    await page.goto(`${variant}.html`);
    await expect(page.locator('#count')).toHaveText('0');
    await page.keyboard.press('Tab'); // Lien « Voir le produit ».
    await page.keyboard.press('Tab'); // Le bouton doit venir ensuite.
    await expect(page.getByRole('button', {
      name: 'Ajouter au panier', exact: true,
    })).toBeFocused();
    await page.keyboard.press(key);
    await expect(page.locator('#count')).toHaveText('1');
  });
}
