const supported_languages = [
  'chinese',
  'danish',
  'dutch',
  'english',
  'french',
  'galician',
  'german',
  'italian',
  'polish',
  'portuguese',
  'romanian',
  'russian',
  'spanish',
  'swedish',
  'japanese',
  'persian',
  'arabic',
];
const stopwords = require('./stopwords/stopwords');
const extractChinese = require('./extract_chinese');
const extractJapanese = require('./extract_japanese');
const replaceCharsRegex = /\.|,|;|!|\?|\(|\)|:|"|^\'+|\'+$|“|”|‘|’|¿|¡|\[|\]|\„|\“|\›|\‹|\”|\«|\»|\·|\<|\>|^\#+|\—|^,+|…|\【|\】|^\/+|\/+$|\{|\}|^\&+|\&+$|^\\+|\\+$|^\{+|\{+$|^\}+|\}+$|\#|^\++|\+|^\|+|\|$|^\-+|\`|\´|\–|^\*+|\*|^\，+|\^|^\_+|\・|\（|\）|\•|\~|\│|\-+$|^\√+|\√+$|^\｜+|\｜+$|^\★+|\★+$|^\☆+|\☆+$|^\✦+|\✦+$|^\✻+|\✻+$|\✏|\⚠️|\।|\♩|\¨|\^=+|\=+$|\▪️|\●|\☀️|\♥|^\＆+|\＆+$|^\،+|\،+$|^\、+|\、+$|^\‚+|\‚+$|\❤️|\�|\☃️|\┃|^\'+|\'+$|\「|\⁄|\～|\＃|\×|\➤|\✔|\✮|\➤|\″|\※|\=|\≪|\≫|\✓|\［|\］/g; // next time ^[...]+|[...]+$

const cleanString = (str) => str.replace(/(<([^>]+)>)/gi, '').trim();

function extract(
  str,
  options = {
    remove_digits: true,
    return_changed_case: true,
  },
) {
  if (!str) {
    return [];
  }

  const return_changed_case = options.return_changed_case;
  const return_chained_words = options.return_chained_words;
  const remove_digits = options.remove_digits;
  const _language = options.language || 'english';
  const _remove_duplicates = options.remove_duplicates || false;
  const return_max_ngrams = options.return_max_ngrams;

  if (supported_languages.indexOf(_language) < 0) {
    throw new Error(
      'Language must be one of [' + supported_languages.join(',') + ']',
    );
  }

  //  strip any HTML and trim whitespace
  let words = Array.isArray(str)
    ? str.map((s) => cleanString(s))
    : cleanString(str).split(/\s+/);
  if (!words) {
    return [];
  } else {
    if (_language === 'chinese') {
      words = extractChinese(words);
    }
    // Japanese doesn't work
    // if (_language === 'japanese') {
    //   words = extractJapanese(words);
    // }

    const unchanged_words = [];
    const low_words = [];
    //  change the case of all the words
    for (let x = 0; x < words.length; x++) {
      let w = words[x].match(/https?:\/\/.*[\r\n]*/g)
        ? words[x]
        : words[x]
            .replace(/\s\s+/g, ' ')
            .replace(replaceCharsRegex, '')
            .trim()
            .replace(replaceCharsRegex, '')
            .trim();

      //  if it's a number, remove it
      const digits_match = w.match(/\d/g);
      if (remove_digits && digits_match && digits_match.length === w.length) {
        w = '';
      }
      // for Chinese:
      // if it's a CJK symbol or punctuation or if it's a halfwidth or fullwidth form, remove it
      if (
        (_language === 'chinese' || _language === 'japanese') &&
        w.match(/[\s\u3000-\u303F\uFF00-\uFFEF]/g)
      ) {
        w = '';
      }
      if (w.length > 0) {
        low_words.push(w.toLowerCase());
        unchanged_words.push(w);
      }
    }
    let results = [];
    const _stopwords =
      options.stopwords || getStopwords({ language: _language });
    let _last_result_word_index = 0;
    let _start_result_word_index = 0;
    let _unbroken_word_chain = false;
    for (let y = 0; y < low_words.length; y++) {
      if (_stopwords.indexOf(low_words[y]) < 0) {
        if (_last_result_word_index !== y - 1) {
          _start_result_word_index = y;
          _unbroken_word_chain = false;
        } else {
          _unbroken_word_chain = true;
        }
        const result_word =
          return_changed_case &&
          !unchanged_words[y].match(/https?:\/\/.*[\r\n]*/g)
            ? low_words[y]
            : unchanged_words[y];

        if (
          return_max_ngrams &&
          _unbroken_word_chain &&
          !return_chained_words &&
          return_max_ngrams > y - _start_result_word_index &&
          _last_result_word_index === y - 1
        ) {
          const change_pos = results.length - 1 < 0 ? 0 : results.length - 1;
          results[change_pos] = results[change_pos]
            ? results[change_pos] + ' ' + result_word
            : result_word;
        } else if (return_chained_words && _last_result_word_index === y - 1) {
          const change_pos = results.length - 1 < 0 ? 0 : results.length - 1;
          results[change_pos] = results[change_pos]
            ? results[change_pos] + ' ' + result_word
            : result_word;
        } else {
          results.push(result_word);
        }

        _last_result_word_index = y;
      } else {
        _unbroken_word_chain = false;
      }
    }

    if (_remove_duplicates) {
      results = results.filter((v, i, a) => a.indexOf(v) === i);
    }

    return results;
  }
}

function getStopwords(options) {
  options = options || {};

  const _language = options.language || 'english';
  if (supported_languages.indexOf(_language) < 0) {
    throw new Error(
      'Language must be one of [' + supported_languages.join(',') + ']',
    );
  }

  return stopwords[_language];
}

module.exports = {
  getStopwords,
  extract,
};
