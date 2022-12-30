export class TypeMismatchError extends Error {

    constructor(x) {
        super("Unexpected type -> " + typeof x);
    }

}

export class ParsingError extends Error {

    constructor(x) {
        super("could not parse file -> " + x);
    }

}

export class ReadingError extends Error {

    constructor(x) {
        super("could not read Reject file -> " + x);
    }

}