//Naam van het de key in het JSON-object omzetten naar een normale naam
const jsonToReadableCellName = {
    tPL: "Performance Level",
    category: "Categorie",
    DC: "Diagnostic Coverage",
    oppPerHour: "Aantal activaties per dag",
    oppHoursPerDay: "Actieve uren per dag",
    oppDaysPerYear: "Actieve dagen per jaar",
    faultDetection: "Fault detection",
    logicType: "Logic Type",
    safetyFunctionTitle: "Naam veiligheidsfunctie",
    safetyFunctionEffect: "Gevolg van activatie"
}

const SafetyfunctionRow = ({ rowData }) => {
    return (
        <tr>
            <td style={{verticalAlign: rowData[0] === "safetyFunctionEffect" ? "top" : "center"}} >{jsonToReadableCellName[rowData[0]] ? jsonToReadableCellName[rowData[0]] : rowData[0]}:</td>
            <td>{rowData[1]}</td>
        </tr>
    )
}

export default SafetyfunctionRow;