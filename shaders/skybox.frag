#version 300 es

precision mediump float;

out vec4 FragColor;

in vec3 TexCoords;

uniform samplerCube cubeSampler;//采样器


void main()
{    
    FragColor = texture(cubeSampler, TexCoords);
}