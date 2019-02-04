const puppeteer = require('puppeteer');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
const fields = ['name', 'train', 'direction', 'departure','arrival','duration','changes','seatsFirst','seatsSecond','leavingPlatform','price','cheapTicket'];
const opts = { fields };




let bookingUrl = 'https://www.sbb.ch/de/kaufen/pages/fahrplan/fahrplan.xhtml?suche=true&language=de&vias=%5B%22%22%5D&von=Bern%2C+Hauptbahnhof&nach=Lupsingen%2C+Dorf&viaField1=&datum=Mo%2C+04.02.2019&zeit=23%3A33&an=false';
(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 926 });
    await page.goto(bookingUrl);
    for( let i = 0; i < 20; i++){
        await Promise.all([
            page.click('#next-connections-id'),
            page.waitFor(2000),
        ]);
    }
    // get ticket details
    let ticketData = await page.evaluate(() => {
        let tickets = [];
        // get the ticket elements
        let ticketsElms = document.querySelectorAll('div[data-init=wmTimetableExt]')
        // get the ticket data
        ticketsElms.forEach((elm) => {
            let connection = {}
            let info = elm.outerText.split('\n');
            if(info.length == 35){ //no sparticket possible
                connection.name = info[0];
                connection.train = info[3];
                connection.direction = info[5];
                connection.departure = info[13];
                connection.arrival = info[17];
                connection.duration = info[18];
                connection.changes = info[21];
                connection.seatsFirst = info[26];
                connection.seatsSecond = info[28];
                connection.leavingPlatform = info[30];
                connection.price = info[34].split(' ')[2];
                connection.cheapTicket = false;
                connection.length = info.length;
            }
            if(info.length == 36 && info[2] == 'Sparbillett verfügbar'){ //sparticket verfügbar
                connection.name = info[0];
                connection.train = info[4];
                connection.direction = info[6];
                connection.departure = info[14];
                connection.arrival = info[18];
                connection.duration = info[19];
                connection.changes = info[22];
                connection.seatsFirst = info[27];
                connection.seatsSecond = info[29];
                connection.leavingPlatform = info[31];
                connection.price = info[35].split(' ')[2];
                connection.cheapTicket = true;
                connection.length = info.length;
            }
            tickets.push(connection);
        });
        return tickets;
    });
    console.dir(ticketData);
    try {
        const parser = new Json2csvParser(opts);
        const csv = parser.parse(ticketData);
        console.log(csv);
        fs.writeFile("export.csv", csv, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 
      } catch (err) {
        console.error(err);
      }
})();