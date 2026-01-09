// This version of the index file contains a decodeUplink function that does not use
// the Buffer or ArrayBuffer or TypedArray Classes.
// This version is compatible with ES5
// Due to limitations in ES5, only a limited set of downlink values are permitted.
// Because of this, the decodeDownlink function is not implemented

/**
 * Decode uplink
 * @param {number} fPort - The Port Field on which the uplink has been sent
 * @param {number[]} bytes - Array of bytes represented as numbers as it has been sent from the device
 * @param {variables} variables - variables contains the device variables e.g. {"calibration": "3.5"}. Both key/value are type string
 * @returns {VoltDropDirectData} The decoded object
 */
function Decode(fPort, bytes, variables) {
    var result = {
      data: {},
    };
    var rawBytesArray = bytes;
    // Uplink payload must be 11 bytes long.
    if (rawBytesArray.length != 11) {
      throw new Error("Payload length must be 11 bytes");
    }
  
    // Packet ID - 1 byte
    var packetId = rawBytesArray[0];
    if (packetId !== 50) {
      throw new Error("Payload packet ID is not equal to 50");
    }
  
    // Constant factors for formulas
    var capacitorVoltageFactor = 5.0 / 255.0;
    var temperatureCelsiusFactor = 120.0 / 255.0;
    var deciToUnitFactor = 0.1;
  
    // Amp hour accumulation - 4 bytes
    // 32-bit unsigned integer in network byte order (MSB/BE) reported in deci-ampere-hour (dAh)
    var ampHourAccumulationDeciAmpere =
      ((rawBytesArray[1] << 24) +
        (rawBytesArray[2] << 16) +
        (rawBytesArray[3] << 8) +
        rawBytesArray[4]) >>>
      0;
  
    // Average amps - 2 bytes
    // 16-bit unsigned integer in network byte order (MSB/BE) reported in deci-ampere (dA),
    // this average represents the entire time since the last transmit (one entire transmit period)
    var averageAmpsDeciAmpere =
      ((rawBytesArray[5] << 8) + rawBytesArray[6]) >>> 0;
  
    // Max Offset - 1 byte
    // 8-bit unsigned integer representing the percent offset above the Average amps value.
    var maxOffset = rawBytesArray[7];
  
    // Min Offset - 1 byte
    // 8-bit unsigned integer representing the percent offset below the Average amps value.
    var minOffset = rawBytesArray[8];
  
    // Capacitor Voltage Scalar - 1 byte
    // 8-bit unsigned integer representing the capacitor voltage.
    // (as if the integer range from 0-255 is scaled to between 0.0V and 5.0V)
    var capacitorVoltageScalar = rawBytesArray[9];
  
    // Temperature Scalar
    // 8-bit unsigned integer representing the temperature.
    // (as if the integer range from 0-255 is scaled to between -40C and 80C)
    var temperatureScalar = rawBytesArray[10];
  
    // Calculated fields
    var maximumAmpsDeciAmpere =
      averageAmpsDeciAmpere * ((100 + maxOffset) / 100.0);
    var minimumAmpsDeciAmpere =
      averageAmpsDeciAmpere * ((100 - minOffset) / 100.0);
    var capacitorVoltage = capacitorVoltageFactor * capacitorVoltageScalar;
    var temperatureCelsius = temperatureCelsiusFactor * temperatureScalar - 40;
  
    result.data = {
      ampHourAccumulation: ampHourAccumulationDeciAmpere * deciToUnitFactor,
      averageAmps: averageAmpsDeciAmpere * deciToUnitFactor,
      maximumAmps: maximumAmpsDeciAmpere * deciToUnitFactor,
      minimumAmps: minimumAmpsDeciAmpere * deciToUnitFactor,
      capacitorVoltage: capacitorVoltage,
      temperatureCelsius: temperatureCelsius,
    };
  
    return result.data;
  }
