export class Complex {
    constructor(real, imag) {
        this.real = real;
        this.imag = imag;
    }

    //adds to Complex types together
    add(other) {
        return new Complex(this.real + other.real, this.imag + other.imag);
    }

    //subtracts two Complex types from each other
    subtract(other) {
        return new Complex(this.real - other.real, this.imag - other.imag);
    }

    //multiplies to Complex types with each other
    multiply(other) {
        return new Complex(
            this.real * other.real - this.imag * other.imag,
            this.real * other.imag + this.imag * other.real
        );
    }

    //divides two Complex types by each other
    divide(other) {
        const denom = other.real ** 2 + other.imag ** 2;
        return new Complex(
            (this.real * other.real + this.imag * other.imag) / denom,
            (this.imag * other.real - this.real * other.imag) / denom
        );
    }

    //returns a string representation of the complex number
    toString() {
        imag_part =
            this.imag > 0 ? `+ ${this.imag}` : `- ${Math.abs(this.imag)}`;
        return `(${ths.real} ${imag_part} i)`;
    }

    //returns the conjugate of the complex number, which is obtained by negating the imaginary part of the complex number
    conjugate() {
        return new Complex(this.real, -this.imag);
    }

    //returns the absolute value (magnitude) of the complex number
    abs() {
        return Math.sqrt(this.real ** 2 + this.imag ** 2);
    }

    //returns the argument (angle) of the complex number in radians when no input is given
    //when input is true, the answer given is in degrees
    arg(degrees = false) {
        const argument = Math.atan2(this.imag, this.real);
        return degrees ? (argument * 180) / Math.PI : argument;
    }

    //returns the nth power of the complex number.
    pow(n) {
        const magnitude = this.abs();
        const argument = this.arg();
        return new Complex(
            magnitude ** n * Math.cos(argument * n),
            magnitude ** n * Math.sin(argument * n)
        );
    }

    //returns the exponential of the complex number, which is defined as e^(a+bi) = e^a * (cos(b) + i*sin(b))
    exp() {
        return new Complex(
            Math.exp(this.real) * Math.cos(this.imag),
            Math.exp(this.real) * Math.sin(this.imag)
        );
    }

    //returns the sine of the complex number
    sin() {
        return new Complex(
            Math.sin(this.real) * Math.cosh(this.imag),
            Math.cos(this.real) * Math.sinh(this.imag)
        );
    }

    //returns the cosine of the complex number
    cos() {
        return new Complex(
            Math.cos(this.real) * Math.cosh(this.imag),
            -Math.sin(this.real) * Math.sinh(this.imag)
        );
    }

    //return the tangent of the complex number
    tan() {
        return this.sin().divide(this.cos());
    }

    //returns the hyperbolic cosine of the complex number
    cosh() {
        return new Complex(
            Math.cos(this.imag) * Math.cosh(this.real),
            Math.sin(this.imag) * Math.sinh(this.real)
        );
    }

    //returns the hyperbolic sine of the complex number
    sinh() {
        return new Complex(
            Math.sin(this.imag) * Math.cosh(this.real),
            Math.cos(this.imag) * Math.sinh(this.real)
        );
    }

    //returns the hyperbolic tangent of the complex number
    tanh() {
        return this.sinh().divide(this.cosh());
    }
}
