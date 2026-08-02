// src/services/esp32Service.js
const ESP32_IP = '192.168.1.79';
const USE_PROXY = true;

const getUrl = (endpoint) => {
  if (USE_PROXY) {
    return `/esp32${endpoint}`;
  }
  return `http://${ESP32_IP}${endpoint}`;
};

export const fetchESP32Status = async () => {
  try {
    const response = await fetch(getUrl('/status'), {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('ESP32 error:', error);
    return null;
  }
};

export const sendESP32Command = async (command) => {
  try {
    const response = await fetch(getUrl(`/${command}`));
    return await response.text();
  } catch (error) {
    console.error('Command error:', error);
    return null;
  }
};

export const startESP32Stream = (onData, onError) => {
  let intervalId = null;
  
  const fetchData = async () => {
    const data = await fetchESP32Status();
    if (data && data.status === 'success') {
      onData(data);
    } else if (data) {
      onError('Invalid data');
    } else {
      onError('Failed to fetch');
    }
  };
  
  fetchData();
  intervalId = setInterval(fetchData, 100);
  
  return intervalId;
};

export const stopESP32Stream = (intervalId) => {
  if (intervalId) clearInterval(intervalId);
};

export const checkESP32Connection = async () => {
  try {
    const response = await fetch(getUrl('/status'), {
      signal: AbortSignal.timeout(2000)
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

export const getESP32IP = () => ESP32_IP;