import { Collection } from "./collection.js";

export class Matrix extends Collection {
    
    // Initialize a Matrix with a 2D array of numbers or a Collection instance
    // accounts that all rows of the matrix must be of the same length
    // when matrix rows are not of the same length, they are filled with 0's
    constructor(matrix) {
        super();

        if (matrix instanceof Collection) {
            matrix = matrix.items;
        }

        const maxRowLength = Math.max(...matrix.map((row) => row.length));
        this.items = matrix.map((row) => {
            while (row.length < maxRowLength) {
                row.push(0);
            }
            return row;
        });
    }

    // Transpose the Matrix (swap rows and columns)
    transpose() {
        const transposed = this.items[0].map((col, i) =>
            this.items.map((row) => row[i])
        );
        return new Matrix(transposed);
    }

    // Multiply the Matrix by another Matrix or a scalar value
    multiply(other) {
        if (other instanceof Matrix) {
            if (this.items[0].length !== other.items.length) {
                throw new Error("Invalid matrix dimensions for multiplication");
            }

            const product = this.items.map((row) => {
                return other.transpose().items.map((col) => {
                    return row.reduce(
                        (total, value, i) => total + value * col[i],
                        0
                    );
                });
            });

            return new Matrix(product);
        } else {
            const product = this.items.map((row) =>
                row.map((value) => value * other)
            );
            return new Matrix(product);
        }
    }

    // Add the Matrix to another Matrix
    add(other) {
        if (
            this.items.length !== other.items.length ||
            this.items[0].length !== other.items[0].length
        ) {
            throw new Error("Invalid matrix dimensions for addition");
        }

        const sum = this.items.map((row, i) =>
            row.map((value, j) => value + other.items[i][j])
        );
        return new Matrix(sum);
    }

    // Subtract another Matrix from the Matrix
    subtract(other) {
        if (
            this.items.length !== other.items.length ||
            this.items[0].length !== other.items[0].length
        ) {
            throw new Error("Invalid matrix dimensions for subtraction");
        }

        const difference = this.items.map((row, i) =>
            row.map((value, j) => value - other.items[i][j])
        );
        return new Matrix(difference);
    }
    // Get the determinant of the Matrix (only works for square matrices)
    determinant() {
        if (this.items.length !== this.items[0].length) {
            throw new Error("Matrix must be square to calculate determinant");
        }

        if (this.items.length === 2) {
            return (
                this.items[0][0] * this.items[1][1] -
                this.items[0][1] * this.items[1][0]
            );
        }

        let determinant = 0;
        for (let i = 0; i < this.items[0].length; i++) {
            const cofactor = new Matrix(
                this.items
                    .slice(1)
                    .map((row) => row.slice(0, i).concat(row.slice(i + 1)))
            );
            determinant +=
                (i % 2 === 0 ? 1 : -1) *
                this.items[0][i] *
                cofactor.determinant();
        }
        return determinant;
    }

    // todo add
    pow(n) {

    }

    // todo add
    factorial(n) {

    }

    // Get the number of columns in the Matrix
    col() {
        return this.items[0].length;
    }

    // Get the number of rows in the Matrix
    row() {
        return this.items.length;
    }

    // Get the dimensions of the Matrix (number of rows and columns)
    dimensions() {
        return { rows: this.row(), cols: this.col() };
    }

    // Transform the Matrix into a square Matrix, filling missing values with 0's
    toSquare() {
        const maxDimension = Math.max(this.row(), this.col());
        const squareMatrix = new Array(maxDimension)
            .fill(0)
            .map(() => new Array(maxDimension).fill(0));
        this.items.forEach((row, i) => {
            row.forEach((value, j) => {
                squareMatrix[i][j] = value;
            });
        });
        return new Matrix(squareMatrix);
    }

    // Get the value at a specific position in the Matrix
    get(row, col) {
        if (row >= this.row() || col >= this.col()) {
            throw new Error("Invalid matrix position");
        }
        return this.items[row][col];
    }

    // Set the value at a specific position in the Matrix
    set(row, col, value) {
        if (row >= this.row() || col >= this.col()) {
            throw new Error("Invalid matrix position");
        }
        this.items[row][col] = value;
    }

    // Add a row to the Matrix
    addRow(row) {
        if (!row) {
            row = new Array(this.col()).fill(0);
        }
        if (row.length > this.col()) {
            row = row.slice(0, this.col());
        }
        if (row.length < this.col()) {
            while (row.length < this.col()) {
                row.push(0);
            }
        }
        this.items.push(row);
    }

    // Add a column to the Matrix
    addCol(col) {
        if (!col) {
            col = new Array(this.row()).fill(0);
        }
        if (col.length > this.row()) {
            col = col.slice(0, this.row());
        }
        if (col.length < this.row()) {
            while (col.length < this.row()) {
                col.push(0);
            }
        }
        this.items = this.items.map((row, i) => row.concat(col[i]));
    }

    // Check if the Matrix is a square matrix
    isSquare() {
        return this.items.length === this.items[0].length;
    }

