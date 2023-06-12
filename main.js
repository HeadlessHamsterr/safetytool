const express = require('express');
const fileupload = require('express-fileupload');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const xl = require('excel4node');

const { parseExcelFile, excelToJson } = require('./modules/excelParser.js');
const generatePAScalProject = require('./modules/pascalGenerator.js');

//Maak een HTTP server aan op port 3000
const app = express();
const port = 3001;

//Definieer de map waarin alle bestanden worden opgeslagen die gebruikt worden door de site (geüploade vragenlijsten, PAScal projecten, etc)
const mainUserDirectory = path.join(__dirname, 'userFiles');

//Controleren of de userFiles map bestaat, anders wordt deze aangemaakt
if (!fs.existsSync(mainUserDirectory)) {
  fs.mkdirSync(mainUserDirectory);
}

app.use(express.static('public'));                              //Locatie van de statische bestanden
app.use(bodyParser.json());                                     //Middelware voor het parsen van JSON gegevens in de body van binnen komende requests
app.use(fileupload());                                          //Middelware voor het ontvangen van bestanden
//In development, als de frontend wordt gedraaid door "npm start", moet CORS worden ingeschakeld op de server
//De frontend draait dan op een ander domein dan de server, dit domein moet dan toegestaan worden op de server om de server requests te laten accepteren
//In production kan deze functie uitgeschakeld worden

app.use(cors({
  origin: '*'
}));


//Handler voor het / endpoint, stuurt de index pagina terug naar de client
app.get("/", (req, res) => {
  res.send('index.html');
});

//Handler voor de /upload endpoint, ontvang en parsed de vragenlijst en stuur vervolgens de data uit de vragenlijst in JSON formaat terug naar de client
app.post('/upload', (req, res) => {
  //Controleer of de sessionId een geldig UUID is, zo niet is de request niet geldig en wordt een error 403 teruggestuurd
  try {
    if (!checkIfUUID(req.body.sessionId)) {
      const responseMsg = {
        result: "failed",
        data: {
          errorType: "noUUID",
          errorMsg: "The received sessionID is not a UUID"
        }
      }
      res.status(403).send(responseMsg);
      return;
    }
  } catch (e) {
    const returnData = {
      result: "failed",
      data: {
        errorType: "noSessionId",
        errorMsg: "Probleem met het bericht naar de server. Probeer het opnieuw"
      }
    }

    res.status(500).send(returnData);
    return;
  }

  //Bestanden van clients worden opgeslagen in een map binnen de hoofdmap met als naam de sessionId, zodat deze later teruggevonden kunnen worden
  const userDirectory = path.join(mainUserDirectory, req.body.sessionId);

  try {
    if (req.files.excelFile.data.toString('utf-8', 0, 2) !== 'PK') {
      const returnData = {
        result: "failed",
        data: {
          errorType: "wrongFiletype",
          errorMsg: "Ongeldig Excel bestand"
        }
      }
      res.send(returnData);
    } else {
      //Maak de map aan als deze nog niet bestaat
      if (!fs.existsSync(userDirectory)) {
        fs.mkdirSync(userDirectory);
      }
      //Sla de vragenlijst op in de map van de client en haal de gegevens op met parseExelFile()
      fs.writeFileSync(path.join(userDirectory, req.files.excelFile.name), req.files.excelFile.data);

      let safetyData;
      try {
        safetyData = parseExcelFile(userDirectory, req.files.excelFile.name);
        //Gegevens uit vragenlijst worden opgeslagen als JSON bestand
        fs.writeFileSync(path.join(userDirectory, 'parsedExcel.json'), JSON.stringify(safetyData, null, 4));
        //Gegevens worden teruggestuurd naar de client, zodat de gebruiker deze nog een keer kan controleren
        res.setHeader('safetyfunctions', JSON.stringify(safetyData));
      } catch (e) {
        safetyData = {
          result: "failed",
          data: {
            errorType: "excelParseError",
            errorMsg: "Kan het Excel bestand niet verwerken. Controleer of de vragenlijst de laatste versie heeft."
          }
        }
      }

      if (req.headers.uploadtype === 'recalibration') {
        console.log("Received upload for recalibration");
      } else if (req.headers.uploadtype === 'normal') {
        res.send(safetyData);
      }
    }
  } catch (e) {
    const safetyData = {
      result: "failed",
      data: {
        errorType: "noFileUploaded",
        errorMsg: "Geen bestand geüpload"
      }
    }
    res.send(safetyData);
  }
});

