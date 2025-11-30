#version 300 es

// first vertex shader used to compute view from camera

in vec4 vPosition;

uniform mat4 u_LightSpaceMatrix;
uniform mat4 u_ModelMatrix;

void main()
{
    gl_Position = u_LightSpaceMatrix * u_ModelMatrix * vPosition;
}