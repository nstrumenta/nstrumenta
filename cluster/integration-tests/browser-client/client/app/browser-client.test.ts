const apiKey = process.env.NSTRUMENTA_API_KEY;
const wsUrl = process.env.NSTRUMENTA_WS_URL;

describe('Page with browser client', () => {
  beforeAll(async () => {
    await page.goto(`http://localhost:3000?wsUrl=${wsUrl}&apiKey=${apiKey}`);
  });

  it('loads', async () => {
    expect.assertions(1);
    const text = await page.evaluate(() => document.body.textContent);
    expect(text).toContain('nstrumenta');
  });

  it('connects and gets status', async () => {
    await page.waitForFunction(
      (text: string) =>
        (document.querySelector('#status') as HTMLSpanElement).innerText.includes(text),
      { timeout: 10000 },
      '_status'
    );
  });

  it('shows timestamp when button pressed', async () => {
    await page.click('#ping-button');

    await page.waitForFunction(
      (text: string) =>
        (document.querySelector('#ping-result') as HTMLSpanElement).innerText.includes(text),
      { timeout: 10000 },
      'delta'
    );
  });
});
