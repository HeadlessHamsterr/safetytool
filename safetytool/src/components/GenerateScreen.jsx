import { useEffect } from "react";
import SafetyFunction from "./Safetyfunction";
import { useState } from "react";

const GenerateScreen = ({safetyData, hidden, sessionId}) => {
    const [gridCols, setGridCols] = useState(null);

    useEffect(() => {
        function resizeGrid(){
            if(window.innerWidth >= 1700){
                setGridCols("auto auto auto auto");
            }else if(window.innerWidth <= 1700 && window.innerWidth >= 1273){
                setGridCols("auto auto auto");
            }else if(window.innerWidth <= 1272 && window.innerWidth >= 852){
                setGridCols("auto auto");
            }else if(window.innerWidth <= 851){
                setGridCols("auto");
            }
        }

        window.addEventListener('resize', resizeGrid);
        resizeGrid();

        return () => {
            window.removeEventListener('resize', resizeGrid);
        }
    });

    function downloadFile(type){
        let filename;
        let mimeType;
        switch(type){
            case 'pascal':
                filename = `${safetyData.klant}_${safetyData.projectnaam}_${safetyData.projectcode}.psc`.replace(/\s+/g, "_");
                mimeType = 'application/xml';
                break;
            case 'checklist':
                filename = 'checklist.xlsx';
                mimeType = 'application/vnd.ms-excel';
                break;
            default:
                console.log("Incorrect download type");
                return false;
        }

        //GET request sturen naar het /generate endpoint
        const author = document.getElementById('author').value;
        console.log(`Downloading ${type} file`)
        fetch(`http://localhost:3001/${type}`, {
            method: "GET",
            headers: {
                //De If-None-Match header zorgt ervoor dat de server alleen data terugstuurd wanneer er iets is verandert aan de data die wordt teruggestuurd
                //Omdat het gegenereerde project waarschijnlijk niet verandert tussen requests, maar er wel bij iedere request een project moet worden teruggestuurd
                //moet deze header leeggemaakt worden. Hierdoor stuurt de server altijd data terug naar de client ipv een 304 (https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304)
                'If-None-Match': '',
                //SessionId meesturen zodat de server de juiste bestanden terug stuurt
                sessionId: sessionId,
                projectInfo: JSON.stringify({author: author})
            }
        })
        //Wachten tot de server reageert, dan wordt deze functie uitgevoerd
        .then(response => {
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
                        const blob = new Blob([uint8Array], { type: mimeType });

                        //URL maken van de blob zodat deze gedownload kan worden
                        const url = window.URL.createObjectURL(blob);
                        //Element aanmaken om de URL van de blob aan vast te kunnen maken
                        const a = document.createElement('a');
                        a.href = url;
                        //Bestandsnaam instellen
                        a.download = filename;
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

    return(
        <div className="pageDiv" style={hidden ? {display: 'none'} : null}>
            <h className="projectTitle" id="projectTitle">{safetyData ? `${safetyData.klant} ${safetyData.projectnaam} (${safetyData.projectcode})` : null}</h><br />
            <table style={{color: 'white', textAlign: 'right'}}>
                <tbody>
                    <tr>
                        <td>Auteur:</td>
                        <td><input type="text" id="author"/></td>
                    </tr>
                </tbody>
            </table>
            <div>
            <button className="exportBtn" id="exportBtn" onClick={() => downloadFile('pascal')} style={{marginRight: '15px'}}>Genereer PAScal project</button>
            <button className="exportBtn" id="exportBtn" onClick={() => downloadFile('checklist')}>Genereer checklist</button>
            </div>
            <div className="safetyFunctionListWrapper">
            <div className="safetyFunctionList" id="safetyFunctionList" style={{gridTemplateColumns: gridCols}}>
                {safetyData ? safetyData.safetyFunctions.map((safetyFunction, i) => 
                    <SafetyFunction safetyFunction={safetyFunction} key={i}/>
                ): null}
            </div>
            </div>
        </div>
    )
}

export default GenerateScreen;