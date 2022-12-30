import { Collection } from "./collection.js";

export class String extends Collection {
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
        return new String(this.items.reverse());
    }

    // Get the character at a specific index
    charAt(index) {
        return this.items[index];
    }

    // Get the index of the first occurrence of a substring
    indexOf(substring) {
        return this.items.join("").indexOf(substring);
    }

    // Get the index of the last occurrence of a substring
    lastIndexOf(substring) {
        return this.items.join("").lastIndexOf(substring);
    }

    // Check if the string starts with a specific substring
    startsWith(substring) {
        return this.items.join("").startsWith(substring);
    }

    // Check if the string ends with a specific substring
    endsWith(substring) {
        return this.items.join("").endsWith(substring);
    }

    // Get the substring between two indices (inclusive)
    slice(start, end) {
        return new String(this.items.slice(start, end + 1));
    }

    // Split the string into an array of substrings
    split(separator) {
        return new Collection(this.items.join("").split(separator));
    }

    // Replace all occurrences of a substring with another string
    replace(substring, replacement) {
        return new String(
            this.items.join("").replace(substring, replacement).split("")
        );
    }

    // Remove leading and trailing whitespace from the string
    trim() {
        return new String(this.items.join("").trim().split(""));
    }

    // Convert the string to uppercase
    toUpperCase() {
        return new String(this.items.join("").toUpperCase().split(""));
    }

    // Convert the string to lowercase
    toLowerCase() {
        return new String(this.items.join("").toLowerCase().split(""));
    }

    // Convert the string to a number
    toNumber() {
        return Number(this.items.join(""));
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
            if (string instanceof String) {
                combinedString = combinedString.concat(string.string);
            } else if (typeof string === "string") {
                combinedString = combinedString.concat(string);
            } else {
                throw new TypeError("Value must be a string or String object");
            }
        }
        return new String(combinedString);
    }

    // Pad the start of the string with a character or string
    padStart(length, padString = " ") {
        if (typeof length !== "number" || length < 0) {
            throw new TypeError("Length must be a non-negative number");
        }
        if (typeof padString !== "string") {
            throw new TypeError("Pad string must be a string");
        }
        return new String(this.string.padStart(length, padString));
    }

    // Pad the end of the string with a character or string
    padEnd(length, padString = " ") {
        if (typeof length !== "number" || length < 0) {
            throw new TypeError("Length must be a non-negative number");
        }
        if (typeof padString !== "string") {
            throw new TypeError("Pad string must be a string");
        }
        return new String(this.string.padEnd(length, padString));
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
        return new String(this.string.repeat(count));
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
        return new String(this.items.slice(start, end + 1));
    }

    // TODO: we could potentially create our own regex type
    match(regex) {
        if (!(regex instanceof RegExp)) {
            throw new TypeError("Value must be a regular expression");
        }
        return this.string.match(regex);
    }

    // Search for a substring or regular expression in the string
    search(query) {
        return this.string.search(query);
    }

    // Truncate the string to a given length and append an ellipsis if necessary
    truncate(length, ellipsis = "...") {
        if (this.string.length > length) {
            return new String(
                this.string.slice(0, length - ellipsis.length) + ellipsis
            );
        }
        return new String(this.string);
    }

    // Get the Unicode code point value at a specific index
    codePointAt(index) {
        return this.string.codePointAt(index);
    }

    toString() {
        return this.string;
    }
}
