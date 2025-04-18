const actionToServer = async([action_type, message=NaN], url) => {
  try {
      // Send the file to the server
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action_type,
          msg: message
        }),
      });
      if (response.ok) {
        const responseData = await response.json(); // Parse the response as JSON
        if (responseData.status_code !== 200){
          console.error('Error:', responseData.message)
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

export default actionToServer;