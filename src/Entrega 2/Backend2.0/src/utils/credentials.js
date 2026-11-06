const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_BYTES = 72;

function validEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= MAX_EMAIL_LENGTH &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
}
function validPassword(value) {
  return (
    typeof value === "string" &&
    value.length >= MIN_PASSWORD_LENGTH &&
    Buffer.byteLength(value, "utf8") <= MAX_PASSWORD_BYTES &&
    value.trim().length >= MIN_PASSWORD_LENGTH
  );
}
module.exports = { validEmail, validPassword };
