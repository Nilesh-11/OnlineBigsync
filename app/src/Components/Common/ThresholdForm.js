import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { styles } from './../../styles';

function ThresholdForm({ values, setValues, setReadyToCheckEvents }) {
  const [errors, setErrors] = useState({
    stepChange: false,
    oscillatoryEvent: false,
    impulseEvent: false,
    islandingEvent: false,
  });

  const isFloatOrInt = (value) => {
    return !isNaN(value) && (Number.isInteger(value) || !Number.isNaN(parseFloat(value)));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    const newErrors = {
      stepChange: !isFloatOrInt(values.stepChange),
      oscillatoryEvent: !isFloatOrInt(values.oscillatoryEvent),
      impulseEvent: !isFloatOrInt(values.impulseEvent),
      islandingEvent: !isFloatOrInt(values.islandingEvent),
    };
    const hasErrors = Object.values(newErrors).some((error) => error);
    if (!hasErrors) { 
        setErrors(newErrors);
        setReadyToCheckEvents(true);
    } else {

      setErrors(newErrors);
    }
  };

  return (
    <div style={styles.containerChild}>
      <Typography  style={styles.label} variant="h6">Threshold values</Typography>
      <div style={{display:'flex',flexDirection:'column', maxWidth:'60%'}}>
        <TextField style={{'marginTop':2}}
          required
          error={errors.stepChange}
          helperText={errors.stepChange ? 'Enter a threshold' : ''}
          id="stepChange"
          name="stepChange"
          size="small"
          label="Step Change Threshold"
          value={values.stepChange}
          onChange={handleChange}
        />
        <TextField style={{'marginTop':2}}
          required
          error={errors.oscillatoryEvent}
          helperText={errors.oscillatoryEvent ? 'Enter a threshold' : ''}
          id="oscillatoryEvent"
          name="oscillatoryEvent"
          size="small"
          label="Oscillatory Event Threshold"
          value={values.oscillatoryEvent}
          onChange={handleChange}
        />
        <TextField style={{'marginTop':2}}
          required
          error={errors.impulseEvent}
          helperText={errors.impulseEvent ? 'Enter a threshold' : ''}
          id="impulseEvent"
          name="impulseEvent"
          size="small"
          label="Impulse Event Threshold"
          value={values.impulseEvent}
          onChange={handleChange}
        />
        <TextField style={{'marginTop':2}}
          required
          error={errors.islandingEvent}
          helperText={errors.islandingEvent ? 'Enter a threshold' : ''}
          id="islandingEvent"
          name="islandingEvent"
          size="caption"
          label="Islanding Event Threshold"
          value={values.islandingEvent}
          onChange={handleChange}
        />
        <Button variant="contained" color="primary" size='x' onClick={handleSubmit}>
          Set threshold
        </Button>
      </div>
    </div>
  );
}

export default ThresholdForm;
