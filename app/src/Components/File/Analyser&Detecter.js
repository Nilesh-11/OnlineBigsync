/* eslint-disable no-useless-concat */
import React, { useState, useEffect } from 'react';
import { Checkbox, Grid, Typography, Button, Alert } from '@mui/material';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useLocation } from 'react-router-dom';
import AnalysePlot from '../Plots/Plot_Analyse&Detect';
import PlotlyPlot from '../Plots/PlotV2';
import { useNavigate } from 'react-router-dom';
import DiscreteSlider from '../Common/Slider';
import dataToServer from '../../utils/dataToServer';
import classifyEventData from '../../utils/classifyEventV2';
import ThresholdForm from '../Common/ThresholdForm';
import AlertDialog from '../Common/ErrorAlert'
import { styles } from '../../styles';
import GLOBAL from '../../GLOBAL';

const serverAddress = GLOBAL.serverAddress;
function Analyser() {
    // ------------ Getting csv Data -----------------//
    const navigate = useNavigate();
    const location = useLocation();
    const [subLnData, data, time] = location.state || [null, null, null];
    // -------------- Making state variables ------------//
    const [selectedSub, setSelectedSub] = useState(null);
    const [selectedLine, setSelectedLine] = useState(null);
    const [property, setProperty] = React.useState('F');
    const [faultData, setfaultData] = React.useState(null);
    const [mode, setMode] = React.useState(null);
    const [sd_th, setSd_th] = useState(0.025);
    const [windowSize, setWindowSize] = useState(2);
    const [buttonText, setButtonText] = useState("Detect event")
    const [plotData, setPlotData] = useState([[], []]);
    const [islandingEventData, setislandingEventData] = React.useState(null);
    const [err_message, setErr_message] = React.useState(null);
    const [reaadyToCheckEvents, setReadyToCheckEvents] = React.useState(false);
    const [thresholdValues, setThresholdValues] = useState({
        stepChange: 0.1,
        oscillatoryEvent: 5,
        impulseEvent: 2,
        islandingEvent: 0.1,
    });

    let p1 = ['F', 'VM', 'VA', 'IM', 'IA']
    let p2 = ['Frequency', 'Voltage Magnitude', 'Voltage Angle', 'Current Magnitude', 'Current Angle']

    /* Concept of modes:
        null => default
        0 => after clicking on detect fault
        1 => after clicking on add 
        2 => after getting data from server for detect fault or getting fault data

        if mode is  0 or 1 => buttontext is detect fault
        if any of the sub, line or prop id changed mode is changed to 0


    */


    // --------------- handeling Button functions ------------------ // 

    const handleDetectFaultButton = () => {
        setButtonText('Send To Server');
        setMode(0);

    }
    const appendDataSetToPlot = () => {
        if (selectedSub && selectedLine && property) {
            let temp = [];
            plotData.forEach((d) => {
                if (d.length !== 0) {
                    temp.push([d]);
                }
            })
            temp.push([`${selectedSub}` + ':' + `${selectedLine}`]);
            setPlotData(temp);
            setfaultData(null);
            setislandingEventData(temp);
            setMode(1);
        }
        else {
            return;
        }
    }
    const resetPlotData = () => {
        setPlotData([[], []]);
        setislandingEventData([[], []]);
        setfaultData([[], []]);
        setMode(null);
    }
    const sendToServer = async (e) => {
        const serverData = await dataToServer([time, data[`${selectedSub}` + ':' + `${selectedLine}`][property]], serverAddress + 'v2/detect-event', windowSize, sd_th);
        if (serverData.error) {
            if (serverData.error.message) {
                setErr_message("Server error while detecting");
            }
            else {
                setErr_message("Server error while detecting");
            }

            return
        }
        // server return faultdata if fault is there and fault:none of fault is not there
        else if (serverData && !serverData.error) {
            setfaultData(serverData);
            setPlotData([[], []]);
            setButtonText('Classify event');
            setMode(2);
        }
        else {

            setfaultData(null);
            setErr_message("Server error while detecting");
        }
    }
    const handleClassifyEvent = async (e) => {

        const classifiedData = await classifyEventData([time, data[`${selectedSub}` + ':' + `${selectedLine}`][property], thresholdValues], serverAddress + 'v2/classify-event');
        if (classifiedData.error) {
            setErr_message(classifiedData.error.message);
        }
        else {

            if (classifiedData) {
                navigate('/classify-event', {
                    state: classifiedData,
                })
            }
            else {
                setErr_message('Internal server error!!');
            }

        }
    }
    const handleClassifyIslandingEvent = async (e) => {
        let array = []
        islandingEventData.forEach((d) => {
            array.push(data[d]['F'])
        })
        const serverData = await dataToServer([time, array, thresholdValues], serverAddress + 'v2/detect-islanding-event', windowSize, sd_th);
        if (serverData && !serverData.error) {

            navigate('/classify-event', {
                state: serverData,
            })

        }
        else {
            setErr_message('Internal server error!!');
        }
    }

    // --------------- useeffect -----------------------------------------------------//

    useEffect(()=>{
        if(mode === 0){
            setButtonText('Detect event')
        }
        if(mode === 1){
            setButtonText('Detect event')
        }

    },[mode])


    useEffect(() => {
        resetPlotData();
    }, [property])
    useEffect(() => {
        setMode(0);
        setfaultData(null);
        setButtonText('Detect Event');
    }, [property, selectedLine, selectedSub])

    if (!data) {
        return(<Alert severity="error">No Data found to analyze, Please import a file</Alert>);
    }
    // ---------------------------------------------------------//

    return (
        <div style={styles.container}>
            <div style={styles.flexContainer}>
                {!data && <Alert severity="error">No Data found to analyze !!</Alert>}
                {err_message && <AlertDialog props={[err_message, setErr_message]} />}
                <Grid style={styles.flexItem}>
                    <Grid >
                        <div style={styles.containerChild} >
                            <Typography style={styles.label} variant="h6">Substations</Typography>
                            <FormGroup>
                                {Object.keys(subLnData).map((subKey) => (
                                    <FormControlLabel
                                        key={subKey}
                                        control={
                                            <Checkbox
                                                checked={selectedSub === subKey}
                                                onChange={() => { setSelectedSub(subKey); setSelectedLine(null) }}
                                                size="caption"
                                            />
                                        }
                                        label={subKey}
                                    />
                                ))}
                            </FormGroup>
                        </div>
                        <Grid item style={styles.containerChild}>
                            {selectedSub && (
                                <div>
                                    <Typography style={styles.label} variant="h6">{selectedSub}:Lines</Typography>
                                    <FormGroup>
                                        {subLnData[selectedSub].map((line) => (
                                            <FormControlLabel
                                                key={line}
                                                control=
                                                {<Checkbox size="caption" checked={selectedLine === line}
                                                    onChange={() => setSelectedLine(line)} />}
                                                label={line}

                                            />
                                        ))}
                                    </FormGroup>
                                </div>
                            )}
                        </Grid>
                    </Grid>
                    <Button variant="contained" onClick={appendDataSetToPlot}>Add</Button>

                </Grid>
                <Grid style={styles.flexItem}>
                    <Grid>

                        {(!faultData) && <AnalysePlot props={[time ? time : [], plotData, data, property]} />}
                        {(faultData) && <PlotlyPlot props={[faultData.time ? faultData.time : [], faultData.freq ? faultData.freq : [], 'Time[s]', 'Frequency[Hz]', faultData["fault"] ? "Event Detected in " + `${selectedSub}` + ':' + `${selectedLine}` : "No event detected in " + `${selectedSub}` + ':' + `${selectedLine}`]} />}
                    </Grid>
                    <Grid container margin={2} direction={'column'} justifyContent={'center'} alignItems={'center'}>
                        {mode === 0 && selectedSub && selectedLine && property === 'F' && plotData[0] && plotData[0].length > 0 && <Button variant="contained" onClick={handleDetectFaultButton}>{buttonText}</Button>}
                        {mode === 1 && selectedSub && selectedLine && property === 'F' && (
                            <Button variant="contained"  sx={{ margin: 2 }} onClick={sendToServer}>{buttonText}</Button>
                        )}
                        {reaadyToCheckEvents && mode === 2 && selectedSub && selectedLine && property === 'F' && (
                            <Button variant="contained" sx={{ margin: 2 }} onClick={handleClassifyEvent}>{buttonText}</Button>
                        )}
                        {reaadyToCheckEvents && mode === 2 && selectedSub && selectedLine && property === 'F' && islandingEventData[0] && islandingEventData.length > 1 && (
                            <Button variant="contained" sx={{ margin: 2 }} onClick={handleClassifyIslandingEvent}>{'Detect islanding event '}</Button>
                        )}

                        {data && mode === 1 && property === 'F' && (
                            <DiscreteSlider prop={[sd_th, setSd_th, [0.1, 1, 0.05], "ROCOF Standard deviation threshold", 0.025]} />
                        )}
                        {data && mode === 1 && property === 'F' && (
                            <DiscreteSlider prop={[windowSize, setWindowSize, [10, 200, 10], "Window Size(sec)", 2]} />
                        )}
                    </Grid>


                </Grid>
                <Grid style={styles.flexItem}>
                    <div style={styles.containerChild}>
                        <Typography style={styles.label} variant="h6" >
                            Properties
                        </Typography>                        <FormGroup >
                            {Object.keys(p1).map((p, i) => (
                                <FormControlLabel
                                    key={p}
                                    control={
                                        <Checkbox
                                            checked={property === p1[i]}
                                            onChange={() => { setProperty(p1[i]) }}
                                            size="caption"
                                        />
                                    }
                                    label={p2[i]}
                                />
                            ))}
                        </FormGroup>
                    </div>

                    <Button variant="contained" onClick={resetPlotData}>Reset plot data</Button>
                        {mode === 2 && selectedSub && selectedLine && property === 'F' &&
                            <ThresholdForm values={thresholdValues} setValues={setThresholdValues} setReadyToCheckEvents={setReadyToCheckEvents}> </ThresholdForm>}
                </Grid>

            </div>
        </div>

    );
}
export default Analyser;