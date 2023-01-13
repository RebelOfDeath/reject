const grammar = ohm.grammar(`
Reject {
    
    // =============

    // note that all elements in this grammar are lexical rules.
    // this is to avoid incorrect indentation, etc.

    program = ls* listOf<element, ls> ls* end

    element = var | expression | cond | for | return | fn
    
    // =============
    
    // todo fix
    var = listOf<varList, ",">
    
    varList = identifier s "=" expressionSpaced
    
    // =============
    
    // improve naming
    expression = assignment
    
    expressionSpaced = s expression s
        
    // assignment first since it uses exprs
    assignment = ternary s assignmentOp expressionSpaced -- assignment
        | ternary
    
    // ternary doesn't allow for assignment, so go down
    ternary = ternary s "?" expressionSpaced ":" expressionSpaced -- ternary
        | comparator
        
    comparator = comparator s compareOp expressionSpaced -- compare
        | addition
        
    addition 
        = addition s addOp s multiplication -- add
        | multiplication
        
    multiplication 
        = multiplication s mulOp s exponentiation -- mul
        | exponentiation 
        
    exponentiation
        = exponentiation s "^" s logical -- exp
        | exponentiation "!" -- fac // adding a space causes x! to be confused with x !=, so for now this'll have to do
        | logical
        
    logical = logical s logicOp expressionSpaced -- logic
        | logicalNot
        
    logicalNot = "!" logicalNot s -- not
        | afn

    afn = ":(" listOf<identifierSpaced, ","> "): " expressionSpaced -- afn
        | pipe
        
    pipe = "|" expressionSpaced "|" -- pipe
        | invocation
        
    invocation = identifier "(" listOf<expressionSpaced, ","> ")" -- invoke
        | default
        
    // the last resort
    default
        = identifier 
        | literal
        | "(" expression ")" -- par
    
    // =============
    
    cond = condWhen
    
    condWhen = "when " expressionSpaced ":" s block
    
    for = "for " listOf<identifierSpaced, ","> "in" expressionSpaced ":" s block
    
    fn = "fun " identifierSpaced "(" listOf<fnArg, ","> "):" s block
    
    fnArg = s (var | identifier) s
    
    return = "return" expressionSpaced
    
    // =============
    
    literal = boolean | char | string | number | array | matrix
    
    boolean = "true" | "false"
    
    string = "\\"" (~("\\"" | nl) any)* "\\""

    char = "'" (~nl any) "'"
    
    integer = "-"? digit+
    
    float = "-"? digit* "." integer+
    
    number = integer | float
    
    array = "[" listOf<expressionSpaced, ","> "]"

    matrix = "{" listOf<expressionSpaced, ","> "}"
    
    // =============
    
    addOp = "+" | "-"
    
    mulOp = "*" | "/" | "%"
    
    assignmentOp = "=" | "+=" | "-=" | "*=" | "/=" | "^=" | "%="
    
    compareOp = "==" | "!=" | "<=" | ">=" | "<" | ">" 
    
    logicOp = "and" | "or"
    
    nl = "\\n" | "\\r" | "\u2028" | "\u2029" 
    
    comment (a comment) = "#" (~nl any)*
    
    // line separator
    ls = (nl | comment)+
    
    s = (" " | "    " | comment)*
    
    identifier = ~(digit+) #(alnum | "_")+
    
    identifierSpaced = s identifier s
    
    // todo make sure this uses the correct indentation all the way
    block = ls listOf<blockElem, ls>
    
    blockElem = indent+ element?
    
    indent = "    " | "  " | "\\t"
}
`)

const semantics = grammar.createSemantics();

semantics.addOperation("eval", {

    // main stuff
    program(_, xs, __, ___) {
        return xs
            .asIteration()
            .children
            .map(x => x.eval());
    },

    expressionSpaced(_, x, __) {
        return x.eval();
    },

    // =============

    varList(ident, _, __, value) {
        ident = ident.sourceString.trim();
        value = value.eval();

        VARS.set(ident, new Var(ident, value));
    },

    // =============

    assignment_assignment(name, _, op, expr) {
        name = name.sourceString.trim();
        op = op.sourceString.trim();
        expr = expr.eval();

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

    ternary_ternary(cond, _, __, pass, ___, dontPass) {
        return cond.eval() ? pass.eval() : dontPass.eval();
    },

    comparator_compare(x, _, op, y) {
        x = x.eval();
        op = op.sourceString.trim();
        y = y.eval();

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

    addition_add(x, _, op, ___, y) {
        x = x.eval();
        y = y.eval();
        op = op.sourceString.trim();

        switch (op) {
            case "+":
                return x.add(y);
            case "-":
                return x.subtract(y);
        }
    },

    multiplication_mul(x, _, op, ___, y) {
        x = x.eval();
        y = y.eval();
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

    exponentiation_exp(x, _, __, ___, y) {
        return x.eval().pow(y.eval());
    },
    exponentiation_fac(x, _) {
        return x.eval().factorial();
    },

    logical_logic(x, _, op, y) {
        x = x.eval();
        y = y.eval();
        op = op.sourceString.trim();

        switch (op) {
            case "and":
                return x && y;
            case "or":
                return x || y;
        }
    },

    logicalNot_not(_, x, __) {
        return !x.eval();
    },

    afn_afn(_, args, __, expr) {

    },

    pipe_pipe(_, x, __) {
        x = x.eval();

        if (x instanceof Fraction) {
            return x.abs();
        } else if (x instanceof Collection) {
            return x.length();
        }

        // return x when there is no value to be changed
        return x;
    },

    invocation_invoke(ident, _, xs, __) {
        let fun = FUNS.get(ident.sourceString.trim());

        return fun.invoke(xs.asIteration()
            .children
            .map(x => x.eval()));
    },

    default_par(_, x, __) {
        return x.eval();
    },

    // =============

    condWhen(_, arg, __, ___, block) {
        if (arg === true) {
            block.eval();
        }
    },

    fn(_, ident, __, args, ___, ____, block) {
        ident = ident.sourceString.trim();

        FUNS.set(ident, new Fn(ident,
            args.asIteration()
                .children
                .map(variable => {
                    let string = variable.sourceString.trim();
                    let ident = string.split("=")[0].trim();

                    return string.includes("=") ? new Var(ident, variable.children[1].children[2].eval()) : new Var(ident, null);
                }), block));
    },

    fnArg(_, x, __) {
        return x.eval();
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

    array(_, xs, __) {
        return new Collection(xs
            .asIteration()
            .children
            .map(x => x.eval()));
    },

    matrix(_, xs, __) {
        return new Matrix(xs
            .asIteration()
            .children
            .map(x => x.eval()));
    },

    // =============

    identifier(x) {
        let str = x.sourceString.trim();

        if (VARS.has(str)) {
            return VARS.get(str).value;
        }

        throw new Error("Unknown variable: " + str);
    },

    identifierSpaced(_, x, __) {
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

    // a program contains multiple elements, so call eval on all of them
    _iter(...children) {
        return children.map(c => c.eval());
    },
})

function parse(input) {
    semantics(grammar.match(input)).eval();
}

class Fraction {

    constructor(numerator, denominator = 1) {
        if (denominator === 0) {
            throw new Error("Cannot divide by 0");
        }

        if (arguments.length === 2) {
            // Both numerator and denominator are provided
            this.numerator = numerator;
            this.denominator = denominator;
        } else {
            // Only numerator is provided
            if (Number.isInteger(numerator)) {
                this.numerator = numerator;
                this.denominator = 1;
            } else {
                this.numerator = numerator * Math.pow(10, numerator.toString().split(".")[1].length);
                this.denominator = Math.pow(10, numerator.toString().split(".")[1].length);
                this.simplify();
            }
        }
    }

    add(otherFraction) {
        const numerator =
            this.numerator * otherFraction.denominator +
            otherFraction.numerator * this.denominator;
        const denominator = this.denominator * otherFraction.denominator;
        return new Fraction(numerator, denominator).simplify();
    }

    subtract(otherFraction) {
        const numerator =
            this.numerator * otherFraction.denominator -
            otherFraction.numerator * this.denominator;
        const denominator = this.denominator * otherFraction.denominator;
        return new Fraction(numerator, denominator).simplify();
    }

    multiply(otherFraction) {
        const numerator = this.numerator * otherFraction.numerator;
        const denominator = this.denominator * otherFraction.denominator;
        return new Fraction(numerator, denominator).simplify();
    }

    divide(otherFraction) {
        const numerator = this.numerator * otherFraction.denominator;
        const denominator = this.denominator * otherFraction.numerator;
        return new Fraction(numerator, denominator).simplify();
    }

    pow(otherFraction) {
        const numerator = this.numerator ** otherFraction.numerator;
        const denominator = this.denominator ** otherFraction.denominator;
        return new Fraction(numerator, denominator).simplify();
    }

    factorial() {
        let x = 1;
        for (let i = 2; i <= this.numerator; i++) {
            x *= i;
        }

        return new Fraction(x);
    }

    abs() {
        return new Fraction(Math.abs(this.numerator), Math.abs(this.denominator));
    }

    simplify() {
        let gcd = this.getGCD(this.numerator, this.denominator);
        this.numerator = this.numerator / gcd;
        this.denominator = this.denominator / gcd;
        return this;
    }

    getGCD(a, b) {
        if (b === 0) {
            return a;
        }
        return this.getGCD(b, a % b);
    }

    toString() {
        return `${this.numerator}/${this.denominator}`;
    }

    evaluate() {
        return this.numerator / this.denominator;
    }

    eval() {
        return this;
    }
}