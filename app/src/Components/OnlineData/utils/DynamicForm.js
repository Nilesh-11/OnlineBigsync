import React, { useState } from "react";
import { Card, CardContent, TextField, Button, Snackbar, Alert, CircularProgress } from "@mui/material";
import sendData from "./API/Data";
import { serverAddress } from "../../../GLOBAL";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const DynamicForm = ({ data, setdata, apiEnd }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [formData, setFormData] = useState(data);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const responseData = await sendData([formData], serverAddress + apiEnd);

    if (responseData && responseData.status === "success") {
      setdata(responseData.data);
      setSnackbarOpen(true);  // Show success message
    } else {
      navigate('/error-page', {
        state: {
          message: responseData ? responseData.message : "Something went wrong",
          status_code: responseData ? responseData.status_code : 500
        }
      });
    }

    setLoading(false);
  };

  return (
    <Card
      sx={{
        maxWidth: 450,
        margin: "auto",
        padding: 4,
        boxShadow: theme.palette.mode === 'dark' ? "0 0 15px rgba(255,255,255,0.1)" : "0 0 15px rgba(0,0,0,0.1)",
        borderRadius: 3,
        backgroundColor: theme.palette.mode === 'dark' ? "#1E1E1E" : "#fff",
      }}
    >
      <CardContent>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {Object.keys(data).map((key) => (
            <div key={key} style={{ display: "flex", flexDirection: "column" }}>
              <TextField
                label={key.replace(/_/g, ' ').toUpperCase()}
                type="text"
                name={key}
                value={formData[key]}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                margin="normal"
                InputLabelProps={{
                  style: { color: theme.palette.mode === 'dark' ? "#B0BEC5" : "#000" }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? "#444" : "#ccc",
                    },
                    '&:hover fieldset': {
                      borderColor: "#1976D2",
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: "#1976D2",
                    },
                  },
                }}
              />
            </div>
          ))}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{
              padding: "12px",
              fontWeight: "bold",
              textTransform: "none",
              backgroundColor: "#1976D2",
              '&:hover': {
                backgroundColor: "#1565C0"
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Submit"}
          </Button>
        </form>
      </CardContent>

      {/* Snackbar for Success Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Data submitted successfully!
        </Alert>
      </Snackbar>

      {/* Snackbar for Error Notification */}
      {errorMessage && (
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={3000}
          onClose={() => setErrorMessage("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={() => setErrorMessage("")} severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      )}
    </Card>
  );
};

export default DynamicForm;
