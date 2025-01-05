import React from 'react';
import RealTimeChart from './Plots/LivePlot';
import { Container, List, ListItem, ListSubheader} from '@mui/material';
import { ListItemButton, ListItemText, ListItemIcon } from '@mui/material';
import InboxIcon from '@mui/icons-material/MoveToInbox';

const Test = () => {
  return (
    <div>
        <Container maxWidth='sm'>
            <RealTimeChart></RealTimeChart>
        </Container>
        <List
            sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
            component="nav"
            aria-labelledby="nested-list-subheader"
            subheader={
            <ListSubheader component="div" id="nested-list-subheader">
                Nested List Items
            </ListSubheader>
            }
        >
            <ListItemButton>
                <ListItemIcon>
                    <InboxIcon />
                </ListItemIcon>
                <ListItemText primary="Inbox" />
            </ListItemButton>
        </List>
    </div>
  );
}

export default Test;