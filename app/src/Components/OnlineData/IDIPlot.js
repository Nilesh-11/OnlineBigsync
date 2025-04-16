import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { getIDIData } from "./utils/API/inertiaDistribution";
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Grid,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const IDIPlot = () => {
  const [windowSize, setWindowSize] = useState(10);
  const [dKData, setDKData] = useState([]);
  const [idiData, setIdiData] = useState([]);
  const [timeLabels, setTimeLabels] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const stationsLoaded = useRef(false);

  const fetchData = async () => {
    const result = await getIDIData({ window: windowSize });
    if (result?.data) {
      const { time, d_k, idi, stations: fetchedStations } = result.data;
      setTimeLabels(
        time.map((t) =>
          new Date(t).toISOString().slice(11, 23) // HH:mm:ss.SSS format
        )
      );
      setDKData(d_k);
      setIdiData(idi);

      if (!stationsLoaded.current && fetchedStations.length > 0) {
        setStations(fetchedStations[0]);
        setSelectedStationIndex(0);
        stationsLoaded.current = true;
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [windowSize]);

  const extractSeries = (dataArray) => {
    return dataArray.map((entry) => entry[selectedStationIndex]);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "bottom" },
    },
    scales: {
      x: {
        ticks: {
          callback: (val, index) => {
            const label = timeLabels[index];
            return `${label}`;  // Display in HH:mm:ss.SSS format
          },
        },
      },
    },
  };

  const chartOptionsIDI = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        min: -0.2,
        max: 1.2,
      },
    },
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const selectedStationName = stations[selectedStationIndex]?.trim() || "";

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Inertia Distribution Index (IDI)
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Window Size (sec)"
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Station</InputLabel>
              <Select
                value={selectedStationIndex}
                label="Select Station"
                onChange={(e) =>
                  setSelectedStationIndex(Number(e.target.value))
                }
              >
                {stations.map((station, idx) => (
                  <MenuItem key={idx} value={idx}>
                    {station.trim()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              d_k Values - {selectedStationName}
            </Typography>
            <Line
              height={200}
              options={chartOptions}
              data={{
                labels: timeLabels,
                datasets: [
                  {
                    label: `d_k`,
                    data: extractSeries(dKData),
                    borderColor: "rgba(75, 192, 192, 1)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    fill: true,
                    tension: 0.2,
                    pointRadius: 1,
                  },
                ],
              }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              IDI Values - {selectedStationName}
            </Typography>
            <Line
              height={200}
              options={chartOptionsIDI}
              data={{
                labels: timeLabels,
                datasets: [
                  {
                    label: `IDI`,
                    data: extractSeries(idiData),
                    borderColor: "rgba(255, 99, 132, 1)",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    fill: true,
                    tension: 0.2,
                    pointRadius: 1,
                  },
                ],
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default IDIPlot;
