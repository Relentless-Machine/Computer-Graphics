//画布环境初始化设置需要的参数
var canvas;
var gl;
var program;

// 场景物体的参数：顶点数
var skyboxnumPoints;//立方体天空盒顶点数
var cubenumPoints;//中心物体顶点数


//场景物体的变换矩阵P，V, M矩阵初始化
var  ModelMatrix;//模型变换矩阵
var  ViewMatrix;//观察变换矩阵
var  ProjectionMatrix;//规范化投影矩阵

// 光源位置，类型， 距离(0,0,0)距离半径，绕X轴旋转角度参极坐标theta,φ值，
var lightRadius; //光源半径
var lightTheta; //光源绕Y轴旋转角度
var lightPhi;   //光源绕X轴旋转角度
var lightPosition;  //光源位置或L向量，由类型，半径和角度确定
var lightType; //w=1,(x,y,z)是光源位置,w=0,(x,y,z)是向量光源方向


// 视点（眼睛）位置， 距离(0,0,0)距离半径，绕X轴旋转角度参极坐标theta,φ值，
var eyeRadius;
var eyeTheta;
var eyePhi; 
var eyePos;
var eyeFov;//透视俯仰角，越大则图的投影越小;

var framebuffer, renderbuffer;
var cubeTexture, planeTexture;

// 鼠标参数
let isLeftDragging = false;
let isMiddleDragging = false;
let isRightDragging = false;
let lastX = 0, lastY = 0;

// 场景观察目标点（球心）
let targetX = 0;
let targetY = 0;
let targetZ = 0;

// 特效开关
var enableMirror = false;
var enableBump = false;
var enableTranslucency = false;
var enableFog = false;
var enablePCF = false;
var enableFloorBump = false;

/*初始化和复位：需要恢复变量的初值：模型变换矩阵参数复原，恢复相机初始位置，投影方式为正投影*/
function initParameters(){
	lightTheta = 0;
	lightPhi = 90;
	lightRadius=5.0;	
    lightType=1; //w=1,(x,y,z)是光源位置,w=0,(x,y,z)是向量光源方向	
    lightPosition=vec4(0.0, 0.0, lightRadius, lightType ); //前两个参数不能修改
	
	eyeRadius=15.0;
    eyeTheta=0.0;
	eyePhi=90;

	eyeFov = 55; //perspective的俯仰角，越大图投影越小

	ModelMatrix = mat4();//单位阵
	ViewMatrix=mat4();//单位阵
	ProjectionMatrix=mat4();//单位矩阵

    // 重置特效开关
    enableMirror = false;
    enableBump = false;
    enableFloorBump = false;
    enableTranslucency = false;
    enableFog = false;
    enablePCF = false;
};


