#version 300 es

in vec3 aPosition;
in vec3 aNormal;
in vec4 aColor;
in vec3 aOffset;

uniform float theta; // not used directly but kept for compatibility
uniform mat4 modelView;
uniform mat4 projection;
uniform mat3 normalMatrix;
uniform vec3 lightPos;
uniform vec2 centerOffset;
uniform float cubeScale;

out vec4 vColor;
out vec3 vNormal;
out vec3 vPosition;

void main(){
    vNormal = normalize(normalMatrix * aNormal);
    vec3 worldPos = aOffset + aPosition * cubeScale;
    vec4 viewPos = modelView * vec4(worldPos, 1.0);
    vPosition = viewPos.xyz;
    vec3 lightDir = normalize(lightPos - vPosition);
    float diff = max(dot(vNormal, lightDir), 0.0);
    vec3 base = aColor.rgb;
    vColor = vec4(base * (0.2 + 0.8*diff), aColor.a);
    vec4 clipPos = projection * viewPos;
    clipPos.xy += centerOffset * clipPos.w;
    gl_Position = clipPos;
}
