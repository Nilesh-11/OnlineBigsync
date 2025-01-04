import * as React from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'


export default function DiscreteSlider(prop) {
    let windowSize = (prop.prop[0]).toFixed(3);
    let setwindowSize = prop.prop[1];
    let min = prop.prop[2][0]
    let max = prop.prop[2][1]
    let step = prop.prop[2][2]
    let label = prop.prop[3]
    let defaultValue = prop.prop[4]
    const valuetext = (value) => {
        return `${Number((value / 10).toFixed(3))}`;
    }
    const handleChange = (event, newValue) => { setwindowSize(Number(newValue / 10)); }
    return (
        <Stack spacing={2} direction="row" alignItems="center" justifyContent="center" mt={2}>
            <Typography variant="body1"> {label}:</Typography>
            <Box sx={{ width: 300 }}>
                <Slider
                    aria-label=""
                    defaultValue={Number(defaultValue*10)}
                    onChange={handleChange}
                    valueLabelFormat={valuetext}
                    valueLabelDisplay="auto"
                    step={step}
                    marks
                    min={min}
                    max={max}
                />
            </Box>
            <Typography variant="body1">{windowSize}</Typography>


        </Stack>
    );
}