/***窗口加载时调用:程序环境初始化程序********/
window.onload = function() {
	canvas = document.getElementById("canvas");
    gl = canvas.getContext('webgl2');
    if ( !gl ) { alert( "WebGL isn't available" ); }

	program = initShaders( gl, "shaders/box.vert", "shaders/box.frag" );//初始化shader
	skyboxProgram = initShaders( gl, "shaders/skybox.vert", "shaders/skybox.frag");
	lampPorgram = initShaders(gl, "shaders/lamp.vert", "shaders/lamp.frag");
	depthProgram = initShaders(gl, "shaders/depth.vert", "shaders/depth.frag");

	gl.enable(gl.DEPTH_TEST); //开启深度缓存
    gl.depthFunc(gl.LEQUAL);
    
    // 开启混合以支持半透明
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
	gl.clearColor(0.737255, 0.745098, 0.752941, 1.0); //设置背景色 
	canvas.width = document.body.clientWidth;    
    canvas.height = document.body.clientHeight;   
	gl.viewport( (canvas.width-canvas.height)/2, 0, canvas.height, canvas.height);
	
	//设置界面控制可调参数初值
	initParameters();
	
  	//生成顶点属性数据并保存到顶点数组VBO，Associate out shader variables with our data buffer and variable
	cubenumPoints=colorCube(1.0); 	
	floornumPoints=plane(10.0);
	skyboxnumPoints=colorCube(80); 
	lampnumPoints=colorCube(0.05);

	initArrayBuffer(gl, program, flatten(points), 4, gl.FLOAT, "vPosition");
	initArrayBuffer(gl, program, flatten(normalsArray), 4, gl.FLOAT, "vNormal");
	initArrayBuffer(gl, program, flatten(texCoordsArray), 2, gl.FLOAT, "vTexCoord");

	// generate fbo
	var depthTextureSize = 1024;
	depthTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, depthTextureSize, depthTextureSize, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    framebuffer.width = depthTextureSize;
    framebuffer.height = depthTextureSize;

    // Attach color buffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
	gl.drawBuffers([gl.NONE]);
	gl.readBuffer([gl.NONE]);

	// check for completeness
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(status != gl.FRAMEBUFFER_COMPLETE) alert('Frame Buffer Not Complete');
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	//texture
	gl.useProgram(program);
	var cubeTexImage = document.getElementById("cubeTexImage");
	cubeTexture = configureTexture(cubeTexImage);

	var planeTexImage = document.getElementById("planeTexImage");
	planeTexture = configureTexture(planeTexImage);

	configurePhongModelMeterialParameters(program); 	
	//生成立方体纹理对象并设置属性
	configureCubeMap(program);

	gl.useProgram(skyboxProgram);
	configureCubeMap(skyboxProgram);
	initArrayBuffer(gl, skyboxProgram, flatten(points), 4, gl.FLOAT, "vPosition");
	
	gl.useProgram(lampPorgram);
	configurePhongModelMeterialParameters(lampPorgram);
	initArrayBuffer(gl, lampPorgram, flatten(points), 4, gl.FLOAT, "vPosition");
	//调用绘制函数
	render();
}


