import ohm from 'ohm-js'
import fs from "fs";
import {Fraction} from "./dataTypes/fraction.js"
import {String} from "./dataTypes/string.js"
import {Collection} from "./dataTypes/collection.js"
import {Matrix} from "./dataTypes/matrix.js";
import {ParsingError, ReadingError} from "./reject.js";
import {Complex} from "./dataTypes/complex.js";
import {Var, VARS} from "./dataTypes/var.js";
import {Function, FUNS} from "./dataTypes/function.js";

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

    comment (a comment) = "#" (~nl any)*
    
    // stuff that doesn't matter inline
    s = (" " | "\\t" | comment)*
        
    // new line chars
    nl = "\\n" | "\\r" | "\u2028" | "\u2029"
    
    // line separator
    ls = (nl | comment)+
    
    // todo make sure this uses the correct indentation all the way
    block = ls listOf<blockElem, ls>
    
    blockElem = indent+ element?
    
    indent = "    " | "  " | "\\t"
    
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

    augmented = (identLeft "*=" exprSpaced)
                    | (identLeft "/=" exprSpaced)
                    | (identLeft "+=" exprSpaced)
                    | (identLeft "-=" exprSpaced)

    // ====================

    text = string | char

    string = "\\"" (~("\\"" | nl) any)* "\\"" s

    char = "'" (~nl any) "'" s

    // ====================
    
    array = "[" listOf<exprSpaced, ","> "]" s

    // ====================

    matrix = "{" listOf<exprSpaced, ","> "}" s

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

    condWhen = "when " exprLeft ":" s block
    
    condWhenElse = "else when " exprLeft ":" s block

    condElse = "else: " s block
    
    condArg = s (comparator | boolean) s

    // ====================

    ternary = exprLeft "?" exprSpaced ":" exprSpaced

    // ====================

    comparator = (exprLeft "==" exprSpaced)
                    | (exprLeft "!=" exprSpaced)
                    | (exprLeft ">" exprSpaced)
                    | (exprLeft "<" exprSpaced)
                    | (exprLeft ">=" exprSpaced)
                    | (exprLeft "<=" exprSpaced)
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

    block(_, xs) {
        return xs.asIteration()
            .children
            .map(x => x.eval());
    },

    blockElem(_, x) {
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
        return x.eval().pow(y.eval());
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

    augmented(name, modifier, value) {
        name = name.sourceString.trim();
        modifier = modifier.sourceString.trim();
        value = value.eval();

        let updated;
        if (VARS.has(name)) {
            updated = VARS.get(name);

            switch (modifier) {
                case "*=":
                    updated.value = updated.value.multiply(value);
                    break;
                case "/=":
                    updated.value = updated.value.divide(value);
                    break;
                case "+=":
                    updated.value = updated.value.add(value);
                    break;
                case "-=":
                    updated.value = updated.value.subtract(value);
                    break;
            }
        } else {
            updated = new Var(name, new Fraction(0));
        }

        VARS.set(name, updated);
    },

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

    // iteratives


    // fn invocation

    invocationPipe(_, x, __, ___) {
        x = x.eval();

        if (x instanceof Fraction) {
            return x.abs();
        } else if (x instanceof Collection) {
            return x.length();
        }

        // return x when there is no value to be changed
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

    // invocationFn = identifier "(" s listOf<exprSpaced, ","> s ")" s
    invocationFn(ident, _, __, xs, ___, ____, _____) {
        let fun = FUNS.get(ident.sourceString.trim());

        console.log(fun);

        return fun.invoke(xs.asIteration()
            .children
            .map(x => x.eval()));
    },

    // fn definition

    // fn = "fun " identSpaced "(" listOf<fnArg, ","> "):" s block
    fn(_, ident, __, args, ___, ____, block) {
        ident = ident.sourceString.trim();

        FUNS.set(ident, new Function(ident,
            args.asIteration()
                .children
                .map(variable => {
                    let string = variable.sourceString.trim();
                    let ident = string.split("=")[0].trim();

                    return string.includes("=") ? new Var(ident, variable.children[1].children[2].eval()) : new Var(ident, null);
                }), block));

        console.log(FUNS);
    },

    fnArg(_, x, __) {
        return x.eval();
    },

    // var = identLeft "=" exprSpaced
    var(ident, _, value) {
        ident = ident.sourceString.trim();
        value = value.eval();

        VARS.set(ident, new Var(ident, value));
    },

    // afn


    // conditionals

    // condWhen = "when" expr ":" s block
    condWhen(_, arg, __, ___, block) {
        if (arg === true) {
            // execute block
        }
    },

    // ternary

    ternary(cond, __, pass, ___, dontPass) {
        return cond.eval() ? pass.eval() : dontPass.eval();
    },

    // comparators

    comparator(x, modifier, y) {
        x = x.eval();
        modifier = modifier.sourceString.trim();
        y = y.eval();

        switch (modifier) {
            case "==":
                if (x instanceof Fraction && y instanceof Fraction) {
                    return x.evaluate() === y.evaluate();
                } else if (x instanceof Complex && y instanceof Complex) {
                    return x.real === y.real && x.imag === y.imag;
                } else if (x instanceof Collection && y instanceof Collection) {
                    if (x === y) return true;
                    if (x.length() === y.length()) return true;

                    return x.toString() === y.toString(); // probably not the most efficient, but who cares! :D
                } else {
                    return x === y;
                }
            case "!=":
                if (x instanceof Fraction && y instanceof Fraction) {
                    return x.evaluate() !== y.evaluate();
                } else if (x instanceof Complex && y instanceof Complex) {
                    return x.real !== y.real && x.imag !== y.imag;
                } else if (x instanceof Collection && y instanceof Collection) {
                    if (x === y || x.length() !== y.length()) return false;

                    return x.toString() !== y.toString();
                } else {
                    return x !== y;
                }
            case ">":
                if (x instanceof Fraction && y instanceof Fraction) {
                    return x.evaluate() > y.evaluate();
                }

                throw new TypeError(`Operator '>' cannot be applied to '${typeof x}' and '${typeof y}'`);
            case "<":
                if (x instanceof Fraction && y instanceof Fraction) {
                    return x.evaluate() < y.evaluate();
                }

                throw new TypeError(`Operator '<' cannot be applied to '${typeof x}' and '${typeof y}'`);
            case ">=":
                if (x instanceof Fraction && y instanceof Fraction) {
                    return x.evaluate() >= y.evaluate();
                }

                throw new TypeError(`Operator '>=' cannot be applied to '${typeof x}' and '${typeof y}'`);
            case "<=":
                if (x instanceof Fraction && y instanceof Fraction) {
                    return x.evaluate() <= y.evaluate();
                }

                throw new TypeError(`Operator '<=' cannot be applied to '${typeof x}' and '${typeof y}'`);
        }
    },

    // generics

    // a program contains multiple elements, so call eval on all of them
    _iter(...children) {
        return children.map(c => c.eval());
    },
})

fs.readFile("./x.rej", "utf8", (error, data) => {
    if (error) {
        throw new ReadingError(error.stack)
    }

    try {
        semantics(grammar.match(data)).eval()
    } catch (error) {
        throw new ParsingError(error.stack)
    }
})