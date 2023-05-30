import ImportField from "./ImportField";
import { useEffect, useState } from "react";
import {
	Alert,
	CircularProgress,
	Collapse,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
	DialogContentText,
} from "@mui/material";

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
	const [showDialog, setShowDialog] = useState(false);
	const [missingInfo, setMissingInfo] = useState([null]);
	const [safetyData, setSafetyData] = useState(null);
	const [reloadingPage, setReloadingPage] = useState(false);

	//Als de pagina opnieuw geladen wordt, moeten alle states gereset worden
	//Het hiervoor geüploadde bestand wordt gecleared, de alerts en errors verdwijnen en de laad-cirkels worden uitgezet
	useEffect(() => {
		setLoading(false);
		setServerError(null);
		setImportError(null);
		setHideAlert(true);
		setReloadingPage(false);
		setMissingInfo([null]);
		setSafetyData(null);
		setShowDialog(false);
	}, [hidden]);

	useEffect(() => {
		//Controleren of er errors gevonden zijn
		if (safetyData) {
			if (safetyData.result === "success") {
				returnSafetyfunctions(safetyData.data);
			} else if (safetyData.result === "failed") {
				//Error tonen aan de gebruiker
				setImportError(safetyData.data.errorMsg);
			} else if (safetyData.result === "missingCustomerInfo") {
				setMissingInfo(safetyData.missingCustomerInfo);
				setShowDialog(true);
			}
		}
	}, [safetyData]);

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
			setSafetyData(JSON.parse(xhr.responseText));
			console.log(safetyData);
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

	function handleDialogClose() {
		setShowDialog(false);
	}

	function handleDialogChoice(choice) {
		setReloadingPage(true);
		// eslint-disable-next-line default-case
		switch (choice) {
			case "disagree":
				/*
					Als de gebruiker ervoor kiest om de vragenlijst opnieuw te uploaden
					moet de pagina gereset worden. De makkelijkste manier om dat te doen
					is door de pagina te herladen. Het geüploade bestand wordt automatisch
					gereset, de bestandsnaam wordt uit het uploadvak gehaald etc.
				*/
				window.location.reload(false);
				break;
			case "agree":
				setShowDialog(false);
				returnSafetyfunctions(safetyData.data);
				break;
		}
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
						backgroundColor: "#454545",
					},
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
			<Dialog
				open={showDialog}
				onClose={handleDialogClose}
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description">
				<DialogTitle id="alert-dialog-title">
					Ontbrekende klantgegevens
				</DialogTitle>
				<DialogContent>
					<DialogContentText id="alert-dialog-description">
						De volgende gegevens ontbreken:
					</DialogContentText>
					{missingInfo.map((info, i) => (
						<DialogContentText
							key={i}
							id="alert-dialog-description">
							- {info}
						</DialogContentText>
					))}
					<DialogContentText>
						Deze gegevens zijn nodig voor de naamgeving van het PAScal-project. Het ontwerp kan alsnog gegenereerd worden. De
						ontbrekende gegevens kunnen achteraf in PAScal ingevuld worden.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button disabled={reloadingPage} onClick={() => handleDialogChoice("disagree")}>
						{reloadingPage ? (
							<CircularProgress
								size={24}
								sx={{
									position: "absolute",
									zIndex: 1,
								}}
							/>
						) : (
							"Nieuw bestand uploaden"
						)}
					</Button>
					<Button disabled={reloadingPage} onClick={() => handleDialogChoice("agree")}>
						Project toch genereren
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default Home;
