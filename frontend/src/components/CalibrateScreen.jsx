import { useEffect, useState } from "react";
import ExcelSheet from "./ExcelSheet";

//Dit scherm is bedoelt om een nieuwe versie van de vragenlijst te kunnen uploaden, zodat de server deze kan uitlezen
//Deze functionaliteit is nog niet klaar, dus deze pagina wordt momenteel niet gebruikt
const CalibrateScreen = ({hidden, sessionId}) => {
    const [excelSheets, setExcelSheets] = useState(null);

    useEffect(() => {
        setExcelSheets(["Klant", "Veiligheidsfunctie"]);
    }, []);

    return(
        <div className="buttonWrapper" style={hidden ? {display: 'none'} : null}>
            <table className="buttonRow" id="excelDropzone">
                <tr>
                    <td><table className="importText">
                        <tr>
                            <td><p>Nieuwe vragenlijst</p></td>
                            <td><p className="importFileTypes">(Sleep het bestand, of druk op openen)</p></td>
                        </tr>
                        </table>
                    </td>
                    <td>
                        <table className="importResults">
                            <tr>
                                <td><span id="excelFileName" className="fileName"></span></td>
                                <td><button className="openBtn" onclick="openFile('excel')">Openen</button></td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            <span className="errorSpan" id="excelErrorSpan"></span><br/>
            <span className="errorSpan" id="excelExplainErrorSpan"></span><br/>
            <button className="importBtn" onclick="importExcelFile()">Importeren</button><br/>
            <p className="projectTitle">Gevonden bladen:</p><br/>
            {excelSheets ? excelSheets.map((excelSheet, i) => {
                return <div><ExcelSheet sheetname={excelSheet} key={i} idKey={i}/><br/></div>
            }): <p style={{fontSize: "20px", color: 'white'}}>Importeer eerst een nieuwe vragenlijst</p>}
        </div>
    )
}

export default CalibrateScreen;