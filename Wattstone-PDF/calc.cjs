// Wattstone-PDF/calc.cjs
'use strict';

// EINMALIGE Quelle aller Daten:
const { FIXED_WIND_PRESSURE, DATA, STONES, ROOF_TYPES } = require('./data.cjs');

// ---------- helpers ----------
function num(v) {
  if (v == null) return 0;
  return parseFloat(String(v).replace(',', '.')) || 0;
}
function clampPos(n, fallback) {
  n = Number(n);
  if (!isFinite(n) || n <= 0) return fallback;
  return n;
}
function roundInt(x){ return Math.round(Number(x) || 0); }

function terrain_lookup(row_label, table){
  let foundRow = -1;
  for(let r=0;r<table.length;r++){
    if(typeof table[r][0] === "string" && table[r][0].toLowerCase().includes(row_label)){
      foundRow = r;
    }
  }
  if(foundRow >= 0) {
    return function(terrain){
      return table[foundRow][terrain];
    }
  }
  return null;
}

const zmin_fn  = terrain_lookup("zmin", DATA.bg["K11O18"]);
const pqp_fn   = terrain_lookup("power in formula qp", DATA.bg["K11O18"]);
const fqp_fn   = terrain_lookup("factor wind pressure", DATA.bg["K11O18"]);

function makeGroupCoeffs(orientation) {
  if (orientation === 'EW') return [0.10, 0.12, 0.11, 0.09];   // 4 Gruppen
  return [0.14, 0.13, 0.12, 0.11, 0.10, 0.12, 0.13];          // 7 Gruppen
}

// ---------- compute ----------
function compute(input = {}) {
  try {
    const orientation = (input.orientation === 'S') ? 'S' : 'EW';
    const stoneKey    = String(input.stone || '10V2');
    const stone       = STONES[stoneKey] || STONES['10V2'];

    // clamp sizes
    const H  = clampPos(num(input.moduleH), 1.6);
    const W  = clampPos(num(input.moduleW), 1.1);
    const modW = Math.max(0, num(input.moduleWeight));
    const z  = clampPos(num(input.height), 10);
    const moduleArea = H * W;

    const areaZone = String(input.windZone || '2');                 // '1'..'4'
    const terr     = Math.max(1, Math.min(4, parseInt(input.terrain || 2,10)));
    const roofType = input.roofType || null;

    const Fr = clampPos(num(input.friction || DATA.constants.friction_slide), 0.7);

    // vb0 / qb0
    const vbRow = DATA.bg["K2N5"]?.[3];
    if (!vbRow) return { ok:false, error:"K2N5 row missing" };
    const vb0 = vbRow[Number(areaZone)-1];
    const qb0 = 0.613 * Math.pow(vb0, 2);

    // qp;50
    const _zmin = zmin_fn ? zmin_fn(terr) : 2;
    const p_qp  = pqp_fn  ? pqp_fn(terr)  : 0.24;
    const f_qp  = fqp_fn  ? fqp_fn(terr)  : 2.1;

    const zcalc = Math.max(_zmin, z);
    const factor_at_zmin = DATA.bg["factor_at_zmin"]?.[terr] ?? 1.9;

    const qp_pre = (f_qp * Math.pow(zcalc/10, p_qp)) * qb0;
    const qp_if  = factor_at_zmin * qb0;
    const qp_char = Math.max(qp_pre, qp_if);

    // deflector
    const deflectorYes = (orientation === 'S') && ['10V1','10V2','10XL','15'].includes(stoneKey);
    const deflector = deflectorYes ? stone.deflectorSouth : 0;

    // ballast baseline
    const B60_dyn  = 1.5 * stone.base + modW + deflector;

    // groups
    const coeffs = makeGroupCoeffs(orientation);
    const groups = [];
    let allNegative = true;
    let maxPositiveK = null;

    coeffs.forEach((c, i) => {
      const I_base = c * qp_char;
      const J = (I_base / (DATA.constants.gravity_multiplier * DATA.constants.gravity))
              * DATA.constants.multiplier * moduleArea / Fr;
      const groupNum = i + 1;
      const multiplier = ([1,3,5,7].includes(groupNum)) ? 1.27 : 1.0;
      const K = J - multiplier * B60_dyn;

      if (K >= 0) {
        allNegative = false;
        if (maxPositiveK === null || K > maxPositiveK) maxPositiveK = K;
      }

      groups.push({ group: groupNum, J: roundInt(J), K: roundInt(K) });
    });

    return {
      ok: true,
      input: {
        orientation, stone: stoneKey,
        moduleH: H, moduleW: W, moduleWeight: modW,
        height: z, windZone: areaZone, terrain: terr,
        roofType
      },
      moduleArea,
      vb0, qb0,
      qp_char,
      deflectorUsed: deflector,
      groups,
      allNegative,
      maxPositiveK
    };
  } catch (e) {
    return { ok:false, error: e && e.message ? e.message : String(e) };
  }
}

module.exports = { compute };
