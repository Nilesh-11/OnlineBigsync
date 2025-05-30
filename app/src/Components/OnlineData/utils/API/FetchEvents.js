const fetchData = async (payload, url) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const responseData = await response.json();
        if (!responseData || responseData.status_code !== 200) {
          throw new Error(responseData ? responseData.message : 'No data fetched');
        }
        return responseData;
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };
  
  export default fetchData;
  