
window.onload = () => 
{
    var slider = document.getElementById("start");

    slider.oninput = function()
    {
        update_plot(this.value/10)
    };
    

    let x = linspace(0, 1, 100);
    let y = linspace(0, 1, 100);
    let z = create_data(x, y, 0);
    let type = 'contour';
    Plotly.newPlot('graph', [{x, y, z, type}]);
    update_plot(0.5);
};




function square(x)
{
    return x*x;
}



function convert_to_barycentric(x, y)
{
    const f = 1 / Math.sqrt(3);
    const a = 1 - x - f*y;
    const b = x - f*y;
    const c = 2*f*y;
    return {a, b, c};
}



function logit_gaussian_density_barycentric(x, y, z, mx, my, rho, sx, sy)
{
    validate_gaussian_parameters(mx, my, rho, sx, sy);
    if (![x, y, z].every(value => Number.isFinite(value) && value > 0)
        || Math.abs(x + y + z - 1) > 1e-12)
        return null;
    // Density with respect to dx dy on the simplex (z = 1 - x - y).
    // The additive log-ratio transform has absolute Jacobian 1 / (x*y*z).
    const logDensity = gaussian_bivariate_log_density(
        Math.log(x) - Math.log(z), Math.log(y) - Math.log(z), mx, my, rho, sx, sy);
    return Math.exp(logDensity - Math.log(x) - Math.log(y) - Math.log(z));
}



function logit_gaussian_bivariate_density(x, y, mx, my, rho, sx, sy)
{
    let barycentric = convert_to_barycentric(x, y);
    function out_of_bounds(a){ return !Number.isFinite(a) || a <= 0 || a >= 1; }
    if (out_of_bounds(barycentric.a) || out_of_bounds(barycentric.b) || out_of_bounds(barycentric.c))
        return null;
    // Convert the simplex density to density per unit area in the plotted plane.
    // |det d(a,b)/d(x,y)| = 2 / sqrt(3).
    return (2 / Math.sqrt(3)) * logit_gaussian_density_barycentric(barycentric.a, barycentric.b, barycentric.c, mx, my, rho, sx, sy);
}



function gaussian_bivariate_density(x, y, mx, my, rho, sx, sy)
{
    return Math.exp(gaussian_bivariate_log_density(x, y, mx, my, rho, sx, sy));
}

// rho is correlation; covariance is rho*sx*sy in both distributions.
function validate_gaussian_parameters(mx, my, rho, sx, sy)
{
    if (![mx, my, rho, sx, sy].every(Number.isFinite)
        || sx <= 0 || sy <= 0 || Math.abs(rho) >= 1)
        throw new RangeError('Means must be finite, standard deviations positive, and correlation strictly between -1 and 1.');
}

function gaussian_bivariate_log_density(x, y, mx, my, rho, sx, sy)
{
    validate_gaussian_parameters(mx, my, rho, sx, sy);
    const nx = (x - mx) / sx;
    const ny = (y - my) / sy;
    const variance = (1 - rho) * (1 + rho);
    // Equivalent to nx² - 2*rho*nx*ny + ny², with less cancellation.
    const quadratic = square(nx - rho*ny) / variance + square(ny);
    return -Math.log(2*Math.PI) - Math.log(sx) - Math.log(sy)
        - 0.5*Math.log(variance) - 0.5*quadratic;
}



function linspace(min, max, nsteps)
{
    let result = []
    let step = (max - min) / nsteps
    for (let i = 0; i < nsteps; ++i)
    {
        result.push(min + i*step);
    }
    return result;
}



function create_data(xvec, yvec, rho)
{
    let result = [];
    for (let i = 0; i < yvec.length; ++i)
    {
        let line = [];
        for (let j = 0; j < xvec.length; ++j)
        {
            line.push(logit_gaussian_bivariate_density(xvec[j], yvec[i], 0, 0, rho, 1, 1))
        }
        result.push(line);
    }
    return result;
}



function update_plot(rho)
{
    let x = linspace(0, 1, 100);
    let y = linspace(0, 1, 100);
    let z = create_data(x, y, rho);
    let type = 'contour';
    Plotly.restyle('graph', 
    {
        x: [x],
        y: [y],
        z: [z],
        type: type,
        contours: {'coloring':'heatmap', 'showlines':false},
        line: {'color':'rgba(0,0,0)'},
        colorscale: "Electric"
    });
}




