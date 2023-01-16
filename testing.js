const grammar = ohm.grammar(`
G <: IndentationSensitive {
  IfExpr = "if" Expr ":" Block
  Block = indent Expr dedent
  Expr = IfExpr
       | "True"
       | "False"
       | number
  number = digit+
}
`,
    {IndentationSensitive: ohm.IndentationSensitive}
);

console.log(ohm.IndentationSensitive);

const x = grammar.match(`
if True:\n
  if False:\n
    3
`).succeeded();

console.log(x);