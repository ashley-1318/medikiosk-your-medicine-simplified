// Minimal JWT helpers
// In production replace with: npm install jsonwebtoken

function makeJwt(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function parseJwt(token) {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    return null;
  }
}

module.exports = { makeJwt, parseJwt };
