let excelFile = null;
let eplanFile = null;
let pascalFilename = null;
const allowedExcelExtensions = ['xlsx', 'xls', 'xlsm'];
const allowedEplanExtensions = ['test'];

//Deze functie wordt aangeroepen als op de "importeren" knop wordt gedrukt en upload het Excel bestand naar de server
function importExcelFile(){
    //Object voor het opslaan van de data die naar de server gestuurd gaat worden
    const formData = new FormData();

    //Excel bestand en sessionId van de client toevoegen aan het object
    formData.append('excelFile', excelFile);
    formData.append('sessionId', sessionStorage.getItem('sessionId'));

    //HTTP POST request aanmaken voor het /upload endpoint, met als response data "text"
    const xhr = new XMLHttpRequest();
    xhr.open("POST", '/upload');
    xhr.responseType = 'text';
    xhr.setRequestHeader('uploadType', 'normal')

    xhr.onload = () => {
        //Data wordt teruggestuurd als JSON string, omzetten naar een object om uit te kunnen lezen
        const safetyData = JSON.parse(xhr.getResponseHeader('Safetyfunctions'));
        console.log(safetyData);
        //Controleren of er errors gevonden zijn
        if(safetyData.result === "success"){
            //Data voor de veiligheidsfuncties opslaan in de session storage, zodat deze later gebruikt kan worden
            sessionStorage.setItem('safetyData', JSON.stringify(safetyData.data));

            //Nieuwe inhoud van de webpagina wordt door de server naar de client gestuurd
            //Er wordt dus geen nieuwe pagina geladen, maar er wordt nieuwe inhoud op dezelfde pagina getoond
            //Op die manier wordt het "beforeunload" event niet aangeroepen en wordt er geen berichtg gestuurd naar de /goodbye endpoint, 
            //waardoor de server de bestanden vna de client niet verwijdert
            const newContent = xhr.responseText;
            document.querySelector('#content').innerHTML = newContent;
            window.onresize = resizeGrid;
            resizeGrid();
            //Geschiedenis van de browser aanpassen, zodat de nieuwe inhoud van de pagina ertussen staat. Op die manier werken de terug een vooruit knoppen in de browser zoals verwacht.
            history.pushState({}, '', '/safetyfunctions');
        }else{
            console.log(safetyData.data.errorType);
            let errorMsg;

            switch(safetyData.data.errorType){
                case "noCustomerInfoSheet":
                    errorMsg = 'Onbekend document|Geen blad "Klant informatie" gevonden'
                    break;
                case "undefinedCells":
                    errorMsg = `De vragenlijst is niet volledig ingevuld, of er is een verkeerde versie geüpload|Controleer "${safetyData.data.emptyCell}" op blad "${safetyData.data.sheet}"`;
                    break;
                default:
                    errorMsg = "Onbekende fout opgetreden|Controleer het document"
                    break;
            }

            throwImportError('excel', errorMsg, false);
        }
    }

    //HTTP request versturen, met in de body de data
    xhr.send(formData);
}

