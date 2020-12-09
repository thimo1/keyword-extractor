const words = require('./stopwords/zh.js').stopmulti;

module.exports = (text) => {
  let str = Array.isArray(text) ? text.join('') : text;
  words.forEach((word) => {
    const re = new RegExp(word, 'g');
    str = str.replace(re, '');
  });

  return str.split('');
};
