/* eslint-disable no-useless-concat */
import React, { useState, useEffect } from 'react';
import { Checkbox, Grid, Typography, Button, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useLocation } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';
import dataToServer from './../../utils/dataToServer'
import AlertDialog from './../Common/ErrorAlert'
import MyBarChart from './../Plots/Barchart';
import { styles } from './../../styles';
import GLOBAL from './../../GLOBAL';
const serverAddress = GLOBAL.serverAddress;
function Baseliner() {
    // ------------ Getting csv Data -----------------//
    const location = useLocation();
    const [subLnData, data] = location.state || [null, null, null];

    // -------------- Making state variables ------------//
    const [selectedSub, setSelectedSub] = useState(null);
    const [selectedLine, setSelectedLine] = useState(null);
    const [err_message, setErr_message] = React.useState(null);
    const [statData, setStatData] = React.useState({ 'freq': { "Minimum": 0, "Maximum": 0, "Mean": 0, "99.5% Limit": 0, "99.9% Limit": 0 }, 'rocof': { "Minimum": 0, "Maximum": 0, "Mean": 0, "99.5% Limit": 0, "99.9% Limit": 0 } });
    // making table rows
    const makeRows = (object) => {
        let rows = [];
        const stats = Object.keys(object["freq"]);
        stats.map((e, i) => {
            let row = { id: i, statName: e, freq: Number(object["freq"][e]), rocof: Number(object["rocof"][e]) }
            rows.push(row);
            return null;
        })
        return rows;

    }
    let rows = makeRows(statData);

    const columns = [
        { field: 'id', headerName: 'ID', width: '50' },
        {
            field: 'statName',
            headerName: 'Statistical measure',
            width: '200',
        },
        {
            field: 'freq',
            headerName: 'Frequency',
            width: '200',
        },
        {
            field: 'rocof',
            headerName: 'ROCOF',
            width: '200',
        }
    ];

    // --------------- handeling Button functions ------------------ // 

    // const resetPlotData = () => {
    //     setPlotData([[], []]);
    //     setislandingEventData([[], []])
    // }
    const sendToServer = async (e) => {
        const serverData = await dataToServer([1, data[`${selectedSub}` + ':' + `${selectedLine}`]['F']], serverAddress + 'v2/find-statistics', 1, 1);
        if (serverData.error) {
            if (serverData.error) {
                setErr_message('Server error while trying to check stats');
            }
            return
        }
        // server return faultdata if fault is there and fault:none of fault is not there
        if (serverData) {
            setStatData(serverData);
        }
        else {
            setErr_message("Server error!!!");
        }
    }

    // --------------- useeffect -----------------------------------------------------//

    useEffect(() => {
        rows = makeRows(statData);
    }, [statData])

    if (!data) {
        return(<Alert severity="error">No Data found!!!, Please import a file</Alert>);
    }

    // ---------------------------------------------------------//

    return (
        <div style={styles.container}>
            <div style={styles.flexContainer}>
                {!data && <Alert severity="error">No Data found to analyze !!</Alert>}
                {err_message && <AlertDialog props={[err_message, setErr_message]} />}
                <Grid style={styles.flexItemB} >
                    <Grid >
                        <div style={styles.containerChild} >
                             <Typography style={styles.label}>Substations</Typography>
                            <FormGroup >
                                {Object.keys(subLnData).map((subKey) => (
                                    <FormControlLabel
                                        key={subKey}
                                        control={
                                            <Checkbox
                                                checked={selectedSub === subKey}
                                                onChange={() => { setSelectedSub(subKey); setSelectedLine(null) }}
                                                size="caption"
                                                margin={0}
                                            />
                                        }
                                        label={subKey}
                                    />
                                ))}
                            </FormGroup>
                        </div>
                        <Grid style={styles.containerChild}>
                            {selectedSub && (
                                <div>
                                     <Typography style={styles.label}>{selectedSub}:Lines</Typography>
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
                </Grid>
                <Grid style={styles.flexItemB}>
                    <Grid >
                         <Typography style={styles.label}>Statistics of {`${selectedSub}` + ':' + `${selectedLine}`}, Frequency data</Typography>
                        <Grid container flexDirection="column" xs={3} mt={5}>
                            <DataGrid
                                rows={rows}
                                columns={columns}
                                pageSizeOptions={[2]}
                                rowHeight={40}
                                disableMultipleRowSelection={true}
                            />
                        </Grid>

                    </Grid>
                    <Grid container margin={2} direction={'column'} justifyContent={'center'} alignItems={'center'}>
                        {selectedSub && selectedLine && <Button variant="contained" sx={{ margin: 2 }} onClick={sendToServer}>{'Check Stats'}</Button>}
                    </Grid>


                </Grid>
                <Grid style={{...styles.flexItemB,...{flexDirection:'row'}}} container direction={'column'}>
                    <MyBarChart xData={Object.keys(statData['freq'])} values={Object.values(statData['freq'])} title={'Frequency data stats'} />
                    <MyBarChart  xData={Object.keys(statData['rocof'])} values={Object.values(statData['rocof'])} title={'ROCOF data stats'}/>
                </Grid>
            </div>
        </div>

    );
}
export default Baseliner;