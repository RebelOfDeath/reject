import {Fraction} from "../fraction.js";
import {registerNativeConstants} from "../var.js";

let constants = {
    pi: new Fraction(355, 113),
    e: new Fraction(Math.E),
    pretty_printing: false
}

registerNativeConstants(constants);