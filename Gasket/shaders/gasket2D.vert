#version 300 es

in vec4 aPosition;
in vec4 aColor;

out vec4 Color;

uniform float theta;
uniform float centerX;
uniform float centerY;

void main()
{
    float s = sin( theta );
    float c = cos( theta );

	gl_Position.x = (c * aPosition.x -s * aPosition.y )+ centerX ;
    gl_Position.y =  (s * aPosition.x + c * aPosition.y) + centerY;
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;

    Color = aColor;
}
