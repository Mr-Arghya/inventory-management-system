const StringLib = {
  generateRandomStrings(length) {
    const arr = "0123456789abcdefghijklmnopqrstuvwxyz";
    let str = "";
    for (let i = length; i > 0; i--) {
      str += arr[Math.floor(Math.random() * arr.length)];
    }
    return str;
  },
  isEmail(email) {
    const regexExp =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    return regexExp.test(email);
  },
};

module.exports = StringLib;
