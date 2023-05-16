const express = require('express');
const fileupload = require('express-fileupload');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const favicon = require('serve-favicon');
const cors = require('cors');

const { parseExcelFile, excelToJson } = require('./modules/excelParser.js');
const generatePAScalProject = require('./modules/pascalGenerator.js');
const generateChecklistData = require('./modules/checklistGenerator.js');

//Maak een HTTP server aan op port 3000
const app = express();
const port = 3001;

//Definieer de map waarin alle bestanden worden opgeslagen die gebruikt worden door de site (geüploade vragenlijsten, PAScal projecten, etc)
const mainUserDirectory = path.join(__dirname, 'userFiles');

//Controleren of de userFiles map bestaat, anders wordt deze aangemaakt
if(!fs.existsSync(mainUserDirectory)){
  fs.mkdirSync(mainUserDirectory);
}

app.use(express.static('public'));                              //Locatie van de statische bestanden
app.use(bodyParser.json());                                     //Middelware voor het parsen van JSON gegevens in de body van binnen komende requests
app.use(fileupload());                                          //Middelware voor het ontvangen van bestanden
app.use(favicon(path.join(__dirname, 'assets', 'icon.ico')));   //Middleware voor het versturen van de favicon
app.use(cors({
  origin: '*'
}));

//Handler voor het / endpoint, stuurt de index pagina terug naar de client
app.get("/", (req, res) => {
  res.send('index.html');
});

app.post('/downloadConvertedExcel', (req, res) => {
  if(!checkIfUUID(req.body.sessionId)){
    console.log(`SessionId ${req.body.sessionId} is not a UUID, ignoring`);
    res.status(403).send("The received sessionId is not a UUID");
  }else{
    const userDirectory = path.join(mainUserDirectory, req.body.sessionId);
    if(!fs.existsSync(userDirectory)){
      fs.mkdirSync(userDirectory);
    }

    fs.writeFileSync(path.join(userDirectory, req.files.excelFile.name), req.files.excelFile.data);
    excelToJson(userDirectory, req.files.excelFile.name);

    res.download(path.join(userDirectory, 'excel.json'), (err) => {
      if(err){
        console.log(err);
        res.send({error: err, msg: "Problem downloading the file"});
      }
    });    
  }
});

