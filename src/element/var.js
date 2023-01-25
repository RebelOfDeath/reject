export const VARS = new Map();

export class Var {

    constructor(name, value, scope = "global") {
        this.name = name;
        this.value = value;
        this.scope = scope;
    }

    get var() {
        return this.value;
    }

    set var(value) {
        this.value = value;
    }
}

export function registerNativeConstants(map) {

    for (const name in map) {
        let value = map[name];

        VARS.set(name, new Var(name, value));
    }
}