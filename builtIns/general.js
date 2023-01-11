import { Fraction } from "../dataTypes/fraction";

let general = {
    sgn : (num) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return num === 0 ? new Fraction(0) : new Fraction(Math.sign(num));
    },
}