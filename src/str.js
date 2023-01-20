import {Collection} from "./collection.js";
import {VARS} from "./var.js";
import {FUNS} from "./fn.js";
import parseInput from "../reject.js";

export class Str extends Collection {
    constructor(items = []) {
        if (typeof items === "string") {
            items = items.split("");
        }
        super(items);
    }

    // Get the complete string as a JavaScript string
    get string() {
        return this.items.join("");
    }

    // Set the complete string by splitting it into an array of characters
    set string(string) {
        this.items = string.split("");
    }

    // Reverse the string
    reverse() {
        return new Str(this.items.reverse());
    }

    // Get the character at a specific index
    charAt(index) {
        return this.items[index];
    }

    // Get the index of the first occurrence of a substring
    indexOf(substring) {
        return this.string.indexOf(substring);
    }

    // Get the index of the last occurrence of a substring
    lastIndexOf(substring) {
        return this.string.lastIndexOf(substring);
    }

    // Check if the string starts with a specific substring
    startsWith(substring) {
        return this.string.startsWith(substring);
    }

    // Check if the string ends with a specific substring
    endsWith(substring) {
        return this.string.endsWith(substring);
    }

    // Get the substring between two indices (inclusive)
    slice(start, end) {
        return new Str(this.items.slice(start, end + 1));
    }

    // Split the string into an array of substrings
    split(separator) {
        return new Collection(this.string.split(separator));
    }

    // Replace all occurrences of a substring with another string
    replace(substring, replacement) {
        return new Str(
            this.string.replace(substring, replacement).split("")
        );
    }

    // Remove leading and trailing whitespace from the string
    trim() {
        return new Str(this.string).trim().split("");
    }

    // Convert the string to uppercase
    toUpperCase() {
        return new Str(this.string.toUpperCase().split(""));
    }

    // Convert the string to lowercase
    toLowerCase() {
        return new Str(this.string.toLowerCase().split(""));
    }

    // Convert the string to a number
    toNumber() {
        return Number(this.string);
    }

    // Check if the string is empty
    isEmpty() {
        return this.items.length === 0;
    }

    getCharAt(index) {
        if (index < 0 || index >= this.items.length) {
            throw new RangeError("Index out of bounds");
        }
        return this.items[index];
    }

    // Set the character at a specific index
    setCharAt(index, char) {
        if (index < 0 || index >= this.items.length) {
            throw new RangeError("Index out of bounds");
        }
        if (typeof char !== "string" || char.length !== 1) {
            throw new TypeError("Value must be a single character string");
        }
        this.items[index] = char;
    }

    // Concatenate multiple strings or String objects
    concat(...strings) {
        let combinedString = this.string;
        for (const string of strings) {
            if (string instanceof Str) {
                combinedString = combinedString.concat(string.string);
            } else if (typeof string === "string") {
                combinedString = combinedString.concat(string);
            } else {
                throw new TypeError("Value must be a string or String object");
            }
        }
        return new Str(combinedString);
    }

    // Pad the start of the string with a character or string
    padStart(length, padString = " ") {
        if (typeof length !== "number" || length < 0) {
            throw new TypeError("Length must be a non-negative number");
        }
        if (typeof padString !== "string") {
            throw new TypeError("Pad string must be a string");
        }
        return new Str(this.string.padStart(length, padString));
    }

    // Pad the end of the string with a character or string
    padEnd(length, padString = " ") {
        if (typeof length !== "number" || length < 0) {
            throw new TypeError("Length must be a non-negative number");
        }
        if (typeof padString !== "string") {
            throw new TypeError("Pad string must be a string");
        }
        return new Str(this.string.padEnd(length, padString));
    }

    // Pad the start and end of the string with a character or string
    pad(startLength, endLength = startLength, padString = " ") {
        if (typeof startLength !== "number" || startLength < 0) {
            throw new TypeError("Start length must be a non-negative number");
        }
        if (typeof endLength !== "number" || endLength < 0) {
            throw new TypeError("End length must be a non-negative number");
        }
        if (typeof padString !== "string") {
            throw new TypeError("Pad string must be a string");
        }
        return this.padStart(startLength, padString).padEnd(
            endLength,
            padString
        );
    }

    // Repeat the string a specified number of times
    repeat(count) {
        if (typeof count !== "number" || count < 0) {
            throw new TypeError("Count must be a non-negative number");
        }
        return new Str(this.string.repeat(count));
    }

    // Get the substring between two indices (inclusive)
    substring(start, end) {
        if (
            typeof start !== "number" ||
            start < 0 ||
            start > this.items.length
        ) {
            throw new RangeError("Start index out of bounds");
        }
        if (typeof end !== "number" || end < 0 || end > this.items.length) {
            throw new RangeError("End index out of bounds");
        }
        return new Str(this.items.slice(start, end + 1));
    }

    match(regex) {
        return this.string.match(new RegExp(regex, "g"));
    }

    // Search for a substring or regular expression in the string
    search(query) {
        return this.string.search(query);
    }

    // Truncate the string to a given length and append an ellipsis if necessary
    truncate(length, ellipsis = "...") {
        if (this.string.length > length) {
            return new Str(
                this.string.slice(0, length - ellipsis.length) + ellipsis
            );
        }
        return new Str(this.string);
    }

    // Get the Unicode code point value at a specific index
    codePointAt(index) {
        return this.string.codePointAt(index);
    }

    fillTokens() {
        let string = this.string;
        const regex = /\$(([a-zA-Z_]\w*)(\(.*?\))?)/g;

        for (let item of this.string.matchAll(regex)) {
            const full = item[0];
            const importantStuff = item[1];
            const ident = item[2];

            if (item[3] !== undefined) { // fn invocation
                const fn = FUNS.get(ident);

                if (fn === undefined) {
                    continue;
                }

                string = string.replace(full, parseInput(importantStuff).toString());
            } else { // var
                const variable = VARS.get(ident);

                if (variable === undefined) {
                    continue;
                }

                string = string.replace(full, variable.value === null ? "unknown" : variable.value.toString());
            }
        }

        return string;
    }

    toString() {
        return this.fillTokens();
    }
}
