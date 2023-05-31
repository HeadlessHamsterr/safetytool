import SafetyfunctionRow from "./SafetyfunctionRow";
import { useEffect, useState } from "react";

//Dit component is het blok dat de gegevens laat zien die de server uit het Excel bestand heeft gehaald
//Deze blokken worden voor ieder blad in het Excel bestand gegenereerd
const SafetyFunction = ({safetyFunction}) => {
    const [safetyData, setSafetyData] = useState([[null]]);

    useEffect(() => {
        let newSafetyData = [];
        for(const [key, value] of Object.entries(safetyFunction.data)){
            newSafetyData.push([key, value]);
        }

        setSafetyData(newSafetyData);
    }, [safetyFunction])

    return (
        <div className="safetyFunction">
            <span className="safetyFunctionTitle">{safetyFunction.safetyFunctionTitle}</span><br/><br/><br/>
            <div className="safetyFunctionInfo">
                <table className="sfInfoTable">
                <tbody>
                    {safetyData ? safetyData.map(
                        (safetyData, i) =>(
                            <SafetyfunctionRow rowData={safetyData} key={i}/>
                        )
                    ): null}
                </tbody>
            </table>
            </div>
        </div>
    )
}

export default SafetyFunction;