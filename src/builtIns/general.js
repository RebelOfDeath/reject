import {Fraction} from "../fraction.js";
import {Matrix} from '../matrix.js'
import {Collection} from "../collection.js";
import {Complex} from '../complex.js';
import {registerNativeFns} from "../fn.js";

let general = {
    print: (...xs) => {
        log(xs
            .map(x => x.toString())
            .join(" "));
        return true;
    },
    sgn: (num) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return num === 0 ? new Fraction(0) : new Fraction(Math.sign(num));
    },
    floor: (num) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return new Fraction(Math.floor(num));
    },
    ceil: (num) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return new Fraction(Math.ceil(num));
    },
    round: (num) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return new Fraction(Math.round(num));
    },
    ln: (num) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        return new Fraction(Math.log(num.evaluate()));
    },
    log: (num, base = 10) => {
        if (!((num instanceof Fraction) && (base === 10 || base instanceof Fraction))) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return new Fraction(Math.log(num) / (base === 10 ? Math.log(10) : Math.log(base.evaluate())));
    },
    max: (num1, ...rest) => {
        if (!(num1 instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }

        let max = num1.evaluate();
        for (let elem in rest) {
            if (!(elem instanceof Fraction)) {
                throw new TypeError('Function only supports numeric type (Fraction)');
            }
            max = (elem.evaluate() > max ? elem.evaluate() : max);
        }
        return new Fraction(max);
    },
    min: (num1, ...rest) => {
        if (!(num1 instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }

        let min = num1.evaluate();
        for (let elem in rest) {
            if (!(elem instanceof Fraction)) {
                throw new TypeError('Function only supports numeric type (Fraction)');
            }
            min = (elem.evaluate() < min ? elem.evaluate() : min);
        }
        return new Fraction(min);
    },
    mod: (number, divisor) => {
        if (!(number instanceof Fraction && divisor instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        number = number.evaluate();
        divisor = divisor.evaluate();
        return new Fraction(number % divisor);
    },
    sqrt: (number) => {
        if (!(number instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        number = number.evaluate();
        return new Fraction(Math.sqrt(number));
    },
    root: (number, n) => {
        if (!(number instanceof Fraction && n instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        number = number.evaluate();
        n = n.evaluate();

        return new Fraction(Math.pow(number, 1 / n));
    },
    exp: (number, n = Math.E) => {
        if (!(number instanceof Fraction && (n instanceof Fraction || n === Math.E))) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        number = number.evaluate();
        n = (n === Math.E ? Math.E : n.evaluate());
        return new Fraction(Math.pow(n, number))
    },
    det: (matrix) => {
        if (!(matrix instanceof Matrix)) {
            throw new TypeError('Function only supports matrices');
        }
        return new Fraction(matrix.determinant())
    },
    gcd: (num1, num2) => {
        if (!(num1 instanceof Fraction && num2 instanceof Fraction)) {
            throw new TypeError('Function only supports matrices');
        }
        let x = Math.abs(num1.evaluate());
        let y = Math.abs(num2.evaluate());

        while (y) {
            let t = y;
            y = x % y;
            x = t;
        }

        return new Fraction(x)
    },
    lcm: (num1, num2) => {
        let gcd = general.gcd(num1, num2);
        return new Fraction((num1.evaluate() * num2.evaluate()) / gcd);
    },
    sum: (num1, ...rest) => {
        if (!(num1 instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let sum = num1.evaluate();
        for (let elem in rest) {
            if (!(elem instanceof Fraction)) {
                throw new TypeError('Function only supports numeric type (Fraction)');
            }
            sum = sum + elem.evaluate();
        }
        return new Fraction(sum);
    },
    discriminant: (a, b, c) => {
        if (!(a instanceof Fraction && b instanceof Fraction && c instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        a = a.evaluate();
        b = b.evaluate();
        c = c.evaluate();
        return new Fraction((b ^ 2) - (4 * a * c));
    },
    poly2: (a, b, c) => {
        let D = general.D(a, b, c).evaluate();
        a = a.evaluate();
        b = b.evaluate();
        c = c.evaluate();

        if (D < 0) {
            throw new Error("Discriminant value below 0")
        } else if (D === 0) {
            return new Fraction((-b) / (2 * a))
        } else {
            let sqrtD = Math.sqrt(D);
            return new Collection([(-b + sqrtD) / (2 * a), (-b - sqrtD) / (2 * a)])
        }
    },
    abs: (elem) => {
        if (elem instanceof Fraction) {
            return elem.abs();
        } else if (elem instanceof Collection) {
            return new Fraction(elem.length());
        } else if (elem instanceof Complex) {
            return new Fraction(elem.length())
        } else {
            throw new TypeError('Function does not support provided type');
        }
    }
}

registerNativeFns(general);