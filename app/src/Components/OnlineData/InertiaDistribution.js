import React, { useEffect, useState } from "react";
import { fetchStations, submitStationValues } from "./utils/API/inertiaDistribution";
import IDIPlot from "./IDIPlot";
import {
  Box,
  Typography,
  CircularProgress,
  TextField,
  Button,
  Grid,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import SensorsIcon from "@mui/icons-material/Sensors";

const StationForm = () => {
  const [stations, setStations] = useState([]);
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    const loadStations = async () => {
      try {
        const data = await fetchStations();
        if (!data || !Array.isArray(data.stations)) {
          console.error("Station names not fetched correctly");
          return;
        }

        setStations(data.stations);
        const initValues = Object.fromEntries(
          data.stations.map((name) => [name, ""])
        );
        setValues(initValues);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, []);

  const handleChange = (name, val) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async () => {
    try {
      const numericValues = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, Number(v)])
      );
      await submitStationValues({ stations: numericValues });
      setShowSnackbar(true);
      setTimeout(() => setSubmitted(true), 1000);
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  const handleReset = () => {
    const resetValues = Object.fromEntries(
      stations.map((name) => [name, ""])
    );
    setValues(resetValues);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (submitted) return <IDIPlot />;

  return (
    <Box p={4} maxWidth={600} mx="auto">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <SensorsIcon color="primary" fontSize="large" sx={{ mr: 1 }} />
          <Typography variant="h5">Configure Station Parameters</Typography>
        </Box>

        <Typography variant="body1" mb={3}>
          Please enter the inertia values for each station below.
        </Typography>

        <Grid container spacing={2}>
          {stations.map((name) => (
            <Grid item xs={12} sm={6} key={name}>
              <TextField
                label={name}
                type="number"
                value={values[name]}
                onChange={(e) => handleChange(name, e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
          ))}
        </Grid>

        <Box mt={4} display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
          >
            Submit
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleReset}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={1500}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert severity="success" variant="filled">Submitted successfully!</Alert>
      </Snackbar>
    </Box>
  );
};

export default StationForm;
