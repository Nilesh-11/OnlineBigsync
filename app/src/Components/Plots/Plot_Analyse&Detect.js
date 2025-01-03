import React from 'react';
import Plot from 'react-plotly.js';
const getInnermostValue = (arr) => arr.reduce((acc, val) => (Array.isArray(val) ? getInnermostValue(val) : val), arr);

const AnalysePlot = (props) => {
  let [xData, yDatas, data, property] = props.props;
  if (!xData || !yDatas || yDatas.length === 0) {
    xData=[];
    yDatas=[]

  }
  let yTitle = "";
  if(property === 'F'){yTitle = property + '[Hz]'}
  if(property === 'VM'){yTitle = property + '[kV]'}
  if(property === 'VA'){yTitle = property + '[degrees]'}
  if(property === 'IM'){yTitle = property + '[Amps]'}
  if(property === 'IA'){yTitle = property + '[degrees]'}
  const toPlot = yDatas.map((yData, i) => ({
    x:xData,
    y: data[yData]?data[yData][property].map(dataPoint => dataPoint):[],
    type: 'scatter',
    mode: 'lines+points',
    name: getInnermostValue(yDatas[i]), // Set the legend as yDatas[i]
  }));

  return (
    <Plot
      data={toPlot}
      layout={{
        // width: 1000, height: 450,
        xaxis: {
          title: 'Time[s]',
        },
        yaxis: {
          title: yTitle,
        },
      }}
    />
  );
};

export default AnalysePlot;
