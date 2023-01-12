import { Fraction } from "./fraction.js";

export class Complex {
    constructor(real, imag) {
        this.real = real instanceof Fraction ? real : new Fraction(real);
        this.imag = imag instanceof Fraction ? imag : new Fraction(imag);
    }

    //adds to Complex types together
    add(other) {
        if(!(other instanceof Complex)){
            other = new Complex(other)
        }
        return new Complex(
            this.real.add(other.real),
            this.imag.add(other.imag)
        );
    }

    //subtracts two Complex types from each other
    subtract(other) {
        if(!(other instanceof Complex)){
            other = new Complex(other)
        }
        return new Complex(
            this.real.subtract(other.real),
            this.imag.subtract(other.imag)
        );
    }

    //multiplies to Complex types with each other
    multiply(other) {
        if(!(other instanceof Complex)){
            other = new Complex(other)
        }
        return new Complex(
            this.real
                .multiply(other.real)
                .subtract(this.imag.multiply(other.imag)),
            this.real.multiply(other.imag).add(this.imag.multiply(other.real))
        );
    }

    //divides two Complex types by each other
    divide(other) {
        if(!(other instanceof Complex)){
            other = new Complex(other)
        }
        // const denom = other.real ** 2 + other.imag ** 2;
        // return new Complex(
        //     (this.real * other.real + this.imag * other.imag) / denom,
        //     (this.imag * other.real - this.real * other.imag) / denom
        // );
        //I have no idea if this will work!! 10:30 pm vibez man!
        let real = this.real
            .multiply(other.real)
            .add(this.imag.multiply(other.imag));
        let imag = this.imag
            .multiply(other.real)
            .subtract(this.real.multiply(other.imag));
        let denom = other.real
            .multiply(other.real)
            .add(other.imag.multiply(other.imag));
        return new Complex(
            real.divide(denom).evaluate(),
            imag.divide(denom).evaluate()
        );
    }

    //returns the conjugate of the complex number, which is obtained by negating the imaginary part of the complex number
    conjugate() {
        return new Complex(this.real, this.imag.multiply(-1));
    }

    //returns the absolute value (magnitude) of the complex number
    abs() {
        return new Fraction(Math.sqrt(
            this.real.multiply(this.real).add(this.imag.multiply(this.imag))
        ));
    }

    //returns the argument (angle) of the complex number in radians when no input is given
    //when input is true, the answer given is in degrees
    arg(degrees = false) {
        const argument = Math.atan2(this.imag.evaluate(), this.real.evaluate());
        return new Fraction(degrees ? (argument * 180) / Math.PI : argument);
    }

    //returns the nth power of the complex number.
    pow(n) {
        if(!(n instanceof Fraction)){
            n = new Fraction(n)
        } // todo is this supposed to be fraction or ?

        const magnitude = this.abs();
        const argument = this.arg();
        return new Complex(
            magnitude ** n.evaluate() * Math.cos(argument * n.evaluate()),
            magnitude ** n.evaluate() * Math.sin(argument * n.evaluate())
        );
    }

    //returns the exponential of the complex number, which is defined as e^(a+bi) = e^a * (cos(b) + i*sin(b))
    exp() {
        return new Complex(
            Math.exp(this.real.evaluate()) * Math.cos(this.imag.evaluate()),
            Math.exp(this.real.evaluate()) * Math.sin(this.imag.evaluate())
        );
    }

    //return the length of the complex number
    length() {
        let real = this.real.evaluate();
        let imag = this.imag.evaluate();
        return new Fraction(
            Math.sqrt((real^2) + (imag^2))
        )
    }

    //returns the sine of the complex number
    sin() {
        return new Complex(
            Math.sin(this.real.evaluate()) * Math.cosh(this.imag.evaluate()),
            Math.cos(this.real.evaluate()) * Math.sinh(this.imag.evaluate())
        );
    }

    //returns the cosine of the complex number
    cos() {
        return new Complex(
            Math.cos(this.real.evaluate()) * Math.cosh(this.imag.evaluate()),
            -Math.sin(this.real.evaluate()) * Math.sinh(this.imag.evaluate())
        );
    }

    //return the tangent of the complex number
    tan() {
        return this.sin().divide(this.cos());
    }

    //returns the hyperbolic cosine of the complex number
    cosh() {
        return new Complex(
            Math.cos(this.imag.evaluate()) * Math.cosh(this.real.evaluate()),
            Math.sin(this.imag.evaluate()) * Math.sinh(this.real.evaluate())
        );
    }

    //returns the hyperbolic sine of the complex number
    sinh() {
        return new Complex(
            Math.sin(this.imag.evaluate()) * Math.cosh(this.real.evaluate()),
            Math.cos(this.imag.evaluate()) * Math.sinh(this.real.evaluate())
        );
    }

    //returns the hyperbolic tangent of the complex number
    tanh() {
        return this.sinh().divide(this.cosh());
    }

    //returns a string representation of the complex number
    toString() {
        let imag = this.imag.evaluate();

        let imag_part = imag > 0
            ? `+ ${imag}`
            : `- ${Math.abs(imag)}`;
        return `(${this.real.evaluate()} ${imag_part} i)`;
    }
}