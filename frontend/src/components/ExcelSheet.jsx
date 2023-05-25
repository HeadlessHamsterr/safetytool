import { useEffect, useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import ExcelCell from "./ExcelCell";
const $ = require('jquery');

let cellRowId = 0;

//Dit component hoort bij het "calibrateScreen" component
//Wordt op het moment dus ook nog niet gebruikt
const ExcelSheet = ({sheetname, idKey}) => {
    const [cells, setCells] = useState([]);
    useEffect(() => {
        $(document.getElementById(`excelCellWrapper${idKey}`)).slideUp(400);
        document.getElementById(`arrowIcon${idKey}`).style.setProperty('transform', 'rotate(0deg)');
    }, [idKey]);

    function expandSheet(){
        const arrow = document.getElementById(`arrowIcon${idKey}`);
        if(arrow.style.getPropertyValue('transform') === 'rotate(180deg)'){
            arrow.style.setProperty('transform', 'rotate(0deg)');
            $(document.getElementById(`excelCellWrapper${idKey}`)).slideUp(400);
        }else{
            arrow.style.setProperty('transform', 'rotate(180deg)');
            $(document.getElementById(`excelCellWrapper${idKey}`)).slideDown(400);
        }
    }

    function addCell(){
        cellRowId++;
        setCells(cells => [...cells, cellRowId]);
    }

    function removeCell(index){
        let clone = [...cells];
        clone.splice(index, 1);
        setCells(clone);
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
                {cells.map((id, i) =>
                    <ExcelCell key={id} cellId={i} removeCell={removeCell}/>
                )}
                <hr className="cellLine"/>
                <button className="addCell" onClick={addCell}>+ Cel toevoegen</button>
            </div>
        </div>
    )
}

export default ExcelSheet;