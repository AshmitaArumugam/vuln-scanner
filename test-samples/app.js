// This file has NO secrets - used to confirm the scanner doesn't give false positives

function add(a, b) {
  return a + b;
}

function greet(name) {
  return `Hello, ${name}!`;
}

module.exports = { add, greet };
