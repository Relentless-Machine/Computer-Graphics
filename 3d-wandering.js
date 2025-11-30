var canvas;
var gl;
var program;

var vBuffer, cBuffer;//顶点属性数组

// 交互可调参数及根据参数生成的三个变换：M,V,P（全局变量）
var modelScale; //物体整体缩放的因子
var theta; // 视点（眼睛）绕Y轴旋转角度，参极坐标θ值，
var phi; // 视点（眼睛）绕X轴旋转角度，参极坐标φ值，
var isOrth; // 投影方式设置参数
var fov; // 透视投影的俯仰角，fov越大视野范围越大
var orthoScale; // 正交投影视见体缩放因子
var ModelMatrix; // 模型变换矩阵
var ViewMatrix; // 视图变换矩阵
var ProjectionMatrix; // 投影变换矩阵

// shader里的统一变量在本代码里的标识变量
var u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;
var u_Flag;//用来区分绘制坐标还是物体，坐标轴不需要进行M变换
var u_Color;
var u_UseUniformColor;
var u_UseLambert;
var u_LightDir;
var u_UseEarthPattern;
var u_PatternFreq;
var u_LongLines;
var u_LatLines;
var u_LineWidth;

// 当前选择的模型
var currentModel = 'sun_earth';

// 游戏模式
var gameMode = false;
var objectPosX = 0.0, objectPosY = 0.0, objectPosZ = 0.0;
var isDragging = false;
var lastMouseX = -1, lastMouseY = -1;

/* ***********窗口加载时调用:程序环境初始化程序****************** */
window.onload = function() {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext('webgl2');
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    program = initShaders( gl, "shaders/3d-wandering.vert", "shaders/3d-wandering.frag" );
    gl.useProgram( program );
    
	//调整画布大小为正方形以保证图形长宽比例正确,设置视口viewport大小与画布一致
    resize();
	
	// 开启深度缓存，以正确渲染物体被遮挡部分，3D显示必备
    gl.enable(gl.DEPTH_TEST); 
	// 设置canvas画布背景色 -白色-
    gl.clearColor(1.0, 1.0, 1.0, 1.0); 
	
	
    // 初始化数据缓冲区，并关联attribute 着色器变量
    vBuffer = gl.createBuffer();//为points存储的缓存
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );  	
    cBuffer = gl.createBuffer();//为colors存储的缓存
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
		
	// 关联uniform着色器变量
    u_ModelMatrix = gl.getUniformLocation(program,"u_ModelMatrix");
    u_ViewMatrix = gl.getUniformLocation( program, "u_ViewMatrix" );
    u_ProjectionMatrix = gl.getUniformLocation( program, "u_ProjectionMatrix" );
    u_Flag = gl.getUniformLocation(program, "u_Flag");
    u_Color = gl.getUniformLocation(program, "u_Color");
    u_UseUniformColor = gl.getUniformLocation(program, "u_UseUniformColor");
    u_UseLambert = gl.getUniformLocation(program, "u_UseLambert");
    u_LightDir = gl.getUniformLocation(program, "u_LightDir");
    u_UseEarthPattern = gl.getUniformLocation(program, "u_UseEarthPattern");
    u_PatternFreq = gl.getUniformLocation(program, "u_PatternFreq");
    u_LongLines = gl.getUniformLocation(program, "u_LongLines");
    u_LatLines = gl.getUniformLocation(program, "u_LatLines");
    u_LineWidth = gl.getUniformLocation(program, "u_LineWidth");

	//初始化交互界面上的相关参数
	initViewingParameters();
	
    // 默认加载太阳-地球模型，在 WebGL 初始化完成之后再切换，避免空缓冲
    modelChange('sun_earth');

    canvas.addEventListener("mousedown", function(e) {
        if (!gameMode) return;
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    canvas.addEventListener("mouseup", function(e) {
        isDragging = false;
    });

    canvas.addEventListener("mousemove", function(e) {
        if (!gameMode || !isDragging) return;

        var newX = e.clientX;
        var newY = e.clientY;

        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;

        theta += deltaX * 0.5;
        phi += deltaY * 0.5;

        lastMouseX = newX;
        lastMouseY = newY;

        render();
    });
}

/* 注册键盘按键事件，修改变换矩阵中的各项参数，并重新进行渲染render */
window.onkeydown = function(e){
    var moveSpeed = 0.1;
    switch (e.keyCode) { 
        case 71: // G key
            gameMode = !gameMode;
            if(gameMode) {
                alert("切换为仿游戏交互模式：WASD移动物体，鼠标拖动旋转视角。");
            } else {
                alert("切换为默认交互模式。");
            }
            break;
		case 90:    // Z-模型沿Y轴旋转
            modelScale *=1.1;
            break;
        case 67:    // C-模型沿Y轴反向旋转
            modelScale *= 0.9;
            break;

        case 87:    // W
            if (gameMode) {
                objectPosZ -= moveSpeed;
            } else {
                phi -= 5;
            }
            break;
        case 83:    // S
            if (gameMode) {
                objectPosZ += moveSpeed;
            } else {
                phi += 5;
            }
            break;
        case 65:    // A
            if (gameMode) {
                objectPosX -= moveSpeed;
            } else {
                theta -= 5;
            }
            break;
        case 68:    // D
            if (gameMode) {
                objectPosX += moveSpeed;
            } else {
                theta += 5;
            }
            break;
                
        case 80:    // P-切换投影方式
            isOrth = !isOrth;
            break;
        case 77:    // M-放大俯仰角，给了一个限制范围
            if (isOrth) {
                orthoScale = Math.min(orthoScale * 1.1, 10.0);
            } else {
                fov = Math.min(fov + 5, 170);
            }
            break;
        case 78:    // N-较小俯仰角
            if (isOrth) {
                orthoScale = Math.max(orthoScale * 0.9, 0.1);
            } else {
                fov = Math.max(fov - 5, 5);
            }
            break; 			
			
		case 32:    // 空格-复位
            initViewingParameters();
            break;
    
        //===================TODO3：消隐设置=======================
      case 82: 
       // R -设置后向面剔除
            //gl.cullFace(gl.BACK); // gl.BACK or gl.FRONT; default is gl.BACK
            alert("开启后向面剔除"); 
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
            break;
        case 84: //T- 不设置后向面切换
            // 设置后向面剔除 默认状态
            //gl.cullFace(gl.BACK); // gl.BACK or gl.FRONT; default is gl.BACK
            alert("关闭后向面剔除"); 
            gl.disable(gl.CULL_FACE);
            break;

        case 66: //B-开启深度缓存，使用消隐算法
            // 开启深度缓存，以正确渲染物体被遮挡部分
            alert("开启深度缓存消隐算法");
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.DEPTH_BUFFER_BIT);
            break;
        case 86: //V-关闭深度缓存，不用消隐
            // 开启深度缓存，以正确渲染物体被遮挡部分，默认状态
            alert("关闭深度缓存消隐算法");
            gl.disable(gl.DEPTH_TEST);
            break;
    }        
    render();//参数变化后需要重新绘制画面
}

