import React from "react";
import { Box, Typography, IconButton, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DynamicForm from "./DynamicForm";
import { useTheme } from "@mui/material/styles";

const SettingsPanel = ({
    thresholdValues,
    eventWindowLens,
    windowLens,
    setThresholdValues,
    setEventWindowLens,
    setWindowLens,
    onClose
}) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    return (
        <Box
            sx={{
                width: 350,
                p: 3,
                height: "100vh",
                backgroundColor: isDarkMode ? "#1E1E1E" : "#fff",
                color: isDarkMode ? "#E0E0E0" : "#333",
                transition: "all 0.3s ease-in-out",
                borderLeft: isDarkMode ? "1px solid #333" : "1px solid #ddd",
                boxShadow: isDarkMode ? "0 0 15px rgba(255,255,255,0.1)" : "0 0 15px rgba(0,0,0,0.1)"
            }}
        >
            {/* Header Section */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2
                }}
            >
                <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: isDarkMode ? "#FFF" : "#000" }}
                >
                    Settings
                </Typography>
                <IconButton onClick={onClose} sx={{ color: isDarkMode ? "#FFF" : "#000" }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <Divider sx={{ mb: 2, borderColor: isDarkMode ? "#444" : "#ddd" }} />

            {/* Data Window Lengths */}
            <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ mb: 1, color: isDarkMode ? "#B0BEC5" : "#333" }}
            >
                Data Window Lengths
            </Typography>
            <DynamicForm
                data={windowLens}
                setdata={setWindowLens}
                apiEnd={"set-parameters-windowLens"}
            />

            <Divider sx={{ my: 2, borderColor: isDarkMode ? "#444" : "#ddd" }} />

            {/* Threshold Values */}
            <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ mb: 1, color: isDarkMode ? "#B0BEC5" : "#333" }}
            >
                Threshold Values
            </Typography>
            <DynamicForm
                data={thresholdValues}
                setdata={setThresholdValues}
                apiEnd={"set-parameters-threshold"}
            />

            <Divider sx={{ my: 2, borderColor: isDarkMode ? "#444" : "#ddd" }} />

            {/* Event Window Lengths */}
            <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ mb: 1, color: isDarkMode ? "#B0BEC5" : "#333" }}
            >
                Event Window Lengths
            </Typography>
            <DynamicForm
                data={eventWindowLens}
                setdata={setEventWindowLens}
                apiEnd={"set-parameters-eventLens"}
            />
        </Box>
    );
};

export default SettingsPanel;
