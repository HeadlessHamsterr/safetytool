import { useEffect, useState } from "react";
const ErrorField = ({error}) => {
    const [errorMsg, setErrorMsg] = useState(null);
    const [explainErrorMsg, setExplainErrorMsg] = useState(null);

    useEffect(() => {
        if(error){
            const splitErrors = error.split("|");
            setErrorMsg(splitErrors[0]);
            setExplainErrorMsg(splitErrors[1]);
        }else{
            setErrorMsg(error);
            setExplainErrorMsg(error);
        }
    }, [error]);

    return(
        <div>
            <span className="errorSpan" id="excelErrorSpan">{errorMsg}</span><br/>
            <span className="errorSpan" id="excelExplainErrorSpan">{explainErrorMsg}</span><br/>
        </div>
    )

} 

export default ErrorField;