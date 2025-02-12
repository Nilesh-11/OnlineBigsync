import { ConnectionErrorCode } from "./../_variable";

const closeConnection = async(url) => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            const responseData = await response.json(); // Parse the response as JSON
            console.log(responseData);
            if (responseData.status_code !== 200){
                console.error('Error:', responseData.message)
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

export default closeConnection;