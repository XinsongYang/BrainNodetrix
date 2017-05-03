//MatrixBuilder

function MatrixBuilder(data){
    this._data = data;
    this._rows = data.length;
    this._cols = data[0].length;
}

MatrixBuilder.prototype.add = function(matrix){
    if ((this._rows != matrix.length)||(this._cols != matrix[0].length)) {
        throw new Error('Invalid dimensions');
    }
    for (var row = 0; row < this._rows; row++) {
        for (var col = 0; col < this._cols; col++) {
            this._data[row][col]+= matrix[row][col];
        }
    }
};
MatrixBuilder.prototype.multiple = function(matrix){
// Throw an error if there are invalid dimensions (matrix one columns
// must equal matrix two rows)
    if (this._cols !== matrix.length) {
        throw new Error('Invalid dimensions');
    }
// Create the product matrix
    var product = new Array();
// Compute the product
    for (var row = 0; row < this._rows; row++) {
        product[row] = new Array();
        for (var col = 0; col < matrix[0].length; col++) {
            var square = 0;
            for (var i = 0; i < this._cols; i++) {
                square = square+ this._data[row][i] * matrix[i][col];
            }
            product[row][col] = square;
        }
    }
    this._rows = product.length;this._cols = product[0].length;
    this._data = product;
};

/*
MatrixBuilder.prototype.multiple = function(matrix){
// Throw an error if there are invalid dimensions (matrix one columns
// must equal matrix two rows)
    if (this._cols !== matrix.length) {
        throw new Error('Invalid dimensions');
    }
// Create the product matrix
    var product = new Array();
// Compute the product
    for (var row = 0; row < this._rows; row++) {
        product[row] = new Array();
        for (var col = 0; col < matrix[0].length; col++) {
            var square = 0;
            for (var i = 0; i < this._cols; i++) {
                square = square+ this._data[row][i] * matrix[i][col];
            }
            product[row][col] = square;
        }
    }
    return product;
};
*/
MatrixBuilder.prototype.inverse = function(){
    // Throw an error if the matrix is either not square or is singular
    if (!this.isSquare() || this.isSingular()) {
        throw new Error('The matrix must be a square matrix with a size of at least 2x2');
    }
// Declare variables
    var ratio;
    var a;
    var n = this._rows;
// Put an identity matrix to the right of matrix
    this._cols = 2 * n;
    for (var i = 0; i < n; i++) {
        for (var j = n; j < 2 * n; j++) {
            if (i === (j - n)) {
                this._data[i][j] = 1;
            }
            else {
                this._data[i][j] = 0;
            }
        }
    }
    for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
            if (i !== j) {
                ratio = this._data[j][i] / this._data[i][i];
                for (var k = 0; k < 2 * n; k++) {
                    this._data[j][k] -= ratio * this._data[i][k];
                }
            }
        }
    }
    for(i = 0; i < n; i++){
        for (j = 0; j <  n; j++){
            if(i != j)this._data[i][j] = 0;
        }
    }
    for (i = 0; i < n; i++) {
        a = this._data[i][i];
        for (j = 0; j < 2 * n; j++) {
            this._data[i][j] = this._data[i][j]/a;
        }
    }
// Rmove the left-hand identity matrix
    for (i = 0; i < n; i++) {
        this._data[i].splice(0, n);
    }
    this._cols = n;
    return this._data;
};
MatrixBuilder.prototype.getData = function(){
    return this._data;
};
MatrixBuilder.prototype.isSquare = function(){
    return this._rows === this._cols;
};
MatrixBuilder.prototype.isSingular = function(){
    return this._rows === 1 && this._cols === 1;
};
