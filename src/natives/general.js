import {Fraction} from "../types/fraction.js"
import {Matrix} from '../types/matrix.js'
import {Collection} from "../types/collection.js"
import {Complex} from '../types/complex.js'
import {AFn, registerNativeFns} from "../element/fn.js"
import {assert, range, repeat} from "../element/util.js"
import {Str} from "../types/str.js"

const assertIsFraction = x => assert(x instanceof Fraction, "Value is not a fraction")

let general = {
    even(x) {
        assertIsFraction(x)

        return x.evaluate() % 2 === 0
    },
    uneven(x) {
        return !general.even(x)
    },
    print: (...xs) => {
        log(xs
            .map(x => x.toString())
            .join(" "))
        return true
    },
    sgn: (num) => {
        num = num.evaluate()
        return num === 0 ? new Fraction(0) : new Fraction(Math.sign(num))
    },
    floor: (num) => {
        assertIsFraction(num)

        return new Fraction(Math.floor(num.evaluate()))
    },
    ceil: (num) => {
        assertIsFraction(num)

        return new Fraction(Math.ceil(num.evaluate()))
    },
    round: (num) => {
        assertIsFraction(num)

        return new Fraction(Math.round(num.evaluate()))
    },
    ln: (num) => {
        assertIsFraction(num)

        return new Fraction(Math.log(num.evaluate()))
    },
    log: (num, base = 10) => {
        assertIsFraction(num)

        return new Fraction(Math.log(num.evaluate()) / (base === 10 ? Math.log(10) : Math.log(base.evaluate())))
    },
    max: (num1, ...rest) => {
        assertIsFraction(num1)

        let max = num1.evaluate()
        for (let elem in rest) {
            assertIsFraction(elem)

            max = (elem.evaluate() > max ? elem.evaluate() : max)
        }
        return new Fraction(max)
    },
    min: (num1, ...rest) => {
        assertIsFraction(num1)

        let min = num1.evaluate()
        for (let elem in rest) {
            assertIsFraction(elem)

            min = (elem.evaluate() < min ? elem.evaluate() : min)
        }
        return new Fraction(min)
    },
    mod: (number, divisor) => {
        assertIsFraction(number)
        assertIsFraction(divisor)

        return new Fraction(number.evaluate() % divisor.evaluate())
    },
    sqrt: (number) => {
        assertIsFraction(number)

        return new Fraction(Math.sqrt(number.evaluate()))
    },
    root: (number, n) => {
        assertIsFraction(number)
        assertIsFraction(n)

        return new Fraction(Math.pow(number.evaluate(), 1 / n.evaluate()))
    },
    exp: (number, n = Math.E) => {
        assertIsFraction(number)

        return new Fraction(Math.pow(number.evaluate(), n instanceof Fraction ? n.evaluate() : Math.E))
    },
    det: (matrix) => {
        assert(matrix instanceof Matrix, "Function only supports matrices")

        return new Fraction(matrix.determinant())
    },
    gcd: (num1, num2) => {
        assertIsFraction(num1)
        assertIsFraction(num2)

        let x = Math.abs(num1.evaluate())
        let y = Math.abs(num2.evaluate())

        while (y) {
            let t = y
            y = x % y
            x = t
        }

        return new Fraction(x)
    },
    lcm: (num1, num2) => {
        assertIsFraction(num1)
        assertIsFraction(num2)

        let gcd = general.gcd(num1, num2)
        return new Fraction((num1.evaluate() * num2.evaluate()) / gcd)
    },
    sum: (num1, ...rest) => {
        assertIsFraction(num1)

        return new Fraction(rest.reduce((a, b) => {
            return a + b.evaluate()
        }, num1.evaluate()))
    },
    discriminant: (a, b, c) => {
        assertIsFraction(a)
        assertIsFraction(b)
        assertIsFraction(c)

        a = a.evaluate()
        b = b.evaluate()
        c = c.evaluate()

        return new Fraction((b ^ 2) - (4 * a * c))
    },
    poly2: (a, b, c) => {
        let D = general.discriminant(a, b, c).evaluate()
        a = a.evaluate()
        b = b.evaluate()

        if (D < 0) {
            throw new Error("Discriminant value below 0")
        } else if (D === 0) {
            return new Fraction((-b) / (2 * a))
        } else {
            let sqrtD = Math.sqrt(D)
            return new Collection([(-b + sqrtD) / (2 * a), (-b - sqrtD) / (2 * a)])
        }
    },
    abs: (elem) => {
        if (elem instanceof Fraction) {
            return elem.abs()
        } else if (elem instanceof Collection) {
            return new Fraction(elem.length())
        } else if (elem instanceof Complex) {
            return new Fraction(elem.length())
        } else {
            throw new TypeError("Function does not support provided type")
        }
    },
    range: (a, b, increment = new Fraction(1)) => {
        assert(a instanceof Fraction, "Lower bound is not a fraction")
        assert(b instanceof Fraction, "Upper bound is not a fraction")
        assert(increment instanceof Fraction, "Increment is not a fraction")

        return new Collection(range(a, b, increment))
    },
    repeat: (x, n) => {
        assert(n instanceof Fraction, "Repeat value is not a fraction")

        return new Collection(repeat(x, n.evaluate()))
    },
    filter: (afn, coll) => {
        assert(afn instanceof AFn, "Predicate is not an anonymous function")
        assert(coll instanceof Collection, "Collection is not a collection")

        return coll.filter(x => afn.invoke(x))
    },
    map: (afn, coll) => {
        assert(afn instanceof AFn, "Predicate is not an anonymous function")
        assert(coll instanceof Collection, "Collection is not a collection")

        return coll.map(x => afn.invoke(x))
    },
    reduce: (afn, initialValue, coll) => {
        assert(afn instanceof AFn, "Predicate is not an anonymous function")
        assert(afn.params.length === 2, "Reducer function must have two parameters")
        assert(coll instanceof Collection, "Collection is not a collection")

        return coll.reduce((oldValue, newValue) => afn.invoke(oldValue, newValue), initialValue)
    },
    get: (coll, index) => {
        assert(index instanceof Fraction, "Index is not a fraction")
        assert(index.simplify().denominator === 1, "Index is not a whole number")
        assert(coll instanceof Collection, "Collection is not a collection")

        const value = coll.get(Math.floor(index.evaluate()))
        return (value === null || value === undefined) ? false : value
    },
    set: (coll, index, value) => {
        assert(index instanceof Fraction, "Index is not a fraction")
        assert(index.simplify().denominator === 1, "Index is not a whole number")
        assert(coll instanceof Collection, "Collection is not a collection")

        index = Math.floor(index.evaluate())

        const previous = coll.get(index)
        coll.set(index, value)
        return previous !== null && previous !== undefined
    },
    append: (coll, item) => {
        assert(coll instanceof Collection, "Collection is not a collection")

        return coll.append(item)
    },
    insert: (coll, index, item) => {
        assert(coll instanceof Collection, "Collection is not a collection")

        return coll.insert(index, item)
    },
    not: (x) => {
        assert(typeof x === "boolean", "Argument is not a boolean")

        return !x
    },
    num: (x) => {
        assert(x instanceof Str, "Argument is not a string")

        return new Fraction(Number.parseFloat(x))
    },
    str: (...xs) => {
        return new Str(xs
            .map(x => x.toString())
            .join(""))
    },
    z: (real, imaginary) => {
        assert(real instanceof Fraction, "Real part is not a fraction")
        assert(imaginary instanceof Fraction, "Imaginary part is not a fraction")

        return new Complex(real, imaginary)
    }
}

registerNativeFns(general)