/******绘制函数render************/
function render(){	
    //清屏
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	//shadow map
	var lightProjection;
    lightProjection = perspective(155.0, 1.0, 0.1, 100); //55.0也可以修改乘其它值
	
	var lightPos = vec3(lightPosition[0], lightPosition[1], lightPosition[2]);
	var lightView = lookAt(lightPos, vec3(0,0,0), vec3(0,1,0));
	var lightSpaceMatrix = mult(lightProjection, lightView);

	gl.useProgram(depthProgram);
	gl.uniformMatrix4fv( gl.getUniformLocation(depthProgram, "u_LightSpaceMatrix"),false, flatten(lightSpaceMatrix) );
	gl.uniformMatrix4fv( gl.getUniformLocation(depthProgram, "u_ModelMatrix"),false, flatten(formModelMatrix()));
	gl.viewport(0, 0, framebuffer.width, framebuffer.height);
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.clear(gl.DEPTH_BUFFER_BIT);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);

	gl.drawArrays( gl.TRIANGLES, 0, cubenumPoints);

	var Translate = mat4(1, 0, 0, 0,
		0, 1, 0, -1,
		0, 0, 1, 0,
		0, 0, 0, 1);
	var Scale =  mat4(2, 0, 0, 0,
		0, 0.1, 0, 0,
		0, 0, 2, 0,
		0, 0, 0, 1);
		
	ModelMatrix = mult(Translate, Scale);
	gl.uniformMatrix4fv(gl.getUniformLocation(depthProgram,"u_ModelMatrix"), false, flatten(ModelMatrix));
	gl.drawArrays( gl.TRIANGLES, cubenumPoints, floornumPoints);//floor
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	gl.viewport( (canvas.width-canvas.height)/2, 0, canvas.height, canvas.height);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	gl.useProgram(program);
	gl.uniform4fv( gl.getUniformLocation(program,  "u_lightPosition"),flatten(lightPosition) );    
    //传递几何变换矩阵，视点和投影矩阵
	ModelMatrix=formModelMatrix();
	ViewMatrix=formViewMatrix();
	ProjectionMatrix=formProjectMatrix();
	gl.uniformMatrix4fv( gl.getUniformLocation(program,"u_ModelMatrix"), false, flatten(ModelMatrix));
	gl.uniformMatrix4fv( gl.getUniformLocation(program,"u_ViewMatrix"), false, flatten(ViewMatrix));
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "u_ProjectionMatrix" ),false, flatten(ProjectionMatrix));	
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "u_LightSpaceMatrix" ),false, flatten(lightSpaceMatrix));	
	
	gl.uniform3fv( gl.getUniformLocation( program, "viewPos" ), flatten(eyePos));
	
    // 传递特效开关 Uniforms
    gl.uniform1i(gl.getUniformLocation(program, "enableMirror"), enableMirror);
    gl.uniform1i(gl.getUniformLocation(program, "enableBump"), enableBump);
    gl.uniform1i(gl.getUniformLocation(program, "enableTranslucency"), enableTranslucency);
    gl.uniform1i(gl.getUniformLocation(program, "enableFog"), enableFog);
    gl.uniform1i(gl.getUniformLocation(program, "enablePCF"), enablePCF);
    gl.uniform1i(gl.getUniformLocation(program, "enableFloorBump"), enableFloorBump);
    
    // 传递物体ID: 1=中心立方体, 2=地板
    gl.uniform1i(gl.getUniformLocation(program, "objectId"), 1);

	//set texture
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.uniform1i(gl.getUniformLocation(program, "diffuseTexture"), 0);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.uniform1i(gl.getUniformLocation(program, "depthTexture"), 1);	
    
    // 绑定 CubeMap 到 TEXTURE2
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    gl.uniform1i(gl.getUniformLocation(program, "cubeSampler"), 2);

    // 如果未开启半透明，按原顺序先画立方体
    if (!enableTranslucency) {
	    gl.drawArrays( gl.TRIANGLES, 0, cubenumPoints);
    }
	
	var Translate = mat4(1, 0, 0, 0,
					0, 1, 0, -1,
					0, 0, 1, 0,
					0, 0, 0, 1);
	var Scale =  mat4(2, 0, 0, 0,
					0, 0.1, 0, 0,
					0, 0, 2, 0,
					0, 0, 0, 1);
	ModelMatrix = mult(Translate, Scale);
	gl.uniformMatrix4fv(gl.getUniformLocation(program,"u_ModelMatrix"), false, flatten(ModelMatrix));
    
    // 传递物体ID: 1=中心立方体, 2=地板
    gl.uniform1i(gl.getUniformLocation(program, "objectId"), 2);
    
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, planeTexture);
    gl.uniform1i(gl.getUniformLocation(program, "diffuseTexture"), 0);
	gl.drawArrays( gl.TRIANGLES, cubenumPoints, floornumPoints);//floor

	// draw lamp
	gl.useProgram(lampPorgram);
	ModelMatrix = mat4();
	ModelMatrix = translate(lightPosition[0], lightPosition[1], lightPosition[2]);
	gl.uniformMatrix4fv(gl.getUniformLocation(lampPorgram,"u_ModelMatrix"), false, flatten(ModelMatrix));
	gl.uniformMatrix4fv( gl.getUniformLocation(lampPorgram,"u_ViewMatrix"), false, flatten(ViewMatrix));
    gl.uniformMatrix4fv( gl.getUniformLocation( lampPorgram, "u_ProjectionMatrix" ),false, flatten(ProjectionMatrix));	
	gl.drawArrays( gl.TRIANGLES, cubenumPoints + floornumPoints + skyboxnumPoints, lampnumPoints);//球体等三角形封闭网4


	// draw skybox
	gl.useProgram(skyboxProgram);
	gl.uniformMatrix4fv( gl.getUniformLocation(skyboxProgram,"u_ViewMatrix"), false, flatten(ViewMatrix));
    gl.uniformMatrix4fv( gl.getUniformLocation( skyboxProgram, "u_ProjectionMatrix" ),false, flatten(ProjectionMatrix));	
	gl.drawArrays( gl.TRIANGLES, cubenumPoints + floornumPoints, skyboxnumPoints);//绘制立方体封闭网格，绘制天空盒，不动

    // 如果开启了半透明，最后画立方体
    if (enableTranslucency) {
        gl.useProgram(program);
        // 恢复立方体的 ModelMatrix
        ModelMatrix = formModelMatrix();
        gl.uniformMatrix4fv(gl.getUniformLocation(program,"u_ModelMatrix"), false, flatten(ModelMatrix));
        // 恢复物体ID
        gl.uniform1i(gl.getUniformLocation(program, "objectId"), 1);
        // 恢复纹理绑定
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
        
        // 开启混合，关闭深度写入
        gl.depthMask(false); 
        gl.drawArrays( gl.TRIANGLES, 0, cubenumPoints);
        gl.depthMask(true); // 恢复深度写入
    }
}

