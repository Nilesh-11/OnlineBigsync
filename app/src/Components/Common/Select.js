import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles"; // For Theme Detection

const CustomSelect = ({ options, onSelect }) => {
  const theme = useTheme(); // Get current theme
  const isDarkMode = theme.palette.mode === "dark"; // Check if dark mode is active
  const [selected, setSelected] = useState(options[0] || "Select an option");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
    if (onSelect) onSelect(option);
  };

  // Styles for Light & Dark Mode
  const styles = {
    container: {
      position: "relative",
      width: "250px",
      margin: "10px",
    },
    header: {
      background: isDarkMode ? "#333" : "#fff",
      color: isDarkMode ? "#ddd" : "#333",
      padding: "12px",
      width: "100%",
      cursor: "pointer",
      textAlign: "center",
      borderRadius: "8px",
      border: isDarkMode ? "1px solid #555" : "1px solid #ddd",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      transition: "background 0.3s ease, color 0.3s ease",
    },
    options: {
      position: "absolute",
      width: "100%",
      background: isDarkMode ? "#444" : "#fff",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px",
      marginTop: "5px",
      zIndex: 10,
      border: isDarkMode ? "1px solid #555" : "1px solid #ddd",
    },
    option: {
      padding: "10px 15px",
      cursor: "pointer",
      color: isDarkMode ? "#ddd" : "#333",
      transition: "background 0.2s, color 0.2s",
    },
    optionHover: {
      background: isDarkMode ? "#EC6F66" : "#f0f0f0",
      color: "#fff",
    },
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <div style={styles.header} onClick={() => setIsOpen(!isOpen)}>
        {selected}
      </div>
      {isOpen && (
        <div style={styles.options}>
          {options.map((option, index) => (
            <div
              key={index}
              style={styles.option}
              onMouseEnter={(e) => (e.target.style.background = styles.optionHover.background)}
              onMouseLeave={(e) => (e.target.style.background = isDarkMode ? "#444" : "#fff")}
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
