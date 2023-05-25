import { useEffect, useRef, useState } from "react";
import getFileInfo from "./modules/fileTools";
import { Alert, Collapse, Button } from "@mui/material";

const ImportField = ({ filetype, setFile, hidden, error }) => {
	const [filename, setFilename] = useState("");
	const [errorMsg, setErrorMsg] = useState(null);
	const [hideAlert, setHideAlert] = useState(true);
	const [borderColor, setBorderColor] = useState("grey");
	const [tableWidth, setTableWidth] = useState(275);
	const inputRef = useRef(null);

	useEffect(() => {
		setFilename(null);
		setFile(null);
		setErrorMsg(null);
		setHideAlert(true);
		setBorderColor("grey");
		inputRef.current.reset();
	}, [hidden]);

	useEffect(() => {
		if (error) {
			setErrorMsg(error);
			setHideAlert(false);
		} else {
			setHideAlert(true);
		}
	}, [error]);

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

	function handleFileChange(e) {
		setHideAlert(true);
		setBorderColor("grey");

		if (e.target.files.length === 0) {
			return;
		}

		const fileInfo = getFileInfo(e.target.files[0].name, filetype);

		if (fileInfo.success) {
			setFile(e.target.files[0]);
			setFilename(fileInfo.filename);
		} else {
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
													color: "#accfaf",
													":hover": {
														color: "#7a8c7b",
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
						color: "#E9BEBF",
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
