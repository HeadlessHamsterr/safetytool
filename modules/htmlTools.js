module.exports = function generateSafetyFunctionElements(safetyData, htmlTemplate, htmlFile){
    htmlFile.getElementById('projectTitle').innerHTML = `${safetyData["klant"]} ${safetyData["projectnaam"]} (${safetyData["projectcode"]})`;
    console.log(safetyData);
    let safetyFunctions = "";
    for(let safetyFunction of safetyData["safetyFunctions"]){
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
        safetyFunctions = safetyFunctions + '\n' + htmlElement;
    }
    htmlFile.querySelector('#safetyFunctionList').innerHTML = safetyFunctions;
    return htmlFile;
}

//Functie voor het omzetten van een JSON template naar het HTML element
//Wordt gebruikt bij het maken van de elementen waar de gegevens de veiligheidsfuncties in staan, zodat de gebruiker deze nog een keer kan
//controleren op de site, voordat het PAScal project gegenereerd wordt.
//De functie is recursief en wordt uitgevoerd voor alle objecten en arrays die eventueel in het object aanwezig zijn
function convertToHTML(referencedObj){
    //Het object wordt tijdens het omzetten naar HTML een paar keer aangepast, maar het originele object moet intact blijven voor later gebruik
    //Daarom wordt het object eerst omgezet naar een string en vervolgens weer geparsed naar een object, zodat het nieuwe object kan worden aangepast zonder
    //het originele object aan te passen.
    let obj = JSON.parse(JSON.stringify(referencedObj))
    let html = '';
    //Alle onderdelen van het object langslopen
    for (let prop in obj) {
        //Br elementen moeten anders worden omgezet dan normale elementen, anders worden ze dubbel gelezen door de browser
        if(prop === "br"){
            for(let br in obj[prop]){
                html += "<br />";
            }
        }else{
            //Als de prop attributes heeft, moeten die verwerkt worden in de tag
            if(obj[prop].hasOwnProperty('ATTR')){
                //Attributen omzetten naar één string zodat deze in de tag gezet kan worden
                let attributes = assignAttributes(obj[prop])
                delete obj[prop]['ATTR']

                //Attributes in de tag plaatsen
                html += obj[prop] instanceof Array ? '' : `<${prop} ${attributes}>`
            }else{
                html += obj[prop] instanceof Array ? '' : `<${prop}>`;
            }
            if (obj[prop] instanceof Array) {
                for (let array in obj[prop]) {
                    if(obj[prop][array].hasOwnProperty('ATTR')){
                        let attributes = assignAttributes(obj[prop][array])
                        delete obj[prop][array]['ATTR']

                        html += `\n<${prop} ${attributes}>`
                    }else{
                        html += `\n<${prop}>`
                    }
                    if(obj[prop][array] instanceof Array || typeof obj[prop][array] == 'object'){
                        //Onderliggende tags met daarin meer tags worden recursief toegevoegd
                        html += convertToHTML(new Object(obj[prop][array]));
                    }else{
                        html += obj[prop][array]
                    }
                    html += `</${prop}>`
                }
            } else if (typeof obj[prop] == 'object') {
                html += convertToHTML(new Object(obj[prop]));
            } else {
                html += obj[prop]
            }
            html += obj[prop] instanceof Array ? '' : `</${prop}>\n`
        }
    }
    //Alle JSON tekens moeten worden verwijderd
    html = html.replace(/<\/?[0-9]{1,}>/g, '');
    return html;
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