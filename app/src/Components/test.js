import React from 'react';
import { Container, Typography } from '@mui/material';
import EventsList from './OnlineData/utils/EventsList'; // Import the component
import { Bolt, Waves, Warning, CloudOff, SignalCellularNoSim } from '@mui/icons-material';

const eventsData = {
  events: {
      loadloss: {
          mintime: [
              "2025-03-07T19:22:18.459549",
              "2025-03-07T19:22:19.026369",
              "2025-03-07T19:22:19.859447"
          ],
          maxtime: [
              "2025-03-07T19:22:38.337941",
              "2025-03-07T19:22:38.937788",
              "2025-03-07T19:22:39.837941"
          ]
      },
      genloss: null,
      impulse: {
          mintime: [
              "2025-03-07T19:22:18.459549",
              "2025-03-07T19:22:19.026369",
              "2025-03-07T19:22:19.326164"
          ],
          maxtime: [
              "2025-03-07T19:22:38.337941",
              "2025-03-07T19:22:38.937788",
              "2025-03-07T19:22:39.271121"
          ]
      },
      oscillatory: {
          mintime: [
              "2025-03-07T19:22:18.459549",
              "2025-03-07T19:22:19.026369"
          ],
          maxtime: [
              "2025-03-07T19:22:38.337941",
              "2025-03-07T19:22:38.937788"
          ]
      },
      islanding: null
  }
};

const eventStyles = {
    loadloss: { color: 'red', icon: <CloudOff /> },
    genloss: { color: 'gray', icon: <SignalCellularNoSim /> },
    impulse: { color: 'blue', icon: <Bolt /> },
    oscillatory: { color: 'purple', icon: <Waves /> },
    islanding: { color: 'green', icon: <Warning /> },
};

const TestEvents = () => {
    return (
          <EventsList eventsData={eventsData.events} eventStyles={eventStyles}/>
        // <Container maxWidth="md" sx={{ padding: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
        // </Container>
    );
};

export default TestEvents;
