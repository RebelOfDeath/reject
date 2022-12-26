const ohm = require('ohm-js')
const grammar = ohm.grammar(`
Reject {

    // note that almost all elements in this grammar are lexical rules.
    // this is to avoid goofy indentation, etc.

    Program = element*

    element = statement | expression
    
    statement = iterative | return | var | fn
    
    expression = logical | comparator | cond | ternary | invocation | literal | identifier

    // ====================
    
    nl = "\\n" | "\\r" | "\u2028" | "\u2029"

    comment = "#" (~nl any)*
    
    space := " " | comment // ignore comments in code
    
    // ====================

    literal = array | matrix | text | arithmetic | boolean

    // format for vars, fn names
    identifier = ~(digit+) #(alnum | "_")+
    
    // ====================
    
    boolean = "true" | "false"

    logical = logical spaces "and" spaces boolean -- and
                    | logical spaces "or" spaces boolean -- or
                    | logicalPar

    logicalPar = "(" spaces logical spaces ")" -- par
                    | "!" logical -- inv
                    | boolean

    // ====================

    integer = "-"? digit+
    
    float = "-"? digit* "." integer+
    
    fraction = integer+ "//" integer+

    number = fraction | float | integer

    arithmetic = exprAdd

    exprAdd = exprAdd spaces "+" spaces exprMul -- plus
                    | exprAdd spaces "-" spaces exprMul -- sub
                    | exprMul

    exprMul = exprMul spaces "*" spaces exprExp -- mul
                    | exprMul spaces "/" spaces exprExp -- div
                    | exprExp

    exprExp = exprExp spaces "^" spaces number -- exp
                    | exprPar

    exprPar = "(" spaces exprAdd spaces ")" -- par
                    | number

    // ====================

    text = string | char

    string = "\\"" (~("\\"" | nl) any)* "\\""

    char = "'" (~nl any) "'"

    // ====================
    
    array = "[" listOf<expression, ","> "]"

    // ====================

    matrix = "{" listOf<matrixArgsTypes, ","> "}"

    matrixArgsTypes = spaces (matrix | number) spaces

    // ====================
    
    iterative = "for " spaces listOf<identifier, ","> spaces " in " spaces expression spaces ":" spaces

    // ====================

    invocation = invocationPipe | invocationFn

    invocationPipe = "|" spaces expression spaces "|"
    
    invocationFn = identifier "(" spaces listOf<expression, ","> spaces ")"

    // ====================

    fn = "fun " spaces identifier spaces "(" spaces listOf<fnArg, ","> spaces "):" spaces 

    fnArg = var | identifier

    return = "return " spaces expression

    var = identifier spaces "=" spaces expression spaces

    // ====================

    cond = condWhen | condWhenElse | condElse

    condWhen = "when " spaces comparator spaces ":" spaces
    
    condWhenElse = "else when " spaces comparator spaces ":" spaces

    condElse = "else:" spaces

    // ====================

    ternary = expression spaces "?" spaces expression spaces ":" spaces expression

    // ====================

    comparator = expression spaces "==" spaces expression -- equals
                    | expression spaces "!=" spaces expression -- not_equals
                    | expression spaces ">" spaces expression -- bigger
                    | expression spaces "<" spaces expression -- smaller
                    | expression spaces ">=" spaces expression -- bigger_equals
                    | expression spaces "<=" spaces expression -- smaller_equals
}
`)