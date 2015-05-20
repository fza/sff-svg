'use strict';

function makeGlyphMap(glyphTable) {
  var codePointGlyphMap = {};
  var glyphData;
  for (var glyphId = 0; glyphId < glyphTable.length; glyphId++) {
    glyphTable[glyphId].id = glyphId;
    glyphData = glyphTable[glyphId];
    glyphData.codePoints.forEach(function (codePoint) {
      codePointGlyphMap[codePoint] = glyphId;
    });
  }

  return codePointGlyphMap;
}

function SffFont(metaData, glyphTable, kerningTable) {
  if (!(this instanceof SffFont)) {
    return new SffFont(metaData, glyphTable, kerningTable);
  }

  var self = this;

  Object.keys(metaData).forEach(function (key) {
    Object.defineProperty(self, key, {
      configurable: false,
      enumerable: true,
      value: metaData[key]
    });
  });

  self.glyphTable = glyphTable;
  self.glyphMap = makeGlyphMap(glyphTable);
  self.kerningTable = self._processKerningTable(kerningTable);
}

SffFont.prototype.getGlyphFromCharCode = function (charCode) {
  var self = this;

  return self.glyphTable[self.glyphMap[charCode]];
};

SffFont.prototype.getGlyphsFromString = function (str) {
  var self = this;

  var glyphs = [];
  str.split('').forEach(function (char) {
    var glyph = self.getGlyphFromCharCode(char.charCodeAt(0));
    if (glyph) {
      glyphs.push(glyph);
    }
  });

  return glyphs;
};

SffFont.prototype.getAdvancesForString = function (str) {
  var self = this;

  var advances = [];
  var glyphs = self.getGlyphsFromString(str);
  var kerningTable = self.kerningTable;
  var advance, offset;
  var curGlyph, nextGlyph;
  for (var i = 0; i < glyphs.length; i++) {
    curGlyph = glyphs[i];
    nextGlyph = glyphs[i + 1];
    advance = curGlyph.advance;
    if (nextGlyph && kerningTable[curGlyph.id] && (offset = kerningTable[curGlyph.id][nextGlyph.id])) {
      advance += offset;
    }
    advances.push(advance);
  }

  return advances;
};

SffFont.prototype._processKerningTable = function (kerningTable) {
  var self = this;

  var result = {};
  var kerningMap;
  var glyphLeft, glyphRight;
  kerningTable.forEach(function (item) {
    kerningMap = {};
    glyphLeft = self.glyphTable[self.glyphMap[item.codePoint]];
    item.map.forEach(function (glyphKerningItem) {
      glyphRight = self.glyphTable[self.glyphMap[glyphKerningItem.codePoint]];
      kerningMap[glyphRight.id] = glyphKerningItem.advance;
    });

    result[glyphLeft.id] = kerningMap;
  });

  return result;
};

module.exports = SffFont;
