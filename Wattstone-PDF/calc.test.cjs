// calc.test.cjs
const assert = require('assert');
const { compute } = require('./calc.cjs');

function isNum(x){ return typeof x === 'number' && Number.isFinite(x); }

function runCase(name, input) {
  const r = compute(input);
  console.log(name, JSON.stringify(r, null, 2));
  assert.equal(r.ok, true, `${name}: ok === true`);
  assert.ok(isNum(r.qp_char) && r.qp_char > 0, `${name}: qp_char > 0`);
  assert.ok(Array.isArray(r.groups) && r.groups.length > 0, `${name}: groups present`);
  r.groups.forEach((g,i) => {
    assert.ok(isNum(g.J), `${name}: group ${i+1} J numeric`);
    assert.ok(isNum(g.K), `${name}: group ${i+1} K numeric`);
  });
  return r;
}

try {
  // EW-Fall: 4 Gruppen, kein Deflektor
  const rEW = runCase('EW test', {
    orientation: 'EW',
    stone: '10V2',
    windZone: '2',
    terrain: 2,
    moduleH: 1.6,
    moduleW: 1.1,
    height: 10,
    moduleWeight: 0
  });
  assert.equal(rEW.groups.length, 4, 'EW: groups == 4');
  assert.equal(rEW.deflectorUsed, 0, 'EW: deflectorUsed == 0');

  // Süd-Fall: 7 Gruppen, Deflektor verwendet
  const rS = runCase('S test', {
    orientation: 'S',
    stone: '15',
    windZone: '2',
    terrain: 2,
    moduleH: 1.6,
    moduleW: 1.1,
    height: 10,
    moduleWeight: 0
  });
  assert.equal(rS.groups.length, 7, 'S: groups == 7');
  assert.ok(isNum(rS.deflectorUsed) && rS.deflectorUsed > 0, 'S: deflectorUsed > 0');

  console.log('✅ calc.test.cjs: all green');
} catch (e) {
  console.error('❌ calc.test.cjs failed:', e.message);
  process.exit(1);
}
