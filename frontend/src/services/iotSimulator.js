export const IOT_SCENARIOS = {
  NORMAL: 'NORMAL',
  HIGH_TEMP: 'HIGH_TEMP',
  LOW_TEMP: 'LOW_TEMP',
  HUMIDITY_VIOLATION: 'HUMIDITY_VIOLATION',
  GPS_DEVIATION: 'GPS_DEVIATION'
};

export const generateIoTReading = (drugId, shipmentId, scenario = IOT_SCENARIOS.NORMAL) => {
  let temperature = 5.0; // Normal range: 2-8 C
  let humidity = 45; // Normal range: 30-60%
  let lat = 40.7128 + (Math.random() * 0.1 - 0.05);
  let lng = -74.0060 + (Math.random() * 0.1 - 0.05);

  switch (scenario) {
    case IOT_SCENARIOS.HIGH_TEMP:
      temperature = 12.5 + (Math.random() * 5); // Above 8
      break;
    case IOT_SCENARIOS.LOW_TEMP:
      temperature = -2.0 + (Math.random() * 3); // Below 2
      break;
    case IOT_SCENARIOS.HUMIDITY_VIOLATION:
      humidity = 85 + (Math.random() * 10); // Above 60
      break;
    case IOT_SCENARIOS.GPS_DEVIATION:
      lat = 45.0; // Way off
      lng = -120.0;
      break;
    default:
      // Add slight normal variations
      temperature += (Math.random() * 2 - 1);
      humidity += (Math.random() * 10 - 5);
      break;
  }

  return {
    drugId,
    shipmentId,
    temperature: parseFloat(temperature.toFixed(2)),
    humidity: parseFloat(humidity.toFixed(1)),
    location: { lat, lng },
    timestamp: Math.floor(Date.now() / 1000),
    isViolation: scenario !== IOT_SCENARIOS.NORMAL
  };
};
