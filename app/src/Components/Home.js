import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to the Homepage</h1>
      <button onClick={() => navigate("/file-home")} style={{ margin: "10px", padding: "10px 20px" }}>
        Submit file
      </button>
      <button onClick={() => navigate("/live-home")} style={{ margin: "10px", padding: "10px 20px" }}>
        Connect to server
      </button>
      <button onClick={() => navigate("/test")} style={{ margin: "10px", padding: "10px 20px" }}>
        Test
      </button>
    </div>
  );
};

export default HomePage;