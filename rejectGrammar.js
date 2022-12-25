const ohm = require('ohm-js')
const grammar = ohm.grammar(`
Reject {

    Line = Comment | Statement
    
    Statement = Iterative | Return | Assignment | Expression
    
    Assignment = Var | Fn
    
    Expression = Logical | Comparator | Cond | Ternary | Invocation | Literal | StorableFormat

    // ====================

    Literal = Array | Matrix | Text | Arithmetic | Boolean

    // format for vars, fn names
    StorableFormat = ~(digit+) #(alnum | "_")+
    
    Block = Statement*
    
    // ====================
    
    Boolean = "true" | "false"

    Logical = Logical "and" Boolean -- and
    				| Logical "or" Boolean -- or
                    | ParLogical

    ParLogical = "(" Logical ")" -- par
    				| "!" Logical -- inv
                    | Boolean

    // ====================

    Comment = "#" any*

    // ====================

	Integer = "-"? digit+
    
    Float = "-"? digit* "." Integer+
    
    Fraction = Integer+ "//" Integer+

    Number = Fraction | Float | Integer

	Arithmetic = AddExp

    AddExp = AddExp "+" MulExpr -- plus
                    | AddExp "-" MulExpr -- sub
                    | MulExpr

    MulExpr = MulExpr "*" ExpExpr -- mul
                    | MulExpr "/" ExpExpr -- div
                    | ExpExpr

    ExpExpr = MulExpr "^" Number -- exp
                    | ParExpr

    ParExpr = "(" AddExp ")" -- par
                    | Number

    // ====================

    Text = String | Char

    String = "\"" alnum* "\""

    Char = "'" alnum "'"

    // ====================
    
    Array = "[" ArrayArgs "]"

    ArrayArgs = Expression* ("," Expression)+ -- multiple
                    | Expression -- single 
                    | "" -- empty

	// ====================

    Matrix = "{" MatrixArgs "}"

    MatrixArgs = MatrixArgsTypes* ("," MatrixArgsTypes)+ -- multiple
                    | MatrixArgsTypes -- single 
                    | "" -- empty

    MatrixArgsTypes = Matrix | Number

    // ====================
    
    Iterative = "for" IterativeArgs "in" Expression ":" Block
    
    IterativeArgs = StorableFormat* ("," StorableFormat)+ -- multiple 
    				| StorableFormat -- single 

    // ====================

    Invocation = PipeFnInvoke | FnInvoke

    PipeFnInvoke = "|" Expression "|"
    
    FnInvoke = StorableFormat "(" FnInvokeArgs ")"

    // expr for invokation args
    FnInvokeArgs = Expression* ("," Expression)+ -- multiple
                    | Expression -- single 
                    | "" -- empty

    // ====================

    Fn = "fun " StorableFormat "(" FnArgs "):" Block

    FnArg = Var | StorableFormat

    FnArgs = FnArg* ("," FnArg)+ -- multiple
                    | FnArg -- single 
                    | "" -- empty

	Return = "return" Expression

    // ====================

    Var = StorableFormat "=" Expression

    // ====================

    Cond = WhenCond | WhenElseCond | ElseCond

    WhenCond = "when" Comparator ":" Block
    
    WhenElseCond = "else when" Comparator ":" Block

    ElseCond = "else:" Block

	// ====================

    Ternary = Expression "?" Expression ":" Expression

	// ====================

    Comparator = Expression "==" Expression -- equals
    				| Expression "!=" Expression -- not_equals
    				| Expression ">" Expression -- bigger
    				| Expression "<" Expression -- smaller
    				| Expression ">=" Expression -- bigger_equals
    				| Expression "<=" Expression -- smaller_equals
}Reject {

    Statement = Performable | Assignment | Expression
    
    Performable = Iterative | Return 
    
    Assignment = Var | Fn
    
    Expression = Logical | Comparator | Cond | Ternary | Invocation | Literal | StorableFormat

    // ====================

    Literal = Array | Matrix | Text | Arithmetic | Boolean

    // format for vars, fn names
    StorableFormat = ~(digit+) #(alnum | "_")+
    
    Block = Statement*
    
    //blockx = ":" (any ~(space space))*
    
    //BlockStatement = #("\t") "_"
    
	// ====================

	nl = "\n" | "\r" | "\u2028" | "\u2029"

    comment = "#" (~nl any)*
    
    space := nl | "\t" | " " | comment // ignore comments in code
    
    // ====================
    
    Boolean = "true" | "false"

    Logical = Logical "and" Boolean -- and
    				| Logical "or" Boolean -- or
                    | ParLogical

    ParLogical = "(" Logical ")" -- par
    				| "!" Logical -- inv
                    | Boolean

    // ====================

	Integer = "-"? digit+
    
    Float = "-"? digit* "." Integer+
    
    Fraction = Integer+ "//" Integer+

    Number = Fraction | Float | Integer

	Arithmetic = AddExp

    AddExp = AddExp "+" MulExpr -- plus
                    | AddExp "-" MulExpr -- sub
                    | MulExpr

    MulExpr = MulExpr "*" ExpExpr -- mul
                    | MulExpr "/" ExpExpr -- div
                    | ExpExpr

    ExpExpr = MulExpr "^" Number -- exp
                    | ParExpr

    ParExpr = "(" AddExp ")" -- par
                    | Number

    // ====================

    Text = String | Char

    String = "\"" alnum* "\""

    Char = "'" alnum "'"

    // ====================
    
    Array = "[" ListOf<Expression, ","> "]"

	// ====================

    Matrix = "{" ListOf<MatrixArgsTypes, ","> "}"

    MatrixArgsTypes = Matrix | Number

    // ====================
    
    Iterative = "for" ListOf<StorableFormat, ","> "in" Expression ":" Block

    // ====================

    Invocation = PipeFnInvoke | FnInvoke

    PipeFnInvoke = "|" Expression "|"
    
    FnInvoke = StorableFormat "(" ListOf<Expression, ","> ")"

    // ====================

    Fn = "fun " StorableFormat "(" ListOf<FnArg, ","> "):" Block

    FnArg = Var | StorableFormat

	Return = "return" Expression

    // ====================

    Var = StorableFormat "=" Expression

    // ====================

    Cond = WhenCond | WhenElseCond | ElseCond

    WhenCond = "when" Comparator ":" Block
    
    WhenElseCond = "else when" Comparator ":" Block

    ElseCond = "else:" Block

	// ====================

    Ternary = Expression "?" Expression ":" Expression

	// ====================

    Comparator = Expression "==" Expression -- equals
    				| Expression "!=" Expression -- not_equals
    				| Expression ">" Expression -- bigger
    				| Expression "<" Expression -- smaller
    				| Expression ">=" Expression -- bigger_equals
    				| Expression "<=" Expression -- smaller_equals
}
`)