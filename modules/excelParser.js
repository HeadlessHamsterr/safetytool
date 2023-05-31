const xlsx = require('node-xlsx');
const fs = require('fs');
const path = require('path');

//Object voor het vertalen van de namen van keys in het JSON object naar de namen van de cellen in de vragenlijst, wordt gebruikt voor het maken van error berichten
const jsonToReadableCellName = {
    tpL: "Gewenst Performance Level",
    category: "Categorie",
    DC: "Diagnostic Coverage",
    oppPerHour: "Aantal activaties per dag",
    oppHoursPerDay: "Actieve uren per dag",
    oppDaysPerYear: "Actieve dagen per jaar",
    faultDetection: "Fault detection",
    logicType: "Logic Type",
    safetyFunctionTitle: "Naam veiligheidsfunctie"
}

//Functie om te checken of het huidige blad een blad is met veiligheidsfuncties
function shouldSkipSheet(sheetName){
    const sheetsToSkip = ["Klant informatie", "Versiebeheer", "vlookup"];

    for(skipSheet of sheetsToSkip){
        if(sheetName === skipSheet){
            return true;
        }
    }

    return false;
}

//Functie voor het ophalen van de gegevens voor de veiligheidsfuncties uit het Excel bestand
function parseExcelFile(fileName, saveExcel=false, saveParsedOutput=false){
    //Excel bestand omzetten naar JSON object
    
    var excelObj;
    
    try{
        excelObj = xlsx.parse(fileName);
    }catch(e){
        console.log(e);
        
        const returnObj = {
            result: "failed",
            data: {
                errorType: "wrongFiletype",
                errorMsg: "Kan Excel bestand niet openen. Bestand is mogelijk corrupt."
            }
        }
        return returnObj;
    }

    //Als de JSON versie excel bestand moet worden opgeslagen wordt dat gedaan
    if(saveExcel){
        fs.writeFile("excel.json", JSON.stringify(excelObj, null, 4), (err) =>{
            if(err){
                console.log(err);
            }
        });
    }
    //Object dat wordt teruggestuurd door de functie
    var returnObj = {
        result: null,
        data: null
    }

    //Object waar de klantgegevens en alle veiligheidsfuncties in worden opgeslagen
    var safetyData = {
        klant: null,
        projectnaam: null,
        projectcode: null,
        safetyFunctions: []
    };

    //Controleer of het eerste blad "Klant informatie" heet, anders is er een verkeerd Excel bestand geüpload en wordt een error teruggestuurd
    if(excelObj[0]["name"] != "Klant informatie"){
        returnObj["result"] = "failed";
        returnObj["data"] = {
            errorType: "noCustomerInfoSheet",
            errorMsg: 'Document is niet volgens het juiste format. Eerste blad moet "Klant informatie" zijn.'
        };
        return returnObj;
    }

    
    //Klant informatie ophalen
    safetyData["klant"] = excelObj[0]["data"][1][1];
    safetyData["projectnaam"] = excelObj[0]["data"][2][1];
    safetyData["projectcode"] = excelObj[0]["data"][3][1];

    var missingInfo = []

    if(safetyData["klant"] === undefined){
        missingInfo.push("Klant");
    }

    if(safetyData["projectnaam"] === undefined){
        missingInfo.push("Projectnaam");
    }

    if(safetyData["projectcode"] === undefined){
        missingInfo.push("Projectcode");
    }

    /*
    //Controleer of een van de cellen die gelezen zijn leeg is, als dat het geval is mist er informatie en wordt een error teruggestuurd
    const emptyCell = findEmptyCell(safetyData);
    if(emptyCell){
        console.log(safetyData[emptyCell])
        returnObj["result"] = "failed";
        returnObj["data"] = {
            errorType: "undefinedCells",
            emptyCell: emptyCell,
            sheet: excelObj[0]["name"],
            errorMsg: `Vragenlijst niet volledig ingevuld. Controleer de cel "${emptyCell}" op het blad "${excelObj[0]["name"]}".`
        }
        return returnObj;
    }*/

    //Lees de rest van de bladen uit
    for(let sheetNumber = 0; sheetNumber < excelObj.length; sheetNumber++){
        //Controleren of het huidige blad één van de bladen is waar geen veiligheidsfuncties op staan
        if(shouldSkipSheet(excelObj[sheetNumber]["name"])){
            continue;
        }

        //Object voor het opslaan van de informatie voor de veiligheidsfuncties
        var tempObj = {
            safetyFunctionTitle: null,
            safetyFunctionEffect: null,
            resetType: null,
            data: {
                tPL: null,
                category: null,
                DC: null,
                oppPerHour: null,
                oppHoursPerDay: null,
                oppDaysPerYear: null,
                faultDetection: null,
                logicType: null
            }
        };

        //Gegevens ophalen uit de vragenlijst
        tempObj["safetyFunctionTitle"] = excelObj[sheetNumber]["data"][10][0];
        tempObj["safetyFunctionEffect"] = excelObj[sheetNumber]["data"][12][0];
        tempObj["resetType"] = excelObj[sheetNumber]["data"][14][0]
        tempObj["data"]["logicType"] = excelObj[sheetNumber]["data"][18][0];
        tempObj["data"]["tPL"] = excelObj[sheetNumber]["data"][21][0];
        tempObj["data"]["category"] = excelObj[sheetNumber]["data"][25][0];
        tempObj["data"]["faultDetection"] = excelObj[sheetNumber]["data"][25][1];
        tempObj["data"]["DC"] = excelObj[sheetNumber]["data"][25][2];
        tempObj["data"]["oppPerHour"] = excelObj[sheetNumber]["data"][23][0];
        tempObj["data"]["oppHoursPerDay"] = excelObj[sheetNumber]["data"][23][1];
        tempObj["data"]["oppDaysPerYear"] = excelObj[sheetNumber]["data"][23][2];

        //Controleren of de titel is ingevuld, zo niet wordt er een error teruggestuurd
        if(tempObj["safetyFunctionTitle"] === undefined){
            returnObj["result"] = "failed";
            returnObj["data"] = {
                errorType: "undefinedCells",
                emptyCell: jsonToReadableCellName["safetyFunctionTitle"],
                sheet: excelObj[sheetNumber]["name"],
                errorMsg: `Vragenlijst niet volledig ingevuld. Controleer de cel "${jsonToReadableCellName["safetyFunctionTitle"]}" op het blad "${excelObj[sheetNumber]["name"]}".`
            };
            return returnObj;
        }

        //Controleren of er verder nog lege cellen in het bestand zaten, als dat zo is wordt er een error teruggestuurd
        const emptyCell = findEmptyCell(tempObj["data"]);
        if(emptyCell){
            returnObj["result"] = "failed";
            returnObj["data"] = {
                errorType: "undefinedCells",
                emptyCell: jsonToReadableCellName[emptyCell],
                sheet: excelObj[sheetNumber]["name"],
                errorMsg: `Vragenlijst niet volledig ingevuld. Controleer de cel "${jsonToReadableCellName[emptyCell]}" op het blad "${excelObj[sheetNumber]["name"]}".`
            };
            return returnObj;
        }

        //Veiligheidsfunctie toevoegen aan de lijst
        safetyData["safetyFunctions"].push(tempObj);
    }

    //Als de verwerkte informatie moet worden opgeslagen, wordt dat gedaan
    if(saveParsedOutput){
        fs.writeFile("parsedExcel.json", JSON.stringify(safetyData, null, 4), (err) =>{
            if(err){
                console.log(err);
            }
        });
    }

    //Resultaat en veiligheidsfuncties toevoegen aan het object dat wordt teruggestuurd
    if(missingInfo.length > 0){
        returnObj["result"] = "missingCustomerInfo";
        returnObj["missingCustomerInfo"] = missingInfo;
    }else{
        returnObj["result"] = "success";
    }
    returnObj["data"] = safetyData;
    return returnObj;
}

//Functie voor het controleren of een key in het object leeg is, wordt gebruikt voor het controleren of de vragenlijst volledig is ingevuld
function findEmptyCell(object){
    //Alle keys nalopen in het object
    for(const [key, value] of Object.entries(object)){
        //Als de key een array bevat wordt het niet gecontroleerd door deze functie, die moeten los gechecked worden
        if(Array.isArray(value)){
            continue;
        }else{
            //Als de waarde undefined is, was deze cell leeg
            if(value === undefined){
                return key;
            }
        }
    }

    //Geen lege cellen gevonden, dus false terugsturen
    return false;
}

function excelToJson(folder, excelFilename){
    const excelObj = xlsx.parse(path.join(folder, excelFilename));
    fs.writeFileSync(path.join(folder, 'excel.json'), JSON.stringify(excelObj, null, 4));
}

module.exports = { parseExcelFile, excelToJson }