import React from "react";
import {
  Box,
  Button,
  Typography,
  Container,
  Grid,
  Paper,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import WifiIcon from "@mui/icons-material/Wifi";
import PowerIcon from "@mui/icons-material/Power";
import InsightsIcon from "@mui/icons-material/Insights";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import GitHubIcon from "@mui/icons-material/GitHub";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme.palette.mode === "dark";

  const handleFileUpload = (event) => {
    navigate("/analyse", { state: { file: event.target.files[0] } });
  };

  const handleConnectServer = () => {
    navigate("/live-home");
  };

  const features = [
    {
      icon: <PowerIcon color="primary" sx={{ fontSize: 50 }} />,
      title: "Real-time Event Detection",
      text: "Instantly detect power system faults, oscillations, and anomalies using AI.",
    },
    {
      icon: <InsightsIcon color="secondary" sx={{ fontSize: 50 }} />,
      title: "Frequency Analysis",
      text: "Monitor and analyze frequency deviations and oscillations over time.",
    },
    {
      icon: <DataUsageIcon color="success" sx={{ fontSize: 50 }} />,
      title: "Data-driven Insights",
      text: "Gain valuable insights from historical data and long-term trends.",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          backgroundImage: `url(${isDarkMode ? "/electrical_back.png" : "/electrical_back.png"})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          // backgroundRepeat: "no-repeat",
          width: "100%", height: "100%",
          textAlign: "center",
          py: 12,
          position: "relative",
        }}
      >

        {/* Overlay for better text visibility */}
        <Box sx={{ 
          position: "absolute", 
          top: 0, left: 0, 
          width: "100%", height: "100%", 
          backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)", 
        }} />
        <Container sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
            Power System Event Detection & Analysis
          </Typography>
          <Typography
            variant="h6"
            sx={{ maxWidth: "700px", mx: "auto", mb: 4 }}
          >
            Advanced AI-powered analytics for detecting faults, oscillations, and real-time monitoring.
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<WifiIcon />}
                onClick={handleConnectServer}
                sx={{
                  fontSize: "1.2rem",
                  py: 1.5,
                  transition: "all 0.3s",
                  "&:hover": { transform: "scale(1.08)" },
                }}
              >
                Connect to Server
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                component="label"
                variant="contained"
                color="secondary"
                fullWidth
                startIcon={<CloudUploadIcon />}
                sx={{
                  fontSize: "1.2rem",
                  py: 1.5,
                  transition: "all 0.3s",
                  "&:hover": { transform: "scale(1.08)" },
                }}
              >
                Upload File
                <input type="file" hidden onChange={handleFileUpload} />
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
          Key Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 3 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: "center",
                  backgroundColor: theme.palette.background.paper,
                  transition: "all 0.3s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
                elevation={3}
              >
                {feature.icon}
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {feature.text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ backgroundColor: theme.palette.background.paper, py: 4, mt: 6 }}>
        <Container>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" fontWeight="bold">
                BigSync Power Analytics
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Your trusted partner for power system monitoring and analysis.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ textAlign: "center" }}>
              <Typography variant="h6" fontWeight="bold">
                Follow Us
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                {[
                  { icon: <LinkedInIcon />, link: "https://github.com/Nilesh-11/OnlineBigsync" },
                  { icon: <TwitterIcon />, link: "https://github.com/Nilesh-11/OnlineBigsync" },
                  { icon: <GitHubIcon />, link: "https://github.com/Nilesh-11/OnlineBigsync" },
                ].map((social, index) => (
                  <IconButton key={index} sx={{ mx: 1, color: theme.palette.text.primary }} href={social.link}>
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
