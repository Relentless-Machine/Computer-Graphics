var points = []; //顶点的属性：坐标数组
var colors = []; //顶点的属性：颜色数组

const VertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 0.0, 0.5, 0.0, 1.0 ),  // light-green        
    vec4( 0.0, 0.0, 0.5, 1.0 ),  // light-blue
    vec4( 0.5, 0.0, 0.0, 1.0 ),  // light-red
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.5, 0.5, 0.5, 1.0 )   // grey
];// 常量颜色

/****************************************************
 * 坐标轴模型：X轴，Y轴，Z轴的顶点位置和颜色,(-1,1)范围内定义 
 ****************************************************/
function vertextsXYZ()
{
    const len = 0.9;
    var XYZaxis = [
        vec4(-len,  0.0,  0.0, 1.0), // X
        vec4( len,  0.0,  0.0, 1.0),
        vec4( len, 0.0, 0.0, 1.0),
        vec4(len-0.01, 0.01, 0.0, 1.0),
        vec4(len, 0.0, 0.0, 1.0),
        vec4(len-0.01, -0.01, 0.0, 1.0),
        
        vec4( 0.0, -len,  0.0, 1.0), // Y
        vec4( 0.0,  len,  0.0, 1.0),
        vec4( 0.0, len,0.0, 1.0),
        vec4(0.01, len-0.01, 0.0, 1.0),
        vec4(0.0, len, 0.0, 1.0),
        vec4(-0.01, len-0.01, 0.0, 1.0),
        
        vec4( 0.0,  0.0, -len, 1.0), // Z
        vec4( 0.0,  0.0,  len, 1.0),
        vec4( 0.0, 0.0, len, 1.0),
        vec4( 0.01, 0.0,  len-0.01, 1.0),
        vec4( 0.0, 0.0, len, 1.0),
        vec4( -0.01,0.0,  len-0.01, 1.0)
    ];
    
    var XYZColors = [
        vec4(1.0, 0.0, 0.0, 1.0),  // red
        vec4(0.0, 1.0, 0.0, 1.0),  // green
        vec4(0.0, 0.0, 1.0, 1.0),  // blue
    ];
    
    for (var i = 0; i < XYZaxis.length; i++){    
        points.push(XYZaxis[i]);
        var j = Math.trunc(i/6); // JS取整运算Math.trunc//每个方向轴用6个顶点
        colors.push(XYZColors[j]);
    }
}

/****************************************************
 * 立方体模型生成
 ****************************************************/
function generateCube()
{
    quad( 1, 0, 3, 2 ); //Z正-前
    quad( 4, 5, 6, 7 ); //Z负-后
    
    quad( 2, 3, 7, 6 ); //X正-右
    quad( 5, 4, 0, 1 ); //X负-左
    
    quad( 6, 5, 1, 2 ); //Y正-上
    quad( 3, 0, 4, 7 ); //Y负-下
} 

function quad(a, b, c, d) 
{
	const vertexMC = 0.5; // 顶点分量X,Y,Z到原点距离
    var vertices = [
        vec4( -vertexMC, -vertexMC,  vertexMC, 1.0 ), //Z正前面左下角点V0，顺时针四点0~3
        vec4( -vertexMC,  vertexMC,  vertexMC, 1.0 ),
        vec4(  vertexMC,  vertexMC,  vertexMC, 1.0 ),
        vec4(  vertexMC, -vertexMC,  vertexMC, 1.0 ),
        vec4( -vertexMC, -vertexMC, -vertexMC, 1.0 ),   //Z负后面左下角点V4，顺时针四点4~7
        vec4( -vertexMC,  vertexMC, -vertexMC, 1.0 ),
        vec4(  vertexMC,  vertexMC, -vertexMC, 1.0 ),
        vec4(  vertexMC, -vertexMC, -vertexMC, 1.0 )
    ];

    var indices = [ a, b, c, a, c, d ];
    for ( var i = 0; i < indices.length; ++i ) {
        points.push(vertices[indices[i]]);  // 保存一个顶点坐标到定点给数组vertices中        
        colors.push(VertexColors[a]); // 立方体每面为单色
    }
}

/****************************************************
 * 球体模型生成：由四面体递归生成
 ****************************************************/
function generateSphere(){
    // 细分次数和顶点
    const numTimesToSubdivide = 5; // 球体细分次数
    var va = vec4(0.0, 0.0, -1.0, 1.0);
    var vb = vec4(0.0, 0.942809, 0.333333, 1.0);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1.0);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1.0);
    
    function triangle(a, b, c) {
        points.push(a);
        points.push(b);
        points.push(c);
        
        colors.push(vec4(0.0, 1.0, 1.0, 1.0));
        colors.push(vec4(1.0, 0.0, 1.0, 1.0));
        colors.push(vec4(0.0, 1.0, 0.0, 1.0));
    };

    function divideTriangle(a, b, c, count) {
        if ( count > 0 ) {
            var ab = mix( a, b, 0.5);
            var ac = mix( a, c, 0.5);
            var bc = mix( b, c, 0.5);

            ab = normalize(ab, true);
            ac = normalize(ac, true);
            bc = normalize(bc, true);

            divideTriangle(  a, ab, ac, count - 1 );
            divideTriangle( ab,  b, bc, count - 1 );
            divideTriangle( bc,  c, ac, count - 1 );
            divideTriangle( ab, bc, ac, count - 1 );
        }
        else {
            triangle( a, b, c );
        }
    }

    function tetrahedron(a, b, c, d, n) {
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
    };

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide); // 递归细分生成球体
}

