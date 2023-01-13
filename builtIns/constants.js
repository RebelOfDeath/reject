import { Fraction } from "../dataTypes/fraction";
import {registerNatives} from "../dataTypes/var.js";

let constants = {
    PI : new Fraction(355, 113),
    e : new Fraction(Math.E)
}

registerNatives(constants);