/* eslint-disable no-useless-concat */
import React, { useState, useEffect } from 'react';
import { Checkbox, Grid, Typography, Button, Alert } from '@mui/material';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useLocation } from 'react-router-dom';
// import AnalysePlot from './Plot_Analyse&Detect';
import PlotlyPlotOSLP from './Plots/PlotOSLP';
// import { useNavigate } from 'react-router-dom';
import dataToServerOSLP from '../utils/dataToServerOSLP'
import AlertDialog from './Others/ErrorAlert'
import { styles } from '../styles';
import GLOBAL from '../GLOBAL';
import MessageDialog from './Others/MessageDialog';
import LinearBuffer from './Others/Loading';


const serverAddress = GLOBAL.serverAddress;
function OSLP() {
    // ------------ Getting csv Data -----------------//
    // const navigate = useNavigate();
    const location = useLocation();
    const [subLnData, data, time] = location.state || [null, null, null];
    // -------------- Making state variables ------------//
    const [selectedSub, setSelectedSub] = useState(null);
    const [selectedLine, setSelectedLine] = useState(null);
    const [property, setProperty] = React.useState('F');
    const [plotData, setPlotData] = useState([[], []]);
    const [stage, setStage] = React.useState(null);
    const buttonText = "Locate the source"
    const [err_message, setErr_message] = React.useState(null);
    const [selectedPoints, setSelectedPoints] = useState([]);
    const [rankData, setRankData] = React.useState([]);
    const [loading, setLoading] = useState(false);
    const [currSlope, setCurrSlope] = React.useState(0);
    const [slopeData, setSlopeData] = React.useState([]);
    const [defData, setDefData] = React.useState([]);
    // const [stEd, setStEd] = React.useState([0, 0]);
    const [open, setOpen] = React.useState(false);

    let p1 = ['F', 'VM', 'VA', 'IM', 'IA']
    let p2 = ['Frequency', 'Voltage Magnitude', 'Voltage Angle', 'Current Magnitude', 'Current Angle']

    /* Concept of stages:
        null => default
        0 => after clicking on add
        1 => after clicking on oscillations
    */


    // --------------- handeling Button functions ------------------ // 


    const handleSlopeIndexChange = (event, newIndex) => {
        if (newIndex !== null) {

            setCurrSlope(newIndex);
            setPlotData(slopeData[newIndex]);
        }
    };


    const appendDataSetToPlot = () => {
        if (selectedSub && selectedLine && property) {
            setPlotData(data[`${selectedSub}` + ':' + `${selectedLine}`][property]);
            setStage(0);
            setOpen(true);
            // setStage(null);
            // if (time) { setStEd([0, time.length]) }
            setSlopeData([]);
            setRankData([]);
            // stage === 1 && selectedSub && selectedLine && property === 'F' && plotData[0] && plotData[0].length > 0
        }
        else {
            return;
        }
    }
    const resetPlotData = () => {
        setPlotData([[], []]);
        // setfaultData([[], []]);
        setSelectedPoints([]);
        setStage(null);
        setStage(null);
        // if (time) { setStEd([0, time.length]) }
        setSlopeData([]);
        setRankData([]);
    }
    const sendToServer = async (e) => {
        setStage(1);
        setLoading(true);
        let serverData = await dataToServerOSLP([time, data, selectedPoints], serverAddress + 'v2/oslp');
        setSelectedPoints([]);
        if (serverData.error) {
            setLoading(false);
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
            setLoading(false);            
            setRankData(serverData['rank']);
            setPlotData(serverData['slope'][currSlope])
            setSlopeData(serverData['slope']);
            setDefData(serverData['def'])
        }
        else {
            setLoading(false);
            setErr_message("Server error while detecting");
        }
        // setLoading(false);
    }



    // --------------- useeffect -----------------------------------------------------//




    useEffect(() => {
        resetPlotData();
    }, [property])
    useEffect(() => {
        setStage(null);
        // if (time) { setStEd([0, time.length]) }
        setSlopeData([]);
        setRankData([]);
        setPlotData([],[]);
        // setfaultData(null);
    }, [property, selectedLine, selectedSub, time])


    if (!data) {
        return (<Alert severity="error">No Data found to analyze, Please import a file</Alert>);
    }
    // ---------------------------------------------------------//

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

    const tableRows = rankData.map((rank, index) => {
        // Determine row color based on condition


        // Define row style
        const rowStyle = {
            textAlign: 'center'
        };

        return (
            <tr key={index} style={rowStyle}>
                <td>{(index + 1)}</td>
                <td>{rank ? rank : '-'}</td>
                <td>{defData && defData[index] !== 'nan' ? defData[index] : '-'}</td>
                {/* <td>{rankData ? rankData[1].toFixed(3) : '-'}</td>
                <td>{rankData ? rankData[2].toFixed(3) : '-'}</td>
                <td>{rankData ? rankData[3].toFixed(3) : '-'}</td>
                <td>{rankData ? rankData[4].toFixed(4) : '-'}</td> */}
            </tr>
        );
    });


    return (
        <div style={styles.container}>
            <div style={styles.flexContainer}>
                {!data && <Alert severity="error">No Data found to do OSLP analysis !!</Alert>}
                {err_message && <AlertDialog props={[err_message, setErr_message]} />}
                {<MessageDialog props={["How to select window for finding source of oscillations?", "Click on the figure to select left and right points of the window.", open, setOpen]} />}
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
                        <PlotlyPlotOSLP props={[time ? time : [], plotData ? plotData : [], 'Time[s]', stage === 1 ? "Energy" : property, stage !== 1 ? "Selected data: " + `${selectedSub}` + ':' + `${selectedLine}` : "Flow of energy of: " + rankData[currSlope], selectedPoints, setSelectedPoints]} />
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {stage === 0 && selectedPoints.length === 2 && (
                                <Typography>
                                    Start Time: {selectedPoints[0].x}, End Time: {selectedPoints[1].x}
                                </Typography>
                            )}


                        </div>
                        {loading && <Typography variant="h6">Locating the source of sustained
oscillations...</Typography>}
                        {loading && <LinearBuffer />}
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>

                            {stage === 1 && slopeData.length > 0 && <Typography variant="body1">
                                Energy flow of:
                            </Typography>}
                            {stage === 1 && rankData.length > 0 && <select
                                id="modeDropdownIndex"
                                value={currSlope}
                                onChange={(event) => handleSlopeIndexChange(event, event.target.value)}
                            >
                                {stage === 1 && slopeData.length > 0 && [0, 1, 2, 3, 4].map((mode, index) => (
                                    <option value={index}>{rankData[index]}</option>
                                ))}
                            </select>}
                        </div>

                    </Grid>

                    <Grid container margin={2} direction={'column'} justifyContent={'center'} alignItems={'center'}>
                        {stage === 0 && selectedSub && selectedLine && plotData[0] && plotData.length > 0 && selectedPoints.length === 2 && <Button variant="contained" onClick={sendToServer}>{buttonText}</Button>}
                    </Grid>
                    
                    {stage === 1 && rankData.length > 1 && <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderTop: '5px solid #0073ba', width:'100%' , margin:'0'}}>
                        {rankData.length > 0 &&
                            <Typography style={styles.label} variant="h6">Most probable sources</Typography>}
                        {rankData.length > 0 && <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Ranking</th>
                                    <th style={thStyle}>Lines</th>
                                    <th style={thStyle}>DEF</th>
                                    {/* <th style={thStyle}>Damped Freq.</th>
                                <th style={thStyle}>Amp</th>
                                <th style={thStyle}>Theta</th>
                                <th style={thStyle}>Damping(%)</th>
                                <th style={thStyle}>% Energy </th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows}
                            </tbody>
                        </table>}
                    </div>}


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
                </Grid>

            </div>
        </div>

    );
}
export default OSLP;