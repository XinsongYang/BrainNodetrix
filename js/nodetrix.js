function GetQueryString(name)
{
     var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
     var r = window.location.search.substr(1).match(reg);
     if(r!=null)return  unescape(r[2]); return null;
}

//read data
//weightsData contains 92x2485 weights
//graphData contains the order of links


//var graphData, weightsData;

var fileName = GetQueryString("data");
	if(!fileName) fileName = "AD";

d3.json(fileName + "/nodes.json", function(error, nodes) {
	if(error)
		console.log(error);

d3.json(fileName + "/edge1.json", function(error, edge1) {
	if(error)
		console.log(error);

d3.json(fileName + "/edge2.json", function(error, edge2) {
	if(error)
		console.log(error);

d3.json(fileName + "/clusters.json", function(error, clusters) {
	if(error)
		console.log(error);

d3.json(fileName + "/clusterNames.json", function(error, clusterNames) {
	if(error)
		console.log(error);

d3.json(fileName + "/bestNodeClustering.json", function(error, roiCluster) {
	if(error)
		console.log(error);
	
	var taskType = 0;
	taskType = Number( GetQueryString("type") );

	//all data
	var adjMatrix1 = [],adjMatrix2 = [];
	function loadData()
	{
		adjMatrix1 = [];adjMatrix2 = [];
		var	n = nodes.length;
		nodes.forEach(function(node, i) {
			adjMatrix1[i] = d3.range(n).map(function(j) {return 0;});
			adjMatrix2[i] = d3.range(n).map(function(j) {return 0;});
		});
		for(i in edge1) {
			var index = Number(i);
			var source = 0;
			var target = 0;
			var total = 0, count = 0;
			while(total < (index+1) ) {
				total = total + n - count;
				count ++; 
			}
			source = count - 1;
			target = source + index + 1 - (total - n + count);
			adjMatrix1[source][target] = Math.round(edge1[i]);
			adjMatrix1[target][source] = Math.round(edge1[i]);
		}
		for(i in edge2) {
			var index = Number(i);
			var source = 0;
			var target = 0;
			var total = 0, count = 0;
			while(total < (index+1) ) {
				total = total + n - count;
				count ++; 
			}
			source = count - 1;
			target = source + index + 1 - (total - n + count);
			adjMatrix2[source][target] = Math.round(edge2[i]);
			adjMatrix2[target][source] = Math.round(edge2[i]);
		}

		for(var i = 0; i < n; i++)
		{
			adjMatrix1[i][i] = 0;
			adjMatrix2[i][i] = 0;
		}
	}
	loadData();
	
	//clusters
	// var clusters = [
	// 				[3,12,14,17,18,19,20,24,27,28,32],
	// 				[38,47,49,52,53,54,55,59,62,63,67],//frontal
	// 				[8,21,22,25,29,31],
	// 				[43,56,57,60,64,66],//parietal
	// 				[5,11,13],
	// 				[40,46,48],//occipital
	// 				[1,6,7,9,15,30,33,34],
	// 				[36,41,42,44,50,65,68,69],//temporal 
	// 				[2,10,16,23,26],
	// 				[37,45,51,58,61],//limbic
	// 				[0,35],
	// 				[4,39]
	// 				];
	// clusterNames = ["Frontal lobe", "Frontal lobe", "Parietal lobe", "Parietal lobe", "Occipital lobe", "Occipital lobe", 
	// "Temporal lobe", "Temporal lobe", "Limbic lobe", "Limbic lobe", "IC", "CC"];


	//merge nodes
	var newNodes = [];
	var clusK = 0;
	if(GetQueryString("K")) clusK = Number( GetQueryString("K") );
	var newAdjMatrix1 = [], newAdjMatrix2 = [];
	var newClusters = [];
	
	function mergeNodes() 
	{
		newNodes = [];
		for(i in roiCluster[clusK]) {
			var newX = 0, newY = 0, newZ = 0;
			for(j in roiCluster[clusK][i]) {
				var tmpI = roiCluster[clusK][i][j];
				newX += nodes[tmpI].x;
				newY += nodes[tmpI].y; 
				newZ += nodes[tmpI].z;  
			}
			newX = newX / roiCluster[clusK][i].length;
			newY = newY / roiCluster[clusK][i].length;
			newZ = newZ / roiCluster[clusK][i].length;
			newNodes.push({ consist: roiCluster[clusK][i], x: newX, y: newY, z: newZ, originalClus: clusterNo(roiCluster[clusK][i][0],clusters) });
		}

		newAdjMatrix1 = [], newAdjMatrix2 = [];
		newNodes.forEach(function(node, i) {
			newAdjMatrix1[i] = d3.range(newNodes.length).map(function(j) {return 0;});
			newAdjMatrix2[i] = d3.range(newNodes.length).map(function(j) {return 0;});
		});

		for(var i = 0; i < newNodes.length; i ++) {
			for(var j = i + 1; j < newNodes.length; j++){
				var tmpWeight = 0;
				for (k in newNodes[i].consist) {
					for(l in newNodes[j].consist) {
						tmpWeight += adjMatrix1[newNodes[i].consist[k]][newNodes[j].consist[l]]; 
					}
				}
				newAdjMatrix1[i][j] = tmpWeight;
				newAdjMatrix1[j][i] = tmpWeight;
			}
			newAdjMatrix1[i][i] = -1;
		}

		for(var i = 0; i < newNodes.length; i ++) {
			for(var j = i + 1; j < newNodes.length; j++){
				var tmpWeight = 0;
				for (k in newNodes[i].consist) {
					for(l in newNodes[j].consist) {
						tmpWeight += adjMatrix2[newNodes[i].consist[k]][newNodes[j].consist[l]]; 
					}
				}
				newAdjMatrix2[i][j] = tmpWeight;
				newAdjMatrix2[j][i] = tmpWeight;
			}
			newAdjMatrix2[i][i] = -1;
		}

		newClusters = [];
		for(i in clusters) {
			newClusters[i] = [];
		}
		for(var i = 0; i < newNodes.length; i ++) {
			newClusters[newNodes[i].originalClus].push(i);
		}

		maxWeight = maxW();
   		fillMax = maxWeight;
   		fillMin = 0;
	}
	mergeNodes();

	//color scale

    function maxW()
    {
    	var w = [];
    	for(i in newAdjMatrix1)
    		for(j in newAdjMatrix1[i])
    			w.push(adjMatrix1[i][j]);
    	for(i in newAdjMatrix2)
    		for(j in newAdjMatrix2[i])
    			w.push(newAdjMatrix2[i][j]);
    	return Math.max.apply(this, w);
    }
    var maxWeight = maxW(),
   		fillMax = maxWeight,
   		fillMin = 0;

   	var filter = Number( GetQueryString("filter") );
   	var	minColorvalue = 250,
   		minColor = d3.rgb(255,minColorvalue,minColorvalue).toString();
    function fillScale(weight) {
    	if(weight == -1)
    		return "#ddd";
    	if(weight <= filter)
    		return "#ffffff";
    	if(weight <= fillMin)
    		return "#ffffff";
    	var g = minColorvalue * (1- (weight - fillMin) / (fillMax - fillMin) ); 
    	return d3.rgb(255,g,g).toString(); 
    }
    function opacityScale(weight)
    {
    	if(weight < filter)
    		return 0;
    	if(weight < fillMin)
    		return 0;
    	return 1;
    } 
    function blueFillScale(weight) {
    	if(weight == -1)
    		return "#ddd";
    	if(weight <= filter)
    		return "#ffffff";
    	if(weight <= fillMin)
    		return "#ffffff";
    	var g = minColorvalue * (1- (weight - fillMin) / (fillMax - fillMin) ); 
    	return d3.rgb(g,g,255).toString(); 
    }   
    function reFill()
    {
    	fillMin = 0;
		fillMax = maxWeight;
		d3.selectAll(".cell")
			.style("fill", function(d) { return fillScale(d.weight); });
		d3.selectAll(".link")
			.style("stroke", function(d) { return fillScale(d.weight); })
			.style("opacity", function(d) { return opacityScale(d.weight); });
    }

	//nodes location scale
	var height = window.screen.height*0.8,
    	width = height*905/1030;
	
	var x_range = {"x1":1000,"x2":0},y_range = {"y1":1000,"y2":0},z_range = {"z1":1000,"z2":0};
    nodes.forEach(function(d){
	    x_range.x1 = x_range.x1 < d.x ? x_range.x1 : d.x;
	    x_range.x2 = x_range.x2 > d.x ? x_range.x2 : d.x;
	    y_range.y1 = y_range.y1 < d.y ? y_range.y1 : d.y;
	    y_range.y2 = y_range.y2 > d.y ? y_range.y2 : d.y;
	    z_range.z1 = z_range.z1 < d.z ? z_range.z1 : d.z;
	    z_range.z2 = z_range.z2 > d.z ? z_range.z2 : d.z;
	});
	var xScale = d3.scale.linear()
	    .domain([0,x_range.x2])
	    .range([- 100*width/905,width - 100*width/905]);
	var yScale = d3.scale.linear()
	    .domain([0,y_range.y2])
	    .range([- 70*height/1030,height - 70*height/1030]);

	//canvas
	var divId = "#nodetrix";
	d3.select(divId).style("width", (width * 2 + 300) + "px");

	var leftDiv = d3.select(divId).append("div")
		.attr("id","leftDiv");
	var panel = d3.select(divId).append("div")
		.attr("id","panel");
	var rightDiv = d3.select(divId).append("div")
		.attr("id","rightDiv");
	d3.select(divId).append("div").attr("class", "clear");

	leftDiv.append("b")
		.attr("id", "groupLabel1")		
    	.text("Control Group")
    	.style("font-size", "24px");
    rightDiv.append("b")
    	.attr("id", "groupLabel2")
    	.text(fileName + " Group")
    	.style("font-size", "24px");	

	var leftCanvas = leftDiv.append("svg")
		.attr("id", "leftCanvas")
		.attr("width", width)
		.attr("height", height);
	var rightCanvas = rightDiv.append("svg")
		.attr("id", "rightCanvas")
		.attr("width", width)
		.attr("height", height);

	leftCanvas.append("image")
		.attr("class","background")
        .attr("xlink:href", "pic/brain_xy.png")
        .attr("x", 0).attr("y", 0)
        .attr("width", width).attr("height",height)
        .attr("opacity", 0.4);
    rightCanvas.append("image")
		.attr("class","background")
        .attr("xlink:href", "pic/brain_xy.png")
        .attr("x", 0).attr("y", 0)
        .attr("width", width).attr("height",height)
        .attr("opacity", 0.4);

    //matrixs
    var cellUnitLength = 10;
	var leftMatrixs = [],
		rightMatrixs = [];
	var isReorder = 0;
	
	function setMatrixs() 
	{
		leftMatrixs = [];
		rightMatrixs = [];

		for(i in newClusters) 
		{
			//get cluster matrix data
			var leftMatrix = [],
				rightMatrix = [];
			var nodesNum = newClusters[i].length;
			var	matrixLength = 0;

			if(isReorder) {	
				var nodesWeight = [];
				for(j in newClusters[i]) {
					var w = 0;
					for(h in newClusters[i]) {
						w += newAdjMatrix1[newClusters[i][j]][newClusters[i][h]];
					}
					nodesWeight.push({node:newClusters[i][j], weight:w});
				}
				nodesWeight.sort(function(a,b) {return b.weight - a.weight;});

				// newClusters[i] = [];
				// for(j in nodesWeight) {
				// 	newClusters[i].push(nodesWeight[j].node);
				// }

				var midIndex = parseInt(nodesWeight.length / 2);
				if(nodesWeight.length % 2 == 1) {
					newClusters[i][midIndex] = nodesWeight[0].node;
					for(var j = 1; j <= midIndex; j++) {
						newClusters[i][midIndex - j] = nodesWeight[2 * j - 1].node;
						newClusters[i][midIndex + j] = nodesWeight[2 * j].node;
					}
				}
				else if(nodesWeight.length % 2 == 0) {
					for(var j = 0; j < midIndex; j++) {
						newClusters[i][midIndex - j - 1] = nodesWeight[2 * j].node;
						newClusters[i][midIndex + j] = nodesWeight[2 * j + 1].node;
					}
				}
				
			}


			for(var j in newClusters[i])
			{
				matrixLength += newNodes[ newClusters[i][j] ].consist.length * cellUnitLength;
			}

			for(var j = 0; j < nodesNum; j++) 
			{			
				leftMatrix[j] = d3.range(nodesNum).map(function(k) {
					var s = newClusters[i][j],
						t = newClusters[i][k];
					return {lobe: i, source: s, target: t, x: k, y: j, weight: newAdjMatrix1[s][t],
						cellHeight: newNodes[s].consist.length, cellWidth: newNodes[t].consist.length};
				});
				rightMatrix[j] = d3.range(nodesNum).map(function(k) {
					var s = newClusters[i][j],
						t = newClusters[i][k];
					return {lobe: i, source: s, target: t, x: k, y: j, weight: newAdjMatrix2[s][t], 
						cellHeight: newNodes[s].consist.length, cellWidth: newNodes[t].consist.length};
				});
			}
			
			//get location of the matrix
			var coordinateX = 0, coordinateY = 0, coordinateZ = 0;
			for(var j in clusters[i])
			{
				coordinateX = coordinateX + nodes[ clusters[i][j] ].x;
				coordinateY = coordinateY + nodes[ clusters[i][j] ].y;
				coordinateZ = coordinateZ + nodes[ clusters[i][j] ].z;
			}
			coordinateX = parseInt(coordinateX / clusters[i].length + 0.5);
			coordinateY = parseInt(coordinateY / clusters[i].length+ 0.5);
			coordinateZ = parseInt(coordinateZ / clusters[i].length+ 0.5);

			leftMatrixs.push({ name:clusterNames[i], n: nodesNum, nodes: newClusters[i], links: leftMatrix, originPos: {x: coordinateX, y: coordinateY, z:coordinateZ}, 
				projectPos: {x: xScale(coordinateX), y: yScale(coordinateY)}, length: matrixLength});
			
			rightMatrixs.push({ name:clusterNames[i], n: nodesNum, nodes: newClusters[i], links: rightMatrix, originPos: {x: coordinateX, y: coordinateY, z:coordinateZ}, 
				projectPos: {x: xScale(coordinateX), y: yScale(coordinateY)}, length: matrixLength});
		}
	}
	setMatrixs();

	if(1) {
		leftMatrixs[9].projectPos.x = leftMatrixs[9].projectPos.x - 30;
		leftMatrixs[8].projectPos.x = leftMatrixs[8].projectPos.x + 30;
		leftMatrixs[10].projectPos.y = leftMatrixs[10].projectPos.y + 80;
		leftMatrixs[11].projectPos.y = leftMatrixs[11].projectPos.y - 20;

		rightMatrixs[9].projectPos.x = rightMatrixs[9].projectPos.x - 30;
		rightMatrixs[8].projectPos.x = rightMatrixs[8].projectPos.x + 30;
		rightMatrixs[10].projectPos.y = rightMatrixs[10].projectPos.y + 80;
		rightMatrixs[11].projectPos.y = rightMatrixs[11].projectPos.y - 20;
	}
	
	//console.log(leftMatrixs);

	//draw matrix
	var leftMatrixBodys, rightMatrixBodys;
	function drawMatrixs()
	{
		//leftMatrixBodys.remove();
		leftMatrixBodys = leftCanvas.selectAll(".matrix")
			.data(leftMatrixs)
			.enter().append("g")
			.attr("class", function(d,i) {
				if(i >= 10) return "midMatrix"; 
				if(i % 2 == 1) return "leftMatrix";
				else return "rightMatrix";
			})
			.attr("id", function(d, i) { return "leftMatrix" + i; })
			.attr("transform", function(d) {
				return "translate(" + (d.projectPos.x - d.length / 2) + "," + (d.projectPos.y - d.length / 2) + ")";
			})
			.each(addRows);
			//.each(addColumns);

		//rightMatrixs.remove();
		rightMatrixBodys = rightCanvas.selectAll(".matrix")
			.data(rightMatrixs)
			.enter().append("g")
			.attr("class", function(d,i) {
				if(i >= 10) return "midMatrix"; 
				if(i % 2 == 1) return "leftMatrix";
				else return "rightMatrix";
			})
			.attr("id", function(d, i) { return "rightMatrix" + i; })
			.attr("transform", function(d) {
				return "translate(" + (d.projectPos.x - d.length / 2) + "," + (d.projectPos.y - d.length / 2) + ")";
			})
			.each(addRows);
			//.each(addColumns);
		
		//外框
		leftMatrixBodys.append("rect")
			.attr("class", function(d,i) {return "lobeFrame" + i;})
			.attr("x", 0).attr("y", 0)
			.attr("width", function(d) {return d.length; })
			.attr("height", function(d) {return d.length; })
			.style("fill", "none")
			.style("stroke-width", 2)
			.style("stroke", function(d, i) {return "#bbb";});

		rightMatrixBodys.append("rect")
			.attr("class", function(d,i) {return "lobeFrame" + i;})
			.attr("x", 0).attr("y", 0)
			.attr("width", function(d) {return d.length; })
			.attr("height", function(d) {return d.length; })
			.style("fill", "none")
			.style("stroke-width", 2)
			.style("stroke", function(d, i) {return "#bbb";});
	}
	drawMatrixs();
	

	function addRows(matrix, i)
	{
		var rows = d3.select(this).selectAll(".row")
			.data(matrix.links)
			.enter().append("g")
			.attr("class", "row")
			.attr("transform", function(d, i) {
				var rowY = 0;
				for(var j = 0; j < i; j++) {
					rowY += matrix.links[j][0].cellHeight * cellUnitLength;
				}				
				return "translate(0," + rowY + ")"; 
			})
  			.each(addCells)
  			.each(addNos);
	}

	function addCells(row, i) 
	{
		d3.select(this).selectAll(".cell")
        							.data(row)
      								.enter().append("rect")
      								.attr("class", function(d) {return "lobe" + d.lobe + " cell roi" + d.source + " roi" + d.target;})
      								//.classed("col" + function(d,i) {return i;}, true)
        							//.classed("cell1", true)
        							//.attr("id", function(d) { return "cell1" + "x" + d.x + "y" + d.y; })
        							.attr("x", function(d, i) { 
        								var cellX = 0;
										for(var j = 0; j < i; j++) {
											cellX += row[j].cellWidth * cellUnitLength;
										}				
        								return cellX; 
        							})
        							.attr("width", function(d) {return d.cellWidth * cellUnitLength;})
        							.attr("height", function(d) {return d.cellHeight * cellUnitLength;})
        							.style("fill", function(d) { return fillScale(d.weight); })
        							.style("stroke", "#ddd");
        							//.on("click", selectROI);
	}

	function addNos(row, i)
	{
		d3.select(this).selectAll(".no")
			.data(roiCluster[clusK][row[0].source])
			.enter().append("text")
			.text(function(d) {return d + 1;})
			.attr("x", -2)
  			.attr("y", function(d,i) {return cellUnitLength * (i + 1);})
  			.style("text-anchor", "end")
  			.style("font-size", "12px")
  			.style("fill", "#999");
	}

	function addColumns(matrix, i)
	{
		var columns = d3.select(this).selectAll(".column")
			.data(matrix.nodes)
			.enter().append("g")
			.attr("class", "column")
			.attr("transform", function(d, i) {return "translate(" + (i * cellUnitLength) + ",0)rotate(-90)"; });

		columns.append("text")
			.text(function(d, i) { return d + 1})
  			.attr("x", 2)
  			.attr("y", 8)
  			.style("font-size", "12px")
  			.style("fill", "#999");
	}


	//遍历links，取矩阵之间的连接	
	function isInCluster(node)
	{
		for(c in newClusters)
			for(d in newClusters[c])
				if(node == newClusters[c][d])
					return true;
		return false;
	}
	
	function isSameCluster(node1,node2)
	{
		for(a in newClusters)
		{
			var isNode1In = false;
			var isNode2In = false;
			for(b in newClusters[a])
			{
				if(node1 == newClusters[a][b])
					isNode1In = true;
				if(node2 == newClusters[a][b])
					isNode2In = true;
			}
			if(isNode1In && isNode2In)
				return true;
		}
		return false;
	}

	// function clusterNo(node)
	// {
	// 	for(a in clusters)
	// 		for(b in clusters[a])
	// 			if(node == clusters[a][b])
	// 				return Number(a);
	// 	return null;
	// }
	function clusterNo(node, c)
	{
		for(a in c)
			for(b in c)
				if(node == c[a][b])
					return Number(a);
		return null;
	}


	function nodeIndex(node, clusNo)
	{
		// if(clusterNo(node) != clusNo)
		// 	return null;
		var index = 0;
		for(k in newClusters[clusNo])
		{
			if(node == newClusters[clusNo][k])
				return index;
			else
				index ++;
		}
	}


	var isMatrixLinked = [];
	var leftLinks = [], rightLinks = [];

	function setLinks() 
	{
		isMatrixLinked = [];
		for(i in leftMatrixs) {
			isMatrixLinked[i] = [];
			for(j in leftMatrixs) {
				isMatrixLinked[i][j] = 0;
			}
		}

		leftLinks = [];
		for(i in newAdjMatrix1)
		{
			for(j in newAdjMatrix1[i])
			{
				if( j > i && newAdjMatrix1[i][j] > filter && isInCluster(i) && isInCluster(j) && !isSameCluster(i,j))
				{
					var link = { source: Number(i), target: Number(j), weight: newAdjMatrix1[i][j], 
						sourceMatrix: clusterNo(i,newClusters), targetMatrix: clusterNo(j,newClusters), 
						sourIndex: nodeIndex(Number(i),clusterNo(i,newClusters)), tarIndex: nodeIndex(Number(j),clusterNo(j,newClusters)) };
					leftLinks.push(link);
					isMatrixLinked[link.sourceMatrix][link.targetMatrix] = 1;
					isMatrixLinked[link.targetMatrix][link.sourceMatrix] = 1;
				}
			}
		}

		rightLinks = [];
		for(i in newAdjMatrix2)
		{
			for(j in newAdjMatrix2[i])
			{
				if( j > i && newAdjMatrix2[i][j] > filter && isInCluster(i) && isInCluster(j) && !isSameCluster(i,j))
				{
					var link = { source: Number(i), target: Number(j), weight: newAdjMatrix2[i][j], 
						sourceMatrix: clusterNo(i,newClusters), targetMatrix: clusterNo(j,newClusters), 
						sourIndex: nodeIndex(Number(i),clusterNo(i,newClusters)), tarIndex: nodeIndex(Number(j),clusterNo(j,newClusters)) };
					rightLinks.push(link);
					isMatrixLinked[link.sourceMatrix][link.targetMatrix] = 1;
					isMatrixLinked[link.targetMatrix][link.sourceMatrix] = 1;
				}
			}
		}

		leftLinks.sort(sortWeight);
		rightLinks.sort(sortWeight);
	}
	
	function sortWeight(a,b)
	{
		return a.weight - b.weight;
	}

	setLinks();
	

	//计算矩阵连接控制点
	
	var controlPoints = [];

	function setControlPoints()
	{
		controlPoints = [];
		var controlGraph = {"nodes":[],"links":[], "distance":[]};
		var controlLines = [];
		var isFixedAdd = [];
		for(var i = 0; i < 4 * leftMatrixs.length; i++) {
			isFixedAdd[i] = 0;
		}
		for(i in isMatrixLinked) {
			for(j in isMatrixLinked[i]) {
				if(j > i && isMatrixLinked[i][j]) {
					switch( maRelation(leftMatrixs[i], leftMatrixs[j]) )
					{
						case "right":
						isFixedAdd[4 * i] = 1;
						isFixedAdd[4 * j + 1] = 1;	
						break;
						
						case "left":
						isFixedAdd[4 * i + 1] = 1;
						isFixedAdd[4 * j] = 1;
						break;

						case "down":
						isFixedAdd[4 * i + 2] = 1;
						isFixedAdd[4 * j + 3] = 1;
						break;

						case "up":
						isFixedAdd[4 * i + 3] = 1;
						isFixedAdd[4 * j + 2] = 1;
						break;
					}
				}
			}
		}
		for(i in isFixedAdd) {
			if(isFixedAdd[i]) {
				var matrixIndex = parseInt(i / 4);
				switch(i % 4)
				{
					case 0:
					controlGraph.nodes.push({x: leftMatrixs[matrixIndex].projectPos.x - leftMatrixs[matrixIndex].length / 2, 
						y: leftMatrixs[matrixIndex].projectPos.y, isFixed: 1, matrix: i});
					break;

					case 1:
					controlGraph.nodes.push({x: leftMatrixs[matrixIndex].projectPos.x + leftMatrixs[matrixIndex].length / 2, 
						y: leftMatrixs[matrixIndex].projectPos.y, isFixed: 1, matrix: i});
					break;

					case 2:
					controlGraph.nodes.push({x: leftMatrixs[matrixIndex].projectPos.x, 
						y: leftMatrixs[matrixIndex].projectPos.y - leftMatrixs[matrixIndex].length / 2, isFixed: 1, matrix: i});
					break;

					case 3:
					controlGraph.nodes.push({x: leftMatrixs[matrixIndex].projectPos.x, 
						y: leftMatrixs[matrixIndex].projectPos.y + leftMatrixs[matrixIndex].length / 2, isFixed: 1, matrix: i});
					break;
				}
				
			}
		}
		var fixedAmount = controlGraph.nodes.length;
		var controlNodeCnt = controlGraph.nodes.length;
		
		var intervalN = 3;
		function projectNodeIndex(originIndex)
		{
			var newIndex = originIndex;
			for(var l = 0; l < originIndex; l++ ) {
				if(!isFixedAdd[l]) {
					newIndex --;
				} 
			}
			return newIndex;
		}
		function addInterNodes(i,j)
		{
			var node1, node2;
			var node1Index, node2Index;
			var side1, side2;
			switch( maRelation(leftMatrixs[i], leftMatrixs[j]) )
			{
				case "right":
				node1 = {x: leftMatrixs[i].projectPos.x - leftMatrixs[i].length / 2, y: leftMatrixs[i].projectPos.y};
				node2 = {x: leftMatrixs[j].projectPos.x + leftMatrixs[j].length / 2, y: leftMatrixs[j].projectPos.y};
				node1Index = projectNodeIndex(4 * i);
				node2Index = projectNodeIndex(4 * j + 1);
				side1 = 0;
				side2 = 1;
				break;
				
				case "left":
				node1 = {x: leftMatrixs[i].projectPos.x + leftMatrixs[i].length / 2, y: leftMatrixs[i].projectPos.y};
				node2 = {x: leftMatrixs[j].projectPos.x - leftMatrixs[j].length / 2, y: leftMatrixs[j].projectPos.y};
				node1Index = projectNodeIndex(4 * i + 1);
				node2Index = projectNodeIndex(4 * j);
				side1 = 1;
				side2 = 0;
				break;

				case "down":
				node1 = {x: leftMatrixs[i].projectPos.x, y: leftMatrixs[i].projectPos.y - leftMatrixs[i].length / 2};
				node2 = {x: leftMatrixs[j].projectPos.x, y: leftMatrixs[j].projectPos.y + leftMatrixs[j].length / 2};
				node1Index = projectNodeIndex(4 * i + 2);
				node2Index = projectNodeIndex(4 * j + 3);
				side1 = 2;
				side2 = 3;
				break;

				case "up":
				node1 = {x: leftMatrixs[i].projectPos.x, y: leftMatrixs[i].projectPos.y + leftMatrixs[i].length / 2};
				node2 = {x: leftMatrixs[j].projectPos.x, y: leftMatrixs[j].projectPos.y - leftMatrixs[j].length / 2};
				node1Index = projectNodeIndex(4 * i + 3);
				node2Index = projectNodeIndex(4 * j + 2);
				side1 = 3;
				side2 = 2;
				break;
			}
			controlLines.push({n1: node1, n2: node2, tan: (node1.y - node2.y) / (node1.x - node2.x), 
				mid: {x: (node1.x + node2.x) / 2, y: (node1.y + node2.y) / 2}, length: Math.sqrt(Math.pow(node1.x - node2.x,2) + Math.pow(node1.y - node2.y,2)) });
			var intervalX = (node2.x - node1.x) / (intervalN + 1);
			var intervalY = (node2.y - node1.y) / (intervalN + 1);
			for(var k = 1; k <= intervalN; k++)
			{
				controlGraph.nodes.push( {x: node1.x + k * intervalX, y: node1.y + k * intervalY, isFixed: 0, linkedMatrixs: [i,j], i: k, side:[side1,side2], line: controlLines.length - 1} );
				if(k == 1) {
					controlGraph.links.push( {source: node1Index, target: node2Index} );
				}
				else if(k == intervalN) {
					controlGraph.links.push( {source: controlNodeCnt - 1, target: controlNodeCnt} );
					controlGraph.links.push( {source: controlNodeCnt, target: node2Index} );
				}
				else {
					controlGraph.links.push( {source: controlNodeCnt - 1, target: controlNodeCnt} );
				}
				controlNodeCnt ++;
			}
		}

		for(i in leftMatrixs)
		{
			for(j in leftMatrixs)
			{
				if( Number(i) < Number(j) && isMatrixLinked[i][j]) {addInterNodes(i,j);}
			}
		}	
		for(i in controlGraph.nodes) {
			controlGraph.nodes[i].id = i;
		}
		// for(var i = fixedAmount; i < controlGraph.nodes.length; i++) {
		// 	for(var j = i + 1; j < controlGraph.nodes.length; j++) {
		// 		if(controlGraph.nodes[i].i == controlGraph.nodes[j].i) {
		// 			controlGraph.links.push( {source: i, target:j} );
		// 		}
		// 	}
		// }
		
		function isNodeLink(i,j)
		{
			var nodeI = controlGraph.nodes[i], nodeJ = controlGraph.nodes[j];
			if(nodeI.isFixed || nodeJ.isFixed) {return 0;}
			if(nodeI.linkedMatrixs[0] == nodeJ.linkedMatrixs[0] && nodeI.side[0] == nodeJ.side[0] && nodeI.i == nodeJ.i) {
				return 1;
			}
			if(nodeI.linkedMatrixs[1] == nodeJ.linkedMatrixs[1] && nodeI.side[1] == nodeJ.side[1] && nodeI.i == nodeJ.i) {
				return 1;
			}
			if(nodeI.linkedMatrixs[0] == nodeJ.linkedMatrixs[1] && nodeI.side[0] == nodeJ.side[1] && nodeI.i == intervalN - nodeJ.i + 1) {
				return 1;
			}
			if(nodeI.linkedMatrixs[1] == nodeJ.linkedMatrixs[0] && nodeI.side[1] == nodeJ.side[0] && intervalN - nodeI.i + 1 == nodeJ.i) {
				return 1;
			}
			return 0;
		}
		for(var i = fixedAmount; i < controlGraph.nodes.length; i++) {
			for(var j = i + 1; j < controlGraph.nodes.length; j++) {
				
				if( isNodeLink(i,j) ) {
					controlGraph.links.push( {source: i, target:j} );
				}
			}
		}

	    //caculate distance
	    var Ce = [], 
	    	minCe = 1;
	    for(var i = 0; i < controlLines.length; i++) {
	    	Ce[i] = [];
	    	for(var j = 0; j < controlLines.length; j++) {
	    		Ce[i][j] = 1;
	    		if(i == j) continue;

	    		var angle = Math.atan(controlLines[i].tan) - Math.atan(controlLines[j].tan);
				var Ca = Math.abs( Math.cos(angle) );
				
				var lavg = ( controlLines[i].length + controlLines[j].length ) / 2;
				var Cs = 2 / ( lavg * Math.min(controlLines[i].length,controlLines[j].length) +  Math.max(controlLines[i].length,controlLines[j].length) / lavg );

				var midDist = Math.sqrt( Math.pow(controlLines[i].mid.x - controlLines[j].mid.x,2) + Math.pow(controlLines[i].mid.y - controlLines[j].mid.y,2) );
				var Cp = lavg / ( lavg +  midDist);

				Ce[i][j] = Math.pow(Ca * Cs * Cp, 0.1);
				if(Ce[i][j] < minCe) {minCe = Ce[i][j];}
	    	}
	    }
	    //console.log(Ce,minCe);

	    for(var i = 0; i < controlGraph.nodes.length; i++) {
	    	controlGraph.distance[i] = [];
	    	for(var j = 0; j < controlGraph.nodes.length; j++) {
	    		var node1 = controlGraph.nodes[i], node2 = controlGraph.nodes[j];
	    		controlGraph.distance[i][j] = Math.sqrt( Math.pow(node1.x - node2.x,2) + Math.pow(node1.y - node2.y,2) );
	    		if( isNodeLink(i,j) ) { 
	    			//console.log(Ce[node1.line][node2.line] / minCe);
	    			controlGraph.distance[i][j] = controlGraph.distance[i][j] / Math.pow(Ce[node1.line][node2.line] / minCe, 1.2); 
	    		}
	    	}
	    }


	    //console.log(controlGraph);

	    var MDS = new MDSGraphBuilder(controlGraph);
		MDS.setArguments();
		MDS.MDS();
		//console.log(MDS);
		
		for(var i = 0; i < leftMatrixs.length; i++) {
			controlPoints[i] = [];
			for(var j = 0; j < leftMatrixs.length; j++) {
				controlPoints[i][j] = [];
			}
		}
		for(var i = fixedAmount; i < controlGraph.nodes.length; i ++) {
			var sourceM = controlGraph.nodes[i].linkedMatrixs[0], targetM = controlGraph.nodes[i].linkedMatrixs[1];
			controlPoints[sourceM][targetM].push({x: controlGraph.nodes[i].x, y: controlGraph.nodes[i].y, i: controlGraph.nodes[i].i});
			controlPoints[targetM][sourceM].push({x: controlGraph.nodes[i].x, y: controlGraph.nodes[i].y, i: controlGraph.nodes[i].i});
		}
		
	}
	setControlPoints();
	//console.log(controlPoints);

	function maRelation(sMatrix, tMatrix)
	{
		var x1 = sMatrix.projectPos.x,
		    y1 = sMatrix.projectPos.y,
		    x2 = tMatrix.projectPos.x,
		    y2 = tMatrix.projectPos.y;
		if( Math.abs(x1 - x2) > Math.abs(y1 - y2) )
		{
			if(x1 > x2) return "right";
			else return "left"
		}
		else
		{
			if(y1 > y2) return "down";
			else return "up";
		}
	}


	function moveY(m,index) {
		var len = 0;
		for(var k = 0; k < index; k++) {
			len += m.links[k][0].cellHeight * cellUnitLength;
		}
		len += m.links[index][0].cellHeight * cellUnitLength / 2;
		return len;
	}
	function moveX(m,index) {
		var len = 0;
		for(var k = 0; k < index; k++) {
			len += m.links[0][k].cellWidth * cellUnitLength;
		}
		len += m.links[0][index].cellWidth * cellUnitLength / 2;
		return len;
	}

	var linePath = d3.svg.line()
				.x(function(d) { return d.x; })
    			.y(function(d) { return d.y; })
    			.interpolate("bundle");
	var leftPathData = [], rightPathData = [];
	var leftLines, rightLines;
	
	function drawLinks()
	{
		for(i in leftLinks)
		{		
			var sourMatrix = leftMatrixs[leftLinks[i].sourceMatrix];
			var tarMatrix = leftMatrixs[leftLinks[i].targetMatrix];
			var sourIndex = leftLinks[i].sourIndex;
			var tarIndex = leftLinks[i].tarIndex;
			switch( maRelation(sourMatrix, tarMatrix) )
			{
				case "right":
				leftLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2, 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2 + moveY(sourMatrix,sourIndex)};
				leftLinks[i].targetXY = {x: tarMatrix.projectPos.x + tarMatrix.length / 2,
					y: tarMatrix.projectPos.y - tarMatrix.length / 2 +  moveY(tarMatrix,tarIndex)};
				break;
				
				case "left":
				leftLinks[i].sourceXY = {x: sourMatrix.projectPos.x + sourMatrix.length / 2, 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2 + moveY(sourMatrix,sourIndex)};
				leftLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2, 
					y: tarMatrix.projectPos.y - tarMatrix.length / 2 +  moveY(tarMatrix,tarIndex)};
				break;

				case "down":
				leftLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2 + moveX(sourMatrix,sourIndex), 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2};
				leftLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2 + moveX(tarMatrix,tarIndex), 
					y: tarMatrix.projectPos.y + tarMatrix.length / 2};
				break;

				case "up":
				leftLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2 + moveX(sourMatrix,sourIndex), 
					y: sourMatrix.projectPos.y + sourMatrix.length / 2};
				leftLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2 + moveX(tarMatrix,tarIndex), 
					y: tarMatrix.projectPos.y - tarMatrix.length / 2};
				break;
			}
		}

		for(i in rightLinks)
		{		
			var sourMatrix = rightMatrixs[rightLinks[i].sourceMatrix];
			var tarMatrix = rightMatrixs[rightLinks[i].targetMatrix];
			var sourIndex = rightLinks[i].sourIndex;
			var tarIndex = rightLinks[i].tarIndex;
			switch( maRelation(sourMatrix, tarMatrix) )
			{
				case "right":
				rightLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2, 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2 + moveY(sourMatrix,sourIndex)};
				rightLinks[i].targetXY = {x: tarMatrix.projectPos.x + tarMatrix.length / 2,
					y: tarMatrix.projectPos.y - tarMatrix.length / 2 +  moveY(tarMatrix,tarIndex)};
				break;
				
				case "left":
				rightLinks[i].sourceXY = {x: sourMatrix.projectPos.x + sourMatrix.length / 2, 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2 + moveY(sourMatrix,sourIndex)};
				rightLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2, 
					y: tarMatrix.projectPos.y - tarMatrix.length / 2 +  moveY(tarMatrix,tarIndex)};
				break;

				case "down":
				rightLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2 + moveX(sourMatrix,sourIndex), 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2};
				rightLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2 + moveX(tarMatrix,tarIndex), 
					y: tarMatrix.projectPos.y + tarMatrix.length / 2};
				break;

				case "up":
				rightLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2 + moveX(sourMatrix,sourIndex), 
					y: sourMatrix.projectPos.y + sourMatrix.length / 2};
				rightLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2 + moveX(tarMatrix,tarIndex), 
					y: tarMatrix.projectPos.y - tarMatrix.length / 2};
				break;
			}
		}

		leftPathData = [];
		for(i in leftLinks)
		{	var sourceM = leftLinks[i].sourceMatrix, targetM = leftLinks[i].targetMatrix;
			var sourceP = sourceM < targetM ? leftLinks[i].sourceXY : leftLinks[i].targetXY, targetP = sourceM < targetM ? leftLinks[i].targetXY : leftLinks[i].sourceXY;
			var pathPoints = [sourceP].concat(controlPoints[sourceM][targetM]);
			pathPoints.push(targetP);
			leftPathData.push(pathPoints);	
		}
		rightPathData = [];
		for(i in rightLinks)
		{	var sourceM = rightLinks[i].sourceMatrix, targetM = rightLinks[i].targetMatrix;
			var sourceP = sourceM < targetM ? rightLinks[i].sourceXY : rightLinks[i].targetXY, targetP = sourceM < targetM ? rightLinks[i].targetXY : rightLinks[i].sourceXY;
			var pathPoints = [sourceP].concat(controlPoints[sourceM][targetM]);
			pathPoints.push(targetP);
			rightPathData.push(pathPoints);	
		}

		leftLines = leftCanvas.append("g")
					.selectAll("path")
					.data(leftPathData)
					.enter()
					.append("path")
					//.attr("id", function(d, i) { return "link"; })
					.attr("d",linePath)
					.style("stroke", "#ff0000")
					.style("fill","none")
					.style("stroke-width", 2);
		leftCanvas.selectAll("path")
			.data(leftLinks)
			.attr("class", function(d) {return "link link" + d.source + " link" + d.target + " lobe" + d.sourceMatrix + "lobe" + d.targetMatrix + 
				" lobe" + d.sourceMatrix + " lobe" + d.targetMatrix;})
			.attr("weight", function(d) {return d.weight;})
			.style("stroke", function(d) {return fillScale(d.weight);})
			.style("opacity", function(d) { return opacityScale(d.weight); });

		rightLines = rightCanvas.append("g")
					.selectAll("path")
					.data(rightPathData)
					.enter()
					.append("path")
					//.attr("id", function(d, i) { return "path" + i; })
					.attr("d",linePath)
					.style("stroke", "#ff0000")
					.style("fill","none")
					.style("stroke-width", 2);
		rightCanvas.selectAll("path")
			.data(rightLinks)
			.attr("class", function(d) {return "link link" + d.source + " link" + d.target + " lobe" + d.sourceMatrix + "lobe" + d.targetMatrix + 
				" lobe" + d.sourceMatrix + " lobe" + d.targetMatrix;})
			.attr("weight", function(d) {return d.weight;})
			.style("stroke", function(d) {return fillScale(d.weight);})
			.style("opacity", function(d) { return opacityScale(d.weight); });
	}

	function whichBrain(l1,l2)
	{
		if(l1<10 && l2<10 && (l1%2==1 && l2%2==0 || l1%2==0 && l2%2==1)) return "leftRight";
		if(l1 % 2 == 1 || l2 % 2 == 1) return "leftBrain";
		if(l1 % 2 == 0 || l2 % 2 == 0) return "rightBrain";
		return "else";
	}

	function drawStraightLines()
	{
		for(i in leftLinks)
		{		
			var sourMatrix = leftMatrixs[leftLinks[i].sourceMatrix];
			var tarMatrix = leftMatrixs[leftLinks[i].targetMatrix];
			var sourIndex = leftLinks[i].sourIndex;
			var tarIndex = leftLinks[i].tarIndex;
			switch( maRelation(sourMatrix, tarMatrix) )
			{
				case "right":
				leftLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2, 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2 + moveY(sourMatrix,sourIndex)};
				leftLinks[i].targetXY = {x: tarMatrix.projectPos.x + tarMatrix.length / 2,
					y: tarMatrix.projectPos.y - tarMatrix.length / 2 +  moveY(tarMatrix,tarIndex)};
				break;
				
				case "left":
				leftLinks[i].sourceXY = {x: sourMatrix.projectPos.x + sourMatrix.length / 2, 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2 + moveY(sourMatrix,sourIndex)};
				leftLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2, 
					y: tarMatrix.projectPos.y - tarMatrix.length / 2 +  moveY(tarMatrix,tarIndex)};
				break;

				case "down":
				leftLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2 + moveX(sourMatrix,sourIndex), 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2};
				leftLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2 + moveX(tarMatrix,tarIndex), 
					y: tarMatrix.projectPos.y + tarMatrix.length / 2};
				break;

				case "up":
				leftLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2 + moveX(sourMatrix,sourIndex), 
					y: sourMatrix.projectPos.y + sourMatrix.length / 2};
				leftLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2 + moveX(tarMatrix,tarIndex), 
					y: tarMatrix.projectPos.y - tarMatrix.length / 2};
				break;
			}
		}

		for(i in rightLinks)
		{		
			var sourMatrix = rightMatrixs[rightLinks[i].sourceMatrix];
			var tarMatrix = rightMatrixs[rightLinks[i].targetMatrix];
			var sourIndex = rightLinks[i].sourIndex;
			var tarIndex = rightLinks[i].tarIndex;
			switch( maRelation(sourMatrix, tarMatrix) )
			{
				case "right":
				rightLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2, 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2 + moveY(sourMatrix,sourIndex)};
				rightLinks[i].targetXY = {x: tarMatrix.projectPos.x + tarMatrix.length / 2,
					y: tarMatrix.projectPos.y - tarMatrix.length / 2 +  moveY(tarMatrix,tarIndex)};
				break;
				
				case "left":
				rightLinks[i].sourceXY = {x: sourMatrix.projectPos.x + sourMatrix.length / 2, 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2 + moveY(sourMatrix,sourIndex)};
				rightLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2, 
					y: tarMatrix.projectPos.y - tarMatrix.length / 2 +  moveY(tarMatrix,tarIndex)};
				break;

				case "down":
				rightLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2 + moveX(sourMatrix,sourIndex), 
					y: sourMatrix.projectPos.y - sourMatrix.length / 2};
				rightLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2 + moveX(tarMatrix,tarIndex), 
					y: tarMatrix.projectPos.y + tarMatrix.length / 2};
				break;

				case "up":
				rightLinks[i].sourceXY = {x: sourMatrix.projectPos.x - sourMatrix.length / 2 + moveX(sourMatrix,sourIndex), 
					y: sourMatrix.projectPos.y + sourMatrix.length / 2};
				rightLinks[i].targetXY = {x: tarMatrix.projectPos.x - tarMatrix.length / 2 + moveX(tarMatrix,tarIndex), 
					y: tarMatrix.projectPos.y - tarMatrix.length / 2};
				break;
			}
		}

		leftLines = leftCanvas.append("g")
					.selectAll("line")
					.data(leftLinks)
					.enter().append("line")
					.attr("class", function(d) {return "link link" + d.source + " link" + d.target + " lobe" + d.sourceMatrix + "lobe" + d.targetMatrix + 
					" lobe" + d.sourceMatrix + " lobe" + d.targetMatrix + " " + whichBrain(d.sourceMatrix,d.targetMatrix);})			
					.attr("x1", function(d) {return d.sourceXY.x;}).attr("y1", function(d) {return d.sourceXY.y;})
					.attr("x2", function(d) {return d.targetXY.x;}).attr("y2", function(d) {return d.targetXY.y;})
					.style("stroke", function(d) {return fillScale(d.weight);})
					.style("opacity", function(d) { return opacityScale(d.weight); })
					.style("fill","none")
					.style("stroke-width", 2);
		rightLines = rightCanvas.append("g")
					.selectAll("line")
					.data(rightLinks)
					.enter().append("line")
					.attr("class", function(d) {return "link link" + d.source + " link" + d.target + " lobe" + d.sourceMatrix + "lobe" + d.targetMatrix + 
					" lobe" + d.sourceMatrix + " lobe" + d.targetMatrix + " " + whichBrain(d.sourceMatrix,d.targetMatrix);})			
					.attr("x1", function(d) {return d.sourceXY.x;}).attr("y1", function(d) {return d.sourceXY.y;})
					.attr("x2", function(d) {return d.targetXY.x;}).attr("y2", function(d) {return d.targetXY.y;})
					.style("stroke", function(d) {return fillScale(d.weight);})
					.style("opacity", function(d) { return opacityScale(d.weight); })
					.style("fill","none")
					.style("stroke-width", 2);

	}

	var drawLinkMode = 1;
	function drawLinkByMode()
	{
		if(drawLinkMode == 1) {
			drawStraightLines();
		}
		else if(drawLinkMode == 2) {
			drawLinks();
		}
	}
	drawLinkByMode();

	//label
	function drawLabels()
	{
		leftMatrixBodys.append("text")
		.attr("class", function(d,i) { return "lobeLabel" + i;} )
		.attr("x", function(d){ return (d.length - 6 *  d.name.length) / 2;})
		.attr("y", function(d) {return d.length + 10;})
		.text(function(d) {return d.name})
		.style("font-size", "12px")
		.style("font-weight" ,"bold")
		.style("fill", "#808080");

	rightMatrixBodys.append("text")
		.attr("class", function(d,i) { return "lobeLabel" + i;} )
		.attr("x", function(d){ return (d.length - 6 *  d.name.length) / 2;})
		.attr("y", function(d) {return d.length + 10;})
		.text(function(d) {return d.name})
		.style("font-size", "12px")
		.style("font-weight" ,"bold")
		.style("fill", "#808080");
	}
	drawLabels();
	
	//interaction
	function selectROI(p)
	{
		console.log("clicked");
		if(p.x == p.y) {
			var isSelected = d3.select(".roi" + p.source).classed("selected");
			d3.selectAll(".roi" + p.source).classed("selected", !isSelected);
			d3.selectAll(".link" + p.source).classed("selected", !isSelected);
			d3.selectAll(".link" + p.source).each(selectLinks);
		}
	}

	function selectLinks(link,i)
	{
		//console.log(d3.select(this).classed("selected"));
		if( d3.select(this).classed("selected") ) {
			d3.select(this).style("stroke", selectedFillScale(link.weight));
		}
		else {
			d3.select(this).style("stroke", fillScale(link.weight));
		}
	}

	//Data set option
	var dataBox = panel.append("div").attr("class","panelBox");
	dataBox.append("div").attr("class","panelLabel").html("Data Set:");
	var adBtn = dataBox.append("a")
		.attr("class","btn")
		.style("text-decoration", "none")
		.attr("href","http://vis.ios.ac.cn/brainnodetrix?data=AD")
		.html("AD");
	var cciBtn = dataBox.append("a")
		.attr("class","btn")
		.style("text-decoration", "none")
		.attr("href","http://vis.ios.ac.cn/brainnodetrix?data=CCI")
		.html("CCI");
	var uploadBtn = dataBox.append("button")
		.attr("class","btn")
		.html("Upload");

	if(fileName == "AD") {
		adBtn.classed("true-btn", true);
	}
	if(fileName == "CCI") {
		cciBtn.classed("true-btn", true);
	}

	// var focusBtn = panel.append("button")
	// 					.attr("class", "btn")
	// 					.attr("type", "button")
	// 					.html("FOCUS")
	// 					.on("click", focus);

	var isFocus = false;
	function focus() 
	{
		if(!isFocus)
		{
			d3.selectAll(".link").style("stroke", function(d) {return fillScale(d.weight);});;
			d3.selectAll(".link").classed("hide", true);
			d3.selectAll(".selected").classed("focused", true);
			isFocus = true;
			focusBtn.classed("true-btn", true);
		}
		else
		{
			d3.selectAll(".link").each(selectLinks);
			d3.selectAll(".focused").classed("focused", false);
			d3.selectAll(".link").classed("hide", false);
			isFocus = false;
			focusBtn.classed("true-btn", false);
		}
	}

	function reset()
	{
		d3.selectAll(".selected").classed("selected", false);
		d3.selectAll(".focused").classed("focused", false);
		d3.selectAll(".hide").classed("hide", false);
		d3.selectAll(".link").style("stroke", function(d) {return fillScale(d.weight);});;

		focusBtn.classed("true-btn", false);
		isFocus = false;

		//resetFill();
		//resetSlider();
	}
	//d3.select(divId).on("dblclick",reset);

	
	var lobe1 = -1, lobe2 = -1;
	lobe1 = Number( GetQueryString("lobe1") );
	lobe2 = Number( GetQueryString("lobe2") );
	var roi1 = -1, roi2 = -1;
	roi1 = Number( GetQueryString("roi1") );
	roi2 = Number( GetQueryString("roi2") );
	function setTask()
	{
		if(taskType == 1) {
			d3.selectAll(".roi" + roi1).classed("selected", true);
			d3.selectAll(".link").style("display", "none");
			d3.selectAll(".link" + roi1).style("display", "inline");
		}
		if(taskType == 2) {
			d3.selectAll(".roi" + roi1).classed("selected", true);
			d3.selectAll(".roi" + roi2).classed("selected", true);
			d3.selectAll(".link").style("display", "none");
			d3.selectAll(".link" + roi1).style("display", "inline");
			d3.selectAll(".link" + roi2).style("display", "inline");
		}
		if(taskType == 3) {
			d3.selectAll(".link").style("display", "none");
			d3.selectAll(".lobeFrame" + lobe1).style("stroke", "#4285f4");
			d3.selectAll(".lobeLabel" + lobe1).style("fill", "#4285f4");
		}
		if(taskType == 4) {
			//d3.selectAll(".cell").style("display", "none");
			d3.selectAll(".link").style("display", "none");
			d3.selectAll(".lobe" + lobe1 + "lobe" + lobe2).style("display", "inline");
		}
		if(taskType == 5) {
			d3.selectAll(".link").style("display", "none");
		}
		if(taskType == 6) {
			d3.selectAll(".cell").style("display", "none");
		}
	}
	//setTask();

	var viewBox = panel.append("div").attr("class","panelBox");
	viewBox.append("div").attr("class","panelLabel").html("View Projection:");
	var viewSelection = viewBox.append("select").attr("id","viewSelection");
	viewSelection.append("option").html("Axial");
	viewSelection.append("option").html("Left Sagittal ");
	viewSelection.append("option").html("Right Sagittal ");
	viewSelection.append("option").html("Coronal");

	function changeView()
	{
		var selectedIndex = document.getElementById("viewSelection").selectedIndex;
		//console.log(selectedIndex);
		
		if(selectedIndex == 0) {
			leftCanvas.select("image")
				.attr("width", width).attr("height", height)
				.attr("xlink:href", "pic/brain_xy.png");
			rightCanvas.select("image")
				.attr("width", width).attr("height", height)
				.attr("xlink:href", "pic/brain_xy.png");

			for(i in leftMatrixs) {
				leftMatrixs[i].projectPos.x = xScale(leftMatrixs[i].originPos.x);
				leftMatrixs[i].projectPos.y = yScale(leftMatrixs[i].originPos.y);
			}
			for(i in rightMatrixs) {
				rightMatrixs[i].projectPos.x = xScale(rightMatrixs[i].originPos.x);
				rightMatrixs[i].projectPos.y = yScale(rightMatrixs[i].originPos.y);
			}

			if(1) {
				leftMatrixs[9].projectPos.x = leftMatrixs[9].projectPos.x - 30;
				leftMatrixs[8].projectPos.x = leftMatrixs[8].projectPos.x + 30;
				leftMatrixs[10].projectPos.y = leftMatrixs[10].projectPos.y + 80;
				leftMatrixs[11].projectPos.y = leftMatrixs[11].projectPos.y - 20;

				rightMatrixs[9].projectPos.x = rightMatrixs[9].projectPos.x - 30;
				rightMatrixs[8].projectPos.x = rightMatrixs[8].projectPos.x + 30;
				rightMatrixs[10].projectPos.y = rightMatrixs[10].projectPos.y + 80;
				rightMatrixs[11].projectPos.y = rightMatrixs[11].projectPos.y - 20;
			}

			leftMatrixBodys.remove();
			rightMatrixBodys.remove();
			drawMatrixs();

			setLinks();
			setControlPoints();
			leftLines.remove();
			rightLines.remove();
			drawLinkByMode();
		}

		if(selectedIndex == 2) {
			leftCanvas.select("image")
				.attr("width", width).attr("height", 632*width/760)
				.attr("xlink:href", "pic/brain_yz.png");
			rightCanvas.select("image")
				.attr("width", width).attr("height", 632*width/760)
				.attr("xlink:href", "pic/brain_yz.png");

			var horizontal = d3.scale.linear()
                .domain([y_range.y1,y_range.y2])
                .range([55*width/905,width - 55*width/905]);
            var vertical = d3.scale.linear()
                .domain([z_range.z1,z_range.z2])
                .range([632*width/760 - 160*height/1030,160*height/1030]);


            for(i in leftMatrixs) {
				leftMatrixs[i].projectPos.x = horizontal(leftMatrixs[i].originPos.y);
				leftMatrixs[i].projectPos.y = vertical(leftMatrixs[i].originPos.z);
			}
			for(i in rightMatrixs) {
				rightMatrixs[i].projectPos.x = horizontal(rightMatrixs[i].originPos.y);
				rightMatrixs[i].projectPos.y = vertical(rightMatrixs[i].originPos.z);
			}

			leftMatrixBodys.remove();
			rightMatrixBodys.remove();
			drawMatrixs();
			d3.selectAll(".rightMatrix").style("display","none");
			d3.select("#leftMatrix11").style("display","none");
			d3.select("#rightMatrix11").style("display","none");

			setLinks();
			leftLines.remove();
			rightLines.remove();
			drawStraightLines();
			d3.selectAll(".link").style("display","none");
			d3.selectAll(".leftBrain").style("display","inline");
		}

		if(selectedIndex == 1) {
			leftCanvas.select("image")
				.attr("width", width).attr("height", 632*width/760)
				.attr("xlink:href", "pic/brain_yz.png");
			rightCanvas.select("image")
				.attr("width", width).attr("height", 632*width/760)
				.attr("xlink:href", "pic/brain_yz.png");

			var horizontal = d3.scale.linear()
                .domain([y_range.y1,y_range.y2])
                .range([55*width/905,width - 55*width/905]);
            var vertical = d3.scale.linear()
                .domain([z_range.z1,z_range.z2])
                .range([632*width/760 - 160*height/1030,160*height/1030]);


            for(i in leftMatrixs) {
				leftMatrixs[i].projectPos.x = horizontal(leftMatrixs[i].originPos.y);
				leftMatrixs[i].projectPos.y = vertical(leftMatrixs[i].originPos.z);
			}
			for(i in rightMatrixs) {
				rightMatrixs[i].projectPos.x = horizontal(rightMatrixs[i].originPos.y);
				rightMatrixs[i].projectPos.y = vertical(rightMatrixs[i].originPos.z);
			}

			leftMatrixBodys.remove();
			rightMatrixBodys.remove();
			drawMatrixs();
			d3.selectAll(".leftMatrix").style("display","none");
			d3.select("#leftMatrix11").style("display","none");
			d3.select("#rightMatrix11").style("display","none");

			setLinks();
			leftLines.remove();
			rightLines.remove();
			drawStraightLines();
			d3.selectAll(".link").style("display","none");
			d3.selectAll(".rightBrain").style("display","inline");
		}

		if(selectedIndex == 3) {
			leftCanvas.select("image")
				.attr("width", width).attr("height", 507*width/633)
				.attr("xlink:href", "pic/brain_xz.png");
			rightCanvas.select("image")
				.attr("width", width).attr("height", 507*width/633)
				.attr("xlink:href", "pic/brain_xz.png");

			var	horizontal = d3.scale.linear()
	                .domain([x_range.x1,x_range.x2])
	                .range([55*width/905,width - 55*width/905]);
	        var vertical = d3.scale.linear()
	                .domain([z_range.z1,z_range.z2])
	                .range([507*width/633 - 30*height/1030,30*height/1030]);

			for(i in leftMatrixs) {
				leftMatrixs[i].projectPos.x = horizontal(leftMatrixs[i].originPos.x);
				leftMatrixs[i].projectPos.y = vertical(leftMatrixs[i].originPos.z);
			}
			for(i in rightMatrixs) {
				rightMatrixs[i].projectPos.x = horizontal(rightMatrixs[i].originPos.x);
				rightMatrixs[i].projectPos.y = vertical(rightMatrixs[i].originPos.z);
			}

			leftMatrixBodys.remove();
			rightMatrixBodys.remove();
			drawMatrixs();

			setLinks();
			setControlPoints();
			leftLines.remove();
			rightLines.remove();
			drawLinkByMode();
		}
		drawLabels();
	}
	viewSelection.on("change", changeView);

	var kBox = panel.append("div").attr("class","panelBox");
	kBox.append("div").attr("class","panelLabel").attr("id", "kText").html("#ROI_block: 70");
	kBox.append("div")
		.attr("id", "kSlider");
	$("#kSlider").slider({
		min: 0,
		max: roiCluster.length - 1,
		slide: function(event, ui) {
			$("#kText").html("#ROI_block:: " + (70 - ui.value));
		},
		stop: function(event, ui) {
			$("#kText").html("#ROI_block:: " + (70 - ui.value));
			clusK = ui.value;
			mergeNodes();
			setMatrixs();
			changeView();

			$("#legendText").html("Color Map: " + 0 + "<<" + maxWeight + "==" + maxWeight);
			$("#slider").slider({
				max: maxWeight,
				values: [0, maxWeight]
			});
		}
	});

	var sliderBox = panel.append("div").attr("class","panelBox");
	sliderBox.append("div").attr("class","panelLabel").attr("id", "legendText").html("Color Map: 0<<" + maxWeight + "==" + maxWeight);
	sliderBox.append("div")
		.attr("id", "slider");
	function setSlider()
	{
		$("#slider").slider({
			range: true,
			min: 0,
			max: maxWeight,
			values: [0, maxWeight],
			slide: function(event, ui) {
				$("#legendText").html("Color Map: " + ui.values[0] + "<<" + ui.values[1] + "==" + maxWeight);
				fillMin = ui.values[0];
				fillMax = ui.values[1];
				d3.selectAll(".cell")
					.style("fill", function(d) { return fillScale(d.weight); });
				d3.selectAll(".link")
					.style("stroke", function(d) { return fillScale(d.weight); })
					.style("opacity", function(d) { return opacityScale(d.weight); });

				var redDivWidth = parseInt(d3.select("#slider").style("width")) - parseInt(d3.select("#rightSpan").style("left"));
				legendRedDiv.style("width", redDivWidth + "px");
			},
			stop: function(event, ui) {
				var redDivWidth = parseInt(d3.select("#slider").style("width")) - parseInt(d3.select("#rightSpan").style("left"));
				legendRedDiv.style("width", redDivWidth + "px");
			}
		});
		$("#slider span:first").attr("id", "leftSpan");
		$("#slider span:last").attr("id", "rightSpan");
		$("#slider div").attr("id", "sliderRange");
		var legendRedDiv = d3.select("#slider").append("div").attr("id", "redDiv");
	}
	setSlider();
	
	function binSelect() 
	{
		if($("#binSelector").is(":checked"))
		{
			$("#slider").remove();
			$("#legendText").after("<div id='slider'></div>");
			$("#slider").slider({
				min: 0,
				max: maxWeight,
				slide: function(event, ui) {
					$("#legendText").html("Color Map: " + ui.value + "<<" + ui.value + "==" + maxWeight);
					fillMin = ui.value;
					fillMax = ui.value;
					d3.selectAll(".cell")
						.style("fill", function(d) { return fillScale(d.weight); });
					d3.selectAll(".link")
						.style("stroke", function(d) { return fillScale(d.weight); })
						.style("opacity", function(d) { return opacityScale(d.weight); });
				}
				
			});
		}
		else
		{
			$("#slider").remove();
			$("#legendText").after("<div id='slider'></div>");
			setSlider();
		}
		reFill();
	}
	sliderBox.append("input").attr("id", "binSelector").attr("type","checkbox").on("change",binSelect);
	sliderBox.append("span").attr("class","panelLabel").html("Binary Selector");



	var isCompared = 0;
	function compare()
	{
		if(isCompared)
		{
			compareBtn.classed("true-btn",false);
			loadData();
			isCompared = 0;		
		}
		else
		{	
			compareBtn.classed("true-btn",true);
			for(var i = 0; i < nodes.length; i++) {
				for(var j = i+1; j < nodes.length; j ++) {
					if(adjMatrix1[i][j] >= adjMatrix2[i][j]) {
						adjMatrix1[i][j] = adjMatrix1[i][j] - adjMatrix2[i][j];
						adjMatrix2[i][j] = 0;
						adjMatrix1[j][i] = adjMatrix1[i][j] - adjMatrix2[i][j];
						adjMatrix2[j][i] = 0;
					}
					else {
						adjMatrix2[i][j] = adjMatrix2[i][j] - adjMatrix1[i][j];
						adjMatrix1[i][j] = 0;
						adjMatrix2[j][i] = adjMatrix2[i][j] - adjMatrix1[i][j];
						adjMatrix1[j][i] = 0;
					}
				}
			}
			isCompared = 1;
		}
		mergeNodes();
		setMatrixs();
		changeView();
		$("#slider").slider({
			max: fillMax,
			values: [0, fillMax]
		});
		$("#legendText").html("Color Map: " + 0 + "<<" + maxWeight + "==" + maxWeight);
	}

	function clickReorder()
	{
		if(isReorder == 0) {
			isReorder = 1;
			reorderBtn.classed("true-btn",true);
		}
		else if(isReorder == 1) {
			isReorder = 0;
			reorderBtn.classed("true-btn",false);
		}
		mergeNodes();
		setMatrixs();
		changeView();
	}

	var opsBox = panel.append("div").attr("class","panelBox");
	opsBox.append("div").attr("class","panelLabel").html("Matrix Ops:");
	var compareBtn = opsBox.append("button")
		.attr("class","btn")
		.html("Contrast")
		.on("click",compare);
	var reorderBtn = opsBox.append("button")
		.attr("class","btn")
		.html("Reorder")
		.on("click",clickReorder);

	function changeBundle1()
	{
		drawLinkMode = 1;
		noneBtn.classed("true-btn",true);
		semBtn.classed("true-btn",false);
		//geoBtn.classed("true-btn",false);
		leftLines.remove();
		rightLines.remove();
		drawStraightLines();
		// document.getElementById("trkSelection").options[0].selected = true;
		// trkSelection.attr("disabled","disabled");
		// trkSelection.classed("disabledSel",true);
		// trackText.style("color","gray");		
	}
	function changeBundle2()
	{
		drawLinkMode = 2;
		noneBtn.classed("true-btn",false);
		semBtn.classed("true-btn",true);
		//geoBtn.classed("true-btn",false);
		leftLines.remove();
		rightLines.remove();
		setControlPoints();
		drawLinks();
		// document.getElementById("trkSelection").options[0].selected = true;
		// trkSelection.attr("disabled","disabled");
		// trkSelection.classed("disabledSel",true);
		// trackText.style("color","gray");
	}
	function changeBundle3()
	{
		noneBtn.classed("true-btn",false);
		semBtn.classed("true-btn",true);
		geoBtn.classed("true-btn",false);
		geoBtn.style("background-color","#4285f4");
		trkSelection.style("background-color","#4285f4");
		$("#trkSelection").attr("disabled",false);
		trkSelection.classed("disabledSel",false);
		trackText.style("color","black");
	}

	var bundleBox = panel.append("div").attr("class","panelBox");
	bundleBox.append("div").attr("class","panelLabel").html("Edge Bundling:");
	var noneBtn = bundleBox.append("button")
		.attr("class","btn true-btn")
		.html("None")
		.on("click",changeBundle1);
	var semBtn = bundleBox.append("button")
		.attr("class","btn")
		.html("Semantic")
		.on("click",changeBundle2);

	/*
	var geoBtn = bundleBox.append("button")
		.attr("class","btn")
		.html("Geometric")
		.on("click",changeBundle3);

	var trackText = bundleBox.append("div").attr("class","panelLabel").html("By track:").style("color","gray");
	var trkSelection = bundleBox.append("select").attr("class", "disabledSel").attr("id", "trkSelection").attr("disabled","disabled");
	trkSelection.append("option").html("default");
	trkSelection.append("option").html("ic_temporal");
	trkSelection.append("option").html("ic_occipital");
	trkSelection.append("option").html("atr_l");
	trkSelection.append("option").html("atr_r");
	trkSelection.append("option").html("cgc_l");
	trkSelection.append("option").html("cgc_r");
	trkSelection.append("option").html("cst_l");
	trkSelection.append("option").html("cst_r");
	
	function drawTrack(dataName) 
	{
		d3.json(dataName, function(error, nodes) {
			if(error)
				console.log(error);

			var trackNodes = rightCanvas.append("g").selectAll(".trackNode")
			    .data(nodes)
			    .enter().append("circle")
			    .attr("id", function(d,i) {return "trackNode" + d.i;})
			    .attr("cx", function(d) {return xScale(d.x) - 240;})
			    .attr("cy", function(d) {return yScale(d.y) - 200;})
			    .attr("r", 2)
			    .style("fill", "#00f");
		});
	}

	function changeTrack()
	{
		var selectedIndex = document.getElementById("trkSelection").selectedIndex;
		
		if(selectedIndex == 0) {
			setControlPoints();
			leftLines.remove();
			rightLines.remove();
			drawLinks();
		}

		if(selectedIndex == 1) {
			d3.json("data/trk7to10.json", function(error, nodes1) {
			d3.json("data/trk6to10.json", function(error2, nodes2) {
				for(i in nodes1) {
					nodes1[i].x = xScale(nodes1[i].x) - 240;
					nodes1[i].y = yScale(nodes1[i].y) - 200;
				}
				controlPoints[7][10] = nodes1;
				controlPoints[10][7] = nodes1;
				for(i in nodes2) {
					nodes2[i].x = xScale(nodes2[i].x) - 240;
					nodes2[i].y = yScale(nodes2[i].y) - 200;
				}
				controlPoints[6][10] = nodes2;
				controlPoints[10][6] = nodes2;

				leftLines.remove();
				rightLines.remove();
				drawLinks();
				d3.selectAll(".lobe10lobe7").style("stroke", function(d) {return "#00f";});
				d3.selectAll(".lobe10lobe6").style("stroke", function(d) {return "#00f";});

				leftMatrixBodys.remove();
				rightMatrixBodys.remove();
				drawMatrixs();
				drawLabels();
			});
			});
		}

		if(selectedIndex == 2) {
			d3.json("data/trk4to10.json", function(error, nodes1) {
			d3.json("data/trk5to10.json", function(error2, nodes2) {
				for(i in nodes1) {
					nodes1[i].x = xScale(nodes1[i].x) - 240;
					nodes1[i].y = yScale(nodes1[i].y) - 200;
				}
				controlPoints[4][10] = nodes1;
				controlPoints[10][4] = nodes1;
				for(i in nodes2) {
					nodes2[i].x = xScale(nodes2[i].x) - 240;
					nodes2[i].y = yScale(nodes2[i].y) - 200;
				}
				controlPoints[5][10] = nodes2;
				controlPoints[10][5] = nodes2;

				leftLines.remove();
				rightLines.remove();
				drawLinks();
				d3.selectAll(".lobe10lobe4").style("stroke", function(d) {return blueFillScale(d.weight);});
				d3.selectAll(".lobe10lobe5").style("stroke", function(d) {return blueFillScale(d.weight);});
			});
			});
		}
	}
	trkSelection.on("change", changeTrack);

	// var roiListBox = panel.append('div').attr("class", "panelBox");
	// roiListBox.append("div").html("ROI List:");
	// var roiList = roiListBox.append("ul");
	// for(var i = 1; i <= 35; i++)
	// {
	// 	roiList.append("li").style("font-size","12px").html(i);
	// }
	*/

});
});
});
});
});
});