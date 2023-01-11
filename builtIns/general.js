import { Fraction } from "../dataTypes/fraction";

let general = {
    sgn : (num) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        number = num.evaluate();
        if(number == 0){
            return new Fraction(0);
        }else{
            return new Fraction(Math.sign(number))
        }
    },
}