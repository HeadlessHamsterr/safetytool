const SafetyFunction = ({safetyFunction}) => {
    return (
        <div className="safetyFunction">
            <span className="safetyFunctionTitle">{safetyFunction.safetyFunctionTitle}</span><br/><br/><br/>
            <div className="safetyFunctionInfo">
                <table className="sfInfoTable">
                <tbody>
                    <tr>
                        <td>Logic type:</td>
                        <td>{safetyFunction.data.logicType}</td>
                    </tr>
                    <tr>
                        <td>Target PL:</td>
                        <td>{safetyFunction.data.tPL}</td>
                    </tr>
                    <tr>
                        <td>Categorie:</td>
                        <td>{safetyFunction.data.category}</td>
                    </tr>
                    <tr>
                        <td>Diagnostic Coverage:</td>
                        <td>{safetyFunction.data.DC}</td>
                    </tr>
                    <tr>
                        <td>Operations per day:</td>
                        <td>{safetyFunction.data.oppPerHour}</td>
                    </tr>
                    <tr>
                        <td>Operating hours per day:</td>
                        <td>{safetyFunction.data.oppHoursPerDay}</td>
                    </tr>
                    <tr>
                        <td>Operating days per year:</td>
                        <td>{safetyFunction.data.oppDaysPerYear}</td>
                    </tr>
                    <tr>
                        <td>Fault detection:</td>
                        <td>{safetyFunction.data.faultDetection}</td>
                    </tr>
                </tbody>
            </table>
            </div>
        </div>
    )
}

export default SafetyFunction;