/* De onderstaande code is een functie die een verzoek en antwoord afhandelt voor het
genereren en downloaden van een PAScal-projectbestand. Het controleert eerst of de sessionId in de
aanvraagheader een geldige UUID is, en als dat niet het geval is, stuurt het een foutbericht. Als de
sessionId geldig is, wordt gecontroleerd of er een gebruikersdirectory bestaat voor die sessionId,
en als dat niet het geval is, wordt er een foutbericht verzonden. Als de gebruikersdirectory
bestaat, leest de functie gegevens uit een JSON-bestand, genereert een PAScal-project op basis van die
gegevens en projectinformatie in de verzoekheader en slaat het projectbestand op met een bestandsnaam op
basis van de projectinformatie. Dit projectbestand wordt naar de client gestuurd zodat het gedownload kan worden. */
app.get('/pascal', (req, res) => {
  //Controleren of de sessionId een geldig UUID is, anders wordt een error teruggestuurd
  const sessionId = req.headers.sessionid;
  const projectInfo = JSON.parse(req.headers.projectinfo)

  if (!checkIfUUID(sessionId)) {
    const responseMsg = {
      result: "failed",
      data: {
        errorType: "noUUID",
        errorMsg: "The received sessionID is not a UUID"
      }
    }
    res.status(403).send(responseMsg);
  } else {
    //Controleren of een gebruikersmap bestaat voor deze sessionId, zo niet wordt er een error teruggestuurd
    const userDirectory = path.join(mainUserDirectory, sessionId);
    if (!fs.existsSync(userDirectory)) {
      const responseMsg = {
        result: "failed",
        data: {
          errorType: "unknownSessionId",
          errorMsg: "Verbinding met server verlopen. Upload de vragenlijst opnieuw."
        }
      }
      res.status(404).send(responseMsg);
    } else {
      //Gegevens uit vragenlijst ophalen uit het eerder gemaakte JSON bestand
      const safetyData = JSON.parse(fs.readFileSync(path.join(userDirectory, 'parsedExcel.json')))["data"];
      //PAScal project genereren op basis van de gegevens
      const pascalProject = generatePAScalProject(safetyData, projectInfo.author);
      //Bestandsnaam maken op basis van projectgegevens
      const filename = `${safetyData["klant"]}_${safetyData["projectnaam"]}_${safetyData["projectcode"]}.psc`;

      //PAScal project opslaan
      fs.writeFileSync(path.join(userDirectory, filename), pascalProject);

      res.setHeader('filename', filename);

      //PAScal project bestand terugsturen naar de gebruiker. Dit bestand wordt direct door de browser gedownload.
      res.download(path.join(userDirectory, filename), (err) => {
        if (err) {
          console.log(`Problem sending PAScal file to user: ${err}`);
          const responseMsg = {
            result: "failed",
            data: {
              errorType: "downloadError",
              errorMsg: "Probleem met het downloaden van het bestand. Probeer het opnieuw."
            }
          }
          res.send(responseMsg);
        }
      });
    }
  }
});

/* De onderstaande code is een functie die een checklist kan genereren voor de testapp. Het
controleert eerst of de sessionId in de aanvraagheader een geldige UUID is, en als dat niet het
geval is, stuurt het een foutmelding. Als de sessionId geldig is, wordt gecontroleerd of de
overeenkomstige gebruikersdirectory bestaat en zo niet, dan wordt een 404-foutmelding verzonden. Als
de directory bestaat, leest de functie een JSON-bestand met veiligheidsfuncties en genereert voor al 
deze veiligheidfuncties een checklist. Deze checklist wordt opgeslagen als Excel-bestand. Ten slotte 
stuurt de functie het Excel-bestand naar de client. */
app.get('/checklist', (req, res) => {
  const sessionId = req.headers.sessionid;
  if (!checkIfUUID(sessionId)) {
    const responseMsg = {
      result: "failed",
      data: {
        errorType: "noUUID",
        errorMsg: "The received sessionID is not a UUID"
      }
    }
    res.status(403).send(responseMsg);
  } else {
    const userDirectory = path.join(mainUserDirectory, sessionId);
    if (!fs.existsSync(userDirectory)) {
      const responseMsg = {
        result: "failed",
        data: {
          errorType: "unknownSessionId",
          errorMsg: "Verbinding met de server verlopen. Upload de vragenlijst opnieuw."
        }
      }
      res.status(404).send(responseMsg);
      return;
    }
    let safetyData;
    try {
      safetyData = JSON.parse(fs.readFileSync(path.join(userDirectory, 'parsedExcel.json')))["data"];
    } catch (e) {
      const responseMsg = {
        result: "failed",
        data: {
          errorType: "problemReadingParsedFile",
          errorMsg: "Probleem met het genereren van de checklist. Upload de vragenlijst opnieuw"
        }
      }
      res.status(500).send(responseMsg);
      return;
    }
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('Blad 1');

    const headers = ['Tag nr.', 'Device', 'ODC', 'Question Type', 'Section'];

    for(let i = 0; i < headers.length; i++){
        ws.cell(1, i+1).string(headers[i]);
    }

    for(let i = 0; i < safetyData.safetyFunctions.length; i++){
        ws.cell(i+2, 1).string(`${i}`);
        ws.cell(i+2, 2).string(`${safetyData.safetyFunctions[i].safetyFunctionTitle} | Gevolg van activatie: ${safetyData.safetyFunctions[i].data.safetyFunctionEffect}`);
        ws.cell(i+2, 3).string(`${i}`);
        ws.cell(i+2, 4).string("SafetyFunction");
        ws.cell(i+2, 5).string("Zone 1");
    }

    wb.writeToBuffer().then(function(checklist){
      fs.writeFileSync(path.join(userDirectory, 'checklist.xlsx'), checklist);
      res.download(path.join(userDirectory, 'checklist.xlsx'), (err) => {
        if (err) {
          console.log(`Problem sending checklist file to user: ${err}`);
          const responseMsg = {
            result: "failed",
            data: {
              errorType: "downloadError",
              errorMsg: "Probleem met het downloaden van het bestand. Probeer het opnieuw."
            }
          }
          res.send(responseMsg);
        }
      });
    });
  }
});

