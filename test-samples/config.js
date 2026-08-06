// This is a FAKE test file with FAKE secrets - used only to test the scanner
// Do NOT use real secrets in files like this in real projects

const dbConfig = {
  host: "localhost",
  password: "SuperSecret123!",
};

const awsKey = "AKIAABCDEFGHIJKLMNOP";

const apiKey = "sk_test_abcdefghijklmnop123456";

module.exports = { dbConfig, awsKey, apiKey };
