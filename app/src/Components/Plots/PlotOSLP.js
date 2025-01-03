import React from 'react';
import Plot from 'react-plotly.js';

const PlotlyPlotOSLP = (props) => {
    let [xData, yData, xLabel, yLabel, title, selectedPoints, setSelectedPoints] = props.props;
    if (!xData || !yData || yData.length === 0) {
        xData = [];
        yData = []

    }

    //   const [selectedPoints, setSelectedPoints] = useState([]);
    // Check if yData is an array or an array of arrays
    const traces = Array.isArray(yData[0])
        ? yData.map((y, index) => ({
            x: xData,
            y,
            mode: 'lines',
            name: `Line data`, // Customize the legend label

        }))
        : [
            {
                x: xData,
                y: yData,
                mode: 'lines',
                name: 'Line data', // Customize the legend label
            },
        ];
    
        selectedPoints.forEach((p,i) => {
            traces.push({
                x: [p.x],
                y: [p.y],
                mode: 'markers',
                marker: {
                  size: 10,
                  color: i===0?'#EE4266':'#FBA834', // Customize the color of the marker
                },
                name: i===0?'Start time':'End time',
              });
        });

    

    const handleClick = (data) => {
        const clickedPoint = { x: data.points[0].x, y: data.points[0].y };

        setSelectedPoints((prevPoints) => {
            if (prevPoints.length < 2) {
                let x_sel = [...prevPoints, clickedPoint];
                x_sel.sort(function (a, b) { return a.x - b.x });
                return x_sel;
            } else {
                let x_sel = [clickedPoint];
                x_sel.sort(function (a, b) { return a.x - b.x });
                return x_sel;
            }
        });
        

    };

    return (
        <div>
            <Plot
                data={traces}
                onClick={handleClick}
                layout={{
                    title: title,
                    xaxis: {
                        title: xLabel,
                    },
                    yaxis: {
                        title: yLabel,
                    },
                }}
            />

        </div>
    );
};

export default PlotlyPlotOSLP;
