import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import React, { useState } from "react";
import HomeIcon from "@mui/icons-material/Home";
import PlaceIcon from "@mui/icons-material/Place";
import TimelineIcon from "@mui/icons-material/Timeline";
import { useNavigate } from "react-router-dom";
import LinearBuffer from "../Common/Loading";
import { styles } from "../../styles";
import Sidebar from "../Common/SideBar"; // Import Sidebar component

const Navbar = (props) => {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  const [isLoading, setisLoading] = useState(false);
  const [, setSubLnData] = useState({});
  const [, setData] = useState([]);
  const [, setTime] = useState([]);

  props = props.props;
  const colorMode = props[0];
  const setColorMode = props[1];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setSidebarOpen(open);
  };

  const menuItems = [
    { text: "Home", href: "/" },
    { text: "Analyse and Detect", href: "/analyse" },
    { text: "Baseline", href: "/baseline" },
    { text: "Oscillation Characterisation", href: "/oscillation-characterisation" },
    { text: "Oscillation Source Location", href: "/oscillation-source-location" },
    { text: "Connect to server", href: "/live-home" },
  ];

  const icons = [<HomeIcon />, <TimelineIcon />, <QueryStatsIcon />, <AnalyticsIcon />, <PlaceIcon />, <MenuIcon />];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" variant="dense">
        <Toolbar style={styles.navbar}>
          <Sidebar isOpen={sidebarOpen} toggleDrawer={toggleSidebar} menuItems={menuItems} icons={icons} />

          <IconButton onClick={toggleSidebar(true)} size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BigSync
          </Typography>

          <Button
            sx={{ ml: 1 }}
            onClick={() => setColorMode((prev) => (prev === "light" ? "dark" : "light"))}
            color="inherit"
            endIcon={colorMode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          >
            {colorMode} mode
          </Button>
        </Toolbar>
      </AppBar>

      {isLoading && <LinearBuffer />}
    </Box>
  );
};

export default Navbar;
