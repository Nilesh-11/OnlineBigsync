import * as React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NavBar from './Components/Topnav'
import DetectEvent from './Components/v-1/DetectEvent'
import { createTheme, useTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Home from './Components/Home';
import Live from './Components/OnlineData/Live';
import Classify from './Components/ClassifyEvent'
import Analyser from './Components/Analyser&Detecter';
import Baseliner from './Components/Baseliner';
import ModeAnalysis from './Components/Modes';
import { indigo, purple } from '@mui/material/colors';
import OSLP from './Components/OSLP'
import IpPortForm from './Components/OnlineData/LiveAnalyser'

function App() {
  
  const theme = useTheme();
  const [colorMode, setColorMode] = React.useState(theme.palette.mode);
  const newTheme = createTheme({ palette: { mode: colorMode,primary: indigo,
    secondary: purple, } });
  newTheme.typography.h2 = {
    fontSize: '5rem',
    fontFamily: 'Kohinoor W00 Bold',
    fontWeight: 'light', // Make the text bold
  };
  return (
    <ThemeProvider theme={newTheme}>
      <Paper sx={{ width: '100%', height: '100vh' }} elevation={0}>
        <div>
        
          <BrowserRouter>
          <NavBar props={[colorMode,setColorMode]}></NavBar>
            <Routes>
              <Route path="/" element={<Home ></Home>}></Route>
              <Route path="/analyse" element={<Analyser></Analyser>}></Route>
              <Route path="/detect-event" element={<DetectEvent></DetectEvent>}></Route>
              <Route path="/classify-event" element={<Classify></Classify>}></Route>
              <Route path="/baseline" element={<Baseliner></Baseliner>}></Route>
              <Route path="/oscillation-characterisation" element={<ModeAnalysis></ModeAnalysis>}></Route>
              <Route path="/oscillation-source-location" element={<OSLP></OSLP>}></Route>
              <Route path="/live-server" element={<Live></Live>}></Route>
              <Route path="/live-analysis" element={<IpPortForm></IpPortForm>}></Route>
            </Routes>
          </BrowserRouter>
        </div>
      </Paper>
    </ThemeProvider>
  );
}

export default App;

