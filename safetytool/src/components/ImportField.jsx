import { useEffect, useRef, useState } from "react";
import getFileInfo from "./modules/fileTools";

const ImportField = ({filetype, setFile, hidden}) => {
    const [filename, setFilename] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);
    const [explainErrorMsg, setExplainErrorMsg] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        setFilename(null);
    }, [hidden]);

    useEffect(() => {
        let newTableWidth;
        if(filename){
            newTableWidth = 275 + filename.length * 9;
        }else{
            newTableWidth = 275;
        }

        document.getElementById('excelDropzone').style.width = `${newTableWidth}px`;
    }, [filename]);

    function handleUploadClick(){
        inputRef.current?.click();
    }

    function handleFileChange(e){
        setErrorMsg(null);
        setExplainErrorMsg(null);
        
        if(e.target.files.length === 0){
            console.log("No files selected");
            return;
        }
        const fileInfo = getFileInfo(e.target.files[0].name, filetype);

        if(fileInfo.success){
            setFile(e.target.files[0]);
            setFilename(fileInfo.filename);
        }else{
            setFilename(null);
            const errors = fileInfo.error.split('|');
            setErrorMsg(errors[0]);
            setExplainErrorMsg(errors[1]);
            return;
        }
    }
//<td><p className="importFileTypes">(Sleep het bestand, of druk op openen)</p></td>
    return(
        <div>
            <table className="buttonRow" id="excelDropzone">
                <tbody>
                <tr>
                    <td><table className="importText">
                        <tbody>
                        <tr>
                            <td><p>Vragenlijst</p></td>
                        </tr>
                        </tbody>
                        </table>
                    </td>
                    <td>
                        <table className="importResults">
                            <tbody>
                            <tr>
                                <td nowrap='nowrap'><span id="excelFileName" className="fileName">{filename}</span></td>
                                <td><button className="openBtn" onClick={() => handleUploadClick()}>Openen</button></td>
                                <td><input type="file" accept=".xls, .xlsx, .xlsm" ref={inputRef} onChange={(e) => handleFileChange(e)} style={{ display: 'none' }}/></td>
                            </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                </tbody>
            </table>
            <span className="errorSpan" id="excelErrorSpan">{errorMsg}</span><br/>
            <span className="errorSpan" id="excelExplainErrorSpan">{explainErrorMsg}</span><br/>
        </div>
    )
}

export default ImportField;