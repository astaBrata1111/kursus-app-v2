const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    await page.goto('http://localhost:3000/login');
    await page.type('input[type="email"]', 'admin@test.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    await page.goto('http://localhost:3000/admin/jadwal');
    await page.waitForTimeout(2000);

    // switch to agenda view
    console.log("Switching to list week view...");
    const agendaBtn = await page.$('.fc-listWeek-button');
    if (agendaBtn) await agendaBtn.click();
    else console.log("List week button not found");

    await page.waitForTimeout(1000);

    console.log("Clicking an event in Agenda View...");
    await page.evaluate(() => {
        const events = Array.from(document.querySelectorAll('.fc-list-event'));
        if (events.length > 0) {
            console.log("Found event, clicking...");
            const nativeEvent = document.createEvent('MouseEvents');
            nativeEvent.initEvent('click', true, true);
            events[0].dispatchEvent(nativeEvent);
            // also try clicking a link inside if any
            const link = events[0].querySelector('a');
            if (link) link.click();
        } else {
            console.log("No events found in Agenda View");
        }
    });

    await page.waitForTimeout(1000);

    console.log("Switching to Custom Daftar View...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const listBtn = btns.find(b => b.innerHTML.includes('LayoutList'));
        if (listBtn) listBtn.click();
    });

    await page.waitForTimeout(1000);

    console.log("Clicking Edit button in custom daftar view...");
    await page.evaluate(() => {
        const edits = Array.from(document.querySelectorAll('button[title="Edit"]'));
        if (edits.length > 0) {
            console.log("Found Edit pencil, clicking...");
            edits[0].click();
        } else {
            console.log("No Edit pencil found");
        }
    });

    await page.waitForTimeout(2000);
    console.log("Done checking.");
    await browser.close();
})();
