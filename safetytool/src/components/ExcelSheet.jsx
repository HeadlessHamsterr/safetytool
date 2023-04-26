import { useEffect, useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import ExcelCell from "./ExcelCell";
const $ = require('jquery');

const ExcelSheet = ({sheetname, idKey}) => {
    const [cells, setCells] = useState(0);
    useEffect(() => {
        $(document.getElementById(`excelCellWrapper${idKey}`)).slideUp(400);
        document.getElementById(`arrowIcon${idKey}`).style.setProperty('transform', 'rotate(0deg)');
        console.log(`Excel sheet key: ${idKey}`)
    }, [idKey])

    function expandSheet(){
        const arrow = document.getElementById(`arrowIcon${idKey}`);
        console.log(arrow.style.getPropertyValue('transform'))
        if(arrow.style.getPropertyValue('transform') === 'rotate(180deg)'){
            arrow.style.setProperty('transform', 'rotate(0deg)');
            $(document.getElementById(`excelCellWrapper${idKey}`)).slideUp(400);
        }else{
            arrow.style.setProperty('transform', 'rotate(180deg)');
            $(document.getElementById(`excelCellWrapper${idKey}`)).slideDown(400);
        }
    }

    function addCell(){
        setCells(cells+1);
    }

    function getCells(){
        let content = [];

        for(let i = 0; i < cells; i++){
            content.push(<ExcelCell key={i}/>)
        }

        return content;
    }

    return(
        <div className="excelSheet">
            <table className="excelSheetHeader" onClick={() => expandSheet()}>
                <tbody>
                    <tr>
                        <td>{sheetname}</td>
                        <td style={{textAlign: 'right'}}><MdKeyboardArrowDown id={`arrowIcon${idKey}`} className="arrowIcon"/></td>
                    </tr>
                </tbody>
            </table>
            <div className="excelCellWrapper" id={`excelCellWrapper${idKey}`}>
                <hr className="cellLine"/>
                {getCells()}
                <button className="addCell" onClick={addCell}>+ Cel toevoegen</button>
            </div>
        </div>
    )
}

export default ExcelSheet;