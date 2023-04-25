const xlsx = require('node-xlsx')
//Functie voor het maken van het Excel bestand wat geïmporteerd wordt door de checklist app
module.exports = function generateChecklistData(safetyData){
    //Headers die verreist zijn door de checklist app
    let data = [
        ['Tag nr.', 'Device', 'ODC', 'Question Type', 'Section']
    ]

    //Alle veiligheidsfuncties langs gaan en de juiste naam, id en zones invullen
    for(let i = 0; i < safetyData["safetyFunctions"].length; i++){
        const excelRow = [i, safetyData["safetyFunctions"][i]["safetyFunctionTitle"], i, "SAFETY FUNCTION", "Zone 1"];
        data.push(excelRow);
    }

    //Array omzetten naar Excel bestand en opslaan
    let buffer = xlsx.build([{name: "Checklist", data: data}]);
    return buffer;
}