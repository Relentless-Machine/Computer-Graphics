"use strict";

var canvas;
var gl;

var depth = 0;

var basePositions = [];
var baseNormals = [];
var baseColors = [];
var baseVertexCount = 0;

var instanceOffsets = new Float32Array(0);
var instanceCount = 0;
var cubeScale = 1.0;

var vBuffer, nBuffer, cBuffer, instanceBuffer;
var program;

var theta = 0;
var speed = 0.5;
var anim = true;

var labelEl;

var centerOffset = new Float32Array([0, 0]);

var fps = 0;
var frameCounter = 0;
var lastFpsUpdate = 0;
var statsDirty = true;

var thetaLoc, modelViewLoc, projLoc, normalMatrixLoc, lightPosLoc;
var centerOffsetLoc, cubeScaleLoc;
var aPosLoc, aNormalLoc, aColorLoc, aOffsetLoc;

window.onload = function() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");
    if(!gl) { alert("WebGL2 not available"); return; }

    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0.9,0.9,0.95,1);
    gl.enable(gl.DEPTH_TEST);

    labelEl = document.getElementById("label");

    program = initShaders(gl, "shaders/menger3D.vert", "shaders/menger3D.frag");
    gl.useProgram(program);

    thetaLoc = gl.getUniformLocation(program, "theta");
    modelViewLoc = gl.getUniformLocation(program, "modelView");
    projLoc = gl.getUniformLocation(program, "projection");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    lightPosLoc = gl.getUniformLocation(program, "lightPos");
    centerOffsetLoc = gl.getUniformLocation(program, "centerOffset");
    cubeScaleLoc = gl.getUniformLocation(program, "cubeScale");

    aPosLoc = gl.getAttribLocation(program, "aPosition");
    aNormalLoc = gl.getAttribLocation(program, "aNormal");
    aColorLoc = gl.getAttribLocation(program, "aColor");
    aOffsetLoc = gl.getAttribLocation(program, "aOffset");

    buildBaseGeometry();
    initStaticBuffers();

    document.getElementById("slider").addEventListener("input", function(e){
        depth = clamp(parseInt(e.target.value, 10) || 0, 0, 5);
        rebuild();
    });

    document.getElementById("Animation").onclick = function(){ anim = !anim; };
    document.getElementById("speadUp").onclick = function(){ speed += 0.1; };
    document.getElementById("speadDown").onclick = function(){ speed = Math.max(0.05, speed-0.1); };

    canvas.addEventListener("mousedown", handlePointer);

    lastFpsUpdate = performance.now();

    rebuild();
    render();
};

function buildBaseGeometry(){
    if(basePositions.length) return;

    var v = [
        [-0.5,-0.5,-0.5], [0.5,-0.5,-0.5], [0.5,0.5,-0.5], [-0.5,0.5,-0.5],
        [-0.5,-0.5, 0.5], [0.5,-0.5, 0.5], [0.5,0.5, 0.5], [-0.5,0.5, 0.5]
    ];

    var faces = [
        [0,1,2,3, [0,0,-1]],
        [4,5,6,7, [0,0,1]],
        [0,4,7,3, [-1,0,0]],
        [1,5,6,2, [1,0,0]],
        [3,2,6,7, [0,1,0]],
        [0,1,5,4, [0,-1,0]]
    ];

    for(var i=0;i<faces.length;i++){
        var f = faces[i];
        var a = v[f[0]], b = v[f[1]], c = v[f[2]], d = v[f[3]];
        var n = f[4];
        pushBaseVertex(a, n);
        pushBaseVertex(b, n);
        pushBaseVertex(c, n);
        pushBaseVertex(a, n);
        pushBaseVertex(c, n);
        pushBaseVertex(d, n);
    }

    baseVertexCount = basePositions.length;
}

function pushBaseVertex(position, normal){
    basePositions.push(position);
    baseNormals.push(normal);
    baseColors.push([
        (normal[0] + 1.0) * 0.5,
        (normal[1] + 1.0) * 0.5,
        (normal[2] + 1.0) * 0.5,
        1.0
    ]);
}

function initStaticBuffers(){
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(basePositions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(baseNormals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aNormalLoc);
    gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 0, 0);

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(baseColors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aColorLoc);
    gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, 0, 0);

    instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.enableVertexAttribArray(aOffsetLoc);
    gl.vertexAttribPointer(aOffsetLoc, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aOffsetLoc, 1);
}

