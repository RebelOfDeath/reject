import {VARS} from "./var.js";

export const FUNS = new Map();

export class Function {

    constructor(name, params, block = []) {
        this.name = name;
        this.params = params;
        this.input = this.params
        this.block = block;
    }

    invoke(...args) {
        let nonSetParamCount = this.params.filter(x => x.value === null).length;

        if ((args.length <= this.params.length) && (this.params.length >= nonSetParamCount)) {
            throw new SyntaxError(`Invalid argument count of ${args.length} for function call of '${this.name}'`);
        }

        //makes the assumption that the user is aware of the style guide of the reject language
        //function in the reject language containing default parameters must set these at the end of each function definition and should be aware of this order
        //for the process of function invocation
        for (let i = 0; i < args.length; i++) {
            let variable = this.input[i];
            variable.value = args[i];

            VARS.set(variable.name, variable);
        }

        this.block.asIteration()
            .children
            .map(x => x.eval());
    }

}