/*********绘图界面随窗口交互缩放而相应变化**************/
window.onresize = function(){
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    gl.viewport( (canvas.width-canvas.height)/2, 0, canvas.height, canvas.height);
	render();
}

/********* 注册键盘按键事件 **********************/
window.onkeydown = function(e){
    let code = e.keyCode;
    switch (code) {
        case 32:    // 空格-重置
            initParameters();//恢复相机初始位置，MVP矩阵单位化，投影方式为正投影
            break;	
		case 67://C键：点光源
			 lightType=1.0; //w=1,(x,y,z)是光源位置,w=0,(x,y,z)是向量光源方向
			 lightPosition=changeLightPositionAndType();	
			break;
		case 86://V键：平行光
			 lightType=0.0; //w=1,(x,y,z)是光源位置,w=0,(x,y,z)是向量光源方向
			 lightPosition=changeLightPositionAndType();	
			break;	
			
		case 89://Y,拉大光源距离
		    lightRadius+=0.5;			
			lightPosition=changeLightPositionAndType();	
			break;
		case 85://U,缩小光源距离
		    if(lightRadius>=0) lightRadius-=0.5;		
			lightPosition=changeLightPositionAndType();	
			break;
        	

        case 87:  // W-光源绕X轴顺时针旋转1度
		    lightPhi -=1;
			lightPosition=changeLightPositionAndType();
			break;
		case 83:    // S-光源绕X轴逆时针旋转1度
			lightPhi +=1;
			lightPosition=changeLightPositionAndType();
			break;
		case 65:    // A-光源绕Y轴顺时针旋转1度
			lightTheta -=1;
			lightPosition=changeLightPositionAndType();
			break;
        case 68:    // D-光源绕Y轴逆时针旋转1度
			lightTheta += 1;
			lightPosition=changeLightPositionAndType();
			break;				

		case 77://M   //放大俯仰角
			eyeFov+=5;
			break;
		case 78://N  //较小俯仰角
			eyeFov-=5;
			break; 

		case 73: //I
			eyePhi -= 5;
			break;
		case 75: //K
			eyePhi += 5;
		 	break;
		case 74: //J
			eyeTheta -= 5;
			break;
		case 76: //L
			eyeTheta += 5;
			break;

		case 188: // <
			eyeRadius -= 1;
			break;
		case 190: // >
			eyeRadius += 1;
			break;
		
        case 49: // 1: 镜面反射
            enableMirror = !enableMirror;
            console.log("Mirror:", enableMirror);
            break;
        case 50: // 2: 立方体凹凸贴图
            enableBump = !enableBump;
            console.log("Cube Bump:", enableBump);
            break;
        case 51: // 3: 地板凹凸贴图
            enableFloorBump = !enableFloorBump;
            console.log("Floor Bump:", enableFloorBump);
            break;
        case 52: // 4: 半透明
            enableTranslucency = !enableTranslucency;
            console.log("Translucency:", enableTranslucency);
            break;
        case 53: // 5: 雾化
            enableFog = !enableFog;
            console.log("Fog:", enableFog);
            break;
        case 54: // 6: 阴影反走样 (PCF)
            enablePCF = !enablePCF;
            console.log("PCF:", enablePCF);
            break;
	}	     		

	// 交互后需要调用 render 重新绘制
	render();
}

