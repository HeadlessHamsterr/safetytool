import {BsTrashFill} from 'react-icons/bs'

//Dit component hoort bij het "calibrateScreen" component
//Wordt op het moment dus ook nog niet gebruikt
const ExcelCell = ({removeCell, cellId}) => {
    return (
        <div>
            <table style={{margin: '0 auto'}}>
                <tbody>
                    <td>
                        <input placeholder="Cel naam" className='inputField'/>
                    </td>
                    <td>
                        <BsTrashFill className='trashIcon' onClick={() => removeCell(cellId)}/>
                    </td>
                </tbody>
            </table>
        </div>
    )
}

export default ExcelCell;