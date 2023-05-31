import { useEffect, useRef, useState } from "react";
import getFileInfo from "./modules/fileTools";
import { colors } from '../constants';
import { Alert, Collapse, Button } from "@mui/material";

//Dit component is het veld waar het Excel bestand door de gebruiker in geüpload kan worden
const ImportField = ({ filetype, setFile, hidden, error }) => {
	const [filename, setFilename] = useState("");
	const [errorMsg, setErrorMsg] = useState(null);
	const [hideAlert, setHideAlert] = useState(true);
	const [borderColor, setBorderColor] = useState("grey");
	const [tableWidth, setTableWidth] = useState(275);
	const inputRef = useRef(null);

	//Als de home pagina opnieuw geladen wordt (de variabele "hidden" verandert), wordt alles gereset
	//Het eventueel geüploadde wordt gereset en alle errors worden gecleared
	useEffect(() => {
		setFilename(null);
		setFile(null);
		setErrorMsg(null);
		setHideAlert(true);
		setBorderColor("grey");
		inputRef.current.reset();
	}, [hidden]);

	//Als er een error optreedt, wordt deze getoond aan de gebruiker
	//Deze error kan komen van de server of van de frontend
	useEffect(() => {
		if (error) {
			setErrorMsg(error);
			setHideAlert(false);
		} else {
			setHideAlert(true);
		}
	}, [error]);

	//De breedte van het uploadvak wordt automatisch aangepast aan de lengte van de bestandsnaam
	useEffect(() => {
		let newTableWidth;
		if (filename) {
			newTableWidth = 275 + filename.length * 9;
		} else {
			newTableWidth = 275;
		}

		setTableWidth(newTableWidth);
	}, [filename]);

	function handleUploadClick() {
		document.getElementById("fileInput").click();
	}

	//Deze functie wordt aangeroepen als er een bestand wordt geselecteerd door de gebruiker, of het selecteren wordt geannuleerd
	function handleFileChange(e) {
		setHideAlert(true);
		setBorderColor("grey");

		//Geen bestand geselecteerd
		if (e.target.files.length === 0) {
			return;
		}

		//Deze functie verkort, indien nodig, de bestandsnaam en controleerd of de extensie correct is voor een Excel bestand
		//De server controleerd ook nog of het geüploadde bestand daadwerkelijk een Excel bestand is
		const fileInfo = getFileInfo(e.target.files[0].name, filetype);

		//Controleren of er problemen zijn gevonden met het bestand
		if (fileInfo.success) {
			//Bestand en bestandsnaam opslaan, dit bestand wordt naar de server geüpload
			setFile(e.target.files[0]);
			setFilename(fileInfo.filename);
		} else {
			//Er is iets mis met het bestand, error wordt getoond aan de gebruiker
			setFilename(null);
			setErrorMsg(fileInfo.error);
			setHideAlert(false);
			return;
		}
	}

	return (
		<div>
			<table
				className="buttonRow"
				id="excelDropzone"
				style={{
					borderColor: `${borderColor}`,
					width: `${tableWidth}px`,
				}}>
				<tbody>
					<tr>
						<td>
							<table className="importText">
								<tbody>
									<tr>
										<td>
											<p>Vragenlijst</p>
										</td>
									</tr>
								</tbody>
							</table>
						</td>
						<td>
							<table className="importResults">
								<tbody>
									<tr>
										<td nowrap="nowrap">
											<span
												id="excelFileName"
												className="fileName">
												{filename}
											</span>
										</td>
										<td>
											<Button
												variant="text"
												onClick={() =>
													handleUploadClick()
												}
												sx={{
													color: colors.tertiary,
													":hover": {
														color: colors.tertiary_text_btn_hover,
														backgroundColor: "transparent"
													}
												}}>
												Openen
											</Button>
										</td>
										<td>
											<form ref={inputRef}>
												<input
													id="fileInput"
													type="file"
													accept=".xls, .xlsx, .xlsm"
													onChange={(e) =>
														handleFileChange(e)
													}
													style={{ display: "none" }}
												/>
											</form>
										</td>
									</tr>
								</tbody>
							</table>
						</td>
					</tr>
				</tbody>
			</table>
			<Collapse in={!hideAlert}>
				<Alert
					variant="outlined"
					severity="error"
					sx={{
						color: colors.alert_error_text,
						width: "fit-content",
						margin: "10px auto",
					}}>
					{errorMsg}
				</Alert>
			</Collapse>
		</div>
	);
};

export default ImportField;
