import ohm from 'ohm-js';

const grammar = ohm.grammar(`
Reject {

    // note that all elements in this grammar are lexical rules.
    // this is to avoid incorrect indentation, etc.

    program = ls* listOf<element, ls+> ls*

    element = (statement | expression) s
    
    statement = iterative | return | var | augmented | fn
    
    expression = logical | comparator | cond | ternary | afn | invocation | literal | identifier

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

    logical = logical s "and" s boolean -- and
                    | logical s "or" s boolean -- or
                    | logicalPar

    logicalPar = "(" s logical s ")" -- par
                    | "!" logical -- inv
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

    exprExp = exprExp s "^" s number -- exp
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

    invocation = invocationPipe | invocationFactorial | invocationFn

    invocationPipe = "|" s expression s "|"
    
    invocationFactorial = expression s "!"
    
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

const semantics = grammar.createSemantics();

semantics.addOperation('eval', {
    exprAdd_plus(x, _1, _2, _3, y) {
        return x.eval() + y.eval();
    },
    exprAdd_sub(x, _1, _2, _3, y) {
        return x.eval() - y.eval();
    },
    exprMul_mul(x, _1, _2, _3, y) {
        return x.eval() * y.eval();
    },
    exprMul_div(x, _1, _2, _3, y) {
        return x.eval() / y.eval();
    },
    exprExp_exp(x, _1, _2, _3, y) {
        return Math.pow(x.eval(), y.eval());
    },
    number(digits) {
        return parseInt(digits.sourceString)
    }
});

console.log(semantics(grammar.match('100 + 1 * 2')).eval())