//Handler voor de /goodbye endpoint, hier wordt een request naartoe gestuurd door de client als de pagina wordt afgesloten
//De server verwijdert dan alle data van die client
app.post('/goodbye', (req, res) => {
  const sessionId = req.body.sessionId;

  //Wederom worden alleen geldige UUID's toegestaan
  if (!checkIfUUID(sessionId)) {
    const responseMsg = {
      result: "failed",
      data: {
        errorType: "noUUID",
        errorMsg: "The received sessionID is not a UUID"
      }
    }
    res.status(403).send(responseMsg);
  } else {
    //Verwijder de map van de client, als deze bestaat
    if (fs.existsSync(path.join(mainUserDirectory, sessionId))) {
      fs.rmSync(path.join(mainUserDirectory, sessionId), { recursive: true, force: true });
    } else {
    }
    //Response terugsturen naar de client
    res.status(200).send("Deleted user files");
  }
});

app.all('*', (req, res) => {
  const responseMsg = {
    result: "failed",
    data: {
      errorType: "noSuchRoute",
      errorMsg: "Onbekende URL"
    }
  }
  res.status(404).send(responseMsg);
});

//Functie voor het controleren of een string een geldig UUID is. Dit wordt gedaan met behulp van regex
function checkIfUUID(string) {
  //UUID's beginnen met 8 cijfers of nummers, dan drie keer 4 cijfers of nummers en eindigt met 12 cijfers of nummers, met telkens een streep tussen de onderdelen
  let regex = /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/i;
  return regex.test(string);
}

/* De onderstaande code is een functie die automatisch clientmappen verwijdert die langer
dan een uur inactief zijn geweest. Dit gebeurt door het bestand "parsedExcel.json" in elke
clientmap te controleren om te bepalen op welk tijdstip het bestand "parsedExcel.json" is gemaakt. 
Dit bestand wordt opnieuw aangemaakt, iedere keer dat de gebruiker iets uploadt. Als dit bestand meer dan een
uur oud is, wordt deze verwijderd. Dit betekend namelijk dat de gebruiker al een uur niks meer heeft geüpload.*/
setInterval(() => {
  try {
    //Huidige tijd bepalen, wordt opgeslagen in milliseconde sinds epoch
    const currentDate = Date.now();
    //ALle mappen in de map "userFiles" worden gecontroleerd
    const folders = fs.readdirSync(mainUserDirectory);

    //Loop door alle mappen
    for (const folder of folders) {
      let birthtime;

      //Als er geen bestand "parsedExcel.json" in de map van de client staat, is deze client map niet (of verkeerd) door de server aangemaakt.
      //De map kan dan direct verwijderd worden
      try {
        //Tijd van aanmaken van de client map ophalen, wordt opgeslagen in milliseconde sinds epoch
        birthtime = fs.statSync(path.join(mainUserDirectory, folder, 'parsedExcel.json')).birthtime.valueOf();
      } catch (e) {
        //Kan het bestand "parsedExcel.json" niet lezen, map wordt direct verwijderd.
        fs.rmSync(path.join(mainUserDirectory, folder), { recursive: true, force: true });
        continue;
      }

      //Verstreken tijd sinds het aanmaken van het "parsedExcel.json" bestand berekenen. Deze tijd wordt gegeven in minuten.
      const folderAliveTime = timeDifference(birthtime, currentDate);
      //Bestand is meer dan een uur oud
      if (folderAliveTime >= 60) {
        //Map van de client verwijderen
        fs.rmSync(path.join(mainUserDirectory, folder), { recursive: true, force: true });
      }
    }
  } catch (e) {
    console.log(`Error occured while auto-removing files: ${e}`);
  }
}, 900000);

//Deze functie wordt gebruikt voor het berekenen van het verschil tussen twee tijden.
//De tijden worden gegeven in milliseconde, het veschil wordt teruggegeven in minuten.
function timeDifference(pastTime, currentTime) {
  const difference = currentTime - pastTime;
  //60000 milliseconden in een minuut, dus verschil in tijd delen door 60000
  return Math.round(difference / 60000);
}

/*
  DEVELOPMENT
  Comment de onderstaande regel voordat dit bestand naar de repo gepushed wordt
*/
app.listen(port, () => {console.log(`Listening on port ${port}`)});

/*
  PRODUCTION
  Uncomment de onderstaande regel voordat dit bestand naar de repo gepushed wordt
*/
//app.listen(process.env.PORT, () =>{console.log(`Listening on port ${port}`)});