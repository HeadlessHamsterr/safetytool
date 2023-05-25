import "./App.css";
import "./index.css";
import Home from "./components/Home";
import GenerateScreen from "./components/GenerateScreen";
//import CalibrateScreen from './components/CalibrateScreen';
import HomeIcon from "@mui/icons-material/Home";
import { Alert, Snackbar, Slide } from "@mui/material";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const serverURL = "http://localhost:3001";

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

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  useEffect(() => {
    window.addEventListener("beforeunload", () => {
      fetch(`${serverURL}/goodbye`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: sessionId }),
        keepalive: true,
      });
    });

    return () => {
      window.removeEventListener("beforeunload", () => {});
    };
  });

  function fileUploaded(data) {
    setSafetyfunctions(data);
    hideHome(true);
    hideCalibrateScreen(true);
    hideGenerateScreen(false);
  }

  function iconClick() {
    hideHome(true);
    hideCalibrateScreen(true);
    hideGenerateScreen(true);
    if (!homeHidden) {
      hideCalibrateScreen(false);
    } else if (!calibrateScreenHidden || !generateScreenHidden) {
      hideHome(false);
    }
  }

  function enableSnackbar(severity, text, autoHide = true) {
    setAlertSeverity(severity);
    setAlertText(text);
    setShowSnackbar(true);
    setSnackbarAutohide(autoHide);
  }

  function handleSnackbarClose(event, reason) {
    if (reason === "clickaway") {
      return;
    }

    setShowSnackbar(false);
  }

  function slideFromTop(props) {
    return <Slide {...props} direction="down" />;
  }

  return (
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
  );
}
//<CalibrateScreen hidden={calibrateScreenHidden} sessionId={sessionId}/>

export default App;
