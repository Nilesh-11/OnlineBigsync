const connectToServer = async ([serverIp, serverPort], url, navigate) => {
  console.log('serverAddress', url);
  console.log(serverIp, serverPort);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip: serverIp,
        port: serverPort
      }),
    });
    if (response.ok) {
      const responseData = await response.json();
      if (responseData.status_code !== 200) {
        console.error('Error:', responseData.message);
        return { error: { message: responseData.message } };
      } else {
        return responseData;
      }
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    return {
      error: {
        message: error.message
      }
    };
  }
};

export default connectToServer;
