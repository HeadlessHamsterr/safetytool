const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery');

resizeGrid();

const convertToHTML = require('./modules/htmlTools');
const generatePAScalProject = require('./modules/pascalGenerator');
const { generateChecklistData } = require('./modules/excelParser');

let globSafetyData;

ipcRenderer.on('safetyData', (event, arg) => {
    console.log(arg);
    drawScreen(arg["data"]);
});

function drawScreen(safetyData){
    $(document.getElementById('safetyFunctionList')).empty();
    console.log(path.join(__dirname, 'json/safetyFunction.json'))
    let htmlTemplate = JSON.parse(fs.readFileSync(path.join(__dirname, 'json/safetyFunction.json')));

    document.getElementById('projectTitle').innerHTML = `${safetyData["klant"]} ${safetyData["projectnaam"]} (${safetyData["projectcode"]})`;

    for(safetyFunction of safetyData["safetyFunctions"]){
        console.log(`Drawing ${safetyFunction["safetyFunctionTitle"]}`);

        htmlTemplate["div"]["h"][0] = safetyFunction["safetyFunctionTitle"];
        htmlTemplate["div"]["div"][0]["table"][0]["tr"][0]["td"][1] = safetyFunction["data"]["logicType"];
        htmlTemplate["div"]["div"][0]["table"][0]["tr"][1]["td"][1] = safetyFunction["data"]["tPL"];
        htmlTemplate["div"]["div"][0]["table"][0]["tr"][2]["td"][1] = safetyFunction["data"]["category"];
        htmlTemplate["div"]["div"][0]["table"][0]["tr"][3]["td"][1] = safetyFunction["data"]["DC"];
        htmlTemplate["div"]["div"][0]["table"][0]["tr"][4]["td"][1] = safetyFunction["data"]["oppPerHour"];
        htmlTemplate["div"]["div"][0]["table"][0]["tr"][5]["td"][1] = safetyFunction["data"]["oppHoursPerDay"];
        htmlTemplate["div"]["div"][0]["table"][0]["tr"][6]["td"][1] = safetyFunction["data"]["oppDaysPerYear"];
        htmlTemplate["div"]["div"][0]["table"][0]["tr"][7]["td"][1] = safetyFunction["data"]["faultDetection"];

        let htmlElement = convertToHTML(htmlTemplate);
        console.log(htmlElement);
        $(document.getElementById('safetyFunctionList')).append(htmlElement);
    }
    globSafetyData = safetyData;
}

function savePascalFile(){
    let projectFile = generatePAScalProject(globSafetyData);
    const projectName = `${globSafetyData["klant"]}_${globSafetyData["projectnaam"]}_${globSafetyData["projectcode"]}`;
    let filepath = ipcRenderer.sendSync("saveFile") + `/${projectName}`;

    if(!fs.existsSync(filepath)){
        fs.mkdirSync(filepath);
    }

    const savefile = filepath + `/${projectName}.psc`;
    console.log(filepath)
    fs.writeFile(savefile, projectFile, function(err){
        if(err){
            console.log(err);
        }
    });

    generateChecklistData(filepath, globSafetyData);
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
window.onresize = resizeGrid;