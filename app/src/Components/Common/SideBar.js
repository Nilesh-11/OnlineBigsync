import React from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

const Sidebar = ({ isOpen, toggleDrawer, menuItems, icons }) => {
  return (
    <Drawer anchor="left" open={isOpen} onClose={toggleDrawer(false)}>
      <List sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component="a" href={item.href}>
              <ListItemIcon>{icons[index]}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
