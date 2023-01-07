import ohm from 'ohm-js'
import {Fraction} from "./dataTypes/fraction.js"
import {String} from "./dataTypes/string.js"
import {Collection} from "./dataTypes/collection.js"
import {Matrix} from "./dataTypes/matrix.js";
import fs from "fs";
import {ParsingError, ReadingError} from "./reject.js";

const grammar = ohm.grammar(`
Reject {

    // note that all elements in this grammar are lexical rules.
    // this is to avoid incorrect indentation, etc.

    program = ls* listOf<element, ls> ls*

    element = statement | expression
    
    statement = cond | iterative | return | var | augmented | fn
    
    expression = ternary | comparator | logical | afn | invocation | literal
                    | "(" exprSpaced ")" -- par
                    | identifier
    
    // spaced expr shortcuts
    exprSpaced = s expression s
    exprLeft = expression s

    // format for vars, fn names
    identifier = ~(digit+) #(alnum | "_")+
    
    // spaced ident shortcuts
    identSpaced = s identifier s
    identLeft = identifier s
    
    // ====================

    comment = "#" (~nl any)*
    
    // inline spacing
    inline = " " | "\\t" | comment // ignore comments in code
    
    // inline space
    s = inline*
        
    // new line chars
    nl = "\\n" | "\\r" | "\u2028" | "\u2029"
    
    // line separator
    ls = (nl | comment)+
    
    block = ls listOf<blockElem, nl>
    
    blockElem = indent element?
    
    indent = " "
    
    // ====================

    literal = array | matrix | text | arithmetic | boolean

    // ====================
    
    boolean = "true" | "false"

    logical = logical s "and" s logicalNot s -- and
                    | logical s "or" s logicalNot s -- or
                    | logicalNot

    // todo change name
    logicalNot = "!" logical -- not
                    | "(" logical ")" -- par
                    | boolean

    // ====================

    integer = "-"? digit+
    
    float = "-"? digit* "." integer+
    
    fraction = integer+ "//" integer+

    number = fraction | float | integer

    arithmetic = exprAdd

    exprAdd = exprAALeft "+" exprAASpaced -- plus
                    | exprAALeft "-" exprAASpaced -- sub
                    | exprMul

    exprMul = exprAALeft "*" exprAASpaced -- mul
                    | exprAALeft "/" exprAASpaced -- div
                    | exprExp

    exprExp = exprAALeft "^" exprAASpaced -- exp
                    | exprFac

    exprFac = exprAALeft "!" -- fac
                    | number

    // exprArithmeticAllowed
    exprAA = ternary | arithmetic | invocation | identifier 
                    | "(" exprAA ")" -- par
    
    exprAASpaced = s exprAA s
    exprAALeft = exprAA s

    // ====================

    augmented = identLeft "*=" exprSpaced -- mul
                    | identLeft "/=" exprSpaced -- div
                    | identLeft "+=" exprSpaced -- plus
                    | identLeft "-=" exprSpaced -- sub

    // ====================

    text = string | char

    string = "\\"" (~("\\"" | nl) any)* "\\"" s

    char = "'" (~nl any) "'" s

    // ====================
    
    array = "[" listOf<exprSpaced, ","> "]" s

    // ====================

    matrix = "{" listOf<matrixArgsTypes, ","> "}" s

    matrixArgsTypes = s (matrix | number) s

    // ====================
    
    iterative = "for" listOf<identSpaced, ","> "in" exprSpaced ":" s block

    // ====================

    invocation = invocationPipe | invocationPrint | invocationFn

    invocationPipe = "|" exprSpaced "|" s
    
    invocationPrint = "print(" s listOf<exprSpaced, ","> s ")" s
    
    invocationFn = identifier "(" s listOf<exprSpaced, ","> s ")" s 

    // ====================

    fn = "fun " identSpaced "(" listOf<fnArg, ","> "):" s block

    fnArg = s (var | identifier) s

    return = "return" exprSpaced

    var = identLeft "=" exprSpaced
    
    // ====================

    afn = ":(" listOf<identSpaced, ","> "):" exprSpaced

    // ====================

    cond = condWhen | condWhenElse | condElse

    condWhen = "when" condArg ":" s block
    
    condWhenElse = "else when" condArg ":" s block

    condElse = "else:" s block
    
    condArg = s (comparator | boolean) s

    // ====================

    // doesnt allow for exprLeft for some reason, even though it's literally the same as expression s
    ternary = expression s "?" exprSpaced ":" exprSpaced

    // ====================

    comparator = exprLeft "==" exprSpaced -- equals
                    | exprLeft "!=" exprSpaced -- not_equals
                    | exprLeft ">" exprSpaced -- bigger
                    | exprLeft "<" exprSpaced -- smaller
                    | exprLeft ">=" exprSpaced -- bigger_equals
                    | exprLeft "<=" exprSpaced -- smaller_equals
}
`)

