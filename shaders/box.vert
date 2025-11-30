#version 300 es

//uniform所用顶点公用的数据 ,IN variable
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_LightSpaceMatrix;

//in每顶点各用的属性，IN variable
in vec4 vPosition;   //顶点位置        	
in vec4 vNormal;     //为作光照计算，从JS传递过来的顶点属性参数：顶点法向量				
in vec2 vTexCoord;

out vec2 TexCoord;
out vec3 FragPos;
out vec3 Normal;
out vec4 FragPosLightSpace;

void main() { 
    gl_Position=u_ProjectionMatrix*u_ViewMatrix*u_ModelMatrix*vPosition;

    FragPos = (u_ModelMatrix * vPosition).xyz;
    Normal = transpose(inverse(mat3(u_ModelMatrix))) * vNormal.xyz;
    
    TexCoord = vTexCoord;

    FragPosLightSpace = u_LightSpaceMatrix * vec4(FragPos, 1.0);
}
