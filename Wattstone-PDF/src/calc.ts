import { Inputs, Outputs } from './types';
import { DATA, STONES, ROOF_TYPES, FIXED_WIND_PRESSURE } from './data';

const G = DATA.constants.gravity;                 // 9.81
const MULT = DATA.constants.multiplier;           // 1.35
const GMULT = DATA.constants.gravity_multiplier;  // 1
const FrDefault = DATA.constants.friction_slide;  // 0.7

const zmin_fn  = mkLookup('zmin', DATA.bg['K11O18']);
const pqp_fn   = mkLookup('power in formula qp', DATA.bg['K11O18']);
const fqp_fn   = mkLookup('factor wind pressure', DATA.bg['K11O18']);

function mkLookup(rowLabel: string, table: any[][]) {
  const r = table.findIndex((row) => typeof row[0] === 'string' && row[0].toLowerCase().includes(rowLabel));
  return (terrain: number) => table[r][terrain];
}

function qp50(vb0: number, z: number, terr: 1|2|3|4) {
  const qb0 = 0.613 * Math.pow(vb0, 2);
  const zmin = zmin_fn(terr);
  const p_qp = pqp_fn(terr);
  const f_qp = fqp_fn(terr);
  const zcalc = Math.max(zmin, z);
  const qp_pre = (f_qp * Math.pow(zcalc/10, p_qp)) * qb0;
  const qp_if  = DATA.bg['factor_at_zmin'][terr] * qb0;
  return Math.max(qp_pre, qp_if);
}

function pickRawKey(stone: Inputs['stone'], orientation: Inputs['orientation']) {
  if (orientation === 'EW') {
    if (stone === '15') return '15_east';
    if (stone === '0')  return '0_east';
    if (stone === '6')  return '6_east';
    if (stone === '10V1') return '10V1_east';
    if (stone === '10V2') return '10V2_east';
    if (stone === '10XL') return '10XL_east';
    return '10V2_east';
  } else {
    if (stone === '15') return '15_south';
    if (stone === '0')  return '0_south';
    if (stone === '6')  return '6_south';
    if (stone === '10V1') return '10V1_south';
    if (stone === '10V2') return '10V2_south';
    if (stone === '10XL') return '10XL_south';
    return '10V2_south';
  }
}

export function calc(inputs: Inputs): Outputs {
  const stone = STONES[inputs.stone];
  const area = Math.max(0.01, inputs.moduleH * inputs.moduleW);

  // vb0 aus Tabelle (deine K2N5)
  const vb0 = DATA.bg['K2N5'][3][Number(inputs.windZone) - 1];
  const qp_z = qp50(vb0, inputs.height, inputs.terrain);

  // Referenz-qp (fixe Map wie im Frontend)
  const qpRef = FIXED_WIND_PRESSURE[`${inputs.windZone}_${inputs.terrain}`] ?? null;

  // deflector-Regel wie bei dir
  const deflectorYes = (inputs.orientation === 'S') && ['10V1','10V2','10XL','15'].includes(inputs.stone);
  const combBallast = 1.5 * stone.base + inputs.moduleWeight + (deflectorYes ? stone.deflectorSouth : 0);

  // Cp-Max pro Gruppe aus deinen RAW-Arrays
  const rawKey = pickRawKey(inputs.stone, inputs.orientation);
  const source = DATA.raw[rawKey] || {};
  const groupKeys = Object.keys(source).filter(k => k.startsWith('Group_'));
  const cpMaxByGroup: number[] = groupKeys.map((g) => {
    const arr: number[] = source[g] || [];
    return Math.max(...arr.filter(v => typeof v === 'number' && isFinite(v)));
  });

  // J / K genau wie in compute()
  const Fr = FrDefault; // identisch zu deinem Default 0.7
  const groups = cpMaxByGroup.map((cpMax, idx) => {
    const groupNo = idx + 1;
    const I_base = cpMax * qp_z;
    const J = I_base / (GMULT * G) * MULT * area / Fr;
    const mult127 = [1,3,5,7].includes(groupNo) ? 1.27 : 1.0;
    const K = J - mult127 * combBallast;
    return { group: groupNo, jTotal: Math.round(J), kExtra: Math.round(K) };
  });

  const positives = groups.filter(g => g.kExtra >= 0);
  const allNegative = positives.length === 0;
  const maxPositiveK = allNegative ? null : Math.max(...positives.map(g => g.kExtra));

  return {
    qp50: qp_z, qpRef, vb0,
    groups, allNegative, maxPositiveK,
    deflector: deflectorYes, combBallast
  };
}
