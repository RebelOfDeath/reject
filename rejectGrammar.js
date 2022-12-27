const ohm = require('ohm-js')
const grammar = ohm.grammar(`
Reject {

    // note that almost all elements in this grammar are lexical rules.
    // this is to avoid goofy indentation, etc.

    program = listOf<element, (nl | comment)+>

       element = (statement | expression) s
    
    statement = iterative | return | var | fn
    
    expression = logical | comparator | cond | ternary | afn | invocation | literal | identifier

    // ====================

    comment = "#" (~nl any)*
    
    // inline spacing
    inline = " " | "\t" | comment // ignore comments in code
    
    s = inline*
        
    nl = "\n" | "\r" | "\u2028" | "\u2029"
    
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

    text = string | char

    string = "\"" (~("\"" | nl) any)* "\""

    char = "'" (~nl any) "'"

    // ====================
    
    array = "[" listOf<arrayArg, ","> "]"

    arrayArg = s expression s

    // ====================

    matrix = "{" listOf<matrixArgsTypes, ","> "}"

    matrixArgsTypes = s (matrix | number) s

    // ====================
    
    iterative = "for" listOf<iterativeArg, ","> "in" s expression s ":" s
    
    iterativeArg = s identifier s

    // ====================

    invocation = invocationPipe | invocationFactorial | invocationFn

    invocationPipe = "|" s expression s "|"
    
    invocationFactorial = expression s "!"
    
    invocationFn = identifier "(" s listOf<invocationFnArg, ","> s ")"
    
    invocationFnArg = s expression s

    // ====================

    fn = "fun " s identifier s "(" listOf<fnArg, ","> "):" s 

    fnArg = s (var | identifier) s

    return = "return" s expression s

    var = identifier s "=" s expression s
    
    // ====================

    afn = ":(" listOf<afnArg, ","> "):" s expression
    
    afnArg = s identifier s

    // ====================

    cond = condWhen | condWhenElse | condElse

    condWhen = "when" s comparator s ":" s
    
    condWhenElse = "else when" s comparator s ":" s

    condElse = "else:" s

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