import './App.css';
import './index.css';
import Home from './components/Home'
import GenerateScreen from './components/GenerateScreen';
import CalibrateScreen from './components/CalibrateScreen';
import { MdBuild, MdHome } from "react-icons/md";
import {useState, useEffect} from 'react';
import {v4 as uuidv4} from 'uuid';

function App() {
  const [safetyfunctions, setSafetyfunctions] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [homeHidden, hideHome] = useState(false);
  const [generateScreenHidden, hideGenerateScreen] = useState(true);
  const [calibrateScreenHidden, hideCalibrateScreen] = useState(true);

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', () => {
      console.log("Goodbye");
      fetch("http://localhost:3001/goodbye", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({sessionId: sessionId}),
        keepalive: true
      });
    });

    return () => {
      window.removeEventListener('beforeunload', ()=>{});
    }
  });

  function fileUploaded(data){
    setSafetyfunctions(data);
    hideHome(true);
    hideCalibrateScreen(true);
    hideGenerateScreen(false);
  }

  function iconClick(){
      hideHome(true);
      hideCalibrateScreen(true);
      hideGenerateScreen(true);
      if(!homeHidden){
        hideCalibrateScreen(false);
      }else if(!calibrateScreenHidden || !generateScreenHidden){
        hideHome(false);
      }
  }

  return (
    <div className="container">
      <div className="pageTitle">
            {homeHidden ? <MdHome className='pageTitleIcon' onClick={() => iconClick()}/> : <MdBuild className='pageTitleIcon' onClick={() => iconClick()}/>}
            {calibrateScreenHidden ? "Van den Pol - Safetytool" : "Nieuwe vragenlijst instellen"}
      </div>
        <Home returnSafetyfunctions={fileUploaded} sessionId={sessionId} hidden={homeHidden}/>
        <GenerateScreen safetyData={safetyfunctions} hidden={generateScreenHidden} sessionId={sessionId}/>
        <CalibrateScreen hidden={calibrateScreenHidden} sessionId={sessionId}/>
    </div>
  );
}

export default App;
