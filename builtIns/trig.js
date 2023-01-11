import { Fraction } from "../dataTypes/fraction";

let trigFuncs = {
    cos: (angle, radian=true) => {
        if(!(angle instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = (radian? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.cos(radAngle))
    },
    sin: (angle, radian=true) => {
        if(!(angle instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = (radian? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.sin(radAngle))
    },
    tan: (angle, radian=true) => {
        if(!(angle instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = (radian? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.tan(radAngle))
    }, 
    cot: (angle, radian=true) => {
        if(!(angle instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = (radian? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(1 / Math.tan(radAngle))
    },
    arcCos: (angle, radian=true) => {
        if(!(angle instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = Math.acos(angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533))
    },
    arcSin: (angle, radian=true) => {
        if(!(angle instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = Math.asin(angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533))
    },
    arcTan: (angle, radian=true) => {
        if(!(angle instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = Math.atan(angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533))
    },
    arcCot: (angle, radian=true) => {
        if(!(angle instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = Math.atan(1 / angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533))
    },
    rad: (angle) => {
        if(!(angle instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        return new Fraction((angle.evaluate()) * 0.0174533)
    },
    sinh: (angle, radians=true) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = (radians? angle.evaluate : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.sinh(radAngle))
    },
    cosh: (angle, radians=true) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = (radians? angle.evaluate : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.cosh(radAngle))
    },
    tanh: (angle, radians=true) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        radAngle = (radians? angle.evaluate : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.tanh(radAngle))
    },
    deg: (angle) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        return new Fraction((angle.evaluate()) / 0.0174533)
    }
}