import {Fraction} from "../types/fraction.js";
import {registerNativeFns} from "../element/fn.js";

// todo explain magic numbers

let trigFuncs = {
    cos: (angle, radian = true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.cos(radAngle));
    },
    sin: (angle, radian = true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.sin(radAngle));
    },
    tan: (angle, radian = true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.tan(radAngle));
    },
    cot: (angle, radian = true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(1 / Math.tan(radAngle));
    },
    arccos: (angle, radian = true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = Math.acos(angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533));
    },
    arcsin: (angle, radian = true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = Math.asin(angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533));
    },
    arctan: (angle, radian = true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = Math.atan(angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533));
    },
    arccot: (angle, radian = true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = Math.atan(1 / angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533));
    },
    rad: (angle) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        return new Fraction((angle.evaluate()) * 0.0174533);
    },
    sinh: (num, radians = true) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radians ? num.evaluate : (num.evaluate() * 0.0174533));
        return new Fraction(Math.sinh(radAngle))
    },
    cosh: (num, radians = true) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radians ? num.evaluate : (num.evaluate() * 0.0174533));
        return new Fraction(Math.cosh(radAngle))
    },
    tanh: (num, radians = true) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radians ? num.evaluate : (num.evaluate() * 0.0174533));
        return new Fraction(Math.tanh(radAngle))
    },
    deg: (num) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        return new Fraction((num.evaluate()) / 0.0174533);
    }
}

registerNativeFns(trigFuncs);