// Module imports
import * as React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { createTheme, useTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import { indigo, purple } from '@mui/material/colors';
// Home Page imports
import ErrorPage from './Components/ErrorPage';
import Home from './Components/Home';
// Offline Data imports
// import NavBar from './Components/File/Topnav';
import NavBar from './Components/OnlineData/TopNav';
import DetectEvent from './Components/v-1/DetectEvent';
import FileHome from './Components/File/FileHome';
import Classify from './Components/File/ClassifyEvent';
import Analyser from './Components/File/Analyser&Detecter';
import Baseliner from './Components/File/Baseliner';
import ModeAnalysis from './Components/File/Modes';
import OSLP from './Components/File/OSLP'
// Online Data imports
import LiveDash from './Components/OnlineData/LiveDashboard'
import LiveHome from './Components/OnlineData/LiveHome';
import Test from './Components/test'

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
          <NavBar props={[colorMode, setColorMode]}></NavBar>
            <Routes>
              <Route path="/" element={<Home ></Home>}></Route>
              <Route path="/error-page" element={<ErrorPage></ErrorPage>}></Route>
              <Route path="/file-home" element={<FileHome ></FileHome>}></Route>
              <Route path="/analyse" element={<Analyser></Analyser>}></Route>
              <Route path="/detect-event" element={<DetectEvent></DetectEvent>}></Route>
              <Route path="/classify-event" element={<Classify></Classify>}></Route>
              <Route path="/baseline" element={<Baseliner></Baseliner>}></Route>
              <Route path="/oscillation-characterisation" element={<ModeAnalysis></ModeAnalysis>}></Route>
              <Route path="/oscillation-source-location" element={<OSLP></OSLP>}></Route>
              <Route path="/live-dashboard" element={<LiveDash></LiveDash>}></Route>
              <Route path="/live-home" element={<LiveHome></LiveHome>}></Route>
              <Route path="/test" element={<Test></Test>}></Route>
            </Routes>
          </BrowserRouter>
        </div>
      </Paper>
    </ThemeProvider>
  );
}

export default App;

