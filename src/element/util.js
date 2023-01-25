import {Fraction} from "../types/fraction.js";

const colours = ["A", "B", "C", "D", "E", "F"];

/**
 * Returns a random bright line colour.
 *
 * @return {string} a random bright line colour.
 */
export function getLineColour() {
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += colours[Math.floor(Math.random() * colours.length)];
    }
    return color;
}

/**
 * Returns a range from a (inclusive) to b (exclusive)
 * @param a the lower bound
 * @param b the upper bound
 * @param increment the increment.
 * @return {*[]} an array with all numbers between a (inclusive) and b (exclusive)
 */
export function range(a, b, increment = new Fraction(1)) {
    assertNotNull(a);
    assertNotNull(b);
    assert(a instanceof Fraction, "Lower bound must be a Fraction");
    assert(b instanceof Fraction, "Upper bound must be a Fraction");
    assert(increment instanceof Fraction, "Increment must be a Fraction");
    assert(a.evaluate() <= b.evaluate(), "Lower bound cannot be higher than upper bound");

    let arr = [];
    // the amount of times the loop will run
    const count = (b.evaluate() - a.evaluate()) / increment.evaluate();

    for (let i = 0; i < count; i++) {
        arr[i] = a.add(increment.multiply(new Fraction(i)));
    }

    return arr;
}

/**
 * Repeats x n amount of times.
 *
 * @param   x
 *          The item to repeat.
 *
 * @param   n
 *          The amount of times to repeat it.
 *
 * @returns {*[]} the array with the repeated x value.
 */
export function repeat(x, n) {
    assertNotNull(x);
    assert(Number.isInteger(n), "Repeat value is not an integer");

    let arr = [];
    doTimes(() => {
        arr[arr.length] = x;
    }, n);

    return arr;
}

/**
 * Perform an anonymous function n times.
 *
 * @param afn
 * @param n
 */
export function doTimes(afn, n) {
    for (let i = 0; i < n; i++) {
        afn.apply();
    }
}

export function assert(predicate, error) {
    if (!predicate) {
        throw new Error(error);
    }
}

export function assertNotNull(x) {
    if (x === null || x === undefined) {
        throw new Error("Value is undefined");
    }
}