import React, { useState, useEffect, useRef } from "react";

const styles = {
  container: {
    position: "relative",
    width: "320px",
    margin: "50px auto"
  },
  header: {
    background: "white",
    color: "#EC6F66",
    padding: "15px",
    width: "100%",
    cursor: "pointer",
    textAlign: "center",
    borderRadius: "5px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
  },
  options: {
    position: "absolute",
    width: "100%",
    background: "white",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    borderRadius: "5px",
    marginTop: "5px",
    zIndex: 10
  },
  option: {
    padding: "10px 15px",
    cursor: "pointer",
    color: "gray",
    transition: "background 0.2s"
  },
  optionHover: {
    background: "#EC6F66",
    color: "white"
  }
};

const CustomSelect = ({ options, onSelect }) => {
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
    onSelect && onSelect(option);
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
              onMouseLeave={(e) => (e.target.style.background = "")}
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
