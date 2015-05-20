'use strict';

var SffParser = require('./sff-parser');
var SffFont = require('./sff-font');
var SVGPath = require('svgpath');

var parser;
var fonts = {};

function getTypePath(str, font, fontSize, options) {
  fontSize = Math.abs(fontSize || 72);
  options = options || {};

  var factor = fontSize / font.unitsPerEm;
  var letterSpacing = (options.letterSpacing || 0) * font.unitsPerEm;
  var glyphs = font.getGlyphsFromString(str);
  var kerningAdv = !options.noKerning ? font.getAdvancesForString(str) : null;
  var totalOffsetX = 0, i = 0, advance;
  var paths = [];

  glyphs.forEach(function (glyph) {
    paths.push((new SVGPath(glyph.path)).translate(totalOffsetX, 0).toString().trim());
    advance = !kerningAdv ? glyph.advance : kerningAdv[i++];
    totalOffsetX += advance + letterSpacing;
  });

  if (options.underline) {
    var x1 = 0;
    var y1 = font.ascent - font.underlinePosition;
    var x2 = totalOffsetX;
    var y2 = y1 + font.underlineThickness;
    paths.push('M' + x2 + ',' + y2 + 'H' + x1 + 'V' + y1 + 'h' + x2 + 'V' + y2 + 'z');
  }

  var combinedPath = new SVGPath(paths.join(' '));

  if (options.fakeItalicAngle) {
    combinedPath
      .translate(0, -font.ascent)
      .matrix([
        1, 0, -Math.tan(Math.abs(options.fakeItalicAngle) / 180 * Math.PI),
        1, 0, 0
      ])
      .translate(0, font.ascent);
  }

  return combinedPath.scale(factor).rel().round(3).toString();
}

/**
 * Get the SVG markup for a given string set in a given typeface with given size and options.
 *
 * Options:
 * - `noKerning`: {boolean} [false] Disable kerning
 * - `underline`: {boolean} [false] Draw underline (not yet implemented)
 * - `fakeItalicAngle`: {number} [undefined] Fake italic presentation by skewing the text by the
 * given angle in degrees. `8` - `12` is usually a good range.
 *
 * @param {string} string String to draw
 * @param {SffFont|string} font Either a SffFont or the (postscript) name of a registerd font
 * @param {number} [fontSize=72] Font size in em
 * @param {object} [options={}] Additional typesetting options, see above.
 * @returns {string} SVG markup
 */
exports.getSvgMarkupForString = function (string, font, fontSize, options) {
  if (!(font instanceof SffFont)) {
    var fontName = font;
    font = fonts[fontName];

    if (!font) {
      throw new Error('Unknown font: ' + fontName);
    }
  }

  return '<g><path d="' + getTypePath(string, font, fontSize, options) + '"/></g>';
};

exports.registerFont = function (fontName, buf) {
  if (fonts[fontName]) {
    throw new Error('A font with name "' + fontName + '" has already been registered.');
  }

  var usePostscriptName = false;
  if (Buffer.isBuffer(fontName)) {
    usePostscriptName = true;
    buf = fontName;
  }

  if (!parser) {
    parser = new SffParser();
  }

  var font = parser.parse(buf);

  if (usePostscriptName) {
    fontName = font.postscriptName;
  }

  fonts[fontName] = font;
  fonts[font.postscriptName] = font;

  return fontName;
};

exports.getFont = function (fontName) {
  return fonts[fontName];
};
