/* eslint-disable no-useless-concat */
import React, { useState, useEffect } from 'react';
import { Checkbox, Grid, Typography, Button, Alert } from '@mui/material';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useLocation } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';
import dataToServerModes from '../utils/dataToServerModes'
import AlertDialog from './Others/ErrorAlert'
import { styles } from '../styles';
import GLOBAL from '../GLOBAL';
import PlotlyPlot from './Plots/PlotV2';
import LinearBuffer from './Others/Loading';

const serverAddress = GLOBAL.serverAddress;
function ModeAnalysis() {

    // const navigate = useNavigate();
    const location = useLocation();
    const [subLnData, data, time] = location.state || [null, null, null];
    const [selectedSub, setSelectedSub] = useState(null);
    const [selectedLine, setSelectedLine] = useState(null);
    const property = 'F';
    const [stage, setStage] = React.useState(null);
    const buttonText = "Extract Modes"
    const [plotData, setPlotData] = useState([[], []]);
    const [err_message, setErr_message] = React.useState();
    const [loading, setLoading] = useState(false);
    const [modeCharacterisation, setmodeCharacterisation] = useState([]);
    const [modesData, setmodesData] = React.useState(null);
    const [modesPlotIndex, setmodesPlotIndex] = React.useState(0);
    const [modesPlotChar, setmodesPlotChar] = React.useState("Amp");
    const [plotLabelY, setplotLabelY] = React.useState("Frequency");

    // let p1 = ['F', 'VM', 'VA', 'IM', 'IA']
    // let p2 = ['Frequency', 'Voltage Magnitude', 'Voltage Angle', 'Current Magnitude', 'Current Angle']


    // Table styles
    const tableStyle = {
        fontFamily: 'Arial, sans-serif',
        borderCollapse: 'collapse',
        width: '30vw',
    };

    const thTdStyle = {
        border: '1px solid #dddddd',
        textAlign: 'center',
        padding: '8px',
    };

    const thStyle = {
        ...thTdStyle,
        backgroundColor: '#BDD5DE',
    };

    // Making table rows from the prony data sent by server
    // modeCharacterisation will be an array containing characterisation of nth mode

    const tableRows = modeCharacterisation.map((characteristicsData, index) => {
        // Determine row color based on condition
        let rowColor = characteristicsData && (characteristicsData[3]) < 2 ? 'red' : 'lime';
        if( characteristicsData && (characteristicsData[3]) < 5 && (characteristicsData[3]) > 2){
            rowColor = '#FFC300';
        }
        if(!characteristicsData){
            rowColor = null;
        }
        // Define row style
        const rowStyle = {
            backgroundColor: rowColor,
            textAlign: 'center'
        };

        return (
            <tr key={index} style={rowStyle}>
                <td>{"Mode " + (index + 1)}</td>
                <td>{characteristicsData ? characteristicsData[0].toFixed(3) : '-'}</td>
                <td>{characteristicsData ? characteristicsData[1].toFixed(3) : '-'}</td>
                <td>{characteristicsData ? characteristicsData[2].toFixed(3) : '-'}</td>
                <td>{characteristicsData ? characteristicsData[3].toFixed(3) : '-'}</td>
                <td>{characteristicsData ? characteristicsData[4].toFixed(4) : '-'}</td>
            </tr>
        );
    });

    /* Concept of stages:
        null => default
        0 => after clicking on add
        1 => after clicking on extract modes
    */


    // --------------- handeling Button functions ------------------ // 

    const handleExtractModeButton = () => {
        setmodesData(null);
        setStage(1);
        sendToServer();
        setmodeCharacterisation([]);



    }
    const changeDataSetToPlot = () => {
        if (selectedSub && selectedLine && property) {
            setPlotData(data[`${selectedSub}` + ':' + `${selectedLine}`][property]);
            setStage(0);
            // mode === 1 && selectedSub && selectedLine && property === 'F' && plotData[0] && plotData[0].length > 0
        }
        else {
            return;
        }
    }
    const resetPlotData = () => {
        setPlotData([[], []]);
        setStage(null);
    }
    const sendToServer = async (e) => {

        setLoading(true);
        let serverData = await dataToServerModes(plotData, serverAddress + 'v3/modes-analysis');
        if (serverData.error) {
            if (serverData.error.message) {
                setErr_message("Server error while detecting");
            }
            else {
                setErr_message("Server error while detecting");
            }
            setLoading(false);
            return
        }
        // // server return faultdata if fault is there and fault:none of fault is not there
        else if (serverData && !serverData.error) {
            setStage(1);
            serverData = JSON.parse(serverData);
            const temp1 = Object.fromEntries(
                Object.entries(serverData).filter(([key]) => key !== "Prony_data")
            );
            const temp2 = Object.fromEntries(
                Object.entries(serverData).filter(([key]) => key === "Prony_data")
            );
            setmodesData(temp1);
            setmodeCharacterisation(temp2["Prony_data"]);
            setPlotData(temp1[modesPlotChar][modesPlotIndex]);
        }
        else {

            setErr_message("Server error while detecting");
        }
        setLoading(false);
    }
    const handleModeChangeIndex = (event, newMode) => {
        if (newMode !== null) {

            setmodesPlotIndex(newMode);
            setPlotData(modesData[modesPlotChar][newMode]);
        }
    };
    const handleModeChangeChar = (event, newModeChar) => {
        if (newModeChar !== null) {
            setmodesPlotChar(newModeChar);
            setPlotData(modesData[newModeChar][modesPlotIndex]);

        }
    };

    // --------------- useEffect -----------------------------------------------------//


    useEffect(() => {
        resetPlotData();
    }, [property])
    useEffect(() => {
        setStage(null);
        setPlotData([[], []]);
        setmodeCharacterisation([]);
        setmodesData()
    }, [property, selectedLine, selectedSub])
    useEffect(() => {
        if (stage === 1 && modesData && (modesPlotChar !== "InstFreq")) {
            setplotLabelY("Magnitude");
        }
        else {
            setplotLabelY("Frequency[Hz]");
        }
    }, [modesData, modesPlotChar, plotData, stage])

    if (!data) {
        return (<Alert severity="error">No Data found to analyze, Please import a file</Alert>);
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
                    <Button variant="contained" onClick={changeDataSetToPlot}>Add</Button>

                </Grid>
                <Grid style={styles.flexItem}>
                    <Grid>
                        <PlotlyPlot props={[time ? time : [], plotData ? plotData : [], 'Time[s]', plotLabelY, "Selected data: " + `${selectedSub}` + ':' + `${selectedLine}`]} />
                    </Grid>
                    <Grid container margin={2} direction={'column'} justifyContent={'center'} alignItems={'center'}>
                        {stage === 0 && selectedSub && selectedLine && plotData[0] && plotData.length > 0 && <Button variant="contained" onClick={handleExtractModeButton}>{buttonText}</Button>}
                    </Grid>
                    <Grid style={{ marginLeft: '1rem' }}>
                        {loading && <Typography variant="h6">Extracting the modes....</Typography>}
                        {loading && <LinearBuffer />}
                        {stage === 1 && modesData && <Typography style={styles.label} variant="h6">Number of modes detected: {modesData["Amp"].length}</Typography>}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', flexDirection: 'row' }}>
                                {stage === 1 && modesData && <Typography variant="body1">
                                    Selected Mode:
                                </Typography>}
                                {stage === 1 && modesData && <select
                                    id="modeDropdownIndex"
                                    value={modesPlotIndex}
                                    onChange={(event) => handleModeChangeIndex(event, event.target.value)}
                                >
                                    {modesData && modesData["Amp"].map((mode, index) => (
                                        <option value={index}>Mode {index + 1}</option>
                                    ))}
                                </select>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'row' }}>
                                {stage === 1 && modesData && <Typography variant="body1">
                                    Selected Characteristics:
                                </Typography>}
                                {stage === 1 && modesData && <select
                                    id="modeDropdownChar"
                                    value={modesPlotChar}
                                    onChange={(event) => handleModeChangeChar(event, event.target.value)}
                                >
                                    {stage === 1 && modesData && Object.keys(modesData).map((char, index) => (
                                        <option value={char}>{char}</option>
                                    ))}
                                </select>}
                            </div>
                        </div>


                    </Grid>

                </Grid>
                {/* <label htmlFor="modeDropdown">Select Mode:</label> */}

                <Grid style={{ ...styles.flexItem, ...{ 'width': '30vw' } }}>
                    <Typography style={styles.label} variant="h6">Modes characterisation</Typography>
                    {modeCharacterisation && <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Mode</th>
                                <th style={thStyle}>Damped Freq.</th>
                                <th style={thStyle}>Amp</th>
                                <th style={thStyle}>Theta</th>
                                <th style={thStyle}>Damping(%)</th>
                                <th style={thStyle}>% Energy </th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows}
                        </tbody>
                    </table>}
                </Grid>

            </div>
        </div>

    );
}
export default ModeAnalysis;