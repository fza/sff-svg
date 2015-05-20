# sff-svg

> SFF SVG typesetting

Takes a SFF font file and renders text to SVG paths.

## Installation

```shell
npm i sff-svg
```

## Example

```javascript
var typesetter = require('sff-svg');

typeSetter.registerFont('Helvetica', fs.readFileSync('helvetica.sff'));

var svgMarkup = typesetter.getSvgMarkupForString('Hello world', 'Helvetica', 72);
```

## License

Copyright (c) 2015 [Felix Zandanel](http://felix.zandanel.me)  
Licensed under the MIT license.

See LICENSE for more info.
