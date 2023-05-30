import "./App.css";
import "./index.css";
import Home from "./components/Home";
import GenerateScreen from "./components/GenerateScreen";
//import CalibrateScreen from './components/CalibrateScreen';
import HomeIcon from "@mui/icons-material/Home";
import { Alert, Snackbar, Slide, createTheme, ThemeProvider } from "@mui/material";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const serverURL = "http://localhost:3001";

const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  }
});

function App() {
  const [safetyfunctions, setSafetyfunctions] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [homeHidden, hideHome] = useState(false);
  const [generateScreenHidden, hideGenerateScreen] = useState(true);
  const [calibrateScreenHidden, hideCalibrateScreen] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState(null);
  const [alertText, setAlertText] = useState(null);
  const [snackbarAutohide, setSnackbarAutohide] = useState(true);

  //De eerste keer dat de pagina geladen wordt, wordt een nieuwe sessionID aangemaakt
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  useEffect(() => {
    //Als de pagina wordt gesloten, wordt er een bericht gestuurd naar de server om de bestanden van de client te verwijderen
    window.addEventListener("beforeunload", () => {
      //POST request sturen naar "/goodbye" endpoint
      fetch(`${serverURL}/goodbye`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        //SessionID wordt meegestuurd zodat de juiste bestanden worden verwijderd
        body: JSON.stringify({ sessionId: sessionId }),
        keepalive: true,
      });
    });

    return () => {
      window.removeEventListener("beforeunload", () => { });
    };
  });

  //Deze functie wordt uitgevoerd als er een bestand is geüpload
  //Door deze functie wordt de pagina getoond met de verwerkte data uit het geüploade Excel bestand
  function fileUploaded(data) {
    //Verwerkte data opslaan
    setSafetyfunctions(data);
    //Nieuwe pagina tonen
    hideHome(true);
    hideCalibrateScreen(true);
    hideGenerateScreen(false);
  }

  //Deze functie wordt uitgevoerd als op het icoontje linksboven in de balk wordt geklikt
  //Afhankelijk van de actieve pagina wordt een nieuwe pagina getoond
  function iconClick() {
    //Eerst alle pagina's sluiten, zo kan eenvoudig de nieuwe pagina geopend worden
    hideHome(true);
    hideCalibrateScreen(true);
    hideGenerateScreen(true);

    //De waarde van de stateful variabelen wordt pas geüpdated nadat de functie is uitgevoerd
    //Hier worden dus de oude waardes van de variabelen bekeken
    if (!homeHidden) {
      hideCalibrateScreen(false);
    } else if (!calibrateScreenHidden || !generateScreenHidden) {
      hideHome(false);
    }
  }

  //Functie voor het tonen van een Snackbar met alert op de pagina
  //Het tonen van alerts wordt hier geregeld, zodat ook de alerts niet alleen op bepaalde pagina's werken
  //Zo kan er op de "generateScreen" pagina een error met de verbinding op treden, terug genavigeerd worden naar de home pagina en vervolgens de alert getoond worden
  //Als de alert op de "generateScreen" pagina getoond zou worden, zou deze verdwijnen wanneer naar de home pagina genavigeerd wordt
  function enableSnackbar(severity, text, autoHide = true) {
    setAlertSeverity(severity);
    setAlertText(text);
    setShowSnackbar(true);
    //Als autohide true is, verdwijnt de alert automatisch na 5 seconde
    setSnackbarAutohide(autoHide);
  }

  //Functie voor het sluiten van de snackbar
  //Snackbar sluit wanneer de gebruiker op het kruisje klikt, of op escape drukt
  function handleSnackbarClose(event, reason) {
    if (reason === "clickaway") {
      return;
    }

    setShowSnackbar(false);
  }

  //Functie voor het animeren van de snackbar
  function slideFromTop(props) {
    return <Slide {...props} direction="down" />;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="container">
        <Snackbar
          TransitionComponent={slideFromTop}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          open={showSnackbar}
          autoHideDuration={snackbarAutohide ? 5000 : null}
          onClose={handleSnackbarClose}
        >
          <Alert
            id="alertSnackbar"
            severity={alertSeverity}
            variant="filled"
            onClose={handleSnackbarClose}
          >
            {alertText}
          </Alert>
        </Snackbar>
        <div className="pageTitle">
          {homeHidden ? (
            <HomeIcon
              className="pageTitleIcon"
              fontSize="35px"
              id="homeBtn"
              onClick={() => iconClick()}
            />
          ) : null}
          {calibrateScreenHidden
            ? "Van den Pol - Safetytool"
            : "Nieuwe vragenlijst instellen"}
        </div>
        <Home
          returnSafetyfunctions={fileUploaded}
          sessionId={sessionId}
          hidden={homeHidden}
          showSnackbar={(severity, error, autoHide) =>
            enableSnackbar(severity, error, autoHide)
          }
          hideSnackbar={() => handleSnackbarClose("", "")}
          serverURL={serverURL}
        />
        <GenerateScreen
          safetyData={safetyfunctions}
          hidden={generateScreenHidden}
          returnHome={() => iconClick()}
          sessionId={sessionId}
          showSnackbar={(severity, error, autoHide) =>
            enableSnackbar(severity, error, autoHide)
          }
          hideSnackbar={() => handleSnackbarClose("", "")}
          serverURL={serverURL}
        />
      </div>
    </ThemeProvider>
  );
}
//<CalibrateScreen hidden={calibrateScreenHidden} sessionId={sessionId}/>

export default App;
