import React, { useState } from 'react';
import { TextField, Button, Grid, Typography, Container, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const imageStyles = {
    width: '200px',
    height: 'auto',
    transition: 'transform 0.5s ease', // Add a smooth transition
};

const IpPortForm = () => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!ip || !port) {
      alert("IP and Port are required.");
      return;
    }
    console.log("IP Address:", ip);
    console.log("Port:", port);
    // setTimeout(() => {
    //     navigate('/live-analysis');
    // }, 2000);
  };

  return (
    <Container maxWidth="sm">
        <Box mt={4} textAlign="center">
            {/* Your logo */}
            <img
                src="/logo.png"
                alt="Logo"
                id="image"
                style={imageStyles}
            />
            </Box>
            <Box mt={2} textAlign="center">
            <Typography variant="h3" id="logo">
                Online Big Sync
            </Typography>
            </Box>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems:'center' }}>
        <Box mt={4} align="center">
            <Typography variant="h6" gutterBottom>
                Connect to the server
            </Typography>
        </Box>
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="IP Address"
                variant="outlined"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="e.g. 192.168.1.1"
                type="text"
                required
            />
            </Grid>
            <Grid item xs={12} md={6}>
            <TextField
                fullWidth
                label="Port Number"
                variant="outlined"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="e.g. 8080"
                type="number"
                required
            />
            </Grid>
        </Grid>
        <Button 
            variant="contained" 
            color="primary"
            onClick={handleSubmit} 
            style={{ marginTop: '20px' }}
        >
            Submit
        </Button>
        </div>
    </Container>
  );
};

export default IpPortForm;
