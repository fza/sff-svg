'use strict';

var SffFont = require('./sff-font');
var isArray = require('isarray');
var decompressPath = require('./decompress-path');

var SFF_MAGIC = 'SFF';

function SffParser() {}

SffParser.prototype.parse = function (buf) {
  var self = this;

  var magicLen = Buffer.byteLength(SFF_MAGIC);
  var magic = buf.toString('utf8', 0, magicLen);
  if (magic !== SFF_MAGIC) {
    throw new Error('Not a SFF file');
  }

  self.offset = magicLen;
  self.buf = buf;

  var version = self._unpack('uint16');
  if (version !== 1) {
    throw new Error('Cannot parse SFF file version ' + version);
  }

  var meta = self._parseHeader();
  var glyphData = self._parseGlyphData();
  var kerningTable = self._parseKerningTable();

  return new SffFont(meta, glyphData, kerningTable);
};

SffParser.prototype._parseHeader = function () {
  return this._unpackTable([
    ['postscriptName', 'string'],
    ['copyright', 'string'],
    ['version', 'string'],
    ['unitsPerEm', 'uint16'],
    ['ascent', 'int16'],
    ['descent', 'int16'],
    ['lineGap', 'int16'],
    ['underlinePosition', 'int16'],
    ['underlineThickness', 'int16']
  ]);
};

SffParser.prototype._parseGlyphData = function () {
  return this._unpackArray([['table', [
    ['codePoints', ['array', ['uint16']]],
    ['advance', 'uint16'],
    ['path', decompressPath]
  ]]]);
};

SffParser.prototype._parseKerningTable = function () {
  return this._unpackArray([['table', [
    ['codePoint', 'uint16'],
    ['map', ['array', [['table', [
      ['codePoint', 'uint16'],
      ['advance', 'int16']
    ]]]]
    ]]]]);
};

SffParser.prototype._unpack = function (format) {
  var self = this;

  var buf = self.buf;
  var offset = self.offset;
  var len;
  var result;

  if (typeof format === 'function') {
    len = buf.readUInt16BE(offset);
    result = format(buf.slice(offset + 2, offset + 2 + len));
    offset += 2 + len;
  } else {
    switch (format) {
      case 'string':
        len = buf.readUInt16BE(offset);
        result = buf.toString('utf8', offset + 2, offset + 2 + len);
        offset += 2 + len;
        break;

      case 'uint16':
        result = buf.readUInt16BE(offset);
        offset += 2;
        break;

      case 'int16':
        result = buf.readInt16BE(offset);
        offset += 2;
        break;

      case 'uint32':
        result = buf.readUInt32BE(offset);
        offset += 4;
        break;

      case 'int32':
        result = buf.readInt32BE(offset);
        offset += 4;
        break;

      default:
        throw new Error('Cannot unpack ' + format);
    }
  }

  self.offset = offset;

  return result;
};

SffParser.prototype._unpackCollection = function (type, proto) {
  var self = this;

  switch (type) {
    case 'array':
      return self._unpackArray(proto);

    case 'table':
      return self._unpackTable(proto);

    default:
      throw new Error('Cannot unpack collection type ' + type);
  }
};

SffParser.prototype._unpackArray = function (proto) {
  var self = this;

  var protoLen = proto.length;
  var len = self._unpack('uint16');
  var result = new Array(len);
  var item;
  for (var i = 0; i < len; i++) {
    item = [];
    proto.forEach(function (type) {
      if (isArray(type)) {
        item.push(self._unpackCollection(type[0], type[1]));
      } else {
        item.push(self._unpack(type));
      }
    });

    result[i] = protoLen === 1 ? item[0] : item;
  }

  return result;
};

SffParser.prototype._unpackTable = function (proto) {
  var self = this;

  var result = {};
  proto.forEach(function (item) {
    var key = item[0];
    var type = item[1];
    if (isArray(type)) {
      result[key] = self._unpackCollection(type[0], type[1]);
    } else {
      result[key] = self._unpack(type);
    }
  });

  return result;
};

module.exports = SffParser;

