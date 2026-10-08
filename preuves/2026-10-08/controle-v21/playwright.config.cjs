module.exports = {
  testDir: __dirname,
  testMatch: 'keyboard.spec.cjs',
  workers: 1,
  retries: 0,
  timeout: 15000,
  expect: {timeout: 1500},
  use: {
    baseURL: process.env.DEMO_BASE_URL || 'http://127.0.0.1:8765/original/',
    channel: 'chrome', headless: true,
    viewport: {width:1280,height:900}, locale:'fr-FR',
  },
  reporter: [['json', {outputFile:process.env.KEYBOARD_REPORT || 'keyboard-results.json'}]],
  outputDir: 'test-artifacts',
};
