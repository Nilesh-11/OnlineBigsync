const DataFromServer = async([timeWindowLen], url) => {
    try {
        // Send the file to the server
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            time_window: timeWindowLen
          }),
        });
        if (response.ok) {
          const responseData = await response.json(); // Parse the response as JSON
          if (!responseData || responseData.status_code !== 200){
            if(!responseData) {
              throw Error('No data fetched')
            }
            else{
              console.error('Error:', responseData.message)
            }
          }
          else{
            return responseData;
          }
        } 
        else{
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error:', error);
    }
  };
  
  export default DataFromServer;