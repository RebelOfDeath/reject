// import assert from 'assert';

class Fraction {
    constructor(numerator, denominator = 1) {
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
                this.numerator =
                    numerator *
                    Math.pow(10, numerator.toString().split(".")[1].length);
                this.denominator = Math.pow(
                    10,
                    numerator.toString().split(".")[1].length
                );
                this.simplify();
            }
        }
    }

    add(otherFraction) {
        const numerator =
            this.numerator * otherFraction.denominator +
            otherFraction.numerator * this.denominator;
        const denominator = this.denominator * otherFraction.denominator;
        return new Fraction(numerator, denominator);
    }

    subtract(otherFraction) {
        const numerator =
            this.numerator * otherFraction.denominator -
            otherFraction.numerator * this.denominator;
        const denominator = this.denominator * otherFraction.denominator;
        return new Fraction(numerator, denominator);
    }

    multiply(otherFraction) {
        const numerator = this.numerator * otherFraction.numerator;
        const denominator = this.denominator * otherFraction.denominator;
        return new Fraction(numerator, denominator);
    }

    divide(otherFraction) {
        const numerator = this.numerator * otherFraction.denominator;
        const denominator = this.denominator * otherFraction.numerator;
        return new Fraction(numerator, denominator);
    }

    simplify() {
        let gcd = this.getGCD(this.numerator, this.denominator);
        this.numerator = this.numerator / gcd;
        this.denominator = this.denominator / gcd;
    }

    getGCD(a, b) {
        if (b === 0) {
            return a;
        }
        return this.getGCD(b, a % b);
    }

    toString() {
        return `${this.numerator}/${this.denominator}`;
    }

    evaluate() {
        return this.numerator / this.denominator
    }
}

// function testFraction() {
//   // Test creating a fraction with both numerator and denominator
//   const f1 = new Fraction(1, 2);
//   assert.strictEqual(f1.numerator, 1);
//   assert.strictEqual(f1.denominator, 2);

//   // Test creating a fraction with only numerator
//   const f2 = new Fraction(1);
//   assert.strictEqual(f2.numerator, 1);
//   assert.strictEqual(f2.denominator, 1);

//   // Test creating a fraction from a float
//   const f3 = new Fraction(0.125);
//   assert.strictEqual(f3.numerator, 1);
//   assert.strictEqual(f3.denominator, 8);

//   // Test adding two fractions
//   const f4 = f1.add(f2);
//   assert.strictEqual(f4.numerator, 3);
//   assert.strictEqual(f4.denominator, 2);

//   // Test subtracting two fractions
//   const f5 = f1.subtract(f2);
//   assert.strictEqual(f5.numerator, -1);
//   assert.strictEqual(f5.denominator, 2);

//   // Test multiplying two fractions
//   const f6 = f1.multiply(f2);
//   assert.strictEqual(f6.numerator, 1);
//   assert.strictEqual(f6.denominator, 2);

//   // Test dividing two fractions
//   const f7 = f1.divide(f2);
//   assert.strictEqual(f7.numerator, 1);
//   assert.strictEqual(f7.denominator, 2);

//   // Test simplifying a fraction
//   const f8 = new Fraction(2, 4);
//   f8.simplify();
//   assert.strictEqual(f8.numerator, 1);
//   assert.strictEqual(f8.denominator, 2);

//   // Test converting a fraction to a string
//   assert.strictEqual(f1.toString(), '1/2');
// }

// testFraction();