//Handler voor de /upload endpoint, ontvang en parsed de vragenlijst en stuur vervolgens de data uit de vragenlijst in JSON formaat terug naar de client
app.post('/upload', (req, res) => {
  //Controleer of de sessionId een geldig UUID is, zo niet is de request niet geldig en wordt een error 403 teruggestuurd
  try{
    if(!checkIfUUID(req.body.sessionId)){
      console.log(`SessionId ${req.body.sessionId} is not a UUID, ignoring`);

      const returnData = {
        result: "failed",
        data: {
          errorType: "noSessionId",
          errorMsg: "The received sessionId is not a UUID"
        }
      }
      res.status(403).send(returnData);
      return;
    }
  }catch(e){
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

  try{
    if(req.files.excelFile.data.toString('utf-8', 0, 2) !== 'PK'){
      const returnData = {
        result: "failed",
        data : {
          errorType: "wrongFiletype",
          errorMsg: "Ongeldig Excel bestand"
        }
      }
      res.send(returnData);
    }else{
      //Maak de map aan als deze nog niet bestaat
      if(!fs.existsSync(userDirectory)){
        fs.mkdirSync(userDirectory);
      }
      //Sla de vragenlijst op in de map van de client en haal de gegevens op met parseExelFile()
      fs.writeFileSync(path.join(userDirectory, req.files.excelFile.name), req.files.excelFile.data);

      let safetyData;
      try{
        safetyData = parseExcelFile(path.join(userDirectory, req.files.excelFile.name), true, true);
        //Gegevens uit vragenlijst worden opgeslagen als JSON bestand
        fs.writeFileSync(path.join(userDirectory, 'parsedExcel.json'), JSON.stringify(safetyData, null, 4));
        //Gegevens worden teruggestuurd naar de client, zodat de gebruiker deze nog een keer kan controleren
        res.setHeader('safetyfunctions', JSON.stringify(safetyData));
      }catch(e){
        safetyData = {
          result: "failed",
          data: {
            errorType: "excelParseError",
            errorMsg: "Kan het Excel bestand niet verwerken. Controleer of de vragenlijst de laatste versie heeft."
          }
        }
      }

      if(req.headers.uploadtype === 'recalibration'){
        console.log("Received upload for recalibration");
      }else if(req.headers.uploadtype === 'normal'){
        res.send(safetyData);
      }
    }
  }catch(e){
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

//Handler voor de /generate endpoint
//Deze handler maakt het pascal project en stuurt deze terug naar de gebruiker
app.get('/pascal', (req, res) => {
  //Controleren of de sessionId een geldig UUID is, anders wordt een error teruggestuurd
  const sessionId = req.headers.sessionid;
  const projectInfo = JSON.parse(req.headers.projectinfo)

  if(!checkIfUUID(sessionId)){
    console.log(`SessionId ${sessionId} is not a UUID, ignoring`);
    res.status(403).send("The received sessionId is not a UUID");
  }else{
    //Controleren of een gebruikersmap bestaat voor deze sessionId, zo niet wordt er een error teruggestuurd
    const userDirectory = path.join(mainUserDirectory, sessionId);
    if(!fs.existsSync(userDirectory)){
      console.log("Unkown sessionId");
      const responseMsg = {
        result: "failed",
        data: {
          errorType: "unkownSessionId",
          errorMsg: "Verbinding met server verlopen. Upload de vragenlijst opnieuw."
        }
      }
      res.status(404).send(JSON.stringify(responseMsg));
    }else{
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
        if(err){
          console.log(err);
          res.send({error: err, msg: "Problem downloading the file"});
        }
      });
    }
  }
});

app.get('/checklist', (req, res) => {
  const sessionId = req.headers.sessionid;

  if(!checkIfUUID(sessionId)){
    console.log(`SessionId ${sessionId} is not a UUID, ignoring`);
    res.status(403).send("The received sessionId is not a UUID");
  }else{
    const userDirectory = path.join(mainUserDirectory, sessionId);
    if(!fs.existsSync(userDirectory)){
      console.log("Unkown sessionId");
      res.status(404).send("Unkown sessionId");
      return;
    }
    let safetyData;
    try{
      safetyData = JSON.parse(fs.readFileSync(path.join(userDirectory, 'parsedExcel.json')))["data"];
    }catch(e){
      res.status(404).send(e);
      return;
    }
    console.log(safetyData);
    const checklist = generateChecklistData(safetyData);
    fs.writeFileSync(path.join(userDirectory, 'checklist.xlsx'), checklist);

    res.download(path.join(userDirectory, 'checklist.xlsx'), (err) => {
      if(err){
        console.log(err);
        res.send({error: err, msg: "Problem downloading the file"});
      }
    });
  }
});

//Handler voor de /goodbye endpoint, hier wordt een request naartoe gestuurd door de client als de pagina wordt afgesloten
//de server verwijdert dan alle data van die client
app.post('/goodbye', (req, res) => {
  const sessionId = req.body.sessionId;
  console.log(`Goodbye received from ${sessionId}`);

  //Wederom worden alleen geldige UUID's toegestaan
  if(!checkIfUUID(sessionId)){
    console.log(`SessionId ${sessionId} is not a UUID, ignoring`);
    res.status(403).send("The received sessionId is not a UUID");
  }else{
    //Verwijder de map van de client, als deze bestaat
    if(fs.existsSync(path.join(mainUserDirectory, sessionId))){
      fs.rmSync(path.join(mainUserDirectory, sessionId), { recursive: true, force: true });
    }else{
      console.log("Attempting to remove non-existent directory, ignoring");
    }
    //Response terugsturen naar de client
    res.status(200).send("Deleted user files");
  }
});

//HTTP server starten
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

//Functie voor het controleren of een string een geldig UUID is. Dit wordt gedaan met behulp van regex
function checkIfUUID(string){
  //UUID's beginnen met 8 cijfers of nummers, dan drie keer 4 cijfers of nummers en eindigt met 12 cijfers of nummers, met telkens een streep tussen de onderdelen
  let regex = /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/i;
  return regex.test(string);
}


//Om te voorkomen dat de server vol stroomt met oude bestanden, worden de bestanden automatisch verwijderd.
//Dit wordt gedaan door te controleren hoe lang het geleden is sinds het bestand "parsedExcel.json" is aangemaakt.
//Dit betand wordt telkens opnieuw aangemaakt als de gebruiker een Excel bestand upload. Als dit bestand meer dan een uur oud is, 
//betekent dat dat de gebruiker meer dan een uur niks heeft geüpload. De map kan dan verwijderd worden.
setInterval(()=>{
  try{
    //Huidige tijd bepalen, wordt opgeslagen in milliseconde sinds epoch
    const currentDate = Date.now();
    //ALle mappen in de map "userFiles" worden gecontroleerd
    const folders = fs.readdirSync(mainUserDirectory);

    //Loop door alle mappen
    for(const folder of folders){
      let birthtime;

      //Als er geen bestand "parsedExcel.json" in de map van de client staat, is deze client map niet (of verkeerd) door de server aangemaakt.
      //De map kan dan direct verwijderd worden
      try{
        //Tijd van aanmaken van de client map ophalen, wordt opgeslagen in milliseconde sinds epoch
        birthtime = fs.statSync(path.join(mainUserDirectory, folder, 'parsedExcel.json')).birthtime.valueOf();
      }catch(e){
        //Kan het bestand "parsedExcel.json" niet lezen, map wordt direct verwijderd.
        console.log(`File "parsedExcel.json" not present in folder ${folder}. Removing folder`);
        fs.rmSync(path.join(mainUserDirectory, folder), { recursive: true, force: true });
        continue;
      }

      //Verstreken tijd sinds het aanmaken van het "parsedExcel.json" bestand berekenen. Deze tijd wordt gegeven in minuten.
      const folderAliveTime = timeDifference(birthtime, currentDate);
      //Bestand is meer dan een uur oud
      if(folderAliveTime >= 60){
        console.log(`Time exceeded for client ${folder}, removing folder`);
        //Map van de client verwijderen
        fs.rmSync(path.join(mainUserDirectory, folder), {recursive: true, force: true});
      }
    }
  }catch(e){
    console.log(`Error occured while auto-removing files: ${e}`);
  }
}, 900000);

//Deze functie wordt gebruikt voor het berekenen van het verschil tussen twee tijden.
//De tijden worden gegeven in milliseconde, het veschil wordt teruggegeven in minuten.
function timeDifference(pastTime, currentTime){
  const difference = currentTime - pastTime;
  //60000 milliseconden in een minuut, dus verschil in tijd delen door 60000
  return Math.round(difference/60000);
}