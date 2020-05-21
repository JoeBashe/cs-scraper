const puppeteer = require('puppeteer-extra');
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
// require autoscroll-down plugin to handle infinite scrolling
const scrollPageToBottom = require('puppeteer-autoscroll-down');

const CONFIG = require('./config');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: CONFIG.executablePath,
        headless:       true,
    });
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(30000);
    await page.setViewport({width: 1320, height: 1200});
    // await page.waitForNavigation();

    // open website
    await page.goto('https://www.couchsurfing.com/users/sign_in?cs_new_fe=true');

    // login
    await page.type('#user_login', CONFIG.login);
    await page.waitFor(3000);
    await page.keyboard.press('Tab');
    await page.waitFor(3000);
    await page.keyboard.type(CONFIG.password);
    await page.waitFor(3000);

    await page.keyboard.press('Enter');
    await page.waitFor(10000);

    // go to messages
    await page.click('.global-header-link.mod-inbox');
    await page.waitFor(10000);

    // expand all messages
    // if (await page.$('.js-load-more-threads') !== null) {
    //     while (await page.$('.js-load-more-threads') !== null) {
    //         await page.click('.global-header-link.mod-inbox');
    //         await page.waitFor(3000);
    //     }
    // } else {
    let lastPosition = 0;
    let previousPosition = -1;
    while (lastPosition !== previousPosition) {
        previousPosition = lastPosition; // save last pos in "previousPostition"
        lastPosition = await scrollPageToBottom(page);
        await page.waitFor(3000);
    }
    // }

    let messageIds = await page.evaluate(() => {
        let lis = [...document.querySelectorAll('li.inbox-thread__item')];
        return lis.map((li) => li.id);
    });

    // iterate over messages
    for (let k in messageIds) {
        let mid = messageIds[k];
        // go to message details
        await page.goto('https://www.couchsurfing.com/messages/' + mid);
        // save page
        await page.emulateMedia('screen');
        const pageTitle = await page.title();
        await page.pdf({
            'path': `${savePath}/${mid}--${pageTitle}.pdf`,
        });
    }
    await browser.close();
})();