//Deze functie wordt aangeroepen wanneer de gebruiker op de "Genereer PAScal project" knop drukt
//Er wordt een GET request gestuurd naar het /generate endpoint op de server, de server genereert het PAScal project en stuurt deze terug naar de client
//Vervolgens wordt dit project automatisch door de browser gedownloaded.
function savePascalFile(){
    //GET request sturen naar het /generate endpoint
    const author = document.getElementById('author').value;
    const projectLocation = document.getElementById('projectLocation').value.replace(/["'`]/g, '');
    console.log(projectLocation);
    fetch(`/generate`, {
        method: "GET",
        headers: {
            //De If-None-Match header zorgt ervoor dat de server alleen data terugstuurd wanneer er iets is verandert aan de data die wordt teruggestuurd
            //Omdat het gegenereerde project waarschijnlijk niet verandert tussen requests, maar er wel bij iedere request een project moet worden teruggestuurd
            //moet deze header leeggemaakt worden. Hierdoor stuurt de server altijd data terug naar de client ipv een 304 (https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304)
            'If-None-Match': '',
            //SessionId meesturen zodat de server de juiste bestanden terug stuurt
            sessionId: sessionStorage.getItem("sessionId"),
            projectInfo: JSON.stringify({author: author, projectLocation: projectLocation})
        }
    })
    //Wachten tot de server reageert, dan wordt deze functie uitgevoerd
    .then(response => {
        //Bestandsnaam staat in de header "content-disposition" in het format "filename=FILENAME", deze wordt hier eruit gehaald
        pascalFilename = response.headers.get('content-disposition').split('filename=')[1].replace(/["'`]/g, '');
        console.log(pascalFilename);
        //Bestanden worden doorgestuurd dmv een ReadableStream. Hiervoor moet de default reader uit de body worden gehaald.
        //Deze reader kan dan worden gebruikt om de data van het gestuurde bestand uit de ReadableStream te halen. (https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
        const reader = response.body.getReader();
        //Array aanmaken om de chunks data in op te slaan
        let chunks = [];

        //Deze functie haalt de data (chunks) uit de readable stream. Als alle chunks zijn gehad (done = true) wordt de array met chunks omgezet naar een blob en vervolgens
        //door de browser gedownload als bestand.
        readStream();
        function readStream(){
            //Lees de volgende chunk
            reader.read().then(({ value, done }) => {
                //Alle chunks gehad
                if(done){
                    //Totale lengte van de chunks berekenen zodat een uint8 array met de juiste lengte kan worden gemaakt.
                    const chunkLength = chunks.reduce((totalLength, chunk) => totalLength + chunk.length, 0);
                    const uint8Array = new Uint8Array(chunkLength);

                    //Chunks kopieëren uit de chunks array naar de uint8 array
                    let offset = 0;
                    for(const chunk of chunks){
                        //De offset is de locatie in de uint8 array. Omdat de chunks direct na elkaar moeten worden geplaatst, schuift de offset iedere keer op met de
                        //lengte van de vorige chunk.
                        uint8Array.set(chunk, offset);
                        offset += chunk.length;
                    }

                    //uint8 array omzetten naar blob
                    const blob = new Blob([uint8Array], { type: 'application/xml' });

                    //URL maken van de blob zodat deze gedownload kan worden
                    const url = window.URL.createObjectURL(blob);
                    //Element aanmaken om de URL van de blob aan vast te kunnen maken
                    const a = document.createElement('a');
                    a.href = url;
                    //Bestandsnaam instellen
                    a.download = pascalFilename;
                    //De link wordt door de browser direct ingedrukt, zodat het bestand automatisch wordt gedownload
                    a.click();
                    //Element en URL verwijderen na gebruik
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    //Alle chunks zijn gehad en het bestand is gedownload, dus de functie wordt afgesloten
                    return;
                }

                //Chunk toevoegen aan array met chunks
                chunks.push(value);
                //Volgende chunk lezen
                readStream();
            });
        }
    });
}

function getChecklistData(){
    fetch(`/checklist`, {
        method: "GET",
        headers: {
            //De If-None-Match header zorgt ervoor dat de server alleen data terugstuurd wanneer er iets is verandert aan de data die wordt teruggestuurd
            //Omdat het gegenereerde project waarschijnlijk niet verandert tussen requests, maar er wel bij iedere request een project moet worden teruggestuurd
            //moet deze header leeggemaakt worden. Hierdoor stuurt de server altijd data terug naar de client ipv een 304 (https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304)
            'If-None-Match': '',
            //SessionId meesturen zodat de server de juiste bestanden terug stuurt
            sessionId: sessionStorage.getItem("sessionId"),
        }
    })
    //Wachten tot de server reageert, dan wordt deze functie uitgevoerd
    .then(response => {
        //Bestandsnaam staat in de header "content-disposition" in het format "filename=FILENAME", deze wordt hier eruit gehaald
        pascalFilename = response.headers.get('content-disposition').split('filename=')[1].replace(/"/g, '');
        //Bestanden worden doorgestuurd dmv een ReadableStream. Hiervoor moet de default reader uit de body worden gehaald.
        //Deze reader kan dan worden gebruikt om de data van het gestuurde bestand uit de ReadableStream te halen. (https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
        const reader = response.body.getReader();
        //Array aanmaken om de chunks data in op te slaan
        let chunks = [];

        //Deze functie haalt de data (chunks) uit de readable stream. Als alle chunks zijn gehad (done = true) wordt de array met chunks omgezet naar een blob en vervolgens
        //door de browser gedownload als bestand.
        readStream();
        function readStream(){
            //Lees de volgende chunk
            reader.read().then(({ value, done }) => {
                //Alle chunks gehad
                if(done){
                    //Totale lengte van de chunks berekenen zodat een uint8 array met de juiste lengte kan worden gemaakt.
                    const chunkLength = chunks.reduce((totalLength, chunk) => totalLength + chunk.length, 0);
                    const uint8Array = new Uint8Array(chunkLength);

                    //Chunks kopieëren uit de chunks array naar de uint8 array
                    let offset = 0;
                    for(const chunk of chunks){
                        //De offset is de locatie in de uint8 array. Omdat de chunks direct na elkaar moeten worden geplaatst, schuift de offset iedere keer op met de
                        //lengte van de vorige chunk.
                        uint8Array.set(chunk, offset);
                        offset += chunk.length;
                    }

                    //uint8 array omzetten naar blob
                    const blob = new Blob([uint8Array], { type: 'application/vnd.ms-excel' });

                    //URL maken van de blob zodat deze gedownload kan worden
                    const url = window.URL.createObjectURL(blob);
                    //Element aanmaken om de URL van de blob aan vast te kunnen maken
                    const a = document.createElement('a');
                    a.href = url;
                    //Bestandsnaam instellen
                    a.download = pascalFilename;
                    //De link wordt door de browser direct ingedrukt, zodat het bestand automatisch wordt gedownload
                    a.click();
                    //Element en URL verwijderen na gebruik
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    //Alle chunks zijn gehad en het bestand is gedownload, dus de functie wordt afgesloten
                    return;
                }

                //Chunk toevoegen aan array met chunks
                chunks.push(value);
                //Volgende chunk lezen
                readStream();
            });
        }
    });
}

//Deze functie wordt aangeroepen als de gebruiker op de "openen" knop drukt en zorgt ervoor dat de gebruiker een Excel bestand kan uploaden
function openFile(type){
    //Er wordt een input element aangemaakt, waarmee de gebruiker het Excel bestand kan selecteren
    let input = document.createElement('input');
    //Input elementen met type "file" kunnen gebruikt worden om bestanden te uploaden
    input.type = 'file';
    input.name = 'excelFile';
    //Alleen toestaan dat Excel bestanden worden geüpload
    input.accept = '.xls,.xlsx,.xlsm';
    //Deze functie wordt aangeroepen als de gebruiker een bestand upload
    input.onchange = _ => {
        console.log(`New file: ${input.files[0].name}`);
        //Controleren of de extensie van het geüploade bestand correct is
        //Deze functie zet ook meteen de naam van het bestand naast de "openen" knop en verkort deze als de naam te lang is
        if(getFileInfo(input.files[0].name, type)){
            //Afhankelijk van welk bestand geüpload is, wordt het bestand in de juiste variabele op geslagen
            switch(type){
                case 'excel':
                    excelFile = input.files[0];
                break;
                case 'eplan':
                    eplanFile = input.files[0];
                break;
            }
        }
    }
    //Klikken op het input element, zodat de gebruiker een bestand kan uploaden
    input.click();
}

//Deze functie wordt aangeroepen als de gebruiker een bestand in de uploadbox sleept
function dropHandler(event, type){
    console.log("File dropped!");
    //Het standaard gedrag van de browser is om een bestand te openen wat in de browser wordt gedropt, dit moet worden voorkomen
    event.preventDefault();

    //Gedropte bestanden kunnen door de browser worden gelezen als files of items, deze moeten anders behandelt worden
    if(event.dataTransfer.items){
        //Alle items langslopen
        [...event.dataTransfer.items].forEach((item, i) => {
            //Als het item een bestand is, kan deze worden opgeslagen
            if(item.kind === "file"){
                //Item omzetten naar een bestand
                const file = item.getAsFile();
                //Extensie controleren en bestandsnaam naast de "openen" knop zetten
                if(getFileInfo(file.name, type)){
                    //Bestand opslaan in juiste variabele
                    switch(type){
                        case 'excel':
                            excelFile = file;
                        break;
                        case 'eplan':
                            eplanFile = file;
                        break;
                    }
                }
            }
        });
    }else{
        //Als het bestand al een file is, kan deze direct worden verwerkt
        [...event.dataTransfer.files].forEach((file, i) => {
            if(getFileInfo(file.name, type)){
                switch(type){
                    case 'excel':
                        excelFile = file;
                    break;
                    case 'eplan':
                        eplanFile = file;
                    break;
                }
            }
        });
    }
}

//Functie voor het voorkomen van het standaard gedrag van de browser wanneer een bestand over een webpagina gesleept wordt
function dragOverHandler(event){
    event.preventDefault();
}

//Deze functie controleerd of de extensie van het bestand correct is en vult de bestandsnaam (en verkort deze als dat nodig is) in het tekstvak in
//Geeft een boolean terug die aangeeft of er een probleem is met de extensie of niet
function getFileInfo(filename, type){
    //Eventuele errors worden gereset, zodat deze niet onnodig blijven staan
    throwImportError(type, '', reset=true);
    //Bestandsnaam splitten op de extensie, zodat de extensie kan worden gecontroleerd
    let splitFileName = filename.split('.');
    let extenstion = splitFileName[splitFileName.length-1];
    
    //Extensie controleren op basis van het bestandstype dat geüpload zou moeten zijn
    let validExtension = validateFileExtension(extenstion, type);

    //Extensie klopt niet met wat er verwacht wordt, error teruggeven
    if(!validExtension){
        console.log(`Wrong extension for filetype ${type}! (${extenstion})`);
        throwImportError(type, `Verkeerd bestandstype (${extenstion})`);
        return false;
    }

    //Als de bestandsnaam langer is dan 34 tekens moet deze worden ingekort tot 34 tekens zodat de naam in het tekstvak past
    if(filename.length > 34){
        filename = compressFileName(filename, extenstion);
    }

    //Bestandsnaam invullen in het tekstvak naar de "openen" knop
    const fileNameLabel = document.getElementById(`${type}FileName`);
    fileNameLabel.innerHTML = filename;
    return true;
}

//Functie voor het tonen van error berichten aan de gebruiker
//Door de reset flag op true te zetten worden alle errors verwijdert
function throwImportError(type, message='', reset=false){
    //Benodigde elementen selecteren
    const importBox = document.getElementById(`${type}Dropzone`);
    const errorSpan = document.getElementById(`${type}ErrorSpan`);
    const errorExplainSpan = document.getElementById(`${type}ExplainErrorSpan`);

    //Sommige error berichten bestaan uit twee regels (algemeen bericht en duidelijkere uitleg), deze regels worden gescheiden met een "|" teken
    message = message.split('|')

    //Bestandsnaam verwijderen uit tekstvak
    document.getElementById(`${type}FileName`).innerHTML = "";

    //Als de reset flag op true staat, worden eventuele error berichten weggehaald
    if(reset){
        importBox.style.border = '1px solid grey';
        errorSpan.innerHTML = '';
        errorExplainSpan.innerHTML = '';
    }else{
        //Rand van uploadvak rood maken en error bericht(en) invullen
        importBox.style.border = '1px solid red';
        errorSpan.innerHTML = message[0];
        if(message[1] !== undefined){
            errorExplainSpan.innerHTML = message[1];
        }
    }
}

//Functie voor het controleren van de bestandsextensie
function validateFileExtension(extension, type){
    let allowedExtensions;
    //Juiste array met toegestane extensies selecteren op basis van het bestandstype
    switch(type){
        case 'excel':
            allowedExtensions = allowedExcelExtensions;
        break;
        case 'eplan':
            allowedExtensions = allowedEplanExtensions;
        break;
        default:
            return false;
    }

    //Controleren of de ingevulde extensie in de array staat, zo ja is het oké, anders niet
    for(let allowedExtension of allowedExtensions){
        if(extension === allowedExtension){
            return true;
        }
    }

    return false;
}

//Functie voor het verkorten van bestandsnamen tot 34 tekens
function compressFileName(filename, extension){
    //De bestandsnaam inclusief extensie mag maar 31 tekens zijn, omdat er 3 puntjes bijkomen voor een totaal van 34 tekens
    //De bestandsnaam wordt ingekort tot het aantal tekens wat nog over zijn naast het aantal tekens van de extensie
    filename = filename.slice(0, (31-extension.length));
    return filename + "..." + extension;
}

//Deze functie wordt aangeroepen op het moment dat de website geladen wordt en genereerd een nieuw sessionId die naar de server gestuurd kan worden
window.onload = function(){
    //De sessionId's worden opgeslagen in de sessionStorage, zodat deze tijdens de session gebruikt kunnen worden
    sessionStorage.setItem('sessionId', uuidv4());
}

//Deze functie wordt aangeroepen op het moment dat de site wordt afgesloten, opnieuw wordt geladen of als er een nieuwe pagina wordt geladen
//Er wordt een POST request gestuurd naar de server met het sessionId, zodat de data van de gebruiker door de server verwijdert kan worden
window.onbeforeunload = function() {
    //De sessionId moet worden meegestuurd zodat de server de data van de gebruiker kan verwijderen
    const data = JSON.stringify({sessionId: sessionStorage.getItem('sessionId')});
    //Request sturen naar het "/goodbye" endpoint
    fetch("/goodbye", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: data,
        //Requests die gestuurd worden op het moment dat een pagina wordt gesloten zijn niet gegarandeerd om afgemaakt te worden, dus bestaat de kans dat deze niet wordt verstuurd
        //Als de keepalive flag op true wordt gezet, wordt deze eerst verstuurd voordat de pagina wordt gesloten. Dit garandeert dus dat het bericht verstuurd wordt naar de server
        keepalive: true
    });
};

//Functie voor het genereren van een UUID om te kunnen gebruiken als sessionId.
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function resizeGrid(){
    let safetyFunctionGrid = document.getElementById("safetyFunctionList");
    if(window.innerWidth >= 1700){
        safetyFunctionGrid.setAttribute("style", "grid-template-columns: auto auto auto auto");
    }else if(window.innerWidth <= 1700 && window.innerWidth >= 1273){
        safetyFunctionGrid.setAttribute("style", "grid-template-columns: auto auto auto;");
    }else if(window.innerWidth <= 1272 && window.innerWidth >= 852){
        safetyFunctionGrid.setAttribute("style", "grid-template-columns: auto auto;");
    }else if(window.innerWidth <= 851){
        safetyFunctionGrid.setAttribute("style", "grid-template-columns: auto;");
    }
}

function returnToHome(){
    window.location.href='index.html';
    window.onresize = "";
}