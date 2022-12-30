class Boolean {
  constructor(value) {
    this.value = Boolean(value);
  }

  // Method that returns the negation of the boolean value
  not() {
    return !this.value;
  }

  // Method that returns the conjunction of two boolean values
  and(other) {
    return this.value && other;
  }

  // Method that returns the disjunction of two boolean values
  or(other) {
    return this.value || other;
  }

  // Method that returns the exclusive disjunction of two boolean values
  xor(other) {
    return this.value !== other;
  }

  // Method that converts the boolean value to a string
  toString() {
    return this.value.toString();
  }

  // Method that converts the boolean value to a number
  valueOf() {
    return this.value ? 1 : 0;
  }
}

