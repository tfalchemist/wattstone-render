'use strict';

// EINZIGE Quelle für Konstanten/Daten
const STONES = {
  "0":    { name:"Wattstone 0°",    base:43, deflectorSouth:3, angle:0,  variant:""   },
  "6":    { name:"Wattstone 6°",    base:48, deflectorSouth:3, angle:6,  variant:""   },
  "10V1": { name:"Wattstone 10° V1",base:24, deflectorSouth:3, angle:10, variant:"V1" },
  "10V2": { name:"Wattstone 10° V2",base:25, deflectorSouth:3, angle:10, variant:"V2" },
  "10XL": { name:"Wattstone 10° XL",base:34, deflectorSouth:5, angle:10, variant:"XL" },
  "15":   { name:"Wattstone 15°",   base:26, deflectorSouth:5, angle:15, variant:""   },
};

const ROOF_TYPES = {
  bitumen: { name: "Bitumen", mu: 0.69 },
  kies:    { name: "Kies / Gründach", mu: 0.67 },
  pvc:     { name: "PVC", mu: 0.60 },
  epdm:    { name: "EPDM", mu: 0.71 },
  beton:   { name: "Glatter Beton", mu: 0.65 }
};

const DATA = {
  constants: { gravity: 9.81, multiplier: 1.35, gravity_multiplier: 1, friction_slide: 0.7 },
  bg: {
    "K2N5": [
      ["Zone", 1, 2, 3, 4],
      ["vb0", 22.5, 25.0, 27.5, 30.0],
      ["", "", "", "", ""],
      [22.5, 25.0, 27.5, 30.0] // <- 4. Zeile als Zahlenreihe genutzt
    ],
    "K5O6": [
      ["Zone", 1, 2, 3, 4],
      [320, 390, 470, 560]
    ],
    "K11O18": [
      ["zmin",  2.0, 4.0, 8.0, 16.0],
      ["power in formula qp",   0.19, 0.24, 0.31, 0.40],
      ["factor wind pressure",  2.6,  2.1,  1.6,  1.1]
    ],
    "K11O22": [
      ["qp if z < zmin", 663, 663, 663, 663]
    ],
    "factor_at_zmin": [null, 1.9, 1.7, 1.5, 1.3]
  }
};

const FIXED_WIND_PRESSURE = {
  "1_1": 728.2, "1_2": 580.2, "1_3": 442.6, "1_4": 391.7,
  "2_1": 887.5, "2_2": 707.1, "2_3": 539.4, "2_4": 477.4,
  "3_1": 1069.6,"3_2": 852.1, "3_3": 650.1, "3_4": 575.4,
  "4_1": 1274.4,"4_2": 1015.3,"4_3": 774.6, "4_4": 685.5
};

module.exports = { STONES, ROOF_TYPES, DATA, FIXED_WIND_PRESSURE };
