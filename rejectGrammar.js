import ohm from 'ohm-js';

const grammar = ohm.grammar(`
Reject {

    Program = element*

    element = expression

    expression = exprAdd

    // ====================

    integer = "-"? digit+

    number = integer

    exprAdd = exprAdd "+" exprMul -- plus
                    | exprAdd "-" exprMul -- sub
                    | exprMul

    exprMul = exprMul "*" exprExp -- mul
                    | exprMul "/" exprExp -- div
                    | exprExp

    exprExp = exprExp "^" exprPar -- exp
                    | exprPar

    exprPar = "(" exprAdd ")" -- par
                    | number
}
`)

const semantics = grammar.createSemantics();

semantics.addOperation('eval', {
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
    integer(sgn, x) {
        return parseInt(sgn.sourceString + x.sourceString);
    },
    _iter(...children) {
        return children.map(c => c.eval())
    }
});

console.log(semantics(grammar.match("(1+5)/6-(1+5/6)*10^3")).eval())