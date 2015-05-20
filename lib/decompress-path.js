'use strict';

var ctrl = {
  1: 'A', 2: 'C',
  3: 'H', 4: 'L',
  5: 'M', 6: 'Q',
  7: 'S', 8: 'T',
  9: 'V', 10: 'Z',
  14: ' '
};

var END_BYTE = 0xf0;

module.exports = function decompressPath(buf) {
  var str = '';
  var ctrlByte, ctrlType, valType;
  var offset = 0;
  while (offset < buf.length) {
    ctrlByte = buf[offset];

    if (ctrlByte === END_BYTE) {
      break;
    }

    offset++;

    ctrlType = ctrlByte >> 4;
    if (ctrlType !== 0) {
      if (!ctrl[ctrlType]) {
        throw new Error('Cannot decompress glyph path: Unknown control type');
      }

      str += ctrl[ctrlType];
    }

    valType = ctrlByte & ~(ctrlType << 4);
    if (valType !== 0) {
      if (valType < 1 || valType > 7) {
        throw new Error('Cannot decompress glyph path: Unknown val type');
      }

      switch (valType) {
        case 1:
          str += buf.readUInt8(offset++);
          break;

        case 2:
          str += buf.readInt8(offset++);
          break;

        case 3:
          str += buf.readUInt16BE(offset);
          offset += 2;
          break;

        case 4:
          str += buf.readInt16BE(offset);
          offset += 2;
          break;

        case 5:
          str += buf.readUInt32BE(offset);
          offset += 4;
          break;

        case 6:
          str += buf.readInt32BE(offset);
          offset += 4;
          break;

        case 7:
          str += buf.readFloatBE(offset);
          offset += 4;
          break;
      }
    }
  }

  return str;
};