/****************************************************
* TODO1: 墨西哥帽模型生成，等距细分得z,x，函数计算得到y
****************************************************/
function generateHat()
{
    
    // 这里(x,z)是区域（-1，-1）到（1，1）平均划分成nRows*nColumns得到的交点坐标；
    var nRows = 11; // 线数，实际格数=nRows-1,
    var nColumns = 11; // 线数,实际格数=nColumns-1

    // 嵌套数组data用于存储网格上交叉点的高值(y)值。
    var data = new Array(nRows);
    for(var i = 0; i < nRows; i++) {
        data[i] = new Array(nColumns);
    };
    var xStep = 2.0 / (nColumns - 1);
    var zStep = 2.0 / (nRows - 1);
    // Sombrero 参数
    var A = 0.6;   // 振幅（帽子高度）
    var k = 6.0;   // 频率（环数）

    // 遍历网格上每个点，求点的高度(即Y值)
    for (var row = 0; row < nRows; row++) {
        var z = -1.0 + row * zStep;
        for (var col = 0; col < nColumns; col++) {
            var x = -1.0 + col * xStep;
            var r2 = x * x + z * z;
            var r = Math.sqrt(r2);
            // Sombrero/sinc 形状：y = A * sin(k*r) / (k*r), r->0 取极限 A
            var height = (r < 1e-6) ? A : (A * Math.sin(k * r) / (k * r));
            data[row][col] = height;
        }
    }

    function mixColor(c1, c2, t) {
        var tt = Math.max(0.0, Math.min(1.0, t));
        return vec4(
            c1[0] * (1.0 - tt) + c2[0] * tt,
            c1[1] * (1.0 - tt) + c2[1] * tt,
            c1[2] * (1.0 - tt) + c2[2] * tt,
            1.0
        );
    }

    function colorFromHeight(height, x, z) {
        var t = Math.max(0.0, Math.min(1.0, (height + A) / (2.0 * A)));

        var palette = [
            vec4(0.30, 0.00, 0.60, 1.0), // deep purple-blue
            vec4(0.00, 0.70, 0.90, 1.0), // cyan
            vec4(0.10, 0.80, 0.35, 1.0), // green
            vec4(0.95, 0.85, 0.20, 1.0), // yellow
            vec4(0.90, 0.20, 0.20, 1.0)  // red
        ];

        var breaks = [0.45, 0.70, 0.85, 0.95];

        var seg = 0;
        var t0 = 0.0;
        var t1 = breaks[0];
        if (t < breaks[0]) { seg = 0; t0 = 0.0;        t1 = breaks[0]; }
        else if (t < breaks[1]) { seg = 1; t0 = breaks[0]; t1 = breaks[1]; }
        else if (t < breaks[2]) { seg = 2; t0 = breaks[1]; t1 = breaks[2]; }
        else if (t < breaks[3]) { seg = 3; t0 = breaks[2]; t1 = breaks[3]; }
        else { seg = 4; t0 = breaks[3]; t1 = 1.0; }

        var u = (t1 > t0) ? (t - t0) / (t1 - t0) : 0.0;
        u = Math.max(0.0, Math.min(1.0, u));
        return mixColor(palette[seg], palette[Math.min(seg + 1, palette.length - 1)], u);
    }

    // 顶点数据按每四个片元构成一个四边形网格图元
    for (var i = 0; i < nRows - 1; i++) {
        var z0 = -1.0 + i * zStep;
        var z1 = -1.0 + (i + 1) * zStep;
        for (var j = 0; j < nColumns - 1; j++) {
            var x0 = -1.0 + j * xStep;
            var x1 = -1.0 + (j + 1) * xStep;

            var y00 = data[i][j];
            var y10 = data[i + 1][j];
            var y01 = data[i][j + 1];
            var y11 = data[i + 1][j + 1];

            var v00 = vec4(x0, y00, z0, 1.0);
            var v10 = vec4(x0, y10, z1, 1.0);
            var v01 = vec4(x1, y01, z0, 1.0);
            var v11 = vec4(x1, y11, z1, 1.0);

            var c00 = colorFromHeight(y00, x0, z0);
            var c10 = colorFromHeight(y10, x0, z1);
            var c01 = colorFromHeight(y01, x1, z0);
            var c11 = colorFromHeight(y11, x1, z1);

            // 三角形1
            points.push(v00);
            colors.push(c00);
            points.push(v10);
            colors.push(c10);
            points.push(v01);
            colors.push(c01);

            // 三角形2
            points.push(v10);
            colors.push(c10);
            points.push(v11);
            colors.push(c11);
            points.push(v01);
            colors.push(c01);
        }
    }
}