    // Check if the Matrix is a diagonal matrix
    isDiagonal() {
        if (!this.isSquare()) {
            return false;
        }
        for (let i = 0; i < this.items.length; i++) {
            for (let j = 0; j < this.items[0].length; j++) {
                if (i !== j && this.items[i][j] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if the Matrix is an identity matrix
    isIdentity() {
        if (!this.isSquare()) {
            return false;
        }
        for (let i = 0; i < this.items.length; i++) {
            for (let j = 0; j < this.items[0].length; j++) {
                if (i === j && this.items[i][j] !== 1) {
                    return false;
                }
                if (i !== j && this.items[i][j] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if the Matrix is a lower triangular matrix
    isLowerTriangular() {
        if (!this.isSquare()) {
            return false;
        }
        for (let i = 0; i < this.items.length; i++) {
            for (let j = 0; j < this.items[0].length; j++) {
                if (i < j && this.items[i][j] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if the Matrix is an upper triangular matrix
    isUpperTriangular() {
        if (!this.isSquare()) {
            return false;
        }
        for (let i = 0; i < this.items.length; i++) {
            for (let j = 0; j < this.items[0].length; j++) {
                if (i > j && this.items[i][j] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    inverse() {
        if (!this.isSquare()) {
            throw new Error("Matrix must be square to calculate inverse");
        }

        // Check if matrix is invertible
        const det = this.determinant();
        if (det === 0) {
            throw new Error("Matrix is not invertible");
        }

        // Calculate inverse using cofactor expansion
        const inverted = this.items.map((row, i) => {
            return row.map((value, j) => {
                const cofactor = new Matrix(
                    this.items
                        .slice(0, i)
                        .concat(this.items.slice(i + 1))
                        .map((row) => row.slice(0, j).concat(row.slice(j + 1)))
                );
                return (i + j) % 2 === 0
                    ? cofactor.determinant()
                    : -cofactor.determinant();
            });
        });
        return new Matrix(inverted).multiply(1 / det);
    }

    // Calculate the rank of a matrix
    rank() {
        // Convert matrix to reduced row echelon form
        const rref = this.rref();
        let rank = 0;
        rref.items.forEach((row) => {
            if (!row.every((value) => value === 0)) {
                rank++;
            }
        });
        return rank;
    }

    //rhs stands for right hand side and as a parameter represents the vector of constants
    //on the right side of the equation represented by the matrix
    solve(rhs) {
        // Check if the matrix is square
        if (!this.isSquare()) {
            throw new Error(
                "Matrix must be square to solve system of equations"
            );
        }

        // Check if the matrix is invertible
        if (this.determinant() === 0) {
            throw new Error(
                "System has no solution or an infinite number of solutions"
            );
        }

        // Calculate the inverse of the matrix
        const inverse = this.inverse();

        // Multiply the inverse by the right-hand side to get the solution
        const solution = inverse.multiply(rhs);

        return solution;
    }

    equals(other) {
        if (
            this.items.length !== other.items.length ||
            this.items[0].length !== other.items[0].length
        ) {
            return false;
        }
        return this.items.every((row, i) =>
            row.every((value, j) => value === other.items[i][j])
        );
    }

    isSymmetric() {
        if (!this.isSquare()) {
            throw new Error("Matrix must be square to check symmetry");
        }
        return this.equals(this.transpose());
    }

    isSkewSymmetric() {
        // Check if the matrix is square
        if (!this.isSquare()) {
            return false;
        }

        // Check if the matrix is equal to the negation of its transpose
        const transpose = this.transpose();
        const skewSymmetric = this.items.every((row, i) =>
            row.every((value, j) => value === -transpose.items[i][j])
        );
        return skewSymmetric;
    }

    isOrthogonal() {
        // Check if the matrix is square
        if (!this.isSquare()) {
            return false;
        }

        // Check if the determinant of the matrix is 1 or -1
        if (this.determinant() !== 1 && this.determinant() !== -1) {
            return false;
        }

        // Check if the columns of the matrix are mutually orthonormal
        for (let i = 0; i < this.items[0].length; i++) {
            for (let j = 0; j < this.items[0].length; j++) {
                if (i !== j) {
                    const columnI = new Matrix([
                        this.items.map((row) => row[i]),
                    ]);
                    const columnJ = new Matrix([
                        this.items.map((row) => row[j]),
                    ]);
                    if (
                        columnI.transpose().multiply(columnJ).determinant() !==
                        0
                    ) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    toString() {
        return `{${this.items.join(", ")}}`;
    }
}

import assert from "assert";

assert.deepStrictEqual(new Matrix([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]).items, [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]);

assert.notDeepStrictEqual(new Matrix([
    [1, 2, 3],
    [4, 5]
]), [
    [1, 2, 3],
    [4, 5, 0],
]);

assert.deepStrictEqual(new Matrix([
    [1, 2, 3],
    [4, 5, 6]]
).items, [
    [1, 2, 3],
    [4, 5, 6],
]);

try {
    new Matrix([
        [1, 2, 3],
        [4, "a", 6],
    ]);
} catch (error) {
    assert.strictEqual(error.message, "Matrix must contain only numeric values");
}


/*

TODO: implement the following statistical functions for the matrix class

1. mean
2. median
3. mode
4. variance
5. standardDeviation
6. covariance
7. correlation
8. percentile
9. zScore
10. tTest
11. anova

*/
