const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const math = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../render.js'), 'utf8'), math);

function close(actual, expected, tolerance = 1e-12) {
    assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}

test('triangle vertices and centroid map to barycentric coordinates without globals', () => {
    for (const [x, y, expected] of [
        [0, 0, [1, 0, 0]], [1, 0, [0, 1, 0]],
        [0.5, Math.sqrt(3)/2, [0, 0, 1]],
        [0.5, Math.sqrt(3)/6, [1/3, 1/3, 1/3]],
    ]) {
        const { a, b, c } = math.convert_to_barycentric(x, y);
        [a, b, c].forEach((value, i) => close(value, expected[i]));
    }
    for (const key of ['a', 'b', 'c', 'f']) assert.equal(key in math, false);
});

test('Gaussian known values with unequal scales and nonzero correlation', () => {
    close(math.gaussian_bivariate_density(0, 0, 0, 0, 0, 2, 3), 1/(12*Math.PI));
    close(math.gaussian_bivariate_density(2, 3, 0, 0, 0.5, 2, 3),
        Math.exp(-2/3)/(12*Math.PI*Math.sqrt(0.75)));
    close(math.logit_gaussian_density_barycentric(1/3, 1/3, 1/3, 0, 0, 0.5, 2, 3),
        27/(12*Math.PI*Math.sqrt(0.75)));
});

test('invalid parameters and simplex boundaries are handled', () => {
    for (const [rho, sx, sy] of [[1, 1, 1], [-1, 1, 1], [0, 0, 1], [0, 1, -1], [NaN, 1, 1]])
        assert.throws(() => math.gaussian_bivariate_density(0, 0, 0, 0, rho, sx, sy), { name: 'RangeError' });
    assert.equal(math.logit_gaussian_density_barycentric(0, 0.5, 0.5, 0, 0, 0, 1, 1), null);
    assert.equal(math.logit_gaussian_density_barycentric(0.2, 0.2, 0.2, 0, 0, 0, 1, 1), null);
    assert.equal(math.logit_gaussian_bivariate_density(0, 0, 0, 0, 0, 1, 1), null);
});

test('plotted density numerically integrates to one on the triangle', () => {
    const n = 400;
    const dx = 1/n;
    const dy = Math.sqrt(3)/(2*n);
    for (const rho of [-0.5, 0, 0.5]) {
        let integral = 0;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                integral += (math.logit_gaussian_bivariate_density(
                    (j + 0.5)*dx, (i + 0.5)*dy, 0.2, -0.3, rho, 0.8, 1.2) ?? 0)*dx*dy;
            }
        }
        close(integral, 1, 0.002);
    }
});
