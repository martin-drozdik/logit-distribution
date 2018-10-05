
function square(x)
{
    return x*x;
}



function convert_to_barycentric(x, y)
{
    f = 1.0 / Math.pow(3.0, 0.5);
    a = 1 - x - f*y;
    b = x - f*y;
    c = 2*f*y;
    return {a, b, c};
}



function logit_gaussian_density_barycentric(x, y, z, mx, my, rho, sx, sy)
{
    let det = square(sx)*square(sy) - square(rho);
    let factor = Math.sqrt(2*Math.PI*det)*x*y*z;
    let logx = Math.log(x / z) - mx;
    let logy = Math.log(y / z) - my;
    let exponent = (-1/2)*(1/det)*(square(logx*sy) -2*rho*logx*logy + square(logy*sx));
    return Math.exp(exponent) / factor;
}



function logit_gaussian_bivariate_density(x, y, mx, my, rho, sx, sy)
{
    let barycentric = convert_to_barycentric(x, y);
    let epsilon = 1e-6;
    function out_of_bounds(a){ return a < epsilon || a > 1 - epsilon; } 
    if (out_of_bounds(barycentric.a) || out_of_bounds(barycentric.b) || out_of_bounds(barycentric.c))
        return null;
    return logit_gaussian_density_barycentric(barycentric.a, barycentric.b, barycentric.c, mx, my, rho, sx, sy);
}



function gaussian_bivariate_density(x, y, mx, my, rho, sx, sy)
{
    let scaling_factor = 1 / (2*Math.PI*sx*sy*Math.sqrt(1 - square(rho)));
    let nx = (x - mx)/sx;
    let ny = (y - my)/sy;
    let exponent = (-1 / (2*(1 - square(rho)))) * (square(nx) + square(ny) -rho*nx*ny);
    return scaling_factor * Math.exp(exponent);
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
