import * as ohm from 'ohm-js';

const grammar = ohm.grammar(`
Outline <: IndentationSensitive {
      Items = Item+
      Item = "-" label indent Items dedent  -- withChildren
          | "-" label  -- leaf
    
      label = (~newline any)* eol
    
      eol = newline | end
      newline = "\\r\\n" | "\\r" | "\\n"
      spaces := (~newline space)*
}
`,
    {IndentationSensitive: ohm.IndentationSensitive}
);

grammar.match(`
- x\n
  - y\n
  - z\n
- a
`);