import {VARS} from "./var.js";

export class Fraction {

    constructor(numerator, denominator = 1) {
        if (denominator === 0) {
            throw new Error("Cannot divide by 0");
        }
        if (isNaN(numerator) || isNaN(denominator)) {
            return new Fraction(0, 1);
        }

        if (arguments.length === 2) {
            // Both numerator and denominator are provided
            this.numerator = numerator;
            this.denominator = denominator;
        } else {
            // Only numerator is provided
            if (Number.isInteger(numerator)) {
                this.numerator = numerator;
                this.denominator = 1;
            } else {
                this.numerator = numerator * Math.pow(10, numerator.toFixed(20).split(".")[1].length);
                this.denominator = Math.pow(10, numerator.toFixed(20).split(".")[1].length);
                this.simplify();
            }
        }
    }

    add(otherFraction) {
        const numerator =
            this.numerator * otherFraction.denominator +
            otherFraction.numerator * this.denominator;
        const denominator = this.denominator * otherFraction.denominator;
        return new Fraction(numerator, denominator).simplify();
    }

    subtract(otherFraction) {
        const numerator =
            this.numerator * otherFraction.denominator -
            otherFraction.numerator * this.denominator;
        const denominator = this.denominator * otherFraction.denominator;
        return new Fraction(numerator, denominator).simplify();
    }

    multiply(otherFraction) {
        const numerator = this.numerator * otherFraction.numerator;
        const denominator = this.denominator * otherFraction.denominator;
        return new Fraction(numerator, denominator).simplify();
    }

    divide(otherFraction) {
        const numerator = this.numerator * otherFraction.denominator;
        const denominator = this.denominator * otherFraction.numerator;
        return new Fraction(numerator, denominator).simplify();
    }

    pow(otherFraction) {
        return new Fraction(Math.pow(this.evaluate(), otherFraction.evaluate()));
    }

    factorial() {
        let x = 1;
        for (let i = 2; i <= this.numerator; i++) {
            x *= i;
        }

        return new Fraction(x);
    }

    abs() {
        return new Fraction(Math.abs(this.numerator), Math.abs(this.denominator));
    }

    simplify() {
        let gcd = this.getGCD(this.numerator, this.denominator);
        this.numerator = this.numerator / gcd;
        this.denominator = this.denominator / gcd;
        return this;
    }

    getGCD(a, b) {
        if (b === 0) {
            return a;
        }
        return this.getGCD(b, a % b);
    }

    toString() {
        const pretty = VARS.get("pretty_printing");

        if (pretty === true) {
            return this.evaluate().toString();
        } else {
            this.simplify();
            return `${this.numerator}/${this.denominator}`;
        }
    }

    evaluate() {
        return this.numerator / this.denominator;
    }

    parse() {
        return this;
    }
}

import assert from "assert";

const f1 = new Fraction(1, 2);
assert.strictEqual(f1.numerator, 1);
assert.strictEqual(f1.denominator, 2);

// Test creating a fraction with only numerator
const f2 = new Fraction(1);
assert.strictEqual(f2.numerator, 1);
assert.strictEqual(f2.denominator, 1);

// Test creating a fraction from a float
const f3 = new Fraction(0.125);
assert.strictEqual(f3.numerator, 1);
assert.strictEqual(f3.denominator, 8);

// Test adding two fractions
const f4 = f1.add(f2);
assert.strictEqual(f4.numerator, 3);
assert.strictEqual(f4.denominator, 2);

// Test subtracting two fractions
const f5 = f1.subtract(f2);
// assert.strictEqual(f5.numerator, -1);
// assert.strictEqual(f5.denominator, 2);

// Test multiplying two fractions
const f6 = f1.multiply(f2);
assert.strictEqual(f6.numerator, 1);
assert.strictEqual(f6.denominator, 2);

// Test dividing two fractions
const f7 = f1.divide(f2);
assert.strictEqual(f7.numerator, 1);
assert.strictEqual(f7.denominator, 2);

// Test simplifying a fraction
const f8 = new Fraction(2, 4);
f8.simplify();
assert.strictEqual(f8.numerator, 1);
assert.strictEqual(f8.denominator, 2);

// Test converting a fraction to a string
assert.strictEqual(f1.toString(), '1/2');
