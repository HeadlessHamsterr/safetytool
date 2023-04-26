import './App.css';
import './index.css';
import Home from './components/Home'
import { GrHomeRounded } from "react-icons/gr";
import {useState, useEffect} from 'react';
import {v4 as uuidv4} from 'uuid';

function App() {
  const [safetyfunctions, setSafetyfunctions] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  function fileUploaded(data){
    setSafetyfunctions(data);
    console.log(safetyfunctions);
  }

  return (
    <div className="App">
      <div className="pageTitle">
            <GrHomeRounded className='pageTitleIcon'/>Van den Pol - Safetytool
      </div>
        <Home returnSafetyfunctions={fileUploaded} sessionId={sessionId}/>
    </div>
  );
}

export default App;