/* 绘图界面随窗口交互缩放而相应变化，保持1:1防止图形变形 */
window.onresize = resize;
function resize(){
    var size = Math.min(document.body.clientWidth, document.body.clientHeight);
    canvas.width = size;
    canvas.height = size;
    gl.viewport( 0, 0, canvas.width, canvas.height );
    render();
}


/* ****************************************
*  渲染函数render 
*******************************************/
function render(){    
    // 用背景色清屏
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    // ModelMatrix=formModelMatrix();//M
    ViewMatrix=formViewMatrix(); //V
    ProjectionMatrix=formProjectMatrix(); //P
    
    // 传递变换矩阵    
    gl.uniformMatrix4fv( u_ViewMatrix, false, flatten(ViewMatrix) ); 
    gl.uniformMatrix4fv( u_ProjectionMatrix, false, flatten(ProjectionMatrix) ); 
	
    // 标志位设为0，用顶点数据绘制坐标系
    gl.uniform1i( u_Flag, 0 );
    if (typeof u_UseEarthPattern !== 'undefined' && u_UseEarthPattern) {
        gl.uniform1i(u_UseEarthPattern, false); // 坐标轴关闭条纹
    }
    gl.uniform1i(u_UseUniformColor, false);
    gl.drawArrays( gl.LINES, 0, 6 ); // 绘制X轴，从0开始，读6个点
    gl.drawArrays( gl.LINES, 6, 6 ); // 绘制y轴，从6开始，读6个点
    gl.drawArrays( gl.LINES, 12, 6 ); // 绘制z轴，从12开始，读6个点        

    // 标志位设为1，绘制物体
    gl.uniform1i( u_Flag, 1 );

    if (currentModel === 'sun_earth') {
        gl.uniform1i(u_UseUniformColor, true); // 使用统一颜色
        gl.uniform1i(u_UseLambert, true);      // 开启光照
        gl.uniform3fv(u_LightDir, flatten(vec3(0.8, 0.6, 0.9))); // 光照方向
        gl.uniform1i(u_UseEarthPattern, false); // 太阳默认关闭网格
        gl.uniform1f(u_PatternFreq, 12.0);      // 条纹参数
        gl.uniform1i(u_LongLines, 24);          // 初始经线数
        gl.uniform1i(u_LatLines, 12);          // 初始纬线数
        gl.uniform1f(u_LineWidth, 0.01);        // 参数空间线宽

        // 整套系统平移
        var systemTranslation = translate(objectPosX, objectPosY, objectPosZ);

        // 绘制太阳
        var sunScale = 0.4; // 太阳的大小
        var sunModelMatrix = mult(systemTranslation, scale(sunScale, sunScale, sunScale));
        gl.uniformMatrix4fv(u_ModelMatrix, false, flatten(sunModelMatrix));
        gl.uniform4fv(u_Color, flatten(vec4(1.0, 1.0, 0.0, 1.0)));
        gl.uniform1i(u_UseEarthPattern, false);
        gl.drawArrays(gl.TRIANGLES, 18, points.length - 18);

        // 绘制地球
        var earthOrbitRadius = 1.0; // 地球轨道半径
        var earthScale = 0.15; // 地球的大小
        var earthRevolutionSpeed = 0.5; // 地球公转速度
        var earthSelfRotateSpeed = 2.0; // 地球自转速度

        var angle = (Date.now() / 1000) * earthRevolutionSpeed * Math.PI;
        var earthX = earthOrbitRadius * Math.cos(angle);
        var earthZ = earthOrbitRadius * Math.sin(angle);

        var earthTranslation = translate(earthX, 0, earthZ);
        var earthTilt = rotateZ(23.5); // 轴倾角
        var earthSelfRotate = rotateY((Date.now() / 1000) * earthSelfRotateSpeed * 180.0 / Math.PI);
        var earthScaling = scale(earthScale, earthScale, earthScale);
        // M = T_sys * T_orbit * R_tilt * R_self * S
        var earthModelMatrix = mult(systemTranslation, mult(earthTranslation, mult(earthTilt, mult(earthSelfRotate, earthScaling))));

        gl.uniformMatrix4fv(u_ModelMatrix, false, flatten(earthModelMatrix));
        gl.uniform4fv(u_Color, flatten(vec4(0.1, 0.5, 1.0, 1.0)));
        gl.uniform1i(u_UseEarthPattern, true);
        gl.drawArrays(gl.TRIANGLES, 18, points.length - 18);

        // 绘制地球自转轴
        var axisScale = earthScale * 1.5;
        var axisModelMatrix = mult(systemTranslation, mult(earthTranslation, mult(earthTilt, scale(axisScale, axisScale, axisScale))));
        gl.uniformMatrix4fv(u_ModelMatrix, false, flatten(axisModelMatrix));
        gl.uniform1i(u_UseLambert, false);       // 轴线不受光照
        gl.uniform1i(u_UseEarthPattern, false);  // 轴线不叠加网格
        gl.uniform1i(u_UseUniformColor, true);
        gl.uniform4fv(u_Color, flatten(vec4(0.0, 1.0, 1.0, 1.0))); // 青色轴线
        gl.drawArrays(gl.LINES, 6, 6); // 重用坐标系中的Y轴几何

        requestAnimationFrame(render);
    } else {
        gl.uniform1i(u_UseUniformColor, false)
        gl.uniform1i(u_UseLambert, false);
        var M = formModelMatrix();
        gl.uniformMatrix4fv(u_ModelMatrix, false, flatten(M));
        gl.uniform1i(u_UseEarthPattern, false);
        gl.drawArrays(gl.TRIANGLES, 18, points.length - 18);
    }
}


