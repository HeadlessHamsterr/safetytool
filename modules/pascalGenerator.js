const fs = require('fs')
const path = require('path')

module.exports = function generatePAScalProject(safetyData, author){
    let projectBase = JSON.parse(fs.readFileSync(path.join(__dirname, '../PAScalFiles/emptyProject.json')));

    //Naam van het project wordt gemaakt adhv de naam van de klant, project naam en project code
    let projectName = safetyData["klant"] + "_" + safetyData["projectnaam"] + "_" + safetyData["projectcode"];
    projectBase["project:ProjectType"]["ATTR"]["name"] = projectName.replace(/\s+/g, "_");

    //Modification & creation date omzetten naar juiste format
    const date = new Date(Date.now())
    projectBase["project:ProjectType"]["ATTR"]["creationDate"] = convertToTimestamp(date)
    projectBase["project:ProjectType"]["ATTR"]["modificationDate"] = convertToTimestamp(date)

    projectBase["project:ProjectType"]["ATTR"]["author"] = author

    projectBase["project:ProjectType"]["projectStandard"][0]["ATTR"]["classificationType"] = "PL"
    projectBase["project:ProjectType"]["projectStandard"][0]["ATTR"]["standard"] = "ISO 13849-1:2015 + EN ISO 13849-2:2012"
    
    //Voor alle bladen in het excel bestand moet een srf tag worden toegevoegd.
    for(let i = 0; i < safetyData["safetyFunctions"].length; i++){
        projectBase["project:ProjectType"]["sRF"].push(generatePL_SRF(safetyData["safetyFunctions"][i], i))
    }

    let xmlFile = '<?xml version="1.0" encoding="UTF-8"?>\n' + convertToXML(projectBase)

    return xmlFile;
}

function generatePL_SRF(safetyData, safetyFunctionNum){
    //Object voor het omzetten van de PL letter naar het nummer wat PAScal nodig heeft
    const targetLevels = {
        "A": "0",
        "B": "1",
        "C": "2",
        "D": "3",
        "E": "4"
    }

    let srfBase = JSON.parse(fs.readFileSync(path.join(__dirname, '../PAScalFiles/srfPL.json')))
    srfBase["ATTR"]["name"] = safetyData["safetyFunctionTitle"]
    srfBase["ATTR"]["comments"] = safetyData["safetyFunctionEffect"]
    srfBase["ATTR"]["target"] = targetLevels[safetyData["data"]["tPL"]]

    srfBase["CCF"].push(JSON.parse(fs.readFileSync(path.join(__dirname, '../PAScalFiles/ccf.json'))))

    let itemNumber = 1;
    //Voor ieder onderdeel in de srf wordt een srp gemaakt
    if(safetyData["data"]["category"] == "B" || safetyData["data"]["category"] == 1){
        srfBase["SRP"].push(generatePL_SRP(safetyData, 1, "Input", itemNumber, safetyFunctionNum, "Sensor"));
        itemNumber++;
    }else{
        srfBase["SRP"].push(generatePL_SRP(safetyData, 2, "Input", itemNumber, safetyFunctionNum, "Sensor"));
        itemNumber++;
    }
    
    if(safetyData["data"]["logicType"] == "Veiligheidsrelais"){
        srfBase["SRP"].push(generatePL_SRP(safetyData, 1, "Logic", itemNumber, safetyFunctionNum, "CPU"));
        itemNumber++;
    }else if(safetyData["data"]["logicType"] == "PLC"){
        srfBase["SRP"].push(generatePL_SRP(safetyData, 1, "Logic", itemNumber, safetyFunctionNum, "Input"));
        itemNumber++;

        srfBase["SRP"].push(generatePL_SRP(safetyData, 1, "Logic", itemNumber, safetyFunctionNum, "CPU"));
        itemNumber++;

        srfBase["SRP"].push(generatePL_SRP(safetyData, 1, "Logic", itemNumber, safetyFunctionNum, "Output"));
        itemNumber++;
    }else{
        console.error(`Unkown logic type: ${safetyData["data"]["logicType"]}`);
    }

    if(safetyData["data"]["category"] == "B" || safetyData["data"]["category"] == 1){
        srfBase["SRP"].push(generatePL_SRP(safetyData, 1, "Output", itemNumber, safetyFunctionNum, "Actor"));
    }else{
        srfBase["SRP"].push(generatePL_SRP(safetyData, 2, "Output", itemNumber, safetyFunctionNum, "Actor"));
    }

    return srfBase
}

