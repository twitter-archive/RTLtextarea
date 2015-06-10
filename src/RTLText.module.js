/*
 * RTLText
 * Copyright 2012 Twitter and other contributors
 * Released under the MIT license
 *
 * What it does:
 *
 * This module will set the direction of a textarea to RTL when a threshold
 * of RTL characters has been reached (rtlThreshold). It also applies Twitter-
 * specific RTL rules regarding the placement of @ signs, # tags, and URLs.
 *
 * How to use:
 *
 * Bind keyup and keydown to RTLText.onTextChange. If you have initial text,
 * call RTLText.setText(textarea, initial_string) to set markers on that
 * initial text.
 */
var RTLText = function () {
  'use strict';

  var that = {};
  var rtlThreshold = 0.3;

  /*
   * Right-to-left Unicode blocks for modern scripts are:
   *
   * Consecutive range of the main letters:
   * U+0590  to U+05FF  - Hebrew
   * U+0600  to U+06FF  - Arabic
   * U+0700  to U+074F  - Syriac
   * U+0750  to U+077F  - Arabic Supplement
   * U+0780  to U+07BF  - Thaana
   * U+07C0  to U+07FF  - N'Ko
   * U+0800  to U+083F  - Samaritan
   *
   * Arabic Extended:
   * U+08A0  to U+08FF  - Arabic Extended-A
   *
   * Consecutive presentation forms:
   * U+FB1D  to U+FB4F  - Hebrew presentation forms
   * U+FB50  to U+FDFF  - Arabic presentation forms A
   *
   * More Arabic presentation forms:
   * U+FE70  to U+FEFF  - Arabic presentation forms B
   */
  var rtlChar = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/mg;
  var dirMark = /\u200e|\u200f/mg;
  var ltrMark = "\u200e";
  var rtlMark = "\u200f";
  var keyConstants = {
    BACKSPACE: 8,
    DELETE: 46
  };
  var twLength = 0;
  var DEFAULT_TCO_LENGTH = 22;
  var tcoLength = null;
  var isRTL = false;
  var originalText = "";
  var originalDir = "";
  // Can't use trim cause of IE. Regex from here: http://stackoverflow.com/questions/2308134/trim-in-javascript-not-working-in-ie
  var trimRegex = /^\s+|\s+$/g;

  var setManually = false;
  var heldKeyCodes =  { '91': false,
                        '16': false,
                        '88': false,
                        '17': false };
  var useCtrlKey = navigator.userAgent.indexOf('Mac') === -1;

  /* Private methods */

  // Caret manipulation
  function elementHasFocus (el) {
    // Try/catch to fix a bug in IE that will cause 'unspecified error' if another frame has focus
    try {
      return document.activeElement === el;
    }
    catch (err) {
      return false;
    }
  }

  function getCaretPosition (el) {
    if (!elementHasFocus(el)) { return 0; }

    var range;
    if (typeof el.selectionStart === "number") {
      return el.selectionStart;
    }
    else if (document.selection) {
      el.focus();
      range = document.selection.createRange();
      range.moveStart('character', -el.value.length);
      var length = range.text.length;
      return length;
    }
  }

  function setCaretPosition (el, position) {
    if (!elementHasFocus(el)) { return; }

    if (typeof el.selectionStart === "number") {
      el.selectionStart = position;
      el.selectionEnd = position;
    }
    else if (document.selection) {
      var range = el.createTextRange();
      range.collapse(true);
      range.moveEnd('character', position);
      range.moveStart('character', position);
      range.select();
    }
  }

  // End of caret methods

  function replaceIndices (oldText, extractFn, replaceCb) {
    var lastIndex = 0;
    var newText = '';
    var extractedItems = extractFn(oldText);

    for (var i = 0; i < extractedItems.length; i++) {
      var item = extractedItems[i];
      var type = '';

      if (item.screenName) {
        type = 'screenName';
      }
      if (item.hashtag) {
        type = 'hashtag';
      }
      if (item.url) {
        type = 'url';
      }
      if (item.cashtag) {
        type = 'cashtag';
      }

      var respObj = {
        entityText: oldText.slice(item.indices[0], item.indices[1]),
        entityType: type
      };

      newText += oldText.slice(lastIndex, item.indices[0]) + replaceCb(respObj);
      lastIndex = item.indices[1];
    }
    return newText + oldText.slice(lastIndex, oldText.length);
  }

  // Handle all LTR/RTL markers for tweet features
  function setMarkers (plainText) {
    var matchedRtlChars = plainText.match(rtlChar);
    var text = plainText;
    if (matchedRtlChars || originalDir === "rtl") {
      text = replaceIndices(text, twttr.txt.extractEntitiesWithIndices, function (itemObj) {
        if (itemObj.entityType === "screenName") {
          return ltrMark + itemObj.entityText + rtlMark;
        }
        else if (itemObj.entityType === "hashtag") {
          return (itemObj.entityText.charAt(1).match(rtlChar)) ? itemObj.entityText : ltrMark + itemObj.entityText;
        }
        else if (itemObj.entityType === "url") {
          return itemObj.entityText + ltrMark;
        }
        else if (itemObj.entityType === "cashtag") {
          return ltrMark + itemObj.entityText;
        }
      });
    }
    return text;
  }

  // If a user deletes a hidden marker char, it will just get rewritten during
  // notifyTextUpdated. Special case this by continuing to delete in the same
  // direction until a normal char is consumed.
  function erasePastMarkers (e) {
    var offset;
    var textarea = (e.target) ? e.target : e.srcElement;
    var key = (e.which) ? e.which : e.keyCode;
    if (key === keyConstants.BACKSPACE) { // backspace
      offset = -1;
    } else if (key === keyConstants.DELETE) { // delete forward
      offset = 0;
    } else {
      return;
    }

    var pos = getCaretPosition(textarea);
    var text = textarea.value;
    var numErased = 0;
    var charToDelete;
    do {
      charToDelete = text.charAt(pos + offset) || '';
      // Delete characters until a non-marker is removed.
      if (charToDelete) {
        pos += offset;
        numErased++;
        text = text.slice(0, pos) + text.slice(pos + 1, text.length);
      }
    } while (charToDelete.match(dirMark));

    if (numErased > 1) {
      textarea.value = text;
      // If more than 1 needed to be removed, update the text
      // and caret manually and stop the event.
      setCaretPosition(textarea, pos);
      e.preventDefault ? e.preventDefault() : e.returnValue = false;
    }
  }

  function removeMarkers (text) {
    return text ? text.replace(dirMark, '') : '';
  }

  function shouldBeRTL (plainText) {
    var matchedRtlChars = plainText.match(rtlChar);
    // Remove original placeholder text from this
    plainText = plainText.replace(originalText, "");
    var urlMentionsLength = 0;
    var trimmedText = plainText.replace(trimRegex, '');
    var defaultDir = originalDir;

    if (!trimmedText || !trimmedText.replace(/#/g, '')) {
      return defaultDir === 'rtl' ? true : false; // No text, use default.
    }

    if (!matchedRtlChars) {
      return false; // No RTL chars, use LTR
    }

    if (plainText) {
      var mentions = twttr.txt.extractMentionsWithIndices(plainText);
      var mentionsLength = mentions.length;
      var i;

      for (i = 0; i < mentionsLength; i++) {
        urlMentionsLength += mentions[i].screenName.length + 1;
      }

      var urls = twttr.txt.extractUrlsWithIndices(plainText);
      var urlsLength = urls.length;

      for (i = 0; i < urlsLength; i++) {
        urlMentionsLength += urls[i].url.length;
      }

    }
    var length = trimmedText.length - urlMentionsLength;
    return length > 0 && matchedRtlChars.length / length > rtlThreshold;
  }

  function detectManualDirection (e) {
    var textarea = e.target || e.srcElement;
    if (e.type === "keydown" && (e.keyCode === 91 || e.keyCode === 16 || e.keyCode === 88 || e.keyCode === 17)) {
      heldKeyCodes[String(e.keyCode)] = true;
    }
    else if (e.type === "keyup" && (e.keyCode === 91 || e.keyCode === 16 || e.keyCode === 88 || e.keyCode === 17)) {
      heldKeyCodes[String(e.keyCode)] = false;
    }

    if (((!useCtrlKey && heldKeyCodes['91']) || (useCtrlKey && heldKeyCodes['17'])) && heldKeyCodes['16'] && heldKeyCodes['88']) {
      setManually = true;

      if (textarea.dir === 'rtl') {
        setTextDirection('ltr', textarea);
      }
      else {
        setTextDirection('rtl', textarea);
      }
      heldKeyCodes =  { '91': false,
                        '16': false,
                        '88': false,
                        '17': false };
    }
  }

  function setTextDirection (dir, textarea) {
    textarea.setAttribute('dir', dir);
    textarea.style.direction = dir;
    textarea.style.textAlign = (dir === 'rtl' ? 'right' : 'left');
  }

  /* Public methods */

  // Bind this to *both* keydown & keyup
  that.onTextChange = function (e) {
    var event = e || window.event;

    detectManualDirection(e);

    // Handle backspace through control characters:
    if (event.type === "keydown") {
      erasePastMarkers(event);
    }

    that.setText(event.target || event.srcElement);
  };

  // Optionally takes a second param, with original text, to exclude from RTL/LTR calculation
  that.setText = function (textarea) {
    // Original directionality could be in a few places. Check them all.
    if (!originalDir) {
      if (textarea.style.direction) {
        originalDir = textarea.style.direction;
      }
      else if (textarea.dir) {
        originalDir = textarea.dir;
      }
      else if (document.body.style.direction) {
        originalDir = document.body.style.direction;
      }
      else {
        originalDir = document.body.dir;
      }
    }

    if (arguments.length === 2) {
      originalDir = textarea.ownerDocument.documentElement.className;
      originalText = arguments[1];
    }

    var text = textarea.value;
    if (!text) {
      return;
    }
    var plainText = removeMarkers(text);
    isRTL = shouldBeRTL(plainText);
    var newText = setMarkers(plainText);
    var newTextDir = (isRTL ? 'rtl' : 'ltr');

    if (newText !== text) {
      var pos = getCaretPosition(textarea);
      // Fix for Chrome for Android
      textarea.value = "";
      textarea.focus();
      textarea.value = newText;
      // Assume any recent change in text length due to markers affects the
      // current cursor position. If more accuracy is needed, the position
      // could be translated during replace operations inside setMarkers.
      setCaretPosition(textarea, pos + newText.length - plainText.length);
    }
    if (!setManually) {
      setTextDirection(newTextDir, textarea);
    }
  };

  // Use this to get the length of a tweet with unicode control characters removed
  that.textLength = function (text) {
    var tweet = removeMarkers(text);
    var urls = twttr.txt.extractUrls(tweet);
    var length = tweet.length - urls.join('').length;
    var urlsLength = urls.length;
    var tcoLength = that.getTcoLength();
    for (var i = 0; i < urlsLength; i++) {
      length += tcoLength;
      if (/^https:/.test(urls[i])) {
        length += 1;
      }
    }

    return twLength = length;
  };

  // Do this before text is submitted
  that.cleanText = function (text) {
    return removeMarkers(text);
  };

  // If markers need to be added to a string without affecting the text box, use this
  that.addRTLMarkers = function (s) {
    return setMarkers(s);
  };

  // For determining if text should be RTL (returns boolean)
  that.shouldBeRTL = function (s) {
    return shouldBeRTL(s);
  };

  that.getTcoLength = function () {
    return tcoLength || DEFAULT_TCO_LENGTH;
  };
  that.setTcoLength = function (length) {
    if (length > 0) {
      tcoLength = parseInt(length, 10);
    } else {
      tcoLength = null;
    }
  };

  return that;

}();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RTLText;
}

