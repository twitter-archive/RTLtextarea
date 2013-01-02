describe('tools to apply RTL rules to text entry', function () {
  var KEY_ESCAPE = 27;
  var KEY_ENTER = 13;
  var KEY_BACKSPACE = 8;
  var KEY_DELETE = 46;
  var KEY_RIGHT_ARROW = 39;
  var KEY_CTRL = 17;
  var KEY_COMMAND = 91;
  var KEY_SHIFT = 16;
  var KEY_X = 88;

  var $textbox;

  beforeEach(function () {
    $textbox = $('<textarea id="textbox"></textarea>');
    $('body').append($textbox);
  });

  afterEach(function () {
    $textbox.remove();
  });

  describe('setText()', function () {
    it('surrounds strings with unicode RTL markers', function () {
      // test string contains arabic, @sign, hashtag, and url
      var resultText = '\u064A\u0633\u0634\u0634\u064A\u0633 \u200e@test\u200f \u200e#test \u064A\u0633\u0634\u0634\u064A\u0633 http://www.twitter.com/\u200e';
      var plainText = '\u064A\u0633\u0634\u0634\u064A\u0633 @test #test \u064A\u0633\u0634\u0634\u064A\u0633 http://www.twitter.com/';
      $textbox.val(plainText);
      RTLText.setText($textbox.get(0));
      expect($textbox.val()).toBe(resultText);
    });
  });

  describe('onTextChange()', function () {
    it('appropriately deletes characters', function () {
      var backspaceEvent = $.Event('keydown', { keyCode: KEY_BACKSPACE, which: KEY_BACKSPACE, target: $textbox.get(0) });
      var deleteEvent = $.Event('keydown', { keyCode: KEY_DELETE, which: KEY_DELETE, target: $textbox.get(0) });

      $textbox.on('keydown', RTLText.onTextChange);
      $textbox.on('keyup', RTLText.onTextChange);

      $textbox.focus();
      // Testing delete is much easier, because it doesn't involve positioning cursor
      var sampleText = '\u200e@\u200f\u05D0\u05D5\u05EA\u05D9\u05D5\u05EA \u200e@test\u200f';
      $textbox.val(sampleText);
      caret.setPosition($textbox.get(0), 0);
      $textbox.trigger(deleteEvent);
      expect($textbox.val()).toBe('\u05D0\u05D5\u05EA\u05D9\u05D5\u05EA \u200e@test\u200f');

      // Backspace involves positioning a cursor that doesn't want to be positioned
      $textbox.focus();
      caret.setPosition($textbox.get(0), sampleText.length);
      $textbox.trigger(backspaceEvent);
      $textbox.trigger(backspaceEvent);
      $textbox.trigger(backspaceEvent);
      $textbox.trigger(backspaceEvent);
      $textbox.trigger(backspaceEvent);
      // Have to include the @ as the character will never be deleted without actually pressing the backspace button
      expect($textbox.val()).toBe('\u05D0\u05D5\u05EA\u05D9\u05D5\u05EA @');
    });

    it('manually sets text direction', function () {
      var ctrlKeyEvent = $.Event('keydown', { keyCode: KEY_CTRL, which: KEY_CTRL, target: $textbox.get(0) });
      var commandKeyEvent = $.Event('keydown', { keyCode: KEY_COMMAND, which: KEY_COMMAND, target: $textbox.get(0) });
      var shiftKeyEvent = $.Event('keydown', { keyCode: KEY_SHIFT, which: KEY_SHIFT, target: $textbox.get(0) });
      var xKeyEvent = $.Event('keydown', { keyCode: KEY_X, which: KEY_X, target: $textbox.get(0) });

      $textbox.on('keydown', RTLText.onTextChange);
      $textbox.on('keyup', RTLText.onTextChange);

      $textbox.focus();

      var sampleText = '\u200e@\u200f\u05D0\u05D5\u05EA\u05D9\u05D5\u05EA \u200e@test\u200f';

      $textbox.val(sampleText);

      RTLText.setText($textbox.get(0));

      if (navigator.userAgent.indexOf('Mac') === -1){
        $textbox.trigger(ctrlKeyEvent);
      }
      else {
        $textbox.trigger(commandKeyEvent);
      }
      $textbox.trigger(shiftKeyEvent);
      $textbox.trigger(xKeyEvent);

      expect($textbox.get(0).dir).toBe('ltr');
    });
  });

  describe('textLength()', function () {
    it('ignores unicode directionality chars when checking length', function () {
      var sampleText = '\u200e@\u200f\u064A\u0633\u0634\u0634\u064A\u0633 \u200e@test\u200f';
      var length = RTLText.textLength(sampleText);
      expect(length).toBe(13);
    });
  });

  describe('cleanText()', function () {
    it('removes markers to prep for a tweet submission', function () {
      var sampleText = '\u200e@\u200f\u064A\u0633\u0634\u0634\u064A\u0633 \u200e@test\u200f';
      var expectedResult = '@\u064A\u0633\u0634\u0634\u064A\u0633 @test';
      var result = RTLText.cleanText(sampleText);
      expect(result).toBe(expectedResult);
    });
  });

  describe('addRTLMarkers()', function () {
    it('adds markers to a string', function () {
      var sampleText = '\u064A\u0633 #hi \u0634\u0634\u064A\u0633 @test';
      var expectedResult = '\u064A\u0633 \u200e#hi \u0634\u0634\u064A\u0633 \u200e@test\u200f';
      var result = RTLText.addRTLMarkers(sampleText);
      expect(result).toBe(expectedResult);
    });
  });

  describe('shouldBeRTL()', function () {
    it('successfully determines when a string should be rendered as RTL', function () {
      var sampleText = '\u064A\u0633 @test';
      var result = RTLText.shouldBeRTL(sampleText);
      expect(result).toBe(true);
    });

    it('successfully determines when a string should not be rendered as RTL', function () {
      var sampleText = '\u064A test';
      var result = RTLText.shouldBeRTL(sampleText);
      expect(result).toBe(false);
    });
  });
});
