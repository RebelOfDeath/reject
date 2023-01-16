const g = ohm.grammar(`
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

function parse(input) {
  console.log(g.match().succeeded());
}