/* ****************************************************
* 初始化或复位：需要将交互参数及变换矩阵设置为初始值
********************************************************/
function initViewingParameters(){
	modelScale=1.0;		
    theta = 0;     
	phi = 90;	
    isOrth = true;     
	fov = 120;
    orthoScale = 1.0;
    
    gameMode = false;
    objectPosX = 0.0;
    objectPosY = 0.0;
    objectPosZ = 0.0;
	
	ModelMatrix = mat4(); //单位矩阵
    ViewMatrix = mat4();//单位矩阵
    ProjectionMatrix = mat4();//单位矩阵
};



/****************************************************************
* 初始及交互菜单选择不同图形后，需要重新发送顶点属性数据给GPU
******************************************************************/
function SendData(){
    var pointsData = flatten(points);
    var colorsData = flatten(colors);

    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, pointsData, gl.STATIC_DRAW );
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, colorsData, gl.STATIC_DRAW );
}

/********************************************************
* 交互菜单选择不同图形后，需要重新生成顶点数据并渲染
******************************************************/
function modelChange(model){
    currentModel = model;
    points = [];
    colors = [];
    switch(model){
        case 'cube':{
            vertextsXYZ();
            generateCube();
            break;
        }
        case 'sphere':{
            vertextsXYZ();
            generateSphere();
            break;
        }
        case 'hat':{
            vertextsXYZ();
            generateHat();
            break;
        }
        case 'sun_earth': {
            vertextsXYZ();
            generateSphere();
            break;
        }
    }
    SendData();//重新发送数据
	render();//重新渲染
}


/* ****************************************************
 * 生成观察流水管线中的 M,V,P矩阵  
********************************************************/
function formModelMatrix(){
//===================TODO2：生成物体缩放矩阵============================
//note: modify the `modelMatrix` to the correct value using `modelScale`
    var scaleMatrix = scale(modelScale, modelScale, modelScale);
    var translationMatrix = translate(objectPosX, objectPosY, objectPosZ);
    var modelMatrix = mult(translationMatrix, scaleMatrix);
    return modelMatrix;
}

function formViewMatrix(){
//===================TODO2：生成物体的视点变换矩阵V=======================
/***提示1：观察者（eye）的位置计算***************************************
*观察者（eye）的位置是在绕X和Y轴转动，可以认为是在球面运动，可使用极坐标参数化表示。
*极坐标参数半径radius可直接给定,最好大于1，因为物体坐标MC范围默认在[-1,1]之间。
*极坐标参数theta和phi是交互界面中控制，
*三角函数需要用到Math库，MVnew.js提供的函数radians将三角函数中的角度值转换为弧度值。
************************************************************************/
/***提示2：UP向量的计算**********************************
*通常UP=(0,1,0),但是当相机视线方向n和UP共线时会有问题! 
解决方法：找垂直于观察方向n的某线段作为up向量
*********************************************************/
   
    var radius = 2.5 * Math.max(modelScale, 1.0);
    const at = vec3(0.0, 0.0, 0.0);

    // 初始相机位于 +Z 方向，向上为 +Y
    var eye0 = vec4(0.0, 0.0, radius, 1.0);
    var up0  = vec4(0.0, 1.0, 0.0, 0.0); // 方向向量 w=0

    // 先绕 X 旋转 phi，再绕 Y 旋转 theta
    var Rx = rotateX(phi);
    var Ry = rotateY(theta);
    var R = mult(Ry, Rx);

    var eye4 = mult(R, eye0);
    var up4  = mult(R, up0);

    var eye = vec3(eye4[0], eye4[1], eye4[2]);
    var up  = normalize(vec3(up4[0], up4[1], up4[2]));

    return  lookAt(eye, at, up); //提示：lookAt是/common/MVnew.js中的已经写好的函数
};

function formProjectMatrix(){
   //==========TODO2: 计算投影矩阵=======================
	//提示1：可调用common目录下的MVnew.js里ortho(),perspective()函数
    //ortho正交投影需要的参数有left, right, bottom, ytop, near, far
    //perspective透视投影需要的参数有fov, aspect, near, far， 
	//注意1：fov俯仰角是交互控制变化的参数，是全局变量初始值120
	//注意2：因为参数top是js的保留字，所以这里的参数改名为ytop
	//注意3：设置的视见体参数需要考虑将场景中的景物包含进去。
    const near = 0.1;
    const far = 50.0;
    const range = 1.8 * Math.max(modelScale, 1.0) * orthoScale;
	const left = -range; 
    const right = range;
    const bottom = -range;
    const ytop = range; // 注意：top是js保留字，所以这里改名为ytop

	const aspect = canvas.width / canvas.height || 1.0;

    if (isOrth) {
        return ortho(left, right, bottom, ytop, near, far);
    }

    return perspective(fov, aspect, near, far);
}





