import { browser, by, element } from 'protractor';

describe('Investment Tracker App', () => {
  it('should display landing page and Login button', async () => {
    await browser.get('/');
    const title = await element(by.css('app-landing h1')).getText();
    expect(title).toContain('CapitalCompass');

    const loginButton = element(by.css('app-landing button'));
    expect(await loginButton.getText()).toContain('Login');
  });
});
