#version 300 es

precision mediump float;

in vec4 fColor;
in float vShade;
in vec3 vObjDir;
out vec4 fragColor;

uniform vec4 u_Color; // 新增的颜色 uniform
uniform bool u_UseUniformColor; // 用于切换颜色的标志
uniform bool u_UseEarthPattern; // 是否叠加地球条纹图案
uniform float u_PatternFreq;    // 条纹频率（每圈条数）
uniform int u_LongLines;        // 经线数量
uniform int u_LatLines;         // 纬线数量
uniform float u_LineWidth;      // 线宽（经纬参数空间中的宽度，建议0.005~0.02）

void
main()
{
    vec4 base = u_UseUniformColor ? u_Color : fColor;
    vec3 rgb = base.rgb;

    if (u_UseEarthPattern) {
        // 使用物体空间方向推导经纬度，生成经纬网白色线条（随自转转动）
        float PI = 3.14159265358979323846264;
        vec3 n = normalize(vObjDir);
        float lon = atan(n.z, n.x);          // [-pi, pi]
        float lat = asin(clamp(n.y, -1.0, 1.0)); // [-pi/2, pi/2]

        // 归一化到 [0,1]
        float u = lon / (2.0 * PI) + 0.5;   // 经度
        float v = (lat + 0.5 * PI) / PI;    // 纬度

        // 计算到最近经/纬线的参数距离
        float uDiv = float(max(u_LongLines, 1));
        float vDiv = float(max(u_LatLines, 1));
        float fu = fract(u * uDiv);
        float fv = fract(v * vDiv);
        float du = min(fu, 1.0 - fu);
        float dv = min(fv, 1.0 - fv);

        // 线宽，使用平滑过渡减少锯齿（注意线宽在参数空间中，不是屏幕像素）
        float w = max(u_LineWidth, 0.0005);
        float wu0 = w;
        float wu1 = w * 1.6; // 过渡带
        float wv0 = w;
        float wv1 = w * 1.6;

        float lineU = 1.0 - smoothstep(wu0, wu1, du);
        float lineV = 1.0 - smoothstep(wv0, wv1, dv);
        float grid = max(lineU, lineV);

        // 将白色网格线覆盖到受光照调制后的颜色上
        vec3 lit = rgb * vShade;
        rgb = mix(lit, vec3(1.0), clamp(grid, 0.0, 1.0));
    } else {
        rgb = rgb * vShade;
    }

    fragColor = vec4(rgb, base.a);
}
