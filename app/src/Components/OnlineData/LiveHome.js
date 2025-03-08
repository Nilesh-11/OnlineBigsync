import React, { useState } from "react";
import { TextField, Button, Grid, Typography, Container, Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import GLOBAL from "../../GLOBAL";
import connectToServer from "../../utils/liveServerConnect";
import { useTheme } from "@mui/material/styles";
import CloudSyncIcon from "@mui/icons-material/CloudSync";

const serverAddress = GLOBAL.serverAddress;

const LandingPage = () => {
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async () => {
    if (!ip || !port) {
      alert("IP and Port are required.");
      return;
    }

    setIsSubmitting(true);
    const responseData = await connectToServer([ip, port], serverAddress + "connect-server", navigate);
    setIsSubmitting(false);

    if (responseData.status === "success") {
      navigate("/live-dashboard", { state: { threshold_values: responseData.data.threshold_values, event_WindowLens: responseData.data.event_WindowLens, window_lens: responseData.data.window_lens} });
    } else {
      navigate("/error-page");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: "12px",
            boxShadow: 3,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {/* Logo */}
          <Box mb={3}>
            <img src="/logo.png" alt="BigSync Logo" style={{ width: "150px", height: "auto" }} />
          </Box>

          {/* Title */}
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Online Big Sync
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Connect to the live server for real-time event detection and analysis.
          </Typography>

          {/* Form Fields */}
          <Grid container spacing={2} mt={3}>
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

          {/* Submit Button */}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            sx={{ mt: 3, py: 1.5, fontSize: "1rem" }}
            disabled={isSubmitting}
            startIcon={<CloudSyncIcon />}
          >
            {isSubmitting ? "Connecting..." : "Connect to Server"}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default LandingPage;
