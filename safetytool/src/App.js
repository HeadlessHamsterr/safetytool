import './App.css';
import './index.css';
import Home from './components/Home'
import { GrHomeRounded } from "react-icons/gr";

function App() {
  return (
    <div className="App">
      <div class="pageTitle">
            <GrHomeRounded className='pageTitleIcon'/>Van den Pol - Safetytool
      </div>
        <Home/>
    </div>
  );
}

export default App;
