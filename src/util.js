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
 * @return {*[]} an array with all numbers between a (inclusive) and b (exclusive)
 */
export function range(a, b) {
    assertNotNull(a);
    assertNotNull(b);
    assert(Number.isInteger(a), "Lower bound is not an integer");
    assert(Number.isInteger(b), "Upper bound is not an integer");
    assert(a <= b, "Lower bound cannot be higher than upper bound");

    let arr = [];
    for (let i = a; i < b; i++) {
        arr[arr.length] = i;
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