function generatePL_SRP(safetyData, numComponents, channelType, displayNumber, safetyFunctionNum, componentType=""){
    let srpBase = JSON.parse(fs.readFileSync(path.join(__dirname, "../PAScalFiles/srpPL.json")))
    srpBase["ATTR"]["typeName"] = channelType

    if(numComponents == 1){
        srpBase["ATTR"]["numberOfcomponents"] = "One"
    }else{
        srpBase["ATTR"]["numberOfcomponents"] = "Two"
    }

    if(safetyData["data"]["faultDetection"] == "Short detection"){
        srpBase["ATTR"]["crossShortDetection"] = "true"
        srpBase["ATTR"]["faultExclusion"] = "false"
    }else if(safetyData["data"]["faultDetection"] == "Fault exclusion"){
        srpBase["ATTR"]["faultExclusion"] = "true"
        srpBase["ATTR"]["crossShortDetection"] = "false"
    }else{
        srpBase["ATTR"]["crossShortDetection"] = "false"
        srpBase["ATTR"]["faultExclusion"] = "false"
    }
    srpBase["ATTR"]["category"] = safetyData["data"]["category"]

    for(let i = 0; i < numComponents; i++){
        srpBase["channel"].push(generatePL_Channel(safetyData, i+1, displayNumber, safetyFunctionNum, componentType))
    }

    return srpBase
}

function generatePL_Channel(safetyData, channelNo, displayNumber, safetyFunctionNum, componentType){
    let baseChannel = JSON.parse(fs.readFileSync(path.join(__dirname, "../PAScalFiles/channel.json")));
    let baseComponent = JSON.parse(fs.readFileSync(path.join(__dirname, `../PAScalFiles/old/${componentType}.json`)));

    baseChannel["ATTR"]["channelNo"] = channelNo;

    let componentId;
    switch(componentType){
        case "Sensor":
        case "Actor":
            componentId = `${safetyFunctionNum}Placeholder ${componentType} V1.1`;
            break;
        default:
            componentId = `${safetyFunctionNum}${componentType}1.1.0`;
    }

    baseComponent["projComponent"][0]["ATTR"]["selectedDeviceId"] = componentId;
    //baseComponent["projComponent"][0]["ATTR"]["selectedDevicename"] = componentName;
    baseComponent["projComponent"][0]["device"][0]["ATTR"]["identifier"] = componentId;
    baseComponent["projComponent"][0]["device"][0]["ATTR"]["partNumber"] = componentId.replace(" V1.1", "");
    baseComponent["projComponent"][0]["device"][0]["name"][0]["ATTR"]["key"] = `KeyName_${componentId}`;
    baseComponent["projComponent"][0]["language"][0]["names"][0]["names"][0]["ATTR"]["key"] = `KeyName_${componentId}`;

    baseChannel["configuredComponent"].push(baseComponent)

    switch(safetyData["data"]["DC"]){
        case "None":
            baseChannel["configuredComponent"][0]["ATTR"]["diagnosticCoverage"] = 0.5;
        break;
        case "Low":
            baseChannel["configuredComponent"][0]["ATTR"]["diagnosticCoverage"] = 0.75;
        break;
        case "Medium":
            baseChannel["configuredComponent"][0]["ATTR"]["diagnosticCoverage"] = 0.95;
        break;
        case "High":
            baseChannel["configuredComponent"][0]["ATTR"]["diagnosticCoverage"] = 0.99;
        break;
    }
    baseChannel["configuredComponent"][0]["ATTR"]["channelNo"] = channelNo
    baseChannel["configuredComponent"][0]["ATTR"]["displayNumber"] = `${safetyFunctionNum+1}.${displayNumber}.${channelNo}.1`

    if(componentType === "Sensor"){
        if(safetyData["data"]["faultDetection"] == "Fault exclusion"){
            baseChannel["configuredComponent"][0]["ATTR"]["wiringFaultExclusion"] = "true"
            baseChannel["configuredComponent"][0]["ATTR"]["crossShortDetection"] = "false"
        }else if(safetyData["data"]["faultDetection"] == "Short circuit detection"){
            baseChannel["configuredComponent"][0]["ATTR"]["crossShortDetection"] = "true"
            baseChannel["configuredComponent"][0]["ATTR"]["wiringFaultExclusion"] = "false"
        }else{
            baseChannel["configuredComponent"][0]["ATTR"]["wiringFaultExclusion"] = "false"
            baseChannel["configuredComponent"][0]["ATTR"]["crossShortDetection"] = "false"
        }
        
        //baseChannel["configuredComponent"][0]["numberOfOperations"][0]["ATTR"]["numperOfOperations"] = safetyData["data"]["oppPerHour"].toString()
        baseChannel["configuredComponent"][0]["numberOfOperations"][0]["ATTR"]["operationalHoursPerDay"] = safetyData["data"]["oppHoursPerDay"].toString()
        baseChannel["configuredComponent"][0]["numberOfOperations"][0]["ATTR"]["operationalDaysPerYear"] = safetyData["data"]["oppDaysPerYear"].toString()
        baseChannel["configuredComponent"][0]["numberOfOperations"][0]["operationsPerTime"][0]["ATTR"]["value"] = safetyData["data"]["oppPerHour"].toString()
        baseChannel["configuredComponent"][0]["numberOfOperations"][0]["operationsPerTime"][0]["ATTR"]["unit"] = "3";

        //Time between operations is de inverse van operations per time
        baseChannel["configuredComponent"][0]["numberOfOperations"][0]["timeBetweenOperations"][0]["ATTR"]["value"] = (1/safetyData["data"]["oppPerHour"]).toString()
        baseChannel["configuredComponent"][0]["numberOfOperations"][0]["timeBetweenOperations"][0]["ATTR"]["unit"] = "3";
    }
    
    return baseChannel;
}

