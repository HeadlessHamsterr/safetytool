import ImportField from './ImportField';
import { useEffect, useState } from 'react';
import { Alert, CircularProgress, Collapse } from '@mui/material';

const Home = ({returnSafetyfunctions, sessionId, hidden}) => {
    const [excelFile, setExcelFile] = useState(null);
    const [importError, setImportError] = useState(null);
    const [hideLoadingCircle, setHideLoadingCircle] = useState(true);
    const [serverError, setServerError] = useState(null);
    const [hideAlert, setHideAlert] = useState(true);

    useEffect(() =>{
        setHideLoadingCircle(true);
        setServerError(null);
        setImportError(null);
        setHideAlert(true);
    }, [hidden]);

    function uploadFile(){
        setHideLoadingCircle(false);
        setHideAlert(true);
        setImportError(null);
        setServerError(null);
        //Object voor het opslaan van de data die naar de server gestuurd gaat worden
        const formData = new FormData();

        //Excel bestand en sessionId van de client toevoegen aan het object
        formData.append('excelFile', excelFile);
        formData.append('sessionId', sessionId);

        //HTTP POST request aanmaken voor het /upload endpoint, met als response data "text"
        const xhr = new XMLHttpRequest();
        xhr.open("POST", 'http://localhost:3001/upload');
        xhr.responseType = 'text';
        xhr.setRequestHeader('uploadType', 'normal');

        xhr.onload = () => {
            setHideLoadingCircle(true);
            //Data wordt teruggestuurd als JSON string, omzetten naar een object om uit te kunnen lezen
            const safetyData = JSON.parse(xhr.responseText);

            //Controleren of er errors gevonden zijn
            if(safetyData.result === "success"){
                returnSafetyfunctions(safetyData.data);
            }else{
                setImportError(safetyData.data.errorMsg);
            }
        }

        xhr.onerror = () => {
            setServerError("Kan geen verbinding maken met de server. Herlaad de pagina en probeer het opnieuw.");
            setHideAlert(false);
            setHideLoadingCircle(true);
        }

        //HTTP request versturen, met in de body de data
        xhr.send(formData);
    }

    return (
        <div className="buttonWrapper" style={hidden ? {display: 'none'}: null}>
            <Collapse in={!hideAlert}>
                <Alert variant='outlined' severity='error' sx={{color: '#E9BEBF', width: 'fit-content', margin: '10px auto'}}>{serverError}</Alert>
            </Collapse>
            <ImportField filetype={"excel"} setFile={(file) => setExcelFile(file)} hidden={hidden} error={importError}/>
            <button className="importBtn" onClick={() => uploadFile()}>Importeren</button><br/>
            <CircularProgress style={{marginTop: '20px', display: hideLoadingCircle ? 'none' : ''}}/>
        </div>
    )
}

export default Home;