function rebuild(){
    if(labelEl) labelEl.textContent = "Generating depth " + depth + " ...";

    cubeScale = Math.pow(1.0 / 3.0, depth);

    var result = generateOffsets(depth);
    instanceOffsets = result.data;
    instanceCount = result.count;

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instanceOffsets, gl.STATIC_DRAW);
    gl.vertexAttribPointer(aOffsetLoc, 3, gl.FLOAT, false, 0, 0);

    statsDirty = true;
}

function generateOffsets(level){
    var count = Math.pow(20, level);
    var data = new Float32Array(count * 3);
    var index = 0;

    function recurse(currentLevel, size, offset){
        if(currentLevel === 0){
            data[index++] = offset[0];
            data[index++] = offset[1];
            data[index++] = offset[2];
            return;
        }

        var step = size / 3.0;
        for(var x=0;x<3;x++){
            for(var y=0;y<3;y++){
                for(var z=0;z<3;z++){
                    if((x===1 && y===1) || (x===1 && z===1) || (y===1 && z===1)){
                        continue;
                    }
                    var childOffset = [
                        offset[0] + (x - 1) * step,
                        offset[1] + (y - 1) * step,
                        offset[2] + (z - 1) * step
                    ];
                    recurse(currentLevel - 1, step, childOffset);
                }
            }
        }
    }

    recurse(level, 1.0, [0,0,0]);

    return {
        data: data,
        count: count
    };
}

function handlePointer(event){
    if(!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var nx = ((event.clientX - rect.left) / rect.width) * 2.0 - 1.0;
    var ny = ((rect.bottom - event.clientY) / rect.height) * 2.0 - 1.0;
    centerOffset[0] = clamp(nx, -0.95, 0.95);
    centerOffset[1] = clamp(ny, -0.95, 0.95);
    statsDirty = true;
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(anim) theta += speed;

    frameCounter++;
    var now = performance.now();
    if(now - lastFpsUpdate >= 500){
        fps = frameCounter * 1000.0 / (now - lastFpsUpdate);
        frameCounter = 0;
        lastFpsUpdate = now;
        statsDirty = true;
    }

    var eye = vec3(1.7, 1.7, 1.7);
    var at = vec3(0,0,0);
    var up = vec3(0,1,0);
    var modelView = lookAt(eye, at, up);
    modelView = mult(modelView, rotateY(theta));
    modelView = mult(modelView, rotateX(theta*0.3));

    var projection = perspective(45, canvas.width/canvas.height, 0.1, 10.0);

    var normalMatrix = mat3();
    normalMatrix[0][0] = modelView[0][0]; normalMatrix[0][1] = modelView[0][1]; normalMatrix[0][2] = modelView[0][2];
    normalMatrix[1][0] = modelView[1][0]; normalMatrix[1][1] = modelView[1][1]; normalMatrix[1][2] = modelView[1][2];
    normalMatrix[2][0] = modelView[2][0]; normalMatrix[2][1] = modelView[2][1]; normalMatrix[2][2] = modelView[2][2];

    gl.uniform1f(thetaLoc, theta);
    gl.uniform1f(cubeScaleLoc, cubeScale);
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
    gl.uniformMatrix4fv(projLoc, false, flatten(projection));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));
    gl.uniform3fv(lightPosLoc, flatten([1.0,1.0,1.0]));
    gl.uniform2fv(centerOffsetLoc, centerOffset);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, baseVertexCount, instanceCount);

    if(statsDirty){
        updateStats();
        statsDirty = false;
    }

    requestAnimFrame(render);
}

function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
}

function formatNumber(value){
    if(value === undefined || value === null) return "0";
    return value.toLocaleString ? value.toLocaleString() : String(value);
}

function updateStats(){
    if(!labelEl) return;
    var vertexCount = baseVertexCount * instanceCount;
    var cubeCount = instanceCount;
    labelEl.textContent = "Depth: " + depth +
        " | Cubes: " + formatNumber(cubeCount) +
        " | Vertices: " + formatNumber(vertexCount) +
        " | Center Offset: (" + centerOffset[0].toFixed(2) + ", " + centerOffset[1].toFixed(2) + ")" +
        " | FPS: " + fps.toFixed(1);
}
