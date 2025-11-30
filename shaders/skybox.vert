#version 300 es

in vec4 vPosition;
out vec3 TexCoords;

uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

void main()
{
    TexCoords = vPosition.xyz;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * vPosition;
    gl_Position = gl_Position.xyww;
}