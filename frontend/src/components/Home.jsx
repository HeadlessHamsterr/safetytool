import ImportField from './ImportField';
import { useState } from 'react';

const Home = ({returnSafetyfunctions, sessionId, hidden}) => {
    const [excelFile, setExcelFile] = useState(null);
    const [importError, setImportError] = useState(null);

    function uploadFile(){
        setImportError(null);
        //Object voor het opslaan van de data die naar de server gestuurd gaat worden
        const formData = new FormData();

        //Excel bestand en sessionId van de client toevoegen aan het object
        formData.append('excelFile', excelFile);
        formData.append('sessionId', sessionId);

        //HTTP POST request aanmaken voor het /upload endpoint, met als response data "text"
        const xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/upload');
        xhr.responseType = 'text';
        xhr.setRequestHeader('uploadType', 'normal')

        xhr.onload = () => {
            //Data wordt teruggestuurd als JSON string, omzetten naar een object om uit te kunnen lezen
            const safetyData = JSON.parse(xhr.responseText);

            //Controleren of er errors gevonden zijn
            if(safetyData.result === "success"){
                returnSafetyfunctions(safetyData.data);
            }else{
                setImportError(safetyData.data.errorMsg);
            }
        }

        //HTTP request versturen, met in de body de data
        xhr.send(formData);
    }

    return (
        <div className="buttonWrapper" style={hidden ? {display: 'none'}: null}>
            <ImportField filetype={"excel"} setFile={(file) => setExcelFile(file)} hidden={hidden} error={importError}/>
            <button className="importBtn" onClick={() => uploadFile()}>Importeren</button>
        </div>
    )
}

export default Home;