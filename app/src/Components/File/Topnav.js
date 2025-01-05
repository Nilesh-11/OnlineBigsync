import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PlaceIcon from '@mui/icons-material/Place';
import TimelineIcon from '@mui/icons-material/Timeline';

import HomeIcon from '@mui/icons-material/Home';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import formatData from './../../utils/formatData';
import parseCSV from './../../utils/parseCSV';
import LinearBuffer from './../Common/Loading';
import { styles } from './../../styles';

const Navabar = (props) => {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  // const [selectedFile, setSelectedFile] = useState();
  const [isLoading, setisLoading] = useState(false);
  const [, setSubLnData] = useState({});
  const [, setData] = useState([]);
  const [, setTime] = useState([]);
  const handleImportNewFileButton = async (selectedFile) => {
    if (selectedFile) {
      
      try {
        setisLoading(true);
        var data = await parseCSV(selectedFile);
        var time;
        [time, data] = await formatData(data);
        setData(data);
        setTime(time);
        const sub = Object.keys(data);
        const subLnData = {};
        for (const item of sub) {
          const parts = item.split(':');
          const subKey = `Sub:${parts[1]}`;
          const lnValue = parts[2] + ':' + parts[3];
          if (!subLnData[subKey]) {
            subLnData[subKey] = [];
          }
          subLnData[subKey].push(lnValue);
        }
        setSubLnData(subLnData);
        setisLoading(false);
        const newPath = currentPath || '/analyse';
        navigate(newPath, {
          state: [subLnData, data, time],
        });


      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
  const handleImportFile =  (event) => {
    const file = event.target.files[0];
    // setSelectedFile(file); // Store the selected file in the context
     handleImportNewFileButton(file);
    
  }

  // 
  props = props.props;
  const colorMode = props[0];
  const setColorMode = props[1];
  const [state, setState] = useState({
    left: false,
  });
  const icons = [<HomeIcon />, <TimelineIcon />, <QueryStatsIcon />, <AnalyticsIcon />, <PlaceIcon />, <MenuIcon />]
  // Define the toggleDrawer function
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    setState({ left: open });
  };

  const list = (
<Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {[
          { text: 'Home', href: '/' },
          { text: 'Analyse and Detect', href: '/analyse' },
          { text: 'Baseline', href: '/baseline' },
          { text: 'Oscillation Characterisation', href: '/oscillation-characterisation' },
          { text: 'Oscillation Source Location', href: '/oscillation-source-location' },
          { text: 'Connect to server', href: '/live-home' }
          
        ].map((item, index) => (
          <ListItem key={item.text} disablePadding>
            
              <ListItemButton component="a" href={item.href}>
                <ListItemIcon>{icons[index]}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }} >
      <AppBar position="static" variant="dense" >
        <Toolbar style={styles.navbar}>
          <Drawer
            anchor="left"
            open={state.left}
            onClose={toggleDrawer(false)}
          >
            {list}
          </Drawer>
          <IconButton
            onClick={toggleDrawer(true)}
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BigSync
          </Typography>
          <input type="file" style={styles.fileInputStyle} id="fileInputNav" accept=".csv" onChange={handleImportFile}/>
          {/* <label htmlFor="fileInputNav">
            <Button
              color="inherit"
              component="span"
              sx={{ margin: 2 }}
            >
              Import File
            </Button>
          </label> */}
          <Button
            sx={{ ml: 1 }}
            onClick={() =>
              setColorMode((prev) => (prev === 'light' ? 'dark' : 'light'))
            }
            color="inherit"
            endIcon={
              colorMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />
            }
          >
            {colorMode} mode
          </Button>
        </Toolbar>
      </AppBar>
      {isLoading && <LinearBuffer/>}
    </Box>
    
  )
};

export default Navabar