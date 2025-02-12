import React, { useState } from "react";
import { Card, CardContent, TextField, Button } from "@mui/material";

const DynamicForm = ({ data }) => {
  const [formData, setFormData] = useState(data);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
  };

  return (
    <Card sx={{ maxWidth: 400, margin: "auto", padding: 4, boxShadow: 3, borderRadius: 2 }}>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.keys(data).map((key) => (
            <div key={key} className="flex flex-col">
              <TextField
                label={key}
                type="text"
                name={key}
                value={formData[key]}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                margin="normal"
              />
            </div>
          ))}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ padding: "12px" }}
          >
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DynamicForm;