const semantics = grammar.createSemantics()

semantics.addOperation('eval', {

    // main stuff
    program(_, xs, __) {
        return xs
            .asIteration()
            .children
            .map(x => x.eval());
    },

    element(x) {
        return x.eval();
    },

    expression_par(_, x, __) {
        return x.eval();
    },

    // spaced stuff
    exprSpaced(_, x, __) {
        return x.eval();
    },
    exprLeft(x, _) {
        return x.eval();
    },

    identSpaced(_, x, __) {
        return x.eval();
    },
    identLeft(x, _) {
        return x.eval();
    },

    // booleans

    // parse boolean value
    boolean(x) {
        return x.sourceString === "true";
    },

    logical_and(x, _, __, ___, y, ____) {
        return x.eval() && y.eval();
    },
    logical_or(x, _, __, ___, y, ____) {
        return x.eval() || y.eval();
    },
    logicalNot_not(_, x) {
        return !x.eval();
    },
    logicalNot_par(_, x, __) {
        return x.eval();
    },

    // numerical types
    // every numerical is a fraction under the hood

    // integer x can be represented by fraction as x/1, so just parse int from string
    // and use it as numerator
    integer(sgn, x) {
        return new Fraction(parseInt(sgn.sourceString + x.sourceString));
    },
    // some floats cannot be represented by fractions, therefore the system will internally
    // create a fraction which estimates the floating value.
    float(sgn, x, _, y) {
        return new Fraction(parseFloat(sgn.sourceString + x.sourceString + "." + y.sourceString));
    },
    // fraction only supports ints
    fraction(x, _, y) {
        return new Fraction(x.eval().evaluate(), y.eval().evaluate());
    },

    // arithmetic
    exprAdd_plus(x, _, y) {
        return x.eval().add(y.eval());
    },
    exprAdd_sub(x, _, y) {
        return x.eval().subtract(y.eval());
    },
    exprMul_mul(x, _, y) {
        return x.eval().multiply(y.eval());
    },
    exprMul_div(x, _, y) {
        return x.eval().divide(y.eval());
    },
    exprExp_exp(x, _, y) {
        return x.eval().exp(y.eval());
    },
    exprFac_fac(x, _) {
        return x.eval().factorial();
    },

    exprAA_par(_, x, __) {
        return x.eval();
    },

    // spaced allowed assignment exprs
    exprAASpaced(_, x, __) {
        return x.eval()
    },
    exprAALeft(x, _) {
        return x.eval()
    },

    // augmented assignment

    // todo

    // texts

    string(_, x, __, ___) {
        return new String(x.sourceString); // ignore
    },

    char(_, x, __, ___) {
        return new String(x.sourceString); // ignore
    },

    // arrays

    array(_, xs, __, ___) {
        return new Collection(xs
            .asIteration()
            .children
            .map(x => x.eval()));
    },

    // matrices

    matrix(_, xs, __, ___) {
        return new Matrix(xs
            .asIteration()
            .children
            .map(x => x.eval()));
    },

    matrixArgsTypes(_, x, __) {
        return x.eval();
    },

    // iteratives


    // fn invocation

    // todo error on wrong types

    invocationPipe(_, x, __, ___) {
        x = x.eval();
        if (x instanceof Fraction) {
            return x.abs();
        } else if (x instanceof Collection) {
            return x.length();
        }
        return x;
    },

    invocationPrint(_, __, xs, ___, ____, _____) {
        console.log((xs
            .asIteration()
            .children
            .map(x => x.eval().toString()))
            .join(" "));

        return true; // any value is true
    },

    // fn definition


    // afn


    // conditionals


    // ternary

    ternary(cond, _, __, pass, ___, dontPass) {
        return cond.eval() ? pass.eval() : dontPass.eval();
    },

    // comparators

    comparator_equals(x, _, y) {
        return x.eval() === y.eval();
    },
    comparator_not_equals(x, _, y) {
        return x.eval() !== y.eval();
    },
    comparator_bigger(x, _, y) {
        return x.eval() > y.eval();
    },
    comparator_smaller(x, _, y) {
        return x.eval() < y.eval();
    },
    comparator_bigger_equals(x, _, y) {
        return x.eval() >= y.eval();
    },
    comparator_smaller_equals(x, _, y) {
        return x.eval() <= y.eval();
    },

    // generics

    // a program contains multiple elements, so call eval on all of them
    _iter(...children) {
        return children.map(c => c.eval());
    }
})

fs.readFile("./x.rej", "utf8", (error, data) => {
    if (error) {
        throw new ReadingError(error.message)
    }

    try {
        semantics(grammar.match(data)).eval()
    } catch (error) {
        throw new ParsingError(error.message)
    }
})