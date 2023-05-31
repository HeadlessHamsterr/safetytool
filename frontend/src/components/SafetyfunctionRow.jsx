const jsonToReadableCellName = {
    tPL: "Performance Level",
    category: "Categorie",
    DC: "Diagnostic Coverage",
    oppPerHour: "Aantal activaties per dag",
    oppHoursPerDay: "Actieve uren per dag",
    oppDaysPerYear: "Actieve dagen per jaar",
    faultDetection: "Fault detection",
    logicType: "Logic Type",
    safetyFunctionTitle: "Naam veiligheidsfunctie"
}

const SafetyfunctionRow = ({ rowData }) => {
    return (
        <tr>
            <td>{jsonToReadableCellName[rowData[0]] ? jsonToReadableCellName[rowData[0]] : rowData[0]}:</td>
            <td>{rowData[1]}</td>
        </tr>
    )
}

export default SafetyfunctionRow;