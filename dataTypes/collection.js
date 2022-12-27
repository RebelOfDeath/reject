export class Collection {
    constructor(items) {
        this.items = items;
    }

    // Add an item to the end of the collection
    append(item) {
        this.items.push(item);
    }

    // Insert an item at a specific index
    insert(index, item) {
        this.items.splice(index, 0, item);
    }

    // Remove an item from the collection
    remove(item) {
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }

    // Find the index of an item in the collection
    index(item) {
        return this.items.indexOf(item);
    }

    // Check if an item is in the collection
    contains(item) {
        return this.index(item) !== -1;
    }

    // Get the length of the collection
    length() {
        return this.items.length;
    }

    // Get the item at a specific index
    get(index) {
        return this.items[index];
    }

    // Set the item at a specific index
    set(index, item) {
        this.items[index] = item;
    }

    // Get a sub-collection (slice) of the collection
    slice(start, end) {
        return new Collection(this.items.slice(start, end));
    }

    map(fn) {
        const mapped = this.items.map(fn);
        return new Collection(mapped);
    }

    // Reduce the collection to a single value by applying a function to each item in the collection
    reduce(fn, initialValue) {
        return this.items.reduce(fn, initialValue);
    }

    // Filter the collection to a new Collection with only the items that pass a test function
    filter(fn) {
        const filtered = this.items.filter(fn);
        return new Collection(filtered);
    }

    //evaluate and assign the value of the Collection from a string
    fromString(string) {
        return eval(string);
    }
}

import assert from "assert";

const collection = new Collection([2, 3, 4]);

assert.deepStrictEqual(collection.items, [1, 2, 3, 4]);

collection.append(5);
assert.deepStrictEqual(collection.items, [1, 2, 3, 4, 5]);

collection.insert(1, 1.5);
assert.deepStrictEqual(collection.items, [1, 1.5, 2, 3, 4, 5]);

collection.remove(2);
assert.deepStrictEqual(collection.items, [1, 1.5, 3, 4, 5]);

assert.strictEqual(collection.index(3), 2);

assert(collection.contains(3));
assert(!collection.contains(10));

assert.strictEqual(collection.length(), 5);

assert.strictEqual(collection.get(1), 1.5);

collection.set(1, 2);
assert.deepStrictEqual(collection.items, [1, 2, 3, 4, 5]);

const subCollection = collection.slice(1, 3);
assert.deepStrictEqual(subCollection.items, [2, 3]);

const mapped = collection.map(x => x * 2);
assert.deepStrictEqual(mapped.items, [2, 4, 6, 8, 10]);

const reduced = collection.reduce((acc, x) => acc + x, 0);
assert.strictEqual(reduced, 15);

const filtered = collection.filter(x => x % 2 === 0);
assert.deepStrictEqual(filtered.items, [2, 4]);

const array = collection.fromString("[1, 2, 3, 4]");
assert.deepStrictEqual(array, [1, 2, 3, 4]);

const multiDimensionalArray = collection.fromString("[1, 2, [3, 4], 5]");
assert.deepStrictEqual(multiDimensionalArray, [1, 2, [3, 4], 5]);