function convertToTimestamp(date){
    let timestamp = date.toISOString()
    timestamp = timestamp.replace("Z", "+0100")
    return timestamp
}

/*
BRON: https://codingbeautydev.com/blog/node-js-convert-json-to-xml/
Eigen aanpassingen:
    - Attributes in de tags verwerken ipv als losse tag in de parent tag
    - Strings parsen zonder linebreaks
*/
function convertToXML(obj){
    let xml = '';
    for (let prop in obj) {
        //Als de prop attributes heeft, moeten die verwerkt worden in de tag
        if(obj[prop].hasOwnProperty('ATTR')){
            //Attributen omzetten naar één string zodat deze in de tag gezet kan worden
            let attributes = assignAttributes(obj[prop])
            delete obj[prop]['ATTR']

            //Attributes in de tag plaatsen
            xml += obj[prop] instanceof Array ? '' : `<${prop} ${attributes}>`
        }else{
            xml += obj[prop] instanceof Array ? '' : `<${prop}>`;
        }
        if (obj[prop] instanceof Array) {
            for (let array in obj[prop]) {
                if(obj[prop][array].hasOwnProperty('ATTR')){
                    let attributes = assignAttributes(obj[prop][array])
                    delete obj[prop][array]['ATTR']

                    xml += `\n<${prop} ${attributes}>`
                }else{
                    xml += `\n<${prop}>`
                }
                if(obj[prop][array] instanceof Array || typeof obj[prop][array] == 'object'){
                    //Onderliggende tags met daarin meer tags worden recursief toegevoegd
                    xml += convertToXML(new Object(obj[prop][array]));
                }else{
                    xml += obj[prop][array]
                }
                xml += `</${prop}>`
            }
        } else if (typeof obj[prop] == 'object') {
            xml += convertToXML(new Object(obj[prop]));
        } else {
            xml += obj[prop]
        }
        xml += obj[prop] instanceof Array ? '' : `</${prop}>\n`
    }
    //Alle JSON tekens moeten worden verwijderd
    xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
    return xml;
}

function assignAttributes(attrObj){
    let attrText = ''
    let attributes = attrObj['ATTR']
    //Loopen door alle attributes en hun waardes en in één string zetten
    for(let attr in attributes){
        //"&" tekens mogen niet in XML, moeten worden geschreven als "&amp;"
        attrText += `${attr}="${attributes[attr]}" `.replace("&", "&amp;")
    }
    return attrText
}