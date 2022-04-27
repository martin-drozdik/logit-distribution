
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
    let r = rho / (sx * sy);
    let scaling_factor = 1 / (2*Math.PI*sx*sy*Math.sqrt(1 - square(r)));
    let nx = (x - mx)/sx;
    let ny = (y - my)/sy;
    let exponent = (-1 / (2*(1 - square(r)))) * (square(nx) + square(ny) -r*nx*ny);
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



function create_data(xvec, yvec, f)
{
    let result = [];
    for (let i = 0; i < yvec.length; ++i)
    {
        let line = [];
        for (let j = 0; j < xvec.length; ++j)
        {
            line.push(f(xvec[j], yvec[i]))
        }
        result.push(line);
    }
    return result;
}





function update_plot(min, max, f, name)
{
    let rho = r * s1 * s2;
    let x = linspace(min, max, 100);
    let y = linspace(min, max, 100);
    let z = create_data(x, y, f);
    let type = 'contour';
    Plotly.restyle(name, 
    {
        x: [x],
        y: [y],
        z: [z],
        type: 'surface',
        type: 'heatmap', zsmooth: 'best',
       // line: {'color':'rgba(0,0,0)'},
        colorscale: "Electric"
    });
}



function compute_dirichlet(x, y, a1, a2, a3)
{
    let barycentric = convert_to_barycentric(x, y);
    let epsilon = 1e-6;
    function out_of_bounds(a){ return a < epsilon || a > 1 - epsilon; } 
    if (out_of_bounds(barycentric.a) || out_of_bounds(barycentric.b) || out_of_bounds(barycentric.c))
        return null;

    let factor = gamma(a1+a2+a3) / (gamma(a1)*gamma(a2)*gamma(a3));

    return factor * Math.pow(barycentric.a, a1 - 1)*Math.pow(barycentric.b, a2 - 1)*Math.pow(barycentric.c, a3 - 1) 
}



function compute_dirichlet_ratio(x, y, a1, a2, a3)
{
    return compute_dirichlet(x, y, a1, a2, a3) / compute_dirichlet(x, y, a3, a1, a2)
}



window.onload = () => 
{
    var r = document.getElementById("r");
    var mi1 = document.getElementById("mi1");
    var mi2 = document.getElementById("mi2");
    var s1 = document.getElementById("s1");
    var s2 = document.getElementById("s2");


    var a1 = document.getElementById("a1");
    var a2 = document.getElementById("a2");
    var a3 = document.getElementById("a3");

    function update_both_plots()
    {
        update_plot(0, 1, (x,y) => logit_gaussian_bivariate_density(x,y, parseFloat(mi1.value), mi2.value, r.value, s1.value, s2.value), "graph-logit")
        update_plot(-5, 5, (x,y) => gaussian_bivariate_density(x, y,  mi1.value, mi2.value, r.value, s1.value, s2.value), "graph-normal")
        update_plot(0, 1, (x, y) => compute_dirichlet(x, y, parseFloat(a1.value), parseFloat(a2.value), parseFloat(a3.value)), "graph-dirichlet")
        update_plot(0, 1, (x, y) => compute_dirichlet_ratio(x, y, parseFloat(a1.value), parseFloat(a2.value), parseFloat(a3.value)), "graph-dirichlet-ratio")
    }

    a1.oninput = function()
    {
        update_both_plots();
        document.getElementById("a1_output").value = this.value;
    }

    a2.oninput = function()
    {
        update_both_plots();
        document.getElementById("a2_output").value = this.value;
    }

    a3.oninput = function()
    {
        update_both_plots();
        document.getElementById("a3_output").value = this.value;
    }

    r.oninput = function()
    {
        update_both_plots();
        document.getElementById("r_output").value = this.value;
    };

    mi1.oninput = function()
    {       
        update_both_plots();
        document.getElementById("mi1_output").value = this.value;
    };

    mi2.oninput = function()
    {       
        update_both_plots();
        document.getElementById("mi2_output").value = this.value;
    };

    s1.oninput = function()
    {       
        update_both_plots();
        document.getElementById("s1_output").value = this.value;
    };

    s2.oninput = function()
    {       
        update_both_plots();
        document.getElementById("s2_output").value = this.value;
    };
    

    let x = linspace(0, 1, 100);
    let y = linspace(0, 1, 100);
    let z = create_data(x, y, (x,y) => logit_gaussian_bivariate_density(x, y, 0, 0, 0, 1, 1));
    let type = 'contour';
    Plotly.newPlot('graph-normal', [{x, y, z, type}]);
    Plotly.newPlot('graph-logit', [{x, y, z, type}]);
    Plotly.newPlot('graph-dirichlet', [{x, y, z, type}]);
    Plotly.newPlot('graph-dirichlet-ratio', [{x, y, z, type}]);
};
