import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useLocation } from 'react-router-dom';

const ErrorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract `message` and `status_code` from `location.state` or provide default values
  const { message = "Oops! Something went wrong.", status_code = 404 } = location.state || {};

  const goBack = () => {
    navigate(-1); // Navigate to the previous page
  };

  const goHome = () => {
    navigate('/'); // Navigate to the home page
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="#f8f9fa"
      textAlign="center"
    >
      <Typography variant="h2" color="error" gutterBottom>
        {status_code}
      </Typography>
      <Typography variant="h5" color="textPrimary" gutterBottom>
        {message}
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </Typography>
      <Box mt={4}>
        <Button
          variant="contained"
          color="primary"
          onClick={goBack}
          style={{ marginRight: "10px" }}
        >
          Go Back
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={goHome}
        >
          Go to Home
        </Button>
      </Box>
    </Box>
  );
};

export default ErrorPage;
