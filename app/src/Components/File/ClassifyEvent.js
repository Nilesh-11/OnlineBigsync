import * as React from 'react';
import Alert from '@mui/material/Alert';
import EventTable from './../Common/EventTable'
import { useLocation,useNavigate } from 'react-router-dom';
import { styles } from './../../styles';
export default function ClassifyGrid() {
    const location = useLocation();
    const navigate = useNavigate();

    const { state } = location;
    const data = state;
    if (!data) {
        navigate('/analyse')
        
    }

    // const events = Object.keys(data); // Use Object.keys directly
    return (
        <div style={styles.container}>
            <div style={styles.flexContainer}>
                {!data && <Alert  severity="error">No Data found to classify event!!</Alert>}
                {data && <EventTable props={data}></EventTable>}
            </div>
        </div>
    );
}
