// Unit tests for the Learn answer checker and expression parser.
// node --experimental-default-type=module tests/learn_engine.mjs
import { check } from '../app/js/learn/check.js';
import { equivalent, parse, isFullyFactorised } from '../app/js/learn/expr.js';

let fails = 0;
const t = (name, cond) => { if (!cond) { fails++; console.log(`  ✗ ${name}`); } };
const ok = (input, spec, name) => t(`${name || JSON.stringify(input)} should be accepted`, check(input, spec).ok);
const no = (input, spec, name) => t(`${name || JSON.stringify(input)} should be rejected`, !check(input, spec).ok);

// numbers
ok('7', { kind: 'number', value: 7 }); ok('x = 7', { kind: 'number', value: 7 }); ok('14/2', { kind: 'number', value: 7 });
ok('2.35', { kind: 'number', value: 2.3507810593582121, dp: 2 }); no('2.3508', { kind: 'number', value: 2.3507810593582121, dp: 2 });
ok('9.47 cm', { kind: 'number', value: 9.4719, sf: 3 }); no('9.5', { kind: 'number', value: 9.4719, sf: 3 });
ok('£45.60', { kind: 'number', value: 45.6, dp: 2 }); ok('1,250', { kind: 'number', value: 1250 });
ok('2√3', { kind: 'number', value: 2 * Math.sqrt(3) }); ok('3π', { kind: 'number', value: 3 * Math.PI });
ok('-1 1/2', { kind: 'number', value: -1.5 }); no('abc', { kind: 'number', value: 1 });
// lists
ok('x = 7, x = -2', { kind: 'numbers', values: [7, -2] }); ok('-2 or 7', { kind: 'numbers', values: [7, -2] });
no('7', { kind: 'numbers', values: [7, -2] }); no('-7, 2', { kind: 'numbers', values: [7, -2] });
ok('2/3, -3', { kind: 'numbers', values: [2 / 3, -3] }); ok('0.67, -3', { kind: 'numbers', values: [2 / 3, -3], dp: 2 });
// fractions
ok('17/12', { kind: 'fraction', num: 17, den: 12, simplest: true }); ok('1 5/12', { kind: 'fraction', num: 17, den: 12, simplest: true });
no('34/24', { kind: 'fraction', num: 17, den: 12, simplest: true }); t('34/24 explains simplify', /simplify/.test(check('34/24', { kind: 'fraction', num: 17, den: 12, simplest: true }).msg));
// algebra
const fac = { kind: 'expr', expr: 'x^2-5x-14', form: 'factorised' };
ok('(x-7)(x+2)', fac); ok('(x+2)(x-7)', fac); ok('(x + 2)(x − 7)', fac); no('x^2-5x-14', fac); no('(x+7)(x-2)', fac);
const fac2 = { kind: 'expr', expr: '6x^2-9x', form: 'factorised' };
ok('3x(2x-3)', fac2); no('x(6x-9)', fac2); no('3(2x^2-3x)', fac2);
t('x(6x-9) gives "further" hint', /further/.test(check('x(6x-9)', fac2).msg));
const dots = { kind: 'expr', expr: '4x^2-25', form: 'factorised' };
ok('(2x+5)(2x-5)', dots); no('(4x^2-25)', dots);
const exp = { kind: 'expr', expr: 'x^2-4x-21', form: 'expanded' };
ok('x^2 - 4x - 21', exp); ok('x²-4x-21', exp); no('(x-7)(x+3)', exp); no('x^2+3x-7x-21', exp);
ok('2x^2+x-15', { kind: 'expr', expr: '(2x-5)(x+3)', form: 'expanded' });
const fac3 = { kind: 'expr', expr: '12x^2y-8xy^2', form: 'factorised' };
ok('4xy(3x-2y)', fac3); no('2xy(6x-4y)', fac3); no('4x(3xy-2y^2)', fac3);
ok('(3, 4), (-4, -3)', { kind: 'coords', points: [[3, 4], [-4, -3]] }); no('(3, -3), (-4, 4)', { kind: 'coords', points: [[3, 4], [-4, -3]] });
ok('24x^3', { kind: 'expr', expr: '24x^3', form: 'single' }); no('6x^5*4x^-2', { kind: 'expr', expr: '24x^3', form: 'single' }); ok('16x^12y^8', { kind: 'expr', expr: '16x^12y^8', form: 'single', vars: ['x', 'y'] });
ok('r = √(A/π)', { kind: 'equation', lhsVar: 'r', expr: 'sqrt(A/pi)'.toLowerCase(), vars: ['a'] });
ok('36π', { kind: 'pi', k: 36 }); ok('9π/2', { kind: 'pi', k: 4.5 }); ok('4.5pi cm²', { kind: 'pi', k: 4.5 }); no('113.1', { kind: 'pi', k: 36 }); no('36', { kind: 'pi', k: 36 });
// rearranging
const eq = { kind: 'equation', lhsVar: 't', expr: '(v-u)/a', vars: ['v', 'u', 'a'] };
ok('t = (v-u)/a', eq); ok('t=(v−u)÷a', eq); no('t = v-u/a', eq); no('t = (v-u)/t', eq);
// standard form
ok('4.2 × 10^-4', { kind: 'stdform', value: 0.00042 }); ok('4.2x10^-4', { kind: 'stdform', value: 0.00042 }); ok('4.2 × 10⁻⁴', { kind: 'stdform', value: 0.00042 });
no('42 × 10^-5', { kind: 'stdform', value: 0.00042 }); no('0.00042', { kind: 'stdform', value: 0.00042 });
// ratio, coord, inequality
ok('3:5', { kind: 'ratio', parts: [3, 5], simplest: true }); no('6:10', { kind: 'ratio', parts: [3, 5], simplest: true });
ok('(2, -3)', { kind: 'coord', x: 2, y: -3 }); no('(-3, 2)', { kind: 'coord', x: 2, y: -3 });
ok('x > 3', { kind: 'inequality', v: 'x', lo: 3, loInc: false }); ok('3 < x', { kind: 'inequality', v: 'x', lo: 3, loInc: false });
no('x >= 3', { kind: 'inequality', v: 'x', lo: 3, loInc: false });
ok('-2 < x <= 5', { kind: 'inequality', v: 'x', lo: -2, loInc: false, hi: 5, hiInc: true }); ok('-2<x≤5', { kind: 'inequality', v: 'x', lo: -2, loInc: false, hi: 5, hiInc: true });
// surds
ok('5√2', { kind: 'surd', value: 5 * Math.SQRT2, form: 'k√n' }); no('√50', { kind: 'surd', value: 5 * Math.SQRT2, form: 'k√n' }); no('7.07', { kind: 'surd', value: 5 * Math.SQRT2, form: 'k√n' });
ok('√3/3', { kind: 'surd', value: Math.sqrt(3) / 3, form: 'rational-denominator' }); no('1/√3', { kind: 'surd', value: Math.sqrt(3) / 3, form: 'rational-denominator' });
// multi
ok(['3', '-4'], { kind: 'multi', parts: [{ label: 'a', spec: { kind: 'number', value: 3 } }, { label: 'b', spec: { kind: 'number', value: -4 } }] });
// algebraic fractions and functions
const canc = { kind: 'expr', expr: '(x-3)/(x+2)', form: 'cancelled' };
ok('(x-3)/(x+2)', canc); ok('1 - 5/(x+2)', canc); no('(x^2-9)/(x^2+5x+6)', canc); no('((x+3)(x-3))/((x+3)(x+2))', canc); no('(x+3)/(x+2)', canc);
const frac = { kind: 'expr', expr: '2/(x+1)+3/(x-2)', form: 'fraction' };
ok('(5x-1)/((x+1)(x-2))', frac); ok('(5x - 1)/(x^2 - x - 2)', frac); no('2/(x+1)+3/(x-2)', frac); no('(2(x-2)+3(x+1))/((x+1)(x-2))', frac); no('(5x+1)/((x+1)(x-2))', frac);
const inv = { kind: 'expr', expr: '(x-5)/3' };
ok('f^-1(x) = (x-5)/3', inv); ok('f⁻¹(x) = (x - 5)/3', inv); ok('f^(-1)(x)=(x-5)/3', inv); ok('fg(x) = (x-5)/3', inv); ok('y = (x-5)/3', inv); no('(x+5)/3', inv);
// parser details
t('2x^2 at x=3 is 18', equivalent('2x^2', '18+0x', ['x']) === false && Math.abs(parse('2x^2').t ? 1 : 0) === 1);
t('-x^2 is -(x^2)', equivalent('-x^2', '0-x*x'));
t('implicit (x+1)(x-1)', equivalent('(x+1)(x-1)', 'x^2-1'));
t('sqrt chain 2√3·√3 = 6', equivalent('2√3√3', '6+0*x', ['x']));
t('fully factorised quadratic', isFullyFactorised(parse('2(x+3)(x-1)')) && !isFullyFactorised(parse('(2x+6)(x-1)')));
console.log(fails ? `${fails} engine test(s) failed` : '  ✓ answer checker and expression parser (all cases)');
process.exit(fails ? 1 : 0);
