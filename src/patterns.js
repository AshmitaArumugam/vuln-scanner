// patterns.js
// Job of this file: ONLY ONE THING - store regex patterns that match known secret formats
// This is like a "rules database". Adding a new secret type later = adding one line here.

const SECRET_PATTERNS = [
  {
    name: "AWS Access Key",
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: "critical",
  },
  {
    name: "Generic API Key",
    // matches: api_key = "abcd1234..." or apiKey: "xyz..."
    regex: /(api[_-]?key|apikey)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/gi,
    severity: "high",
  },
  {
    name: "Generic Password",
    regex: /(password|passwd|pwd)\s*[:=]\s*['"].{6,}['"]/gi,
    severity: "high",
  },
  {
    name: "JWT Token",
    regex: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    severity: "medium",
  },
  {
    name: "Private Key Block",
    regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
    severity: "critical",
  },
  {
    name: "Slack Token",
    regex: /xox[baprs]-[0-9A-Za-z-]{10,48}/g,
    severity: "high",
  },
  {
    name: "GitHub Token",
    regex: /gh[pousr]_[A-Za-z0-9]{36}/g,
    severity: "critical",
  },
];

module.exports = { SECRET_PATTERNS };
