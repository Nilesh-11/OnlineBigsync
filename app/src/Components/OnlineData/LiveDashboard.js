import { Box, Container, IconButton} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GLOBAL from '../../GLOBAL';
import ConnectionDashboard from './ConnDash';
import checkConnection from './utils/API/CheckConnection';
import HubIcon from '@mui/icons-material/Hub';
import DataFromServer from './utils/API/DataServer';
import ChartComponent from '../Plots/LivePlot';
import { styles } from './utils/styles';
import CustomSelect from '../Common/Select';
import DynamicForm from './utils/DynamicForm';
const serverAddress = GLOBAL.serverAddress;

const DashType = {
    "ConnectionDash": 0,
    "AnalysisDash": 1
};

const LiveDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    console.log(location.state);
    const { threshold_values, window_lens } = location.state || {};
    const [frequencyPlotTitle, setFrequencyPlotTitle] = useState("Frequency plot")
    const [timeWindowLen, setTimeWindowLen] = useState(20)
    const [pmusData, setPmusData] = useState(null)
    const [pmuNames, setPmuNames] = useState(null)
    const [thresholdValues, setThresholdValues] = useState(threshold_values)
    const [windowLens, setWindowLens] = useState(window_lens)
    const [graphData, setGraphData] = useState(null)
    const [currPmu, setCurrPmu] = useState(null)
    const [freqData, setFreqData] = useState(null)
    const [timeData, setTimeData] = useState(null)

    const updateValues = (newData) => {
        setTimeData(newData.time);
        const pmus = {};
        const pmunames = [];

        for (let i = 0; i < newData.pmus.length; i++) {
            const pmu = newData.pmus[i];
            if (!pmus[pmu.stationname]) {
                pmus[pmu.stationname] = {};
            }
            pmunames.push(pmu.stationname);
            pmus[pmu.stationname]["frequency"] = pmu.frequency;
        }

        setPmusData(pmus);
        setPmuNames(pmunames);
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            const ConnResp = await checkConnection(serverAddress + 'conn-details');
            if (ConnResp.status === 'success') {
                console.log(ConnResp.message);
            } else {
                navigate('/error-page', { state: { message: ConnResp.message, status_code: ConnResp.status_code } });
            }

            const DataResp = await DataFromServer([timeWindowLen], serverAddress + 'data-server');
            if (DataResp && DataResp.status === 'success') {
                updateValues(DataResp.data);
            } else {
                if (!DataResp) {
                    navigate('/error-page');
                } else {
                    navigate('/error-page', { state: { message: DataResp.message, status_code: DataResp.status_code } });
                }
            }
        }, 1000); 
    
        return () => clearInterval(interval); 
    }, [timeWindowLen]);

    useEffect(() => {
        // console.log("Updated pmusData:", pmusData);
        if(currPmu){
            setFreqData(pmusData[currPmu].frequency)
        }
    }, [pmusData]);
    
    useEffect(() => {
        // console.log("Updated pmuNames:", pmuNames);
        if(!currPmu && pmuNames){
            setCurrPmu(pmuNames[0])
        }
    }, [pmuNames]);

    
    const handleIconbutton = () =>{
        
    };

    return (
        <Container sx={styles.container}>
            <Box styles={styles.headerContainer}>
                <Box>
                    {pmuNames && <CustomSelect options={pmuNames} onSelect={(value) => console.log(value)}></CustomSelect>}
                </Box>
                <Box>
                    <ConnectionDashboard/>
                </Box>
            </Box>
            <Box sx={styles.chartContainer} >
                <Box sx={styles.chart}>
                    {freqData && timeData && (
                        <ChartComponent 
                            xAxisData={timeData} 
                            yAxisData={freqData} 
                            title={frequencyPlotTitle} 
                            xAxisLabel='Time' 
                            yAxisLabel='Frequency'
                            yaxisMinLimit='50'
                            yaxisMaxLimit='60'
                        />
                    )}
                </Box>
                <Box sx={styles.chartSettings}>
                    <Box>
                        <DynamicForm data={thresholdValues}></DynamicForm>
                    </Box>
                    <Box>
                        <DynamicForm data={windowLens}></DynamicForm>
                    </Box>
                </Box>
            </Box>
        </Container>
      );
}

export default LiveDashboard;