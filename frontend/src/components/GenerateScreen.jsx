import { useEffect } from "react";
import SafetyFunction from "./Safetyfunction";
import { useState } from "react";
import {
	Alert,
	Collapse,
	TextField,
	outlinedInputClasses,
	Button,
	CircularProgress,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const inputFieldTheme = () =>
	createTheme({
		components: {
			MuiTextField: {
				styleOverrides: {
					root: {
						"--TextField-borderColor": "grey",
						"--TextField-hoverColor": "darkgrey",
						"--TextField-focusColor": "#accfaf",
						"& label.Mui-focused": {
							color: "var(--TextField-focusColor)",
						},
						"& label": {
							color: "white",
						},
						"& value": {
							color: "white",
						},
						"& label.Mui-error": {
							color: "#E9BEBF",
						},
						"& helperText.Mui-error": {
							color: "#E9BEBF",
						},
					},
				},
			},
			MuiInputBase: {
				styleOverrides: {
					root: {
						color: "white",
					},
				},
			},
			MuiOutlinedInput: {
				styleOverrides: {
					notchedOutline: {
						borderColor: "var(--TextField-borderColor)",
					},
					root: {
						[`&:hover .${outlinedInputClasses.notchedOutline}`]: {
							borderColor: "var(--TextField-hoverColor)",
						},
						[`&.Mui-focused .${outlinedInputClasses.notchedOutline}`]:
							{
								borderColor: "var(--TextField-focusColor)",
								color: "white",
							},
						[`&.Mui-error .${outlinedInputClasses.notchedOutline}`]:
							{
								borderColor: "#EF5350",
							},
					},
				},
			},
			MuiFormHelperText: {
				styleOverrides: {
					root: {
						color: "#E9BEBF",
					},
				},
			},
		},
	});

//Dit scherm wordt getoond nadat de gebruiker een Excel bestand heeft geüpload en deze is verwerkt door de server
//De server stuurt de data terug die door deze pagina wordt gebruikt om de elementen op de pagina te genereren
const GenerateScreen = ({
	safetyData,
	hidden,
	sessionId,
	returnHome,
	showSnackbar,
	hideSnackbar,
	serverURL,
}) => {
	const [gridCols, setGridCols] = useState(null);
	const [authorFieldEmpty, setAuthorFieldEmpty] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		//Deze functie zorgt ervoor dat het aantal blokken dat in een rij staat wordt aangepast op de scherm grootte
		//Op die manier is er geen X-overflow
		function resizeGrid() {
			//Aantal kolommen wordt bepaald aan de hand van de breedte van het scherm
			if (window.innerWidth >= 1700) {
				setGridCols("auto auto auto auto");
			} else if (window.innerWidth <= 1700 && window.innerWidth >= 1273) {
				setGridCols("auto auto auto");
			} else if (window.innerWidth <= 1272 && window.innerWidth >= 852) {
				setGridCols("auto auto");
			} else if (window.innerWidth <= 851) {
				setGridCols("auto");
			}
		}

		//Event listener voor het aanpassen van de scherm grootte
		window.addEventListener("resize", resizeGrid);
		//Direct de functie aanroepen, zodat het aantal kolommen goed wordt ingesteld
		resizeGrid();
		setLoading(false);

		return () => {
			window.removeEventListener("resize", resizeGrid);
		};

	});

	//Als de pagina getoond wordt (de variabele "hidden" verandert), wordt de pagina gereset
	//Alle errors worden gereset, en het invul vakje wordt leeggehaald
	useEffect(() => {
		setAuthorFieldEmpty(false);
		setLoading(false);
		document.getElementById("author").value = null;
	}, [hidden]);

	//Deze functie is verantwoordelijk voor het downloaden van het PAScal bestand dat door de server wordt teruggestuurd
	function downloadFile(type) {
		const author = document.getElementById("author").value;

		//Controleren of de auteur is ingevuld
		if (!author) {
			setAuthorFieldEmpty(true);
			return false;
		}
		setAuthorFieldEmpty(false);
		setLoading(true);

		let filename = "";
		let mimeType;

		//De server kan twee soorten bestanden genereren: één voor PAScal en één voor de testapp
		//Hier wordt gecontroleerd welke wordt gedownload, zodat de juiste MIME-type en bestandsnaam kunnen worden ingesteld
		switch (type) {
			case "pascal":
				//Als de gegevens niet ontbreken, worden de klantgegevens gebruikt als bestandsnaam
				if(safetyData.projectcode){
					filename += safetyData.projectcode;
				}

				if(safetyData.klant){
					filename += ` ${safetyData.klant}`;
				}

				if(safetyData.projectnaam){
					filename += ` ${safetyData.projectnaam}`;
				}

				//Alle klantgegevens ontbreken, daardoor is de lengte van filename 0
				//Om te voorkomen dat de naam "undefined" wordt, wordt een standaard naam ingevuld
				if(filename.length === 0){
					filename += "Veiligheidsfuncties";
				}

				filename += '.psc';
				mimeType = "application/xml";
				break;
			case "checklist":
				filename = "checklist.xlsx";
				mimeType = "application/vnd.ms-excel";
				break;
			default:
				return false;
		}

		//GET request sturen naar het /generate endpoint
		fetch(`${serverURL}/${type}`, {
			method: "GET",
			headers: {
				//De If-None-Match header zorgt ervoor dat de server alleen data terugstuurd wanneer er iets is verandert aan de data die wordt teruggestuurd
				//Omdat het gegenereerde project waarschijnlijk niet verandert tussen requests, maar er wel bij iedere request een project moet worden teruggestuurd
				//moet deze header leeggemaakt worden. Hierdoor stuurt de server altijd data terug naar de client ipv een 304 (https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304)
				"If-None-Match": "",
				//SessionId meesturen zodat de server de juiste bestanden terug stuurt
				sessionId: sessionId,
				projectInfo: JSON.stringify({ author: author }),
			},
		})
			//Wachten tot de server reageert, dan wordt deze functie uitgevoerd
			.then((response) => {
				hideSnackbar();
				setLoading(false);
				if (response.status === 404) {
					response.text().then((text) => {
						const responseObj = JSON.parse(text);

						showSnackbar("error", responseObj.data.errorMsg);
						returnHome();
					});
					return;
				}
				//Bestanden worden doorgestuurd dmv een ReadableStream. Hiervoor moet de default reader uit de body worden gehaald.
				//Deze reader kan dan worden gebruikt om de data van het gestuurde bestand uit de ReadableStream te halen. (https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
				const reader = response.body.getReader();
				//Array aanmaken om de chunks data in op te slaan
				let chunks = [];

				//Deze functie haalt de data (chunks) uit de readable stream. Als alle chunks zijn gehad (done = true) wordt de array met chunks omgezet naar een blob en vervolgens
				//door de browser gedownload als bestand.
				readStream();
				function readStream() {
					//Lees de volgende chunk
					reader.read().then(({ value, done }) => {
						//Alle chunks gehad
						if (done) {
							//Totale lengte van de chunks berekenen zodat een uint8 array met de juiste lengte kan worden gemaakt.
							const chunkLength = chunks.reduce(
								(totalLength, chunk) =>
									totalLength + chunk.length,
								0
							);
							const uint8Array = new Uint8Array(chunkLength);

							//Chunks kopieëren uit de chunks array naar de uint8 array
							let offset = 0;
							for (const chunk of chunks) {
								//De offset is de locatie in de uint8 array. Omdat de chunks direct na elkaar moeten worden geplaatst, schuift de offset iedere keer op met de
								//lengte van de vorige chunk.
								uint8Array.set(chunk, offset);
								offset += chunk.length;
							}

							//uint8 array omzetten naar blob
							const blob = new Blob([uint8Array], {
								type: mimeType,
							});

							//URL maken van de blob zodat deze gedownload kan worden
							const url = window.URL.createObjectURL(blob);
							//Element aanmaken om de URL van de blob aan vast te kunnen maken
							const a = document.createElement("a");
							a.href = url;
							//Bestandsnaam instellen
							a.download = filename;
							//De link wordt door de browser direct ingedrukt, zodat het bestand automatisch wordt gedownload
							a.click();
							showSnackbar(
								"success",
								"PAScal project gedownload!"
							);

							//Element en URL verwijderen na gebruik
							a.remove();
							window.URL.revokeObjectURL(url);
							//Alle chunks zijn gehad en het bestand is gedownload, dus de functie wordt afgesloten
							return;
						}

						//Chunk toevoegen aan array met chunks
						chunks.push(value);
						//Volgende chunk lezen
						readStream();
					});
				}
			})
			.catch((response) => {
				setLoading(false);
				console.log(response);
				showSnackbar(
					"error",
					"Kan geen verbinding maken met de server. Herlaad de pagina en probeer het opnieuw.",
					false
				);
			});
	}
	//<button className="exportBtn" id="exportBtn" onClick={() => downloadFile('checklist')}>Genereer checklist</button>

	return (
		<div className="pageDiv" style={hidden ? { display: "none" } : null}>
			<span className="projectTitle" id="projectTitle">
				{safetyData && safetyData.klant && safetyData.projectnaam
					? `${safetyData.klant} ${safetyData.projectnaam}`
					: null}
			</span>
			<br />
			<table style={{ color: "white" }}>
				<tbody>
					<tr>
						<td colSpan={2}>
							<ThemeProvider theme={inputFieldTheme()}>
								<TextField
									error={authorFieldEmpty ? true : ""}
									autoComplete="off"
									id="author"
									variant="outlined"
									label="Auteur:"
								/>
							</ThemeProvider>
						</td>
					</tr>
					<tr>
						<td colSpan={2}>
							<Collapse in={authorFieldEmpty}>
								<Alert
									variant="outlined"
									severity="error"
									sx={{
										color: "#E9BEBF",
										width: "fit-content",
										margin: "10px auto",
									}}>
									Auteur moet ingevuld worden
								</Alert>
							</Collapse>
						</td>
					</tr>
					<tr>
						<td colSpan={2}>
							<Button
								disabled={loading}
								variant="contained"
								id="exportBtn"
								onClick={() => downloadFile("pascal")}
								sx={{
									backgroundColor: "#accfaf",
									color: "#183720",
									":hover": { backgroundColor: "#8aa58c" },
									":disabled": {
										backgroundColor: "#454545"
									}
								}}>
								Genereer PAScal project
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
						</td>
					</tr>
					<tr>
						<td colSpan={2}></td>
					</tr>
				</tbody>
			</table>
			<div className="safetyFunctionListWrapper">
				<div
					className="safetyFunctionList"
					id="safetyFunctionList"
					style={{ gridTemplateColumns: gridCols }}>
					{safetyData
						? safetyData.safetyFunctions.map(
								(safetyFunction, i) => (
									<SafetyFunction
										safetyFunction={safetyFunction}
										key={i}
									/>
								)
						  )
						: null}
				</div>
			</div>
		</div>
	);
};

export default GenerateScreen;
