import ImportField from "./ImportField";
import { useEffect, useState } from "react";
import { Alert, CircularProgress, Collapse, Button } from "@mui/material";

const Home = ({
	returnSafetyfunctions,
	sessionId,
	hidden,
	showSnackbar,
	hideSnackbar,
	serverURL,
}) => {
	const [excelFile, setExcelFile] = useState(null);
	const [importError, setImportError] = useState(null);
	const [loading, setLoading] = useState(true);
	const [serverError, setServerError] = useState(null);
	const [hideAlert, setHideAlert] = useState(true);

	//Als de pagina opnieuw geladen wordt, moeten alle states gereset worden
	//Het hiervoor geüploadde bestand wordt gecleared, de alerts en errors verdwijnen en de laad-cirkels worden uitgezet
	useEffect(() => {
		setLoading(false);
		setServerError(null);
		setImportError(null);
		setHideAlert(true);
	}, [hidden]);

	//Deze functie wordt uitgevoerd wanneer de gebruiker op de "importeren" knop drukt
	function uploadFile() {
		setLoading(true);
		setHideAlert(true);
		setImportError(null);
		setServerError(null);
		//Object voor het opslaan van de data die naar de server gestuurd gaat worden
		const formData = new FormData();

		//Excel bestand en sessionId van de client toevoegen aan het object
		formData.append("excelFile", excelFile);
		formData.append("sessionId", sessionId);

		//HTTP POST request aanmaken voor het /upload endpoint, met als response data "text"
		const xhr = new XMLHttpRequest();
		xhr.open("POST", `${serverURL}/upload`);
		xhr.responseType = "text";
		xhr.setRequestHeader("uploadType", "normal");

		xhr.onload = () => {
			setLoading(false);
			hideSnackbar();

			//Data wordt teruggestuurd als JSON string, omzetten naar een object om uit te kunnen lezen
			const safetyData = JSON.parse(xhr.responseText);

			//Controleren of er errors gevonden zijn
			if (safetyData.result === "success") {
				returnSafetyfunctions(safetyData.data);
			} else {
				//Error tonen aan de gebruiker
				setImportError(safetyData.data.errorMsg);
			}
		};

		//Probleem met de verbinding wordt getoond aan de gebruiker
		xhr.onerror = () => {
			showSnackbar(
				"error",
				"Kan geen verbinding maken met de server. Herlaad de pagina en probeer het opnieuw.",
				false
			);
			setLoading(false);
		};

		//HTTP request versturen, met in de body de data
		xhr.send(formData);
	}

	return (
		<div
			className="buttonWrapper"
			style={hidden ? { display: "none" } : null}>
			<Collapse in={!hideAlert}>
				<Alert
					variant="outlined"
					severity="error"
					sx={{
						color: "#E9BEBF",
						width: "fit-content",
						margin: "10px auto",
					}}>
					{serverError}
				</Alert>
			</Collapse>
			<ImportField
				filetype={"excel"}
				setFile={(file) => setExcelFile(file)}
				hidden={hidden}
				error={importError}
			/>
			<Button
				variant="contained"
				disabled={loading}
				className="importBtn"
				onClick={() => uploadFile()}
				sx={{
					backgroundColor: "#accfaf",
					color: "#183720",
					":hover": { backgroundColor: "#8aa58c" },
					":disabled": {
						backgroundColor: "#454545"
					}
				}}>
				Importeren
				{loading && (
					<CircularProgress
						size={24}
						sx={{
							position: "absolute",
							zIndex: 1,
						}}
					/>
				)}
			</Button>
		</div>
	);
};

export default Home;
