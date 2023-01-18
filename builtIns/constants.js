import {Fraction} from "../dataTypes/fraction";
import {registerNativeConstants} from "../dataTypes/var.js";

let constants = {
    PI: new Fraction(355, 113),
    e: new Fraction(Math.E)
}

registerNativeConstants(constants);