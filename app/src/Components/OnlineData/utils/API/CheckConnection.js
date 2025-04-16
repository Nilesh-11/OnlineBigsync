import { ConnectionErrorCode } from "./../_variable";

const checkConnection = async(url) => {
    try {
        // Send the file to the server
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            const responseData = await response.json(); // Parse the response as JSON
            if (responseData.status_code !== 200){
                console.error('Error:', responseData.details);
            }
            return responseData;
        }
        else{
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } 
    catch (error) {
        console.error('Error:', error);
    }
};

export default checkConnection;