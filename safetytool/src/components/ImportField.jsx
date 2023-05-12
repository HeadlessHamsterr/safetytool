import { useEffect, useRef, useState } from "react";
import getFileInfo from "./modules/fileTools";

const ImportField = ({filetype, setFile, hidden, error}) => {
    const [filename, setFilename] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);
    const [explainErrorMsg, setExplainErrorMsg] = useState(null);
    const [borderColor, setBorderColor] = useState("grey");
    const [tableWidth, setTableWidth] = useState(275);
    const inputRef = useRef(null);

    useEffect(() => {
        setFilename(null);
        setFile(null);
        setErrorMsg(null);
        setExplainErrorMsg(null);
        setBorderColor("grey");
    }, [hidden]);

    useEffect(() => {
        if(error){
            const splitErrors = error.split("|");
            setErrorMsg(splitErrors[0]);
            setExplainErrorMsg(splitErrors[1]);
            setBorderColor("red")
        }else{
            setErrorMsg(null);
            setExplainErrorMsg(null);
        }
    }, [error]);

    useEffect(() => {
        let newTableWidth;
        if(filename){
            newTableWidth = 275 + filename.length * 9;
        }else{
            newTableWidth = 275;
        }

        //document.getElementsByClassName('buttonRow')[0].style.width = `${newTableWidth}px`;
        setTableWidth(newTableWidth);
    }, [filename]);

    function handleUploadClick(){
        inputRef.current?.click();
    }

    function handleFileChange(e){
        setErrorMsg(null);
        setExplainErrorMsg(null);
        setBorderColor("grey");
        
        if(e.target.files.length === 0){
            return;
        }
        
        const fileInfo = getFileInfo(e.target.files[0].name, filetype);

        if(fileInfo.success){
            setFile(e.target.files[0]);
            setFilename(fileInfo.filename);
        }else{
            setFilename(null);
            const splitErrors = fileInfo.error.split("|");
            setErrorMsg(splitErrors[0]);
            setExplainErrorMsg(splitErrors[1]);
            setBorderColor("red")
            return;
        }
    }

    return(
        <div>
            <table className="buttonRow" id="excelDropzone" style={{borderColor : `${borderColor}`, width: `${tableWidth}px`}}>
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