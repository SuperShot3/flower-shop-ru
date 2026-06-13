/**
 * Simple assertions for delivery fee rules.
 * Run with: npx tsx lib/deliveryFees.test.ts (or add to test script).
 */

import { calcDeliveryFeeRUB, detectDistrictFromAddress, DISTRICTS } from './deliveryFees';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// Minimum fee — Uralmash / Ordzhonikidzevsky
assert(calcDeliveryFeeRUB({ district: 'ORDZHONIKIDZEVSKY' }) === 300, 'Ordzhonikidzevsky = 300');
assert(calcDeliveryFeeRUB({ district: 'ZHELEZNODOROZHNY' }) === 300, 'Zheleznodorozhny = 300');

// 350 RUB districts
assert(calcDeliveryFeeRUB({ district: 'VERKH_ISETSKY' }) === 350, 'Verkh-Isetsky = 350');
assert(calcDeliveryFeeRUB({ district: 'KIROVSKY' }) === 350, 'Kirovsky = 350');
assert(calcDeliveryFeeRUB({ district: 'LENINSKY' }) === 350, 'Leninsky = 350');

// 400 RUB districts
assert(calcDeliveryFeeRUB({ district: 'CHKALOVSKY' }) === 400, 'Chkalovsky = 400');
assert(calcDeliveryFeeRUB({ district: 'VIZ' }) === 400, 'VIZ = 400');

// 450 RUB districts
assert(calcDeliveryFeeRUB({ district: 'AKADEMICHESKY' }) === 450, 'Akademichesky = 450');
assert(calcDeliveryFeeRUB({ district: 'SOLNECHNY' }) === 450, 'Solnechny = 450');

// Satellite cities
assert(calcDeliveryFeeRUB({ district: 'VERKHNYAYA_PYSHMA' }) === 400, 'Verkhnyaya Pyshma = 400');
assert(calcDeliveryFeeRUB({ district: 'BEREZOVSKY' }) === 450, 'Berezovsky = 450');
assert(calcDeliveryFeeRUB({ district: 'ARAMIL' }) === 500, 'Aramil = 500');
assert(calcDeliveryFeeRUB({ district: 'PERVOURALSK' }) === 550, 'Pervouralsk = 550');
assert(calcDeliveryFeeRUB({ district: 'UNKNOWN' }) === 500, 'Unknown = 500');

// Auto-detect
assert(detectDistrictFromAddress('ул. Уралмаш, 12') === 'ORDZHONIKIDZEVSKY', 'Uralmash -> Ordzhonikidzevsky');
assert(detectDistrictFromAddress('Верхняя Пышма, ул. Ленина') === 'VERKHNYAYA_PYSHMA', 'Verkhnyaya Pyshma');
assert(detectDistrictFromAddress('Первоуральск') === 'PERVOURALSK', 'Pervouralsk');
assert(detectDistrictFromAddress('random address') === null, 'No match -> null');

// Districts array
assert(DISTRICTS.length >= 10, 'DISTRICTS has options');

console.log('✓ All delivery fee assertions passed');
process.exit(0);
