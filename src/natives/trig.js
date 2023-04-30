import {Fraction} from "../types/fraction.js"
import {registerNativeFns} from "../element/fn.js"
import {assert} from "../element/util.js"

// todo consolidate!

const assertIsFraction = x => assert(x instanceof Fraction, "Function only supports numeric type (Fraction)")

const RADS_PER_DEGREE = 0.01745329

let trigFuncs = {
    cos: (angle, radian = true) => {
        assertIsFraction(angle)
        let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * RADS_PER_DEGREE))
        return new Fraction(Math.cos(radAngle))
    },
    sin: (angle, radian = true) => {
        assertIsFraction(angle)
        let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * RADS_PER_DEGREE))
        return new Fraction(Math.sin(radAngle))
    },
    tan: (angle, radian = true) => {
        assertIsFraction(angle)
        let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * RADS_PER_DEGREE))
        return new Fraction(Math.tan(radAngle))
    },
    cot: (angle, radian = true) => {
        assertIsFraction(angle)
        let radAngle = (radian ? angle.evaluate() : (angle.evaluate() * RADS_PER_DEGREE))
        return new Fraction(1 / Math.tan(radAngle))
    },
    arccos: (angle, radian = true) => {
        assertIsFraction(angle)
        let radAngle = Math.acos(angle.evaluate())
        return new Fraction((radian ? radAngle : radAngle / RADS_PER_DEGREE))
    },
    arcsin: (angle, radian = true) => {
        assertIsFraction(angle)
        let radAngle = Math.asin(angle.evaluate())
        return new Fraction((radian ? radAngle : radAngle / RADS_PER_DEGREE))
    },
    arctan: (angle, radian = true) => {
        assertIsFraction(angle)
        let radAngle = Math.atan(angle.evaluate())
        return new Fraction((radian ? radAngle : radAngle / RADS_PER_DEGREE))
    },
    arccot: (angle, radian = true) => {
        assertIsFraction(angle)
        let radAngle = Math.atan(1 / angle.evaluate())
        return new Fraction((radian ? radAngle : radAngle / RADS_PER_DEGREE))
    },
    rad: (angle) => {
        assertIsFraction(angle)
        return new Fraction((angle.evaluate()) * RADS_PER_DEGREE)
    },
    sinh: (num, radians = true) => {
        assertIsFraction(num)
        let radAngle = (radians ? num.evaluate : (num.evaluate() * RADS_PER_DEGREE))
        return new Fraction(Math.sinh(radAngle))
    },
    cosh: (num, radians = true) => {
        assertIsFraction(num)
        let radAngle = (radians ? num.evaluate : (num.evaluate() * RADS_PER_DEGREE))
        return new Fraction(Math.cosh(radAngle))
    },
    tanh: (num, radians = true) => {
        assertIsFraction(num)
        let radAngle = (radians ? num.evaluate : (num.evaluate() * RADS_PER_DEGREE))
        return new Fraction(Math.tanh(radAngle))
    },
    deg: (num) => {
        assertIsFraction(num)
        return new Fraction((num.evaluate()) / RADS_PER_DEGREE)
    }
}

registerNativeFns(trigFuncs)
