function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function parseColor(color) {
  if (color.indexOf("rgb(") == 0) {
    var inside = color.substr(4, color.length - 5);
    var splits = inside.split(",");
    return [parseInt(splits[0]), parseInt(splits[1]), parseInt(splits[2])];
  }
  var r = parseInt(color.substring(1,3),16);
  var g = parseInt(color.substring(3,5),16);
  var b = parseInt(color.substring(5,7),16);
  return [r, g, b];
}

function hsbToRgb(hue, saturation, brightness) {
  var r = 0, g = 0, b = 0;
  if (saturation == 0) {
    r = g = b = Math.floor(brightness * 255.0 + 0.5);
  } else {
    var h = parseFloat((hue - Math.floor(hue)) * 6.0);
    var f = h - Math.floor(h);
    var p = brightness * (1.0 - saturation);
    var q = brightness * (1.0 - saturation * f);
    var t = brightness * (1.0 - (saturation * (1.0 - f)));
    switch (parseInt(h)) {
      case 0:
      r = Math.floor(brightness * 255.0 + 0.5);
      g = Math.floor(t * 255.0 + 0.5);
      b = Math.floor(p * 255.0 + 0.5);
      break;
      case 1:
      r = Math.floor (q * 255.0 + 0.5);
      g = Math.floor (brightness * 255.0 + 0.5);
      b = Math.floor (p * 255.0 + 0.5);
      break;
      case 2:
      r = Math.floor (p * 255.0 + 0.5);
      g = Math.floor (brightness * 255.0 + 0.5);
      b = Math.floor (t * 255.0 + 0.5);
      break;
      case 3:
      r = Math.floor (p * 255.0 + 0.5);
      g = Math.floor (q * 255.0 + 0.5);
      b = Math.floor (brightness * 255.0 + 0.5);
      break;
      case 4:
      r = Math.floor (t * 255.0 + 0.5);
      g = Math.floor (p * 255.0 + 0.5);
      b = Math.floor (brightness * 255.0 + 0.5);
      break;
      case 5:
      r = Math.floor (brightness * 255.0 + 0.5);
      g = Math.floor (p * 255.0 + 0.5);
      b = Math.floor (q * 255.0 + 0.5);
      break;
    }
  }
  return "rgb(" + r + "," + g + "," + b + ")"
}

function rgbToHsb(red, green, blue) {
  var hue, saturation, brightness;
  var cmax = (red > green) ? red : green;
  if (blue > cmax) 
    cmax = blue;
  var cmin = (red < green) ? red : green;
  if (blue < cmin) 
    cmin = blue;

  brightness = cmax / 255.0;
  if (cmax != 0)
    saturation = parseFloat(cmax - cmin) / cmax;
  else
    saturation = 0;
  if (saturation == 0)
    hue = 0;
  else {
    var redc = parseFloat(cmax - red) / parseFloat(cmax - cmin);
    var greenc = parseFloat(cmax - green) / parseFloat(cmax - cmin);
    var bluec = parseFloat(cmax - blue) / parseFloat(cmax - cmin);
    if (red == cmax)
      hue = bluec - greenc;
    else if (green == cmax)
      hue = 2.0 + redc - bluec;
    else
      hue = 4.0 + greenc - redc;
    hue = hue / 6.0;
    if (hue < 0)
      hue = hue + 1.0;
  }
  return [hue, saturation, brightness];
}

function isMobile() {
  if (navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPod/i)) {
    return true;
  }
  return false;
}
