var Calc = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // calc.cjs
  var require_calc = __commonJS({
    "calc.cjs"(exports, module) {
      var STONES = {
        "0": { name: "Wattstone 0\xB0", base: 43, deflectorSouth: 3, angle: 0, variant: "" },
        "6": { name: "Wattstone 6\xB0", base: 48, deflectorSouth: 3, angle: 6, variant: "" },
        "10V1": { name: "Wattstone 10\xB0 V1", base: 24, deflectorSouth: 3, angle: 10, variant: "V1" },
        "10V2": { name: "Wattstone 10\xB0 V2", base: 25, deflectorSouth: 3, angle: 10, variant: "V2" },
        "10XL": { name: "Wattstone 10\xB0 XL", base: 34, deflectorSouth: 5, angle: 10, variant: "XL" },
        "15": { name: "Wattstone 15\xB0", base: 26, deflectorSouth: 5, angle: 15, variant: "" }
      };
      var DATA = {
        constants: { gravity: 9.81, multiplier: 1.35, gravity_multiplier: 1, friction_slide: 0.7 },
        bg: {
          "K2N5": [
            ["Zone", 1, 2, 3, 4],
            ["vb0", 22.5, 25, 27.5, 30],
            ["", "", "", "", ""],
            [22.5, 25, 27.5, 30]
          ],
          "K5O6": [
            ["Zone", 1, 2, 3, 4],
            [320, 390, 470, 560]
          ],
          "K11O18": [
            ["zmin", 2, 4, 8, 16],
            ["power in formula qp", 0.19, 0.24, 0.31, 0.4],
            ["factor wind pressure", 2.6, 2.1, 1.6, 1.1]
          ],
          "K11O22": [
            ["qp if z < zmin", 663, 663, 663, 663]
          ],
          "factor_at_zmin": [null, 1.9, 1.7, 1.5, 1.3]
        }
      };
      function num(v) {
        if (v == null) return 0;
        return parseFloat(String(v).replace(",", ".")) || 0;
      }
      function clampPos(n, fallback) {
        n = Number(n);
        if (!isFinite(n) || n <= 0) return fallback;
        return n;
      }
      function roundInt(x) {
        return Math.round(Number(x) || 0);
      }
      function terrain_lookup(row_label, table) {
        let foundRow = -1;
        for (let r = 0; r < table.length; r++) {
          if (typeof table[r][0] === "string" && table[r][0].toLowerCase().includes(row_label)) {
            foundRow = r;
          }
        }
        if (foundRow >= 0) {
          return function(terrain) {
            return table[foundRow][terrain];
          };
        }
        return null;
      }
      var zmin_fn = terrain_lookup("zmin", DATA.bg["K11O18"]);
      var pqp_fn = terrain_lookup("power in formula qp", DATA.bg["K11O18"]);
      var fqp_fn = terrain_lookup("factor wind pressure", DATA.bg["K11O18"]);
      function makeGroupCoeffs(orientation) {
        if (orientation === "EW") return [0.1, 0.12, 0.11, 0.09];
        return [0.14, 0.13, 0.12, 0.11, 0.1, 0.12, 0.13];
      }
      function compute(input = {}) {
        try {
          const orientation = input.orientation === "S" ? "S" : "EW";
          const stoneKey = String(input.stone || "10V2");
          const stone = STONES[stoneKey] || STONES["10V2"];
          const H = clampPos(num(input.moduleH), 1.6);
          const W = clampPos(num(input.moduleW), 1.1);
          const modW = Math.max(0, num(input.moduleWeight));
          const z = clampPos(num(input.height), 10);
          const moduleArea = H * W;
          const areaZone = String(input.windZone || "2");
          const terr = Math.max(1, Math.min(4, parseInt(input.terrain || 2, 10)));
          const roofType = input.roofType || null;
          const Fr = clampPos(num(input.friction || DATA.constants.friction_slide), 0.7);
          const vbRow = DATA.bg["K2N5"]?.[3];
          if (!vbRow) return { ok: false, error: "K2N5 row missing" };
          const vb0 = vbRow[Number(areaZone) - 1];
          const qb0 = 0.613 * Math.pow(vb0, 2);
          const _zmin = zmin_fn ? zmin_fn(terr) : 2;
          const p_qp = pqp_fn ? pqp_fn(terr) : 0.24;
          const f_qp = fqp_fn ? fqp_fn(terr) : 2.1;
          const zcalc = Math.max(_zmin, z);
          const factor_at_zmin = DATA.bg["factor_at_zmin"]?.[terr] ?? 1.9;
          const qp_pre = f_qp * Math.pow(zcalc / 10, p_qp) * qb0;
          const qp_if = factor_at_zmin * qb0;
          const qp_char = Math.max(qp_pre, qp_if);
          const deflectorYes = orientation === "S" && ["10V1", "10V2", "10XL", "15"].includes(stoneKey);
          const deflector = deflectorYes ? stone.deflectorSouth : 0;
          const B60_dyn = 1.5 * stone.base + modW + deflector;
          const coeffs = makeGroupCoeffs(orientation);
          const groups = [];
          let allNegative = true;
          let maxPositiveK = null;
          coeffs.forEach((c, i) => {
            const I_base = c * qp_char;
            const J = I_base / (DATA.constants.gravity_multiplier * DATA.constants.gravity) * DATA.constants.multiplier * moduleArea / Fr;
            const groupNum = i + 1;
            const multiplier = [1, 3, 5, 7].includes(groupNum) ? 1.27 : 1;
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
              orientation,
              stone: stoneKey,
              moduleH: H,
              moduleW: W,
              moduleWeight: modW,
              height: z,
              windZone: areaZone,
              terrain: terr,
              roofType
            },
            moduleArea,
            vb0,
            qb0,
            qp_char,
            deflectorUsed: deflector,
            groups,
            allNegative,
            maxPositiveK
          };
        } catch (e) {
          return { ok: false, error: e && e.message ? e.message : String(e) };
        }
      }
      module.exports = { compute };
      if (__require.main === module) {
        console.log("Self-check EW/10V2:", compute({ orientation: "EW", stone: "10V2", windZone: "2", terrain: 2, moduleH: 1.6, moduleW: 1.1, height: 10, moduleWeight: 0 }));
        console.log("Self-check S/15:", compute({ orientation: "S", stone: "15", windZone: "2", terrain: 2, moduleH: 1.6, moduleW: 1.1, height: 10, moduleWeight: 0 }));
      }
    }
  });
  return require_calc();
})();
