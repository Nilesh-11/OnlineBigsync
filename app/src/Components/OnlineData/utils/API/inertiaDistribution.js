import GLOBAL from "./../../../../GLOBAL";
const serverAddress = GLOBAL.serverAddress;

export const getIDIData = async (data) => {
  try {
    const response = await fetch(`${serverAddress}live/IDI/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const responseData = await response.json();
    if (!responseData || responseData.status !== "success") {
      throw new Error(
        responseData ? responseData.details : "No data fetched"
      );
    }
    return responseData;
  } catch (error) {
    console.error("Failed to fetch IDI data:", error);
    return null;
  }
};

export const fetchStations = async (data) => {
  const url = `${serverAddress}live/IDI/stations`;
  try {
    const response = await fetch(url, {
      method: "GET"
    });

    if (response.ok) {
      const responseData = await response.json();
      if (!responseData || responseData.status !== "success") {
        throw new Error(
          responseData ? responseData.details : "No data fetched"
        );
      }
      return responseData;
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

export const submitStationValues = async (data) => {
  const url = `${serverAddress}live/IDI/stations`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const responseData = await response.json();
      if (!responseData || responseData.status !== "success") {
        throw new Error(
          responseData ? responseData.details : "No data fetched"
        );
      }
      return responseData;
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

export default fetchStations;