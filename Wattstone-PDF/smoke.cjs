const { compute } = require('./calc.cjs');

const res = compute({
  orientation: 'EW',
  stone: '10V2',
  moduleH: 1.7,
  moduleW: 1.1,
  moduleWeight: 25,
  height: 10,
  windZone: 2,
  terrain: 2,
  fr: 0.7,
  roofType: 'bitumen'
});

console.dir(res, { depth: null, colors: true });