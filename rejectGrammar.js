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

    element = (statement | expression) s
    
    statement = iterative | return | var | augmented | fn
    
    expression = ternary | comparator | logical | cond | afn | invocation | literal | identifier

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
    
    indent = "\\t" | " " | "  " | "    "
    
    // ====================

    literal = array | matrix | text | arithmetic | boolean

    // format for vars, fn names
    identifier = ~(digit+) #(alnum | "_")+
    
    // ====================
    
    boolean = "true" | "false"

    logical = logical s "and" s logicalPar -- and
                    | logical s "or" s logicalPar -- or
                    | logicalPar

    logicalPar = "(" s logical s ")" -- par
                    | "!" logical -- not
                    | boolean

    // ====================

    integer = "-"? digit+
    
    float = "-"? digit* "." integer+
    
    fraction = integer+ "//" integer+

    number = fraction | float | integer

    arithmetic = exprAdd

    exprAdd = exprAdd s "+" s exprMul -- plus
                    | exprAdd s "-" s exprMul -- sub
                    | exprMul

    exprMul = exprMul s "*" s exprExp -- mul
                    | exprMul s "/" s exprExp -- div
                    | exprExp

    exprExp = exprExp s "^" s exprFac -- exp
                    | exprFac

    exprFac = exprFac s "!" -- fac
                    | exprPar

    exprPar = "(" s exprAdd s ")" -- par
                    | number

    // ====================

    augmented = identifier "*=" expression -- mul
                    | identifier "/=" expression -- div
                    | identifier "+=" expression -- plus
                    | identifier "-=" expression -- sub

    // ====================

    text = string | char

    string = "\\"" (~("\\"" | nl) any)* "\\""

    char = "'" (~nl any) "'"

    // ====================
    
    array = "[" listOf<arrayArg, ","> "]"

    arrayArg = s expression s

    // ====================

    matrix = "{" listOf<matrixArgsTypes, ","> "}"

    matrixArgsTypes = s (matrix | number) s

    // ====================
    
    iterative = "for" listOf<iterativeArg, ","> "in" s expression s ":" s block
    
    iterativeArg = s identifier s

    // ====================

    invocation = invocationPipe | invocationPrint | invocationFn // | invocationFactorial todo

    invocationPipe = "|" s expression s "|"
    
    invocationFactorial = expression s "!"
    
    invocationPrint = "print(" s listOf<invocationFnArg, ","> s ")"
    
    invocationFn = identifier "(" s listOf<invocationFnArg, ","> s ")"
    
    invocationFnArg = s expression s

    // ====================

    fn = "fun " s identifier s "(" listOf<fnArg, ","> "):" s block

    fnArg = s (var | identifier) s

    return = "return" s expression s

    var = identifier s "=" s expression s
    
    // ====================

    afn = ":(" listOf<afnArg, ","> "):" s expression
    
    afnArg = s identifier s

    // ====================

    cond = condWhen | condWhenElse | condElse

    condWhen = "when" s (comparator | boolean) s ":" s block
    
    condWhenElse = "else when" s (comparator | boolean) s ":" s block

    condElse = "else:" s block

    // ====================

    ternary = expression s "?" s expression s ":" s expression

    // ====================

    comparator = expression s "==" s expression -- equals
                    | expression s "!=" s expression -- not_equals
                    | expression s ">" s expression -- bigger
                    | expression s "<" s expression -- smaller
                    | expression s ">=" s expression -- bigger_equals
                    | expression s "<=" s expression -- smaller_equals
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

    element(x, _) {
        return x.eval();
    },

    // booleans

    // parse boolean value
    boolean(x) {
        return x.sourceString === "true"; // ignore
    },

    logical_and(x, _, __, ___, y) {
        return x.eval() && y.eval();
    },
    logical_or(x, _, __, ___, y) {
        return x.eval() || y.eval();
    },
    // if an expression is within parentheses, just evaluate the inner expression
    logicalPar_par(_, __, x, ___, ____) {
        return x.eval();
    },
    logicalPar_not(_, x) {
        return !x.eval();
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
    exprAdd_plus(x, _, __, ___, y) {
        return x.eval().add(y.eval());
    },
    exprAdd_sub(x, _, __, ___, y) {
        return x.eval().subtract(y.eval());
    },
    exprMul_mul(x, _, __, ___, y) {
        return x.eval().multiply(y.eval());
    },
    exprMul_div(x, _, __, ___, y) {
        return x.eval().divide(y.eval());
    },
    exprExp_exp(x, _, __, ___, y) {
        return x.eval().exp(y.eval());
    },
    exprFac_fac(x, _, __) {
        return x.eval().factorial();
    },
    // if an expression is within parentheses, just evaluate the inner expression
    exprPar_par(_, __, x, ___, ____) {
        return x.eval();
    },

    // augmented assignment

    // todo

    // texts

    string(_, x, __) {
        return new String(x.sourceString); // ignore
    },

    char(_, x, __) {
        return new String(x.sourceString); // ignore
    },

    // arrays

    array(_, xs, __) {
        return new Collection(xs
            .asIteration()
            .children
            .map(x => x.eval()));
    },

    arrayArg(_, x, __) {
        return x.eval();
    },

    // matrices

    matrix(_, xs, __) {
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

    invocationPipe(_, __, x, ___, ____) {
        x = x.eval();
        if (x instanceof Fraction) {
            return x.abs();
        } else if (x instanceof Collection) {
            return x.length();
        }
        return x;
    },

    invocationFactorial(x, _, __) {
        return x.eval().factorial();
    },

    invocationPrint(_, __, xs, ___, ____) {
        console.log((xs
            .asIteration()
            .children
            .map(x => x.eval().toString()))
            .join(" "));

        return true; // any value is true
    },

    invocationFnArg(_, x, __) {
        return x.eval();
    },

    // fn definition


    // afn


    // conditionals


    // ternary

    ternary(cond, _, q, __, pass, ___, c, ____, dontPass) {
        return cond.eval() ? pass.eval() : dontPass.eval();
    },

    // comparators

    comparator_equals(x, _, s, __, y) {
        return x.eval() === y.eval();
    },
    comparator_not_equals(x, _, s, __, y) {
        return x.eval() !== y.eval();
    },
    comparator_bigger(x, _, s, __, y) {
        return x.eval() > y.eval();
    },
    comparator_smaller(x, _, s, __, y) {
        return x.eval() < y.eval();
    },
    comparator_bigger_equals(x, _, s, __, y) {
        return x.eval() >= y.eval();
    },
    comparator_smaller_equals(x, _, s, __, y) {
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

