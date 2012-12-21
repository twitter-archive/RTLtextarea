RTLtextarea [![Build Status](https://travis-ci.org/twitter/RTLtextarea.png?branch=master)](https://travis-ci.org/twitter/RTLtextarea)
========
Automatically detects RTL (right-to-left) languages and appropriately configures the text input, without having to manually specify CSS `direction` or `dir` property on page load. Allows automatic switching between LTR and RTL languages.

What it does
------------
This module will set the direction of a textarea to RTL when a threshold
of RTL characters has been reached (`rtlThreshold`). It also applies Twitter-
specific RTL rules regarding the placement of @ signs, # tags, and URLs.

### Before:
![before](http://twitter.github.com/RTLtextarea/img/rtltextarea_before.png)

### After:
![before](http://twitter.github.com/RTLtextarea/img/rtltextarea_after.png)

How to use
-----------
Bind keyup and keydown to `RTLText.onTextChange`. If you have initial text,
call `RTLText.setText(textarea, initial_string)` to set markers on that
initial text.

```javascript
  $(document).ready(function(){
    var $textarea = $('#someTextarea');
    $textarea.on('keyup', RTLText.onTextChange);
    $textarea.on('keydown', RTLText.onTextChange);
    RTLText.setText($textarea.get(0), $textarea.val());
  });
```

When storing or submitting the text, make sure to extract the unicode markers first:

```javascript
  var textToSubmit = RTLText.cleanText($("#someTextarea").val());
```

Get the length of the text minus the control characters:

```javascript
  var textLength = RTLText.textLength($("#someTextarea").val());
```

Add markers to a string without affecting the text box:

```javascript
  var stringWithMarkers = RTLText.addRTLMarkers(string);
```

Versioning
----------
We use semantic versioning, as described here: http://semver.org/

Releases are numbered and constructed with the following guidelines:

  * Breaking backwards compatibility bumps the major
  * New additions without breaking backwards compatibility bumps the minor
  * Bug fixes and misc changes bump the patch

Testing
----------
Tests use [Jasmine](http://pivotal.github.com/jasmine/) and [PhantomJS](http://phantomjs.org/). To run them, just use: `npm test`.

Authors
----------
**Naoki Takano**
+ https://github.com/hontent
+ [@honten](http://www.twitter.com/honten)

**Esten Hurtle**
+ https://github.com/estenh
+ [@esten](http://www.twitter.com/esten)

License
-----------
Copyright 2012 Twitter, Inc.

Licensed under the [MIT License](http://opensource.org/licenses/mit-license.php)
