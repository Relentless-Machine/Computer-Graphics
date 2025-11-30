#version 300 es

// attribute每顶点各用的属性，IN variable
in vec4 vPosition; //顶点位置
in vec4 vColor;//顶点颜色

// uniform所用顶点公用的数据，IN variable
uniform int u_Flag;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform bool u_UseLambert;     // 是否启用兰伯特着色（仅太阳-地球）
uniform vec3 u_LightDir;       // 物体空间的光方向（已归一化）

// varying传递下去的变量，OUT varible
out vec4 fColor;
out float vShade;              // 光照强度（0~1）
out vec3 vObjDir;              // 物体空间方向（单位），用于程序纹理/条纹


// MVP初始为单位矩阵
mat4 MVP = mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0 
);

void main() {
    /*******************TODO:得到针对不同顶点的变换矩阵MVP****************
    //u_Flag == 1绘制物体，变换有模视变换（模型变换和视点变换）和投影变换：MVP
    //u_Flag == 0绘制坐标轴，变换有视点变换和投影变换：VP
    **************************************************************************/
    if(u_Flag == 1){ 
        MVP = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix; 
    }
    else{ // 绘制坐标轴，需要有视点变换和投影变换：VP
        MVP = u_ProjectionMatrix * u_ViewMatrix;
    }  

    //将MVP复合变换矩阵作用于该顶点计算坐标，以及传递顶点原色
    gl_Position = MVP * vPosition;     
    fColor = vColor;
    vObjDir = normalize(vPosition.xyz);

    // 缺省不使用光照
    vShade = 1.0;
    if (u_Flag == 1 && u_UseLambert) {
        // 使用世界空间的统一光照方向：将物体空间法线变换到世界空间
        // 对单位球，物体空间法线可用单位位置近似；对统一缩放，mat3(u_ModelMatrix)即可
        vec3 nObj = normalize(vPosition.xyz);
        vec3 nWorld = normalize(mat3(u_ModelMatrix) * nObj);
        float ndl = max(dot(nWorld, normalize(u_LightDir)), 0.0);
        float ambient = 0.20;
        vShade = clamp(ambient + ndl, 0.0, 1.0);
    }
}