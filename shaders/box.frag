#version 300 es
precision mediump float;

out vec4 FragColor;

uniform float ambientStrength, specularStrength, diffuseStrength,shininess;

in vec3 Normal;//法向量
in vec3 FragPos;//相机观察的片元位置
in vec2 TexCoord;//纹理坐标
in vec4 FragPosLightSpace;//光源观察的片元位置

uniform vec3 viewPos;//相机位置
uniform vec4 u_lightPosition; //光源位置	
uniform vec3 lightColor;//入射光颜色

uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform samplerCube cubeSampler;//盒子纹理采样器

// 特效开关 Uniforms
uniform bool enableMirror;
uniform bool enableBump;
uniform bool enableFloorBump;
uniform bool enableTranslucency;
uniform bool enableFog;
uniform bool enablePCF;
uniform int objectId; // 1=Cube, 2=Floor

float shadowCalculation(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir)
{
    float shadow=0.0;  //非阴影
    /*TODO3: 添加阴影计算，返回1表示是阴影，返回0表示非阴影*/
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;
    
    float currentDepth = projCoords.z;
    float bias = max(0.01 * (1.0 - dot(normal, lightDir)), 0.002);

    if (enablePCF) {
        // PCF
        vec2 texelSize = 1.0 / vec2(textureSize(depthTexture, 0));
        for(int x = -2; x <= 2; ++x)
        {
            for(int y = -2; y <= 2; ++y)
            {
                float pcfDepth = texture(depthTexture, projCoords.xy + vec2(x, y) * texelSize).r; 
                shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;        
            }    
        }
        shadow /= 25.0;
    } else {
        // 普通阴影
        float closestDepth = texture(depthTexture, projCoords.xy).r; 
        shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;
    }
    
    if(projCoords.z > 1.0)
        shadow = 0.0;
    
    return shadow;
   
}       

void main()
{
    
    //采样纹理颜色
    vec3 TextureColor = texture(diffuseTexture, TexCoord).xyz;

    //计算光照颜色
 	vec3 norm = normalize(Normal);
    
    // 凹凸
    // 中心立方体凹凸 (Key 2)
    if (enableBump && objectId == 1) {
        float height = texture(diffuseTexture, TexCoord).r;
        float h_s = texture(diffuseTexture, TexCoord + vec2(0.005, 0.0)).r;
        float h_t = texture(diffuseTexture, TexCoord + vec2(0.0, 0.005)).r;
        
        float dHdS = (h_s - height) * 12.0; 
        float dHdT = (h_t - height) * 12.0;
        
        // 简化处理，假设切线空间主要影响 X/Y
        norm = normalize(norm - vec3(dHdS, dHdT, 0.0) * 0.5); 
    }
    
    // 地板凹凸 (Key 3)
    if (enableFloorBump && objectId == 2) {
        float step = 0.002; // 采样步长
        
        // 获取高度
        #define GET_LUM(uv) dot(texture(diffuseTexture, uv).rgb, vec3(0.299, 0.587, 0.114))
        #define GET_H(uv) (1.0 - pow(1.0 - GET_LUM(uv), 4.0))

        // 中心差分采样
        float h_L = GET_H(TexCoord + vec2(-step, 0.0));
        float h_R = GET_H(TexCoord + vec2( step, 0.0));
        float h_B = GET_H(TexCoord + vec2(0.0, -step)); // Bottom
        float h_T = GET_H(TexCoord + vec2(0.0,  step)); // Top
        
        // 计算梯度
        float dHdS = (h_R - h_L) * 3.0; 
        float dHdT = (h_T - h_B) * 3.0;
        
        // 地板法线朝上 (0,1,0)，扰动 X 和 Z
        norm = normalize(norm + vec3(dHdS, 0.0, dHdT) * 0.5);
    }

	vec3 lightDir;
	if(u_lightPosition.w==1.0) 
        lightDir = normalize(u_lightPosition.xyz - FragPos);
	else lightDir = normalize(u_lightPosition.xyz);
	vec3 viewDir = normalize(viewPos - FragPos);
	vec3 halfDir = normalize(viewDir + lightDir);


    /*TODO2:根据phong shading方法计算ambient,diffuse,specular*/
    vec3  ambient,diffuse,specular;

    ambient = ambientStrength * lightColor;
    
    float diff = max(dot(norm, lightDir), 0.0);
    diffuse = diff * diffuseStrength * lightColor;
    
    float spec = 0.0;
    if(diff > 0.0) {
        spec = pow(max(dot(norm, halfDir), 0.0), shininess);
    }
    specular = spec * specularStrength * lightColor;
  
  	vec3 lightReflectColor=(ambient +diffuse + specular);

    float shadow = shadowCalculation(FragPosLightSpace, norm, lightDir);
	
    //vec3 resultColor =(ambient + (1.0-shadow) * (diffuse + specular))* TextureColor;
    vec3 resultColor=(1.0-shadow/2.0)* lightReflectColor * TextureColor;
    
    // 镜面反射 (objectId == 1)
    if (enableMirror && objectId == 1) {
        vec3 I = normalize(FragPos - viewPos);
        vec3 R = reflect(I, norm);
        vec3 reflectDir = R; 
        vec3 reflectionColor = texture(cubeSampler, reflectDir).rgb;
        
        resultColor = reflectionColor + specular * 0.5; 
    }

    // 雾化效果
    if (enableFog) {
        float fogDensity = 0.04;
        float fogGradient = 1.5;
        float dist = length(viewPos - FragPos);
        float fogFactor = exp(-pow((dist * fogDensity), fogGradient));
        fogFactor = clamp(fogFactor, 0.0, 1.0);
        vec3 fogColor = vec3(0.74, 0.75, 0.75); // 背景色
        resultColor = mix(fogColor, resultColor, fogFactor);
    }

    float alpha = 1.0;
    // 半透明效果
    if (enableTranslucency && objectId == 1) {
        alpha = 0.5;
        // WebGL 混合模式已设置为 SRC_ALPHA, ONE_MINUS_SRC_ALPHA
    }

    FragColor = vec4(resultColor, alpha);
}


