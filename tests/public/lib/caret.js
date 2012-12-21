//no_unit_test

var caret = {
/*
 * Based on a utility by Vishal Monpara (http://blog.vishalon.net/)
 */
  getPosition: function(el) {
    try {
      if (document.selection) {
        // IE case
        el.focus();
        var range = document.selection.createRange();
        range.moveStart('character', -el.value.length);
        return range.text.length;
      } else if (typeof el.selectionStart == "number") {
        return el.selectionStart;
      }
      // If nether of the two methods above work, fail quietly.
    } catch(e) {
      // Recovering from any exception is faster and simpler than trying to
      // detect browser specific problems here. For example, Firefox 3.6 will
      // throw if the element is not visible or not in the dom.
    }
    return 0;
  },

  setPosition: function(el, position) {
    try {
      if (document.selection) {
        // IE case
        var range = el.createTextRange();
        range.collapse(true);
        range.moveEnd('character', position);
        range.moveStart('character', position);
        range.select();
      } else if (typeof el.selectionStart == "number") {
        el.selectionStart = position;
        el.selectionEnd = position;
      }
      // If nether of the two methods above work, fail quietly.
    } catch(e) {
      // See note above about why recovering from any exception is good here.
    }
  },

  getSelection: function() {
    return window.getSelection ? window.getSelection().toString() : document.selection.createRange().text;
  }
};

// module.exports = caret;
