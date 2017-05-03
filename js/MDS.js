//MDSGraphBuilder;

function MDSGraphBuilder(data){
    this._data = data;
    this._distance = data.distance;
}

MDSGraphBuilder.prototype.MDS = function(){
    this.setLaplacianZ(this._position);
    var matrixMul1 = new MatrixBuilder(this._inverseLaplcianW);
    matrixMul1.multiple(this._LaplacianZ);
    //matrixMul1._data[1] = 1;
    var firstNode = [];firstNode[0] = this._position[0];
    matrixMul1.multiple(this._position.slice(1,this._position.length));
    var newPosition = matrixMul1.getData();
        /*
        var matrixMul1 = (new MatrixBuilder(this._inverseLaplcianW)).multiple(this._LaplacianZ);
        var firstNode = [];firstNode[0] = this._position[0];
        var newPosition = (new MatrixBuilder(matrixMul1)).multiple(this._position.slice(1,this._position.length));
        */
    newPosition = firstNode.concat(newPosition);

    // set fixed nodes
    var nodes = this._data.nodes;
    this._fixed.forEach(function(d,i) {
        if(d == 1) {
            newPosition[i][0] = nodes[i].fx;
            newPosition[i][1] = nodes[i].fy;
        }
    });

    var stress = 0,newStress = 0;
    var length = this._data.nodes.length;
    for(var i = 0 ; i < length ; i++){
        for(var j = i + 1 ; j < length ; j++){
            if(this._fixed[i] && this._fixed[j]) {
                continue;
            }
            var PoI = this._position[i],PoJ = this._position[j],dis = 0;
            for(var k = 0 ; k < PoI.length ; k++){
                dis = dis + Math.pow(PoI[k] - PoJ[k],2);
            }
            stress = stress + this._W[i][j]*Math.pow(Math.sqrt(dis) - this._distance[i][j],2);
            PoI = newPosition[i];PoJ = newPosition[j];dis = 0;
            for(k = 0 ; k < PoI.length ; k++){
                dis = dis + Math.pow(PoI[k] - PoJ[k],2);
            }
            newStress = newStress + this._W[i][j]*Math.pow(Math.sqrt(dis) - this._distance[i][j],2);
        }
    }

    if((stress-newStress)/stress > 0.001){
        for(i = 0 ; i < this._LaplacianZ.length ; i ++){
            for(j = 0 ; j < this._LaplacianZ.length ; j++){
                this._LaplacianZ[i][j] = 0;
            }
        }
        this._position = newPosition;
        this.MDS();
    }else{
        this._position = newPosition;
        this._domain = {"minX":1000,"minY":1000,"maxX":0,"maxY":0,"width":0,"height":0};
        this.projection2();
        //console.log("stress:",stress);
    }
};
MDSGraphBuilder.prototype.setArguments = function(){
    this.edgeLength();
    //this._distance = (new FloydWarshall(this._adjEdgeLength)).floydWarshall();
    this.setW();
    this.setLaplacianW();
    this._inverseLaplcianW = (new MatrixBuilder(this._LaplacianW)).inverse();
    /*
    var a = (new MatrixBuilder([[0.53,-0.1,-0.426]
        ,[-0.1,0.86,-0.06],[-0.426,-0.06,0.5856]])).inverse();
    var b = (new MatrixBuilder(a)).multiple(([[0.53,-0.1,-0.426]
        ,[-0.1,0.86,-0.06],[-0.426,-0.06,0.5856]]));
    var tem = [];
    for(var i = 0 ; i < this._LaplacianW.length ; i++){
        tem[i] = [];
        for(var j = 0 ; j < this._LaplacianW.length ; j++){
            tem[i][j] = this._LaplacianW[i][j];
        }
    }
    this._inverseLaplcianW = (new MatrixBuilder(this._LaplacianW)).inverse();
    var ba = (new MatrixBuilder(tem)).multiple(this._inverseLaplcianW);
    */
};
MDSGraphBuilder.prototype.setW = function(){
    for(var i = 0 ; i < this._W.length ; i++){
        for(var j = 0 ; j < i ; j++){
            var w = Math.pow(this._distance[i][j],-2);
            this._W[i][j] = w;
            this._W[j][i] = w;
        }
    }
};
MDSGraphBuilder.prototype.setLaplacianW = function(){
    for(var i = 1 ; i < this._LaplacianW.length+1 ; i++){
        this._LaplacianW[i-1][i-1]+= this._W[i][0];
        for(var j = 1 ; j < i ; j++){
            this._LaplacianW[i-1][j-1] = - this._W[i][j];
            this._LaplacianW[j-1][i-1] = - this._W[j][i];
            this._LaplacianW[i-1][i-1]+= this._W[i][j];
            this._LaplacianW[j-1][j-1]+= this._W[j][i];
        }
    }
};
MDSGraphBuilder.prototype.setLaplacianZ = function(position){
    for(var i = 1 ; i < this._LaplacianZ.length+1 ; i++){
        for(var j = 1 ; j < i ; j++){
            var PoI = position[i],PoJ = position[j],dis = 0;
            for(var k = 0 ; k < PoI.length ; k++){
                dis = dis + Math.pow(PoI[k] - PoJ[k],2);
            }
            var tem = - this._W[i][j]*this._distance[i][j]
                *Math.pow(Math.sqrt(dis),-1);
            this._LaplacianZ[i-1][j-1] = tem;
            this._LaplacianZ[j-1][i-1] = tem;
            this._LaplacianZ[i-1][i-1]-= tem;
            this._LaplacianZ[j-1][j-1]-= tem;
        }
        PoI = position[i];PoJ = position[0];dis = 0;
        for(k = 0 ; k < PoI.length ; k++){
            dis = dis + Math.pow(PoI[k] - PoJ[k],2);
        }
        tem = - this._W[i][0]*this._distance[i][0]
            *Math.pow(Math.sqrt(dis),-1);
        this._LaplacianZ[i-1][i-1]-= tem;
    }
};
MDSGraphBuilder.prototype.edgeLength = function(){
    this.initAdjMatrix();
    var nodes = this._data.nodes,links = this._data.links,that = this;

    links.forEach(function(d){
        //var targetId = d.target.id,sourceId = d.source.id;
        var targetId = d.target,sourceId = d.source;
        var targetIndex = that._nodeIndex[targetId],sourceIndex = that._nodeIndex[sourceId];
        if(!that._adjMatrix[targetIndex][sourceIndex]){
            that._adjMatrix[targetIndex][sourceIndex] = 1;
            that._adjMatrix[sourceIndex][targetIndex] = 1;
            that._adjNodesNum[targetId][sourceId] = 1;
            that._adjNodesNum[sourceId][targetId] = 1;
        }else{
            that._adjNodesNum[targetId][sourceId] ++;
            that._adjNodesNum[sourceId][targetId] ++;
        }
    });

    for(var i = 0 ; i < this._adjMatrix.length ; i++){
        for(var j = i ; j < this._adjMatrix.length ; j++){
            var MatrixI = this._adjMatrix[i],MatrixJ = this._adjMatrix[j];
            if(MatrixI[j]){
                var union = 0,conjunction = 0;
                for(var k = 0 ; k < MatrixI.length ; k++){
                    if(MatrixI[k]||MatrixJ[k]){
                        union++;
                    }
                    if(MatrixI[k]&&MatrixJ[k]){
                        conjunction++;
                    }
                }
                /*
                this._adjEdgeLength[i][j] = (union - conjunction)
                    /Math.sqrt(this._adjNodesNum[nodes[i].id][nodes[j].id]);
                this._adjEdgeLength[j][i] = (union - conjunction)
                    /Math.sqrt(this._adjNodesNum[nodes[i].id][nodes[j].id]);
                    */
                //this._adjEdgeLength[i][j] = (union - conjunction);
                //this._adjEdgeLength[j][i] = (union - conjunction);
                this._adjEdgeLength[i][j] = 100;
                this._adjEdgeLength[j][i] = 100;
            }
        }
    }
};
MDSGraphBuilder.prototype.initAdjMatrix = function(){
    this._nodeIndex = {};this._adjMatrix =[];this._adjNodesNum = {};
    this._adjEdgeLength = [];this._LaplacianW = [];
    this._LaplacianZ = [];this._W = [];this._position = [];
    var nodes = this._data.nodes,length = nodes.length,that = this;
    this._fixed = [];

    nodes.forEach(function(d,i){
        if(d.isFixed) {
            d.fx = d.x;
            d.fy = d.y;
            that._fixed[i] = 1;
        }
        else that._fixed[i] = 0;
        that._nodeIndex[d.id] = i;
        that._adjNodesNum[d.id] = {};
        that._position[i] = [];
        that._position[i].push(d.x);
        that._position[i].push(d.y);
        var matrixX = [],matrixL = [],matrixD = [],matrixLW = [],matrixLZ = [],matrixW = [];
        for(var j = 0 ; j < length ; j++){
            matrixW[j] = 0;
            matrixX[j] = 0;
            if(j < length-1){
                matrixLW[j] = 0;
                matrixLZ[j] = 0;
            }
            matrixL[j] = NaN;
            matrixD[j] = NaN;
        }
        that._adjEdgeLength.push(matrixL);
        that._adjMatrix.push(matrixX);
        //that._distance.push(matrixD);
        if(i>0){
            that._LaplacianW.push(matrixLW);
            that._LaplacianZ.push(matrixLZ);
        }
        that._W.push(matrixW);
    })
};
MDSGraphBuilder.prototype.projection = function(){
    var domain = this._domain,that = this;

    this._position.forEach(function(d){
        domain.minX = d[0] < domain.minX ? d[0] : domain.minX;
        domain.minY = d[1] < domain.minY ? d[1] : domain.minY;
        domain.maxX = d[0] > domain.maxX ? d[0] : domain.maxX;
        domain.maxY = d[1] > domain.maxY ? d[1] : domain.maxY;
    });
    domain.width = domain.maxX - domain.minX;
    domain.height = domain.maxY - domain.minY;

    var ratio = domain.width/vjitWidth > domain.height/ vjitHeight
        ? domain.width/vjitWidth : domain.height/ vjitHeight;
    var xMove = (vjitWidth - domain.minX - domain.maxX)/2,
        yMove = (vjitHeight - domain.minY - domain.maxY)/2;

    this._position.forEach(function(d){
        var newX = d[0] + xMove,newY = d[1] + yMove;
        d[0] = vjitWidth/2 - (vjitWidth/2 - newX)/ratio;
        d[1] = vjitHeight/2 - (vjitHeight/2 - newY)/ratio;
    });

    this._data.nodes.forEach(function(d,i){
        d.x = that._position[i][0];
        d.y = that._position[i][1];
    })
};

MDSGraphBuilder.prototype.projection2 = function(){
    var that = this;

    this._data.nodes.forEach(function(d,i){
        d.x = that._position[i][0];
        d.y = that._position[i][1];
    })
};