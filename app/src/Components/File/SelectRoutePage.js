import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Paper,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";

const SelectRoutePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [subLnData, data, time] = location.state || [{}, {}, []];

  const routes = [
    { path: "/analyse", label: "Analyse" },
    { path: "/baseline", label: "Baseline" },
    { path: "/oscillation-characterisation", label: "Oscillation Characterisation" },
    { path: "/oscillation-source-location", label: "Oscillation Source Location" },
  ];

  const handleNavigation = (path) => {
    navigate(path, { state: [subLnData, data, time] });
  };

  return (
    <Container
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        py: 5,
      }}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Select an Analysis Option
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4, textAlign: "center" }}>
        Choose a method for analyzing your uploaded data.
      </Typography>
      <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: "800px" }}>
        {routes.map((route, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Paper
                elevation={4}
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  transition: "all 0.3s",
                }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleNavigation(route.path)}
                  sx={{
                    fontSize: "1rem",
                    fontWeight: "bold",
                    py: 1.5,
                    width: "100%",
                  }}
                >
                  {route.label}
                </Button>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SelectRoutePage;