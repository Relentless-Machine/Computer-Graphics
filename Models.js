var numVertices=0; //生成顶点数组时计数
var points = [];
var colors = [];
var normalsArray =[];
var texCoordsArray = [];//顶点的纹理坐标属性数组texCoordsArray
var texCoord = [
	vec2(0, 0),
	vec2(0, 1),
	vec2(1, 1),
	vec2(1, 0) 
];

/**生成立方体顶点******************************
****************************************************/
  // Create a cube
  //    v5----- v6
  //   /|      /|
  //  v1------v2|
  //  | |     | |
  //  | |v4---|-|v7
  //  |/      |/
  //  v0------v3
   
  function colorCube(scale){
	numVertices = 0;
	var vertexMC=scale; //顶点沿轴到原点的最远距离
	var vertices = [
			vec4( -vertexMC, -vertexMC,  vertexMC, 1.0 ), //Z正前面左下角点V0，顺时针四点序号0~3
			vec4( -vertexMC,  vertexMC,  vertexMC, 1.0 ),
			vec4(  vertexMC,  vertexMC,  vertexMC, 1.0 ),
			vec4(  vertexMC, -vertexMC,  vertexMC, 1.0 ),
			vec4( -vertexMC, -vertexMC, -vertexMC, 1.0 ),   //Z负后面左下角点V4，顺时针四点序号4~7
			vec4( -vertexMC,  vertexMC, -vertexMC, 1.0 ),
			vec4(  vertexMC,  vertexMC, -vertexMC, 1.0 ),
			vec4(  vertexMC, -vertexMC, -vertexMC, 1.0 )
	];

	quad( 1, 0, 3, 2 ); //Z正-前 红----》兰    //顺时针0123，逆时针是0321或1032
	quad( 4, 5, 6, 7 ); //Z负-后 兰---》深兰	
    quad( 2, 3, 7, 6 ); //X正-右 黄-----》红
	quad( 5, 4, 0, 1 ); //X负-左 品红-----》深红
    quad( 6, 5, 1, 2 ); //Y正-上 青----》绿
	quad( 3, 0, 4, 7 ); //Y负-下 绿----》深绿
	
   	function quad(a, b, c, d) 
	{
		var vertexColors = [
			[ 0.0, 0.0, 0.0, 1.0 ],  // black
			[ 0.0, 0.0, 1.0, 1.0 ],  // blue      //[ 1.0, 0.0, 0.0, 1.0 ],  // red
			[ 1.0, 0.0, 0.0, 1.0 ],  // red       //[ 1.0, 1.0, 0.0, 1.0 ],  // yellow
			[ 0.0, 0.5, 0.0, 1.0 ],  // green        
			[ 0.0, 0.0, 0.5, 1.0 ],  // blue
			[ 0.5, 0.0, 0.0, 1.0 ],  // red        //[ 1.0, 0.0, 1.0, 1.0 ],  // magenta 品红
			[ 0.0, 1.0, 0.0, 1.0 ],  // green     //[ 0.0, 1.0, 1.0, 1.0 ],  // cyan 青
			[ 1.0, 1.0, 1.0, 1.0 ]   // white
		];

		//计算该面的法向量作为每个顶点的法向量
		var t1 = subtract(vertices[b], vertices[a]);
		var t2 = subtract(vertices[c], vertices[b]);
		var v1=vec3(t1[0],t1[1],t1[2]);
		var v2=vec3(t2[0],t2[1],t2[2]);
		var normal = cross(v1, v2);
		var normal = vec4(normal[0],normal[1],normal[2],0.0);//注意向量的最后W=0	
		
		 points.push(vertices[a]);
		 colors.push(vertexColors[a]);
		 normalsArray.push(normal);
		 texCoordsArray.push(texCoord[1]);

		 points.push(vertices[b]);
		 colors.push(vertexColors[a]);
		 normalsArray.push(normal);
		 texCoordsArray.push(texCoord[0]);

		 points.push(vertices[c]);
		 colors.push(vertexColors[a]);
		 normalsArray.push(normal);
		 texCoordsArray.push(texCoord[3]);

		 points.push(vertices[a]);
		 colors.push(vertexColors[a]);
		 normalsArray.push(normal);
		 texCoordsArray.push(texCoord[1]);

		 points.push(vertices[c]);
		 colors.push(vertexColors[a]);
		 normalsArray.push(normal);
		 texCoordsArray.push(texCoord[3]);

		 points.push(vertices[d]);
		 colors.push(vertexColors[a]);
		 normalsArray.push(normal);
		 texCoordsArray.push(texCoord[2]);  
		 
		 numVertices+=6;//顶点计数

		/* We need to parition the quad into two triangles in order for WebGL to be able to render it.  
		//In this case, we create two triangles from the quad indices，vertex color assigned by the index of the vertex    
		var indices = [ a, b, c, a, c, d ];	
		for ( var i = 0; i < indices.length; ++i ) {
			points.push( vertices[indices[i]] );  //保存一个顶点坐标到定点给数组vertices中        
			colors.push(vertexColors[a]);//for solid colored faces use 立方体每面为单色
			//colors.push( vertexColors[indices[i]] );//立方体每面插值为彩色 		
			normalsArray.push(normal);//顶点的法向量			
			texCoordsArray.push(texCoord[indices[i]]);//顶点映射的纹理坐标	!这里错误
            numVertices++;//顶点计数
		};
		*/			
	};
	return numVertices;
	
}


function plane(vscale){
	numVertices = 0;
	var scale = vscale;

	var vertices = [
		vec4(scale, -0.5, scale, 1.0),
		vec4(-scale, -0.5, scale, 1.0),
		vec4(-scale, -0.5, -scale, 1.0),

		vec4(scale, -0.5,  scale, 1.0),
		vec4(-scale, -0.5,  -scale, 1.0),
		vec4(scale, -0.5,  -scale, 1.0)
	];

	var planeColors = [
		vec4(1.0, 1.0, 1.0, 1.0),
		vec4(1.0, 1.0, 1.0, 1.0),
		vec4(1.0, 1.0, 1.0, 1.0),
		vec4(1.0, 1.0, 1.0, 1.0),
		vec4(1.0, 1.0, 1.0, 1.0),
		vec4(1.0, 1.0, 1.0, 1.0),
	];

	var planeNormls = [
		vec4(0.0, 1.0, 0.0, 0.0),
		vec4(0.0, 1.0, 0.0, 0.0),
		vec4(0.0, 1.0, 0.0, 0.0),

		vec4(0.0, 1.0, 0.0, 0.0),
		vec4(0.0, 1.0, 0.0, 0.0),
		vec4(0.0, 1.0, 0.0, 0.0)
	]

	var planeTexCoords = [
		vec2(1,  0.0),
		vec2(0.0,  0.0),
		vec2(0.0, 1),

		vec2(1,  0.0),
		vec2(0.0, 1),
		vec2(1, 1)
	]
	for(var i =0; i<6;++i)
	{
		points.push(vertices[i]);
		colors.push(planeColors[i]);
		normalsArray.push(planeNormls[i]);
		texCoordsArray.push(planeTexCoords[i]);
	}
	return 6;
}
