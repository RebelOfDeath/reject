import ohm from 'ohm-js';

const grammar = ohm.grammar(`
Reject {

    Program = element*

    element = expression

    expression = exprAdd

    // ====================

    integer = "-"? digit+
    
    float = "-"? digit* "." integer+
    
    fraction = integer+ "//" integer+

    number = fraction | float | integer

    arithmetic = exprAdd

    exprAdd = exprAdd "+" exprMul -- plus
                    | exprAdd "-" exprMul -- sub
                    | exprMul

    exprMul = exprMul "*" exprExp -- mul
                    | exprMul "/" exprExp -- div
                    | exprExp

    exprExp = exprExp "^" number -- exp
                    | exprPar

    exprPar = "(" exprAdd ")" -- par
                    | number
}
`)

const semantics = grammar.createSemantics();

semantics.addOperation('eval', {

    integer(sgn, x) {
        return parseInt(sgn.sourceString + x.sourceString);
    },

    float(sgn, x, _, y) {
        return parseFloat(sgn.sourceString + x.sourceString + "." + y.eval())
    },

    fraction(x, _, y) {
        return x.eval() / y.eval()
    },

    exprAdd_plus(x, _, y) {
        return x.eval() + y.eval()
    },
    exprAdd_sub(x, _, y) {
        return x.eval() - y.eval()
    },
    exprMul_mul(x, _, y) {
        return x.eval() * y.eval()
    },
    exprMul_div(x, _, y) {
        return x.eval() / y.eval()
    },
    exprExp_exp(x, _, y) {
        return Math.pow(x.eval(), y.eval())
    },
    exprPar_par(_0, x, _1) {
        return x.eval();
    },


    _iter(...children) {
        return children.map(c => c.eval())
    }
});

console.log(semantics(grammar.match("(1+5)/6-(1+5/6)*10^3.5")).eval())
console.log(semantics(grammar.match("3//5")).eval())