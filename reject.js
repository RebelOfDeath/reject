console.log("Loading grammar");

const grammar = ohm.grammar(`
Reject <: IndentationSensitive { 
    
    // =============

    // note that all elements in this grammar are lexical rules.
    // this is to avoid incorrect indentation, etc.

    program = eol* listOf<element, eol> eol*

    element = var | cond | for | return | fn | expression
    
    // =============
    
    // todo fix
    var = identifier s "=" expressionSpaced
    
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
    
    comment (a comment) = "#" (~nl any)*

    eol = nl | comment

    nl = "\\r\\n" | "\\r" | "\\n"
    
    s = (" " | "\t" | comment)*
    
    identifier = ~(digit+) #(alnum | "_")+
    
    identifierSpaced = s identifier s
    
    block = eol indent element* dedent

}
`, {IndentationSensitive: ohm.IndentationSensitive})

console.log("Created grammar");

const semantics = grammar.createSemantics();

console.log("Created semantics");

semantics.addOperation("eval", {

    // main stuff
    program(_, xs, __) {
        return xs
            .asIteration()
            .children
            .map(x => x.eval());
    },

    expressionSpaced(_, x, __) {
        return x.eval();
    },

    // =============

    var(ident, _, __, value) {
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
        if (arg.eval() === true) {
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

    block(_, __, xs, ___) {
        return xs
            .asIteration()
            .children
            .map(x => x.eval());
    },

    // a program contains multiple elements, so call eval on all of them
    _iter(...children) {
        return children.map(c => c.eval());
    },
})

console.log("Defined semantics");

function parse(input) {
    
    const result = grammar.match(input);

    if (result.succeeded()) {
        return semantics(result).eval();
    } else {
        log(result.shortMessage)
        throw new Error(result.message);
    }
}

class Collection {
    constructor(items) {
        this.items = items;
    }

    // Add an item to the end of the collection
    append(item) {
        this.items.push(item);
    }

    // Insert an item at a specific index
    insert(index, item) {
        this.items.splice(index, 0, item);
    }

    // Remove an item from the collection
    remove(item) {
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }

    // Find the index of an item in the collection
    index(item) {
        return this.items.indexOf(item);
    }

    // Check if an item is in the collection
    contains(item) {
        return this.index(item) !== -1;
    }

    // Get the length of the collection
    length() {
        return this.items.length;
    }

    // Get the item at a specific index
    get(index) {
        return this.items[index];
    }

    // Set the item at a specific index
    set(index, item) {
        this.items[index] = item;
    }

    // Get a sub-collection (slice) of the collection
    slice(start, end) {
        return new Collection(this.items.slice(start, end));
    }

    map(fn) {
        const mapped = this.items.map(fn);
        return new Collection(mapped);
    }

    // Reduce the collection to a single value by applying a function to each item in the collection
    reduce(fn, initialValue) {
        return this.items.reduce(fn, initialValue);
    }

    // Filter the collection to a new Collection with only the items that pass a test function
    filter(fn) {
        const filtered = this.items.filter(fn);
        return new Collection(filtered);
    }

    //evaluate and assign the value of the Collection from a string
    fromString(string) {
        return eval(string);
    }

    toString() {
        return `[${this.items.join(", ")}]`;
    }
}

class Complex {
    constructor(real, imag) {
        this.real = real instanceof Fraction ? real : new Fraction(real);
        this.imag = imag instanceof Fraction ? imag : new Fraction(imag);
    }

    //adds to Complex types together
    add(other) {
        if(!(other instanceof Complex)){
            other = new Complex(other)
        }
        return new Complex(
            this.real.add(other.real),
            this.imag.add(other.imag)
        );
    }

    //subtracts two Complex types from each other
    subtract(other) {
        if(!(other instanceof Complex)){
            other = new Complex(other)
        }
        return new Complex(
            this.real.subtract(other.real),
            this.imag.subtract(other.imag)
        );
    }

    //multiplies to Complex types with each other
    multiply(other) {
        if(!(other instanceof Complex)){
            other = new Complex(other)
        }
        return new Complex(
            this.real
                .multiply(other.real)
                .subtract(this.imag.multiply(other.imag)),
            this.real.multiply(other.imag).add(this.imag.multiply(other.real))
        );
    }

    //divides two Complex types by each other
    divide(other) {
        if(!(other instanceof Complex)){
            other = new Complex(other)
        }
        // const denom = other.real ** 2 + other.imag ** 2;
        // return new Complex(
        //     (this.real * other.real + this.imag * other.imag) / denom,
        //     (this.imag * other.real - this.real * other.imag) / denom
        // );
        //I have no idea if this will work!! 10:30 pm vibez man!
        let real = this.real
            .multiply(other.real)
            .add(this.imag.multiply(other.imag));
        let imag = this.imag
            .multiply(other.real)
            .subtract(this.real.multiply(other.imag));
        let denom = other.real
            .multiply(other.real)
            .add(other.imag.multiply(other.imag));
        return new Complex(
            real.divide(denom).evaluate(),
            imag.divide(denom).evaluate()
        );
    }

    //returns the conjugate of the complex number, which is obtained by negating the imaginary part of the complex number
    conjugate() {
        return new Complex(this.real, this.imag.multiply(-1));
    }

    //returns the absolute value (magnitude) of the complex number
    abs() {
        return new Fraction(Math.sqrt(
            this.real.multiply(this.real).add(this.imag.multiply(this.imag))
        ));
    }

    //returns the argument (angle) of the complex number in radians when no input is given
    //when input is true, the answer given is in degrees
    arg(degrees = false) {
        const argument = Math.atan2(this.imag.evaluate(), this.real.evaluate());
        return new Fraction(degrees ? (argument * 180) / Math.PI : argument);
    }

    //returns the nth power of the complex number.
    pow(n) {
        if(!(n instanceof Fraction)){
            n = new Fraction(n)
        } // todo is this supposed to be fraction or ?

        const magnitude = this.abs();
        const argument = this.arg();
        return new Complex(
            magnitude ** n.evaluate() * Math.cos(argument * n.evaluate()),
            magnitude ** n.evaluate() * Math.sin(argument * n.evaluate())
        );
    }

    //returns the exponential of the complex number, which is defined as e^(a+bi) = e^a * (cos(b) + i*sin(b))
    exp() {
        return new Complex(
            Math.exp(this.real.evaluate()) * Math.cos(this.imag.evaluate()),
            Math.exp(this.real.evaluate()) * Math.sin(this.imag.evaluate())
        );
    }

    //return the length of the complex number
    length() {
        let real = this.real.evaluate();
        let imag = this.imag.evaluate();
        return new Fraction(
            Math.sqrt((real^2) + (imag^2))
        )
    }

    //returns the sine of the complex number
    sin() {
        return new Complex(
            Math.sin(this.real.evaluate()) * Math.cosh(this.imag.evaluate()),
            Math.cos(this.real.evaluate()) * Math.sinh(this.imag.evaluate())
        );
    }

    //returns the cosine of the complex number
    cos() {
        return new Complex(
            Math.cos(this.real.evaluate()) * Math.cosh(this.imag.evaluate()),
            -Math.sin(this.real.evaluate()) * Math.sinh(this.imag.evaluate())
        );
    }

    //return the tangent of the complex number
    tan() {
        return this.sin().divide(this.cos());
    }

    //returns the hyperbolic cosine of the complex number
    cosh() {
        return new Complex(
            Math.cos(this.imag.evaluate()) * Math.cosh(this.real.evaluate()),
            Math.sin(this.imag.evaluate()) * Math.sinh(this.real.evaluate())
        );
    }

    //returns the hyperbolic sine of the complex number
    sinh() {
        return new Complex(
            Math.sin(this.imag.evaluate()) * Math.cosh(this.real.evaluate()),
            Math.cos(this.imag.evaluate()) * Math.sinh(this.real.evaluate())
        );
    }

    //returns the hyperbolic tangent of the complex number
    tanh() {
        return this.sinh().divide(this.cosh());
    }

    //returns a string representation of the complex number
    toString() {
        let imag = this.imag.evaluate();

        let imag_part = imag > 0
            ? `+ ${imag}`
            : `- ${Math.abs(imag)}`;
        return `(${this.real.evaluate()} ${imag_part} i)`;
    }
}

const FUNS = new Map();

class Fn {

    constructor(name, params = [], block = []) {
        this.name = name;
        this.params = params;
        this.block = block;
    }

    invoke(params) {
        for (let i = 0; i < params.length; i++) {
            let variable = this.params[i];
            variable.value = params[i];

            VARS.set(variable.name, variable);
        }

        return this.block.eval();
    }
}

class AFn extends Fn {

    constructor(params, block) {
        super("", params, block)
    }

    invoke(params) {
        for (let i = 0; i < params.length; i++) {
            let variable = this.params[i];
            variable.value = params[i];

            VARS.set(variable.name, variable);
        }

        return this.block.eval();
    }
}

class NativeFn extends Fn {

    constructor(name, afn) {
        super(name);

        this.afn = afn;
    }

    invoke(params) {
        return this.afn(...params);
    }
}

// registers a single function
function register(fn) {
    if (fn.name.length === 0) {
        throw new Error("Cannot register anonymous functions");
    }

    FUNS.set(fn.name, fn);
}

// registers a native function, provided with a map
function registerNativeFns(map) {

    for (const name in map) {
        let fn = map[name];

        register(new NativeFn(name, fn));
    }
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
class Matrix extends Collection {

    // Initialize a Matrix with a 2D array of numbers or a Collection instance
    // accounts that all rows of the matrix must be of the same length
    // when matrix rows are not of the same length, they are filled with 0's
    constructor(matrix) {
        super();

        if (matrix instanceof Collection) {
            matrix = matrix.items;
        }

        const maxRowLength = Math.max(...matrix.map((row) => row.length));
        this.items = matrix.map((row) => {
            while (row.length < maxRowLength) {
                row.push(0);
            }
            return row;
        });
    }

    // Transpose the Matrix (swap rows and columns)
    transpose() {
        const transposed = this.items[0].map((col, i) =>
            this.items.map((row) => row[i])
        );
        return new Matrix(transposed);
    }

    // Multiply the Matrix by another Matrix or a scalar value
    multiply(other) {
        if (other instanceof Matrix) {
            if (this.items[0].length !== other.items.length) {
                throw new Error("Invalid matrix dimensions for multiplication");
            }

            const product = this.items.map((row) => {
                return other.transpose().items.map((col) => {
                    return row.reduce(
                        (total, value, i) => total + value * col[i],
                        0
                    );
                });
            });

            return new Matrix(product);
        } else {
            const product = this.items.map((row) =>
                row.map((value) => value * other)
            );
            return new Matrix(product);
        }
    }

    // Add the Matrix to another Matrix
    add(other) {
        if (
            this.items.length !== other.items.length ||
            this.items[0].length !== other.items[0].length
        ) {
            throw new Error("Invalid matrix dimensions for addition");
        }

        const sum = this.items.map((row, i) =>
            row.map((value, j) => value + other.items[i][j])
        );
        return new Matrix(sum);
    }

    // Subtract another Matrix from the Matrix
    subtract(other) {
        if (
            this.items.length !== other.items.length ||
            this.items[0].length !== other.items[0].length
        ) {
            throw new Error("Invalid matrix dimensions for subtraction");
        }

        const difference = this.items.map((row, i) =>
            row.map((value, j) => value - other.items[i][j])
        );
        return new Matrix(difference);
    }
    // Get the determinant of the Matrix (only works for square matrices)
    determinant() {
        if (this.items.length !== this.items[0].length) {
            throw new Error("Matrix must be square to calculate determinant");
        }

        if (this.items.length === 2) {
            return (
                this.items[0][0] * this.items[1][1] -
                this.items[0][1] * this.items[1][0]
            );
        }

        let determinant = 0;
        for (let i = 0; i < this.items[0].length; i++) {
            const cofactor = new Matrix(
                this.items
                    .slice(1)
                    .map((row) => row.slice(0, i).concat(row.slice(i + 1)))
            );
            determinant +=
                (i % 2 === 0 ? 1 : -1) *
                this.items[0][i] *
                cofactor.determinant();
        }
        return determinant;
    }

    // todo add
    pow(n) {

    }

    // todo add
    factorial() {

    }

    // Get the number of columns in the Matrix
    col() {
        return this.items[0].length;
    }

    // Get the number of rows in the Matrix
    row() {
        return this.items.length;
    }

    // Get the dimensions of the Matrix (number of rows and columns)
    dimensions() {
        return { rows: this.row(), cols: this.col() };
    }

    // Transform the Matrix into a square Matrix, filling missing values with 0's
    toSquare() {
        const maxDimension = Math.max(this.row(), this.col());
        const squareMatrix = new Array(maxDimension)
            .fill(0)
            .map(() => new Array(maxDimension).fill(0));
        this.items.forEach((row, i) => {
            row.forEach((value, j) => {
                squareMatrix[i][j] = value;
            });
        });
        return new Matrix(squareMatrix);
    }

    // Get the value at a specific position in the Matrix
    get(row, col) {
        if (row >= this.row() || col >= this.col()) {
            throw new Error("Invalid matrix position");
        }
        return this.items[row][col];
    }

    // Set the value at a specific position in the Matrix
    set(row, col, value) {
        if (row >= this.row() || col >= this.col()) {
            throw new Error("Invalid matrix position");
        }
        this.items[row][col] = value;
    }

    // Add a row to the Matrix
    addRow(row) {
        if (!row) {
            row = new Array(this.col()).fill(0);
        }
        if (row.length > this.col()) {
            row = row.slice(0, this.col());
        }
        if (row.length < this.col()) {
            while (row.length < this.col()) {
                row.push(0);
            }
        }
        this.items.push(row);
    }

    // Add a column to the Matrix
    addCol(col) {
        if (!col) {
            col = new Array(this.row()).fill(0);
        }
        if (col.length > this.row()) {
            col = col.slice(0, this.row());
        }
        if (col.length < this.row()) {
            while (col.length < this.row()) {
                col.push(0);
            }
        }
        this.items = this.items.map((row, i) => row.concat(col[i]));
    }

    // Check if the Matrix is a square matrix
    isSquare() {
        return this.items.length === this.items[0].length;
    }

    // Check if the Matrix is a diagonal matrix
    isDiagonal() {
        if (!this.isSquare()) {
            return false;
        }
        for (let i = 0; i < this.items.length; i++) {
            for (let j = 0; j < this.items[0].length; j++) {
                if (i !== j && this.items[i][j] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if the Matrix is an identity matrix
    isIdentity() {
        if (!this.isSquare()) {
            return false;
        }
        for (let i = 0; i < this.items.length; i++) {
            for (let j = 0; j < this.items[0].length; j++) {
                if (i === j && this.items[i][j] !== 1) {
                    return false;
                }
                if (i !== j && this.items[i][j] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if the Matrix is a lower triangular matrix
    isLowerTriangular() {
        if (!this.isSquare()) {
            return false;
        }
        for (let i = 0; i < this.items.length; i++) {
            for (let j = 0; j < this.items[0].length; j++) {
                if (i < j && this.items[i][j] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if the Matrix is an upper triangular matrix
    isUpperTriangular() {
        if (!this.isSquare()) {
            return false;
        }
        for (let i = 0; i < this.items.length; i++) {
            for (let j = 0; j < this.items[0].length; j++) {
                if (i > j && this.items[i][j] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }

    inverse() {
        if (!this.isSquare()) {
            throw new Error("Matrix must be square to calculate inverse");
        }

        // Check if matrix is invertible
        const det = this.determinant();
        if (det === 0) {
            throw new Error("Matrix is not invertible");
        }

        // Calculate inverse using cofactor expansion
        const inverted = this.items.map((row, i) => {
            return row.map((value, j) => {
                const cofactor = new Matrix(
                    this.items
                        .slice(0, i)
                        .concat(this.items.slice(i + 1))
                        .map((row) => row.slice(0, j).concat(row.slice(j + 1)))
                );
                return (i + j) % 2 === 0
                    ? cofactor.determinant()
                    : -cofactor.determinant();
            });
        });
        return new Matrix(inverted).multiply(1 / det);
    }

    // Calculate the rank of a matrix
    rank() {
        // Convert matrix to reduced row echelon form
        const rref = this.rref();
        let rank = 0;
        rref.items.forEach((row) => {
            if (!row.every((value) => value === 0)) {
                rank++;
            }
        });
        return rank;
    }

    //rhs stands for right hand side and as a parameter represents the vector of constants
    //on the right side of the equation represented by the matrix
    solve(rhs) {
        // Check if the matrix is square
        if (!this.isSquare()) {
            throw new Error(
                "Matrix must be square to solve system of equations"
            );
        }

        // Check if the matrix is invertible
        if (this.determinant() === 0) {
            throw new Error(
                "System has no solution or an infinite number of solutions"
            );
        }

        // Calculate the inverse of the matrix
        const inverse = this.inverse();

        // Multiply the inverse by the right-hand side to get the solution
        const solution = inverse.multiply(rhs);

        return solution;
    }

    equals(other) {
        if (
            this.items.length !== other.items.length ||
            this.items[0].length !== other.items[0].length
        ) {
            return false;
        }
        return this.items.every((row, i) =>
            row.every((value, j) => value === other.items[i][j])
        );
    }

    isSymmetric() {
        if (!this.isSquare()) {
            throw new Error("Matrix must be square to check symmetry");
        }
        return this.equals(this.transpose());
    }

    isSkewSymmetric() {
        // Check if the matrix is square
        if (!this.isSquare()) {
            return false;
        }

        // Check if the matrix is equal to the negation of its transpose
        const transpose = this.transpose();
        const skewSymmetric = this.items.every((row, i) =>
            row.every((value, j) => value === -transpose.items[i][j])
        );
        return skewSymmetric;
    }

    isOrthogonal() {
        // Check if the matrix is square
        if (!this.isSquare()) {
            return false;
        }

        // Check if the determinant of the matrix is 1 or -1
        if (this.determinant() !== 1 && this.determinant() !== -1) {
            return false;
        }

        // Check if the columns of the matrix are mutually orthonormal
        for (let i = 0; i < this.items[0].length; i++) {
            for (let j = 0; j < this.items[0].length; j++) {
                if (i !== j) {
                    const columnI = new Matrix([
                        this.items.map((row) => row[i]),
                    ]);
                    const columnJ = new Matrix([
                        this.items.map((row) => row[j]),
                    ]);
                    if (
                        columnI.transpose().multiply(columnJ).determinant() !==
                        0
                    ) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    toString() {
        return `{${this.items.join(", ")}}`;
    }
}
class Str extends Collection {
    constructor(items = []) {
        if (typeof items === "string") {
            items = items.split("");
        }
        super(items);
    }

    // Get the complete string as a JavaScript string
    get string() {
        return this.items.join("");
    }

    // Set the complete string by splitting it into an array of characters
    set string(string) {
        this.items = string.split("");
    }

    // Reverse the string
    reverse() {
        return new Str(this.items.reverse());
    }

    // Get the character at a specific index
    charAt(index) {
        return this.items[index];
    }

    // Get the index of the first occurrence of a substring
    indexOf(substring) {
        return this.items.join("").indexOf(substring);
    }

    // Get the index of the last occurrence of a substring
    lastIndexOf(substring) {
        return this.items.join("").lastIndexOf(substring);
    }

    // Check if the string starts with a specific substring
    startsWith(substring) {
        return this.items.join("").startsWith(substring);
    }

    // Check if the string ends with a specific substring
    endsWith(substring) {
        return this.items.join("").endsWith(substring);
    }

    // Get the substring between two indices (inclusive)
    slice(start, end) {
        return new Str(this.items.slice(start, end + 1));
    }

    // Split the string into an array of substrings
    split(separator) {
        return new Collection(this.items.join("").split(separator));
    }

    // Replace all occurrences of a substring with another string
    replace(substring, replacement) {
        return new Str(
            this.items.join("").replace(substring, replacement).split("")
        );
    }

    // Remove leading and trailing whitespace from the string
    trim() {
        return new Str(this.items.join("").trim().split(""));
    }

    // Convert the string to uppercase
    toUpperCase() {
        return new Str(this.items.join("").toUpperCase().split(""));
    }

    // Convert the string to lowercase
    toLowerCase() {
        return new Str(this.items.join("").toLowerCase().split(""));
    }

    // Convert the string to a number
    toNumber() {
        return Number(this.items.join(""));
    }

    // Check if the string is empty
    isEmpty() {
        return this.items.length === 0;
    }

    getCharAt(index) {
        if (index < 0 || index >= this.items.length) {
            throw new RangeError("Index out of bounds");
        }
        return this.items[index];
    }

    // Set the character at a specific index
    setCharAt(index, char) {
        if (index < 0 || index >= this.items.length) {
            throw new RangeError("Index out of bounds");
        }
        if (typeof char !== "string" || char.length !== 1) {
            throw new TypeError("Value must be a single character string");
        }
        this.items[index] = char;
    }

    // Concatenate multiple strings or String objects
    concat(...strings) {
        let combinedString = this.string;
        for (const string of strings) {
            if (string instanceof Str) {
                combinedString = combinedString.concat(string.string);
            } else if (typeof string === "string") {
                combinedString = combinedString.concat(string);
            } else {
                throw new TypeError("Value must be a string or String object");
            }
        }
        return new Str(combinedString);
    }

    // Pad the start of the string with a character or string
    padStart(length, padString = " ") {
        if (typeof length !== "number" || length < 0) {
            throw new TypeError("Length must be a non-negative number");
        }
        if (typeof padString !== "string") {
            throw new TypeError("Pad string must be a string");
        }
        return new Str(this.string.padStart(length, padString));
    }

    // Pad the end of the string with a character or string
    padEnd(length, padString = " ") {
        if (typeof length !== "number" || length < 0) {
            throw new TypeError("Length must be a non-negative number");
        }
        if (typeof padString !== "string") {
            throw new TypeError("Pad string must be a string");
        }
        return new Str(this.string.padEnd(length, padString));
    }

    // Pad the start and end of the string with a character or string
    pad(startLength, endLength = startLength, padString = " ") {
        if (typeof startLength !== "number" || startLength < 0) {
            throw new TypeError("Start length must be a non-negative number");
        }
        if (typeof endLength !== "number" || endLength < 0) {
            throw new TypeError("End length must be a non-negative number");
        }
        if (typeof padString !== "string") {
            throw new TypeError("Pad string must be a string");
        }
        return this.padStart(startLength, padString).padEnd(
            endLength,
            padString
        );
    }

    // Repeat the string a specified number of times
    repeat(count) {
        if (typeof count !== "number" || count < 0) {
            throw new TypeError("Count must be a non-negative number");
        }
        return new Str(this.string.repeat(count));
    }

    // Get the substring between two indices (inclusive)
    substring(start, end) {
        if (
            typeof start !== "number" ||
            start < 0 ||
            start > this.items.length
        ) {
            throw new RangeError("Start index out of bounds");
        }
        if (typeof end !== "number" || end < 0 || end > this.items.length) {
            throw new RangeError("End index out of bounds");
        }
        return new Str(this.items.slice(start, end + 1));
    }

    // TODO: we could potentially create our own regex type
    match(regex) {
        if (!(regex instanceof RegExp)) {
            throw new TypeError("Value must be a regular expression");
        }
        return this.string.match(regex);
    }

    // Search for a substring or regular expression in the string
    search(query) {
        return this.string.search(query);
    }

    // Truncate the string to a given length and append an ellipsis if necessary
    truncate(length, ellipsis = "...") {
        if (this.string.length > length) {
            return new Str(
                this.string.slice(0, length - ellipsis.length) + ellipsis
            );
        }
        return new Str(this.string);
    }

    // Get the Unicode code point value at a specific index
    codePointAt(index) {
        return this.string.codePointAt(index);
    }

    toString() {
        return this.string;
    }
}
const VARS = new Map();

class Var {

    constructor(name, value, scope = "global") {
        this.name = name;
        this.value = value;
        this.scope = scope;
    }

    get var() {
        return this.value;
    }

    set var(value) {
        this.value = value;
    }
}

function registerNativeConstants(map) {

    for (const name in map) {
        let value = map[name];

        VARS.set(name, new Var(name, value));
    }
}

let general = {
    print : (...xs) => {
        log(xs
            .map(x => x.toString())
            .join(" "));
        return true;
    },
    sgn : (num) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return num === 0 ? new Fraction(0) : new Fraction(Math.sign(num));
    },
    floor : (num) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return new Fraction(Math.floor(num));
    },
    ceil : (num) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return new Fraction(Math.ceil(num));
    },
    round : (num) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return new Fraction(Math.round(num));
    },
    ln : (num) => {
        if(!(num instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        return new Fraction(Math.log(num.evaluate()));
    },
    log : (num, base=10) => {
        if(!((num instanceof Fraction) && (base===10 || base instanceof Fraction))) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        num = num.evaluate();
        return new Fraction(Math.log(num) / (base===10 ? Math.log(10) : Math.log(base.evaluate())));
    },
    max : (num1, ...rest) => {
        if (!(num1 instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }

        let max = num1.evaluate();
        for (let elem in rest){
            if (!(elem instanceof Fraction)){
                throw new TypeError('Function only supports numeric type (Fraction)');
            }
            max = (elem.evaluate() > max ? elem.evaluate() : max);
        }
        return new Fraction(max);
    },
    min : (num1, ...rest) => {
        if (!(num1 instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }

        let min = num1.evaluate();
        for (let elem in rest){
            if (!(elem instanceof Fraction)){
                throw new TypeError('Function only supports numeric type (Fraction)');
            }
            min = (elem.evaluate() < min ? elem.evaluate() : min);
        }
        return new Fraction(min);
    },
    mod : (number, divisor) => {
        if(!(number instanceof Fraction && divisor instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        number = number.evaluate();
        divisor = divisor.evaluate();
        return new Fraction(number % divisor);
    },
    sqrt : (number) => {
        if(!(number instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        number = number.evaluate();
        return new Fraction(Math.sqrt(number));
    },
    root : (number, n) => {
        if(!(number instanceof Fraction && n instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        number = number.evaluate();
        n = n.evaluate();

        return new Fraction(Math.pow(number, 1 / n));
    },
    exp : (number, n=Math.E) => {
        if(!(number instanceof Fraction && (n instanceof Fraction || n === Math.E))){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        number = number.evaluate();
        n = (n === Math.E ? Math.E : n.evaluate());
        return new Fraction(Math.pow(n, number))
    },
    det : (matrix) => {
        if(!(matrix instanceof Matrix)){
            throw new TypeError('Function only supports matrices');
        }
        return new Fraction(matrix.determinant())
    },
    gcd : (num1, num2) => {
        if(!(num1 instanceof Fraction && num2 instanceof Fraction)){
            throw new TypeError('Function only supports matrices');
        }
        let x = Math.abs(num1.evaluate());
        let y = Math.abs(num2.evaluate());

        while(y) {
            let t = y;
            y = x % y;
            x = t;
        }

        return new Fraction(x)
    },
    lcm : (num1, num2) => {
        let gcd = general.gcd(num1, num2);
        return new Fraction((num1.evaluate() * num2.evaluate()) / gcd);
    },
    sum : (num1, ...rest) => {
        if(!(num1 instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let sum = num1.evaluate();
        for(let elem in rest){
            if (!(elem instanceof Fraction)) {
                throw new TypeError('Function only supports numeric type (Fraction)');
            }
            sum = sum + elem.evaluate();
        }
        return new Fraction(sum);
    },
    D : (a, b, c) => {
        if (!(a instanceof Fraction && b instanceof Fraction && c instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        a = a.evaluate();
        b = b.evaluate();
        c = c.evaluate();
        return new Fraction((b^2) - (4 * a * c));
    },
    poly2 : (a, b, c) => {
        let D = general.D(a, b, c).evaluate();
        a = a.evaluate();
        b = b.evaluate();
        c = c.evaluate();

        if (D < 0) {
            throw new Error("Discriminant value below 0")
        } else if (D === 0) {
            return new Fraction((-b) / (2*a))
        } else {
            let sqrtD = Math.sqrt(D);
            return new Collection([(-b + sqrtD) / (2 * a), (-b - sqrtD)/(2 * a)])
        }
    },
    abs : (elem) => {
        if (elem instanceof Fraction) {
            return elem.abs();
        } else if (elem instanceof Collection || elem instanceof Complex) {
            return new Fraction(elem.length());
        } else {
            throw new TypeError('Function does not support provided type');
        }
    }
}

let trigFuncs = {
    cos: (angle, radian=true) => {
        if (!(angle instanceof Fraction)){
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radian? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.cos(radAngle));
    },
    sin: (angle, radian=true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radian? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.sin(radAngle));
    },
    tan: (angle, radian=true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radian? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(Math.tan(radAngle));
    },
    cot: (angle, radian=true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radian? angle.evaluate() : (angle.evaluate() * 0.0174533))
        return new Fraction(1 / Math.tan(radAngle));
    },
    arcCos: (angle, radian=true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = Math.acos(angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533));
    },
    arcSin: (angle, radian=true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = Math.asin(angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533));
    },
    arcTan: (angle, radian=true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = Math.atan(angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533));
    },
    arcCot: (angle, radian=true) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = Math.atan(1 / angle.evaluate());
        return new Fraction((radian ? radAngle : radAngle / 0.0174533));
    },
    rad: (angle) => {
        if (!(angle instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        return new Fraction((angle.evaluate()) * 0.0174533);
    },
    sinh: (num, radians=true) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radians? num.evaluate : (num.evaluate() * 0.0174533));
        return new Fraction(Math.sinh(radAngle))
    },
    cosh: (num, radians=true) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radians? num.evaluate : (num.evaluate() * 0.0174533));
        return new Fraction(Math.cosh(radAngle))
    },
    tanh: (num, radians=true) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        let radAngle = (radians? num.evaluate : (num.evaluate() * 0.0174533));
        return new Fraction(Math.tanh(radAngle))
    },
    deg: (num) => {
        if (!(num instanceof Fraction)) {
            throw new TypeError('Function only supports numeric type (Fraction)');
        }
        return new Fraction((num.evaluate()) / 0.0174533);
    }
}

registerNativeFns(general);
registerNativeFns(trigFuncs);

let constants = {
    pi : new Fraction(355, 113),
    e : new Fraction(Math.E)
}

registerNativeConstants(constants);