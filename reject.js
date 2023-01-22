import ohm from 'ohm-js';
import {Collection} from "./src/collection.js";
import {Fraction} from "./src/fraction.js";
import {Complex} from "./src/complex.js";
import {AFn, Fn, FUNS} from "./src/fn.js";
import {Var, VARS} from "./src/var.js";
import {Str} from "./src/str.js";
import {Matrix} from "./src/matrix.js";
import {Return} from "./src/return.js";
import {For} from "./src/for.js";

import "./src/builtIns/constants.js";
import "./src/builtIns/general.js";
import "./src/builtIns/graphs.js";
import "./src/builtIns/stats.js";
import "./src/builtIns/trig.js";

console.log("Loading grammar");

const g = ohm.grammar(`
Reject { 
    
    // =============

    // note that all elements in this grammar are lexical rules.
    // this is to avoid incorrect indentation, etc.

    Program = Element*

    Element = Var | Cond | For | Return | Fn | Expression
    
    // =============
    
    // todo fix
    Var = identifier "=" Expression
    
    // =============
    
    // improve naming
    Expression = Assignment
    
    // assignment first since it uses exprs
    Assignment = Ternary assignmentOp Expression -- assignment
        | Ternary
    
    // ternary doesn't allow for assignment, so go down
    Ternary = Ternary "?" Expression ":" Expression -- ternary
        | Comparator
        
    Comparator = Comparator compareOp Expression -- compare
        | Addition
        
    Addition = Addition addOp Multiplication -- add
        | Multiplication
        
    Multiplication 
        = Multiplication mulOp Exponentiation -- mul
        | Exponentiation 
        
    Exponentiation
        = Exponentiation "^" Logical -- exp
        | Exponentiation ~spaces "!" -- fac // adding a space causes x! to be confused with x !=, so for now this'll have to do
        | Logical
        
    Logical = Logical logicOp Expression -- logic
        | LogicalNot
        
    LogicalNot = "!" ~spaces LogicalNot -- not
        | AFn

    AFn = ":(" ListOf<identifier, ","> "): " Expression -- afn
        | Pipe
        
    Pipe = "|" Expression "|" -- pipe
        | Invocation
        
    Invocation = identifier "(" listOf<Expression, ","> ")" -- invoke
        | Default
        
    // the last resort
    Default
        = Literal 
        | identifier
        | "(" Expression ")" -- par
    
    // =============
    
    Cond = CondWhen
    
    CondWhen = "when " Expression Block
    
    For = "for " ListOf<identifier, ","> "in" Expression Block
    
    Fn = "fun " identifier "(" ListOf<FnArg, ","> ")" Block
    
    FnArg = Var | identifier
    
    Return = "return" Expression
    
    // =============
    
    Literal = boolean | char | string | number | Array | Matrix
    
    boolean = "true" | "false"
    
    string = "\\"" (~("\\"" | nl) any)* "\\""

    char = "'" (~nl any) "'"
    
    integer = "-"? digit+
    
    float = "-"? digit* "." integer+
    
    number = float | integer
    
    Array = "[" ListOf<Expression, ","> "]"

    Matrix = "{" ListOf<Expression, ","> "}"
    
    // =============
    
    addOp = "+" | "-"
    
    mulOp = "*" | "/" | "%"
    
    assignmentOp = "=" | "+=" | "-=" | "*=" | "/=" | "^=" | "%="
    
    compareOp = "==" | "!=" | "<=" | ">=" | "<" | ">" 
    
    logicOp = "and" | "or"
    
    comment (a comment) = "#" (~nl any)*
    
    nl = "\\r\\n" | "\\r" | "\\n"
    
    space := ... | comment
    
    identifier = ~(digit+) #(alnum | "_")+
    
    Block = "{" Element+ "}"

}`)

console.log("Created grammar");

const semantics = g.createSemantics();

console.log("Created semantics");

semantics.addOperation("parse", {

    // =============

    Var(ident, _, value) {
        ident = ident.sourceString.trim();
        value = value.parse();

        VARS.set(ident, new Var(ident, value));
    },

    // =============

    Assignment_assignment(name, op, expr) {
        name = name.sourceString.trim();
        op = op.sourceString.trim();
        expr = expr.parse();

        let updated;
        if (VARS.has(name)) {
            updated = VARS.get(name);

            switch (op) {
                case "=":
                    updated.value = expr;
                    break;
                case "+=":
                    updated.value = updated.value.add(expr);
                    break;
                case "-=":
                    updated.value = updated.value.subtract(expr);
                    break;
                case "*=":
                    updated.value = updated.value.multiply(expr);
                    break;
                case "/=":
                    updated.value = updated.value.divide(expr);
                    break;
                case "^=":
                    updated.value = updated.value.pow(expr);
                    break;
                case "%=":
                    updated.value = updated.value.mod(expr);
                    break;
            }
        } else {
            updated = expr;
        }

        VARS.set(name, updated);
    },

    Ternary_ternary(cond, _, pass, __, dontPass) {
        return cond.parse() ? pass.parse() : dontPass.parse();
    },

    Comparator_compare(x, op, y) {
        x = x.parse();
        op = op.sourceString.trim();
        y = y.parse();

        switch (op) {
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
                    console.log(x.evaluate(), y.evaluate());
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

    Addition_add(x, op, y) {
        x = x.parse();
        y = y.parse();
        op = op.sourceString.trim();

        switch (op) {
            case "+":
                return x.add(y);
            case "-":
                return x.subtract(y);
        }
    },

    Multiplication_mul(x, op, y) {
        x = x.parse();
        y = y.parse();
        op = op.sourceString.trim();

        switch (op) {
            case "*":
                return x.multiply(y);
            case "/":
                return x.divide(y);
            case "%":
                return x.evaluate() % y.evaluate();
        }
    },

    Exponentiation_exp(x, _, y) {
        return x.parse().pow(y.parse());
    },
    Exponentiation_fac(x, _) {
        return x.parse().factorial();
    },

    Logical_logic(x, op, y) {
        x = x.parse();
        y = y.parse();
        op = op.sourceString.trim();

        switch (op) {
            case "and":
                return x && y;
            case "or":
                return x || y;
        }
    },

    LogicalNot_not(_, x) {
        return !x.parse();
    },

    AFn_afn(_, args, __, expr) {
        return new AFn(
            args.asIteration()
                .children
                .map(variable => new Var(variable.sourceString.trim(), null)),
            expr);
    },

    Pipe_pipe(_, x, __) {
        x = x.parse();

        if (x instanceof Fraction) {
            return x.abs();
        } else if (x instanceof Collection) {
            return x.length();
        }

        // return x when there is no value to be changed
        return x;
    },

    Invocation_invoke(ident, _, xs, __) {
        ident = ident.sourceString.trim();
        let fun = FUNS.get(ident);

        if (fun === null || fun === undefined) {
            throw new Error(`Unknown function: ${ident}`);
        }

        return fun.invoke(xs.asIteration()
            .children
            .map(x => x.parse()));
    },

    Default_par(_, x, __) {
        return x.parse();
    },

    // =============

    CondWhen(_, arg, block) {
        if (arg.parse() === true) {
            return block.parse();
        }
    },

    // For = "for " ListOf<identifier, ","> "in" Expression Block
    For(_, params, __, values, block) {
        values = values.parse();

        if (!(values instanceof Collection)) {
            throw new TypeError("Only collections may be looped");
        }

        const loop = new For(
            params.asIteration()
                .children
                .map(variable => new Var(variable.sourceString.trim(), null)),
            values,
            block);

        loop.invoke();
    },

    Fn(_, ident, __, args, ___, block) {
        ident = ident.sourceString.trim();

        FUNS.set(ident, new Fn(ident,
            args.asIteration()
                .children
                .map(variable => {
                    let string = variable.sourceString.trim();
                    let ident = string.split("=")[0].trim();

                    return string.includes("=") ? new Var(ident, variable.children[1].children[2].parse()) : new Var(ident, null);
                }), block));
    },

    Return(_, expr) {
        return new Return(expr.parse());
    },

    // =============

    boolean(x) {
        return x.sourceString === "true";
    },

    string(_, x, __) {
        return new Str(x.sourceString);
    },

    char(_, x, __) {
        return new Str(x.sourceString);
    },

    integer(sgn, x) {
        return new Fraction(parseInt(sgn.sourceString + x.sourceString));
    },

    float(sgn, x, _, y) {
        return new Fraction(parseFloat(sgn.sourceString + x.sourceString + "." + y.sourceString));
    },

    Array(_, xs, __) {
        return new Collection(xs
            .asIteration()
            .children
            .map(x => x.parse()));
    },

    Matrix(_, xs, __) {
        return new Matrix(xs
            .asIteration()
            .children
            .map(x => x.parse()));
    },

    // =============

    identifier(x) {
        let str = x.sourceString.trim();

        if (VARS.has(str)) {
            return VARS.get(str).value;
        }

        throw new Error("Unknown variable: " + str);
    },

    Block(_, xs, __) {
        return xs.parse();
    },

    // a program contains multiple elements, so call eval on all of them
    _iter(...children) {
        return children.map(c => c.parse());
    },
})

console.log("Defined semantics");

export default function parseInput(input) {
    const result = g.match(input);

    if (result.succeeded()) {
        return semantics(result).parse();
    } else {
        log(result.message)
        throw new Error(result.message);
    }
}