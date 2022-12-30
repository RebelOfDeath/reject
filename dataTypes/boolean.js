export class Boolean {
  constructor(value) {
    this.value = value === "true" || value === true;
  }

  // Method that returns the negation of the boolean value
  not() {
    return new Boolean(!this.value);
  }

  // Method that returns the conjunction of two boolean values
  and(other) {
    return new Boolean(this.value && other.value);
  }

  // Method that returns the disjunction of two boolean values
  or(other) {
    return new Boolean(this.value || other.value);
  }

  // Method that returns the exclusive disjunction of two boolean values
  xor(other) {
    return new Boolean(this.value !== other.value);
  }

  // Method that converts the boolean value to a string
  toString() {
    return new Boolean(this.value.toString());
  }

  // Method that converts the boolean value to a number
  valueOf() {
    return new Boolean(this.value ? 1 : 0);
  }
}