/********* 鼠标 & 滚轮交互控制相机 **********************/
// 鼠标按下
window.onmousedown = function(e){
    lastX = e.clientX;
    lastY = e.clientY;

    if (e.button === 0) isLeftDragging = true;   // 左键：旋转相机
    if (e.button === 1) isMiddleDragging = true; // 中键：平移球心
    if (e.button === 2) isRightDragging = true;  // 右键：缩放相机
};

// 鼠标松开
window.onmouseup = function(e){
    isLeftDragging = false;
    isMiddleDragging = false;
    isRightDragging = false;
};

// 阻止右键菜单
window.oncontextmenu = () => false;

// 鼠标移动
window.onmousemove = function(e){
    let dx = e.clientX - lastX;
    let dy = e.clientY - lastY;

    // 左键拖拽：旋转相机
    if (isLeftDragging) {
        const rotateSpeed = 0.3;
        eyeTheta -= dx * rotateSpeed;
        eyePhi   -= dy * rotateSpeed;
    }

    // 中键拖拽：平移球心
    if (isMiddleDragging) {
        const panSpeed = 0.001 * eyeRadius;
        targetX -= dx * panSpeed;
        targetY += dy * panSpeed;
    }

    // 右键拖拽：缩放相机
    if (isRightDragging) {
        const zoomSpeed = 0.05;
        eyeRadius += dy * zoomSpeed;
        if (eyeRadius < 1.0) eyeRadius = 1.0;
    }

    lastX = e.clientX;
    lastY = e.clientY;

    render();
};

// 可选：禁用滚轮缩放，完全依赖右键拖拽
window.onwheel = function(e){
    e.preventDefault();
};


/*改变光源位置lightposition*/
function changeLightPositionAndType(){
	return vec4( lightRadius * Math.sin(toRad(lightPhi)) * Math.sin(toRad(lightTheta)), 
                 lightRadius * Math.cos(toRad(lightPhi)), 
                 lightRadius * Math.sin(toRad(lightPhi)) * Math.cos(toRad(lightTheta)),
			     lightType);
}


/*将角度转换为弧度表示*/
function toRad(deg){
    return deg * Math.PI / 180;//JS三角函数需要输入的参数是弧度，将角度转换为弧度
};

//
function formModelMatrix(){
	return mat4();
}

/*生成观察变换矩阵/相机变换矩阵/视点变换矩阵*/
function formViewMatrix(){	
    // 计算相机位置
    var eye = vec3(
        targetX + eyeRadius * Math.sin(toRad(eyePhi)) * Math.sin(toRad(eyeTheta)), 
        targetY + eyeRadius * Math.cos(toRad(eyePhi)), 
        targetZ + eyeRadius * Math.sin(toRad(eyePhi)) * Math.cos(toRad(eyeTheta))
    );	

    eyePos = eye;

    // 计算视线方向
    var viewDir = normalize(vec3(
        targetX - eye[0],
        targetY - eye[1],
        targetZ - eye[2]
    ));

    // 世界上方向
    var worldUp = vec3(0, 1, 0);

    // 计算右方向
    var right = normalize(cross(viewDir, worldUp));

    // 正确的上方向
    var up = cross(right, viewDir);

    // 返回观察矩阵
    return lookAt(eye, vec3(targetX, targetY, targetZ), up);
};

/* 生成规范化投影变换矩阵 	*/
function formProjectMatrix(){
	const near = 0.1;
	const far = 100;
	const aspect=1.0;
	return  perspective(eyeFov, aspect, near, far); //MV.js里的函数
}

function initArrayBuffer(gl, sp, data, num, type, attribute) {
    var buff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buff);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    var attr = gl.getAttribLocation(sp, attribute);
    gl.vertexAttribPointer(attr, num, type, false, 0, 0);
    gl.enableVertexAttribArray(attr);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}