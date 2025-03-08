export const styles = {
    container: {
      width: '100%',
      minHeight: '100vh', // Changed from fixed 94vh to minHeight to cover full viewport
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      textAlign: 'center',
    },
    headerContainer: {
      display: 'flex',
      flexDirection: 'row',
      height: '10%',
      backgroundColor: 'inherit', // Uses container's background
    },
    chartContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '0 0px',
      backgroundColor: 'inherit',
      flexGrow: 1, // Allows the chart container to expand and fill the remaining space
    },
    chart: {
      flex: '3',
    //   height: '90vh'
      // Height is now controlled inline (or you could set it here, e.g., height: '60vh')
    },
    chartSettings: {
      display: 'flex',
      height: '100%',
      flex: '1',
      flexDirection: 'column',
      backgroundColor: 'inherit',
    },
  };
  