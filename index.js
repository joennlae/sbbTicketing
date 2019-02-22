const puppeteer = require('puppeteer');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
const fields = ['name','duration','changes','seatsSecond','price','cheapTicket'];
const opts = { fields };




let bookingUrl = 'https://www.sbb.ch/de/kaufen/pages/fahrplan/fahrplan.xhtml?suche=true&language=de&vias=%5B%22%22%5D&von=Z%C3%BCrich+HB&nach=Bern%2C+Hauptbahnhof&viaField1=&datum=Fr%2C+22.02.2019&zeit=20%3A27&an=false';
(async () => {

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 926 });
    await page.goto(bookingUrl);
    for( let i = 0; i < 0; i++){
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
            function calculateMins(timeString){
                let splitted = timeString.split(' ');
                console.log('split',splitted);
                if(splitted.length > 3){
                    return parseInt(splitted[0])*60 + parseInt(splitted[2]);
                }
                else return parseInt(splitted[0]);
            }
            function convertBelegung(belegungString){
                if(belegungString === '2. Klasse, Tiefe bis mittlere Belegung erwartet') return 1;
                else if(belegungString === '2. Klasse, Hohe Belegung erwartet') return 2;
                else if(belegungString === '2. Klasse, Sehr hohe Belegung erwartet') return 3;
                else return 0;
            }
            let connection = {}
            let info = elm.outerText.split('\n');
            console.log(info);
            if(info.length == 35){ //no sparticket possible
                connection.name = info[0].split(' ')[0];
                //connection.departure = info[14];
                connection.duration = calculateMins(info[18]);
                connection.changes = info[21];
                //connection.seatsFirst = info[26];
                connection.seatsSecond = convertBelegung(info[28]);
                connection.price = info[34].split(' ')[2];
                connection.cheapTicket = false;
                connection.length = info.length;
            }
            if(info.length == 36 && info[2] == 'Sparbillett verfügbar'){ //sparticket verfügbar
                connection.name = info[0].split(' ')[0];
                //connection.departure = info[14];
                connection.duration = calculateMins(info[19]);
                connection.changes = info[22];
                //connection.seatsFirst = info[27];
                connection.seatsSecond = convertBelegung(info[29]);
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