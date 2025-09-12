/*
 * p5.svg v1.5.1
 * https://github.com/zenozeng/p5.js-svg
 *
 * Copyright (C) 2021 Zeno Zeng
 * Released under the MIT license
 *
 *
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('p5')) :
  typeof define === 'function' && define.amd ? define(['p5'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.p5.SVG = factory(global.p5));
})(this, (function (p5) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var p5__default = /*#__PURE__*/_interopDefaultLegacy(p5);

  var constants = {
    SVG: 'svg',
    PX_ATTRS: ['x', 'y', 'width', 'height', 'font-size', 'stroke-width']
  };

  /**
   * Return a number with input number converted to a string withthio given number of dp
   */
  var toDP = function (n, dp) {
    return (Math.round(n * 100) / 100).toFixed(dp);
  };
  var toString = function (obj) {
    return Object.prototype.toString.call(obj);
  };
  var isObject = function (obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };
  var isArray = Array.isArray;
  var isFunction = function (obj) {
    return toString(obj) === '[object Function]' || typeof obj === 'function';
  };
  var isNumber = function (obj) {
    return toString(obj) === '[object Number]' || typeof obj === 'number';
  };
  var isString = function (obj) {
    return toString(obj) === '[object String]' || typeof obj === 'string';
  };
  var isUndefined = function (obj) {
    return obj === void 0;
  };
  var isDefined = function (obj) {
    return !isUndefined(obj);
  };
  var has = function (obj, key) {
    return isDefined(obj) && Object.prototype.hasOwnProperty.call(obj, key);
  };
  var extend = function (obj) {
    if (!isObject(obj)) {
      return obj;
    }
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
          obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  /**
   * Get current style
   * @param {Element} el
   * @param {String} [name]
   * @returns {CSSStyleDeclaration|String|undefined}
   */
  var getStyle = function (el, name) {
    var style = window.getComputedStyle(el, null);
    if (name) {
      return style.getPropertyValue(name) || undefined;
    } else {
      return style;
    }
  };

  /**
   * Set style
   * @param {Element} el
   * @param {String|Object} name
   * @param {String} [value]
   */
  var setStyle = function (el, name, value) {
    if (isObject(name)) {
      var styles = name;
      for (var _name in styles) {
        if (styles.hasOwnProperty(_name)) {
          el.style[_name] = styles[_name];
        }
      }
    } else {
      el.style[name] = value;
    }
  };

  var removeAttr = function (el, name) {
    el.removeAttribute(name);
  };
  var getAttr = function (el, name) {
    return el.getAttribute(name);
  };
  var setAttr = function (el, name, value) {
    if (isObject(name)) {
      var attrs = name;
      for (var _name in attrs) {
        if (has(attrs, _name)) {
          setAttr(el, _name, attrs[_name]);
        }
      }
    } else {
      el.setAttribute(name, value);
    }
  };
  var setAttrs = function (el, attrs) {
    return setAttr(el, attrs);
  };
  var setNamespacedAttr = function (el, namespace, name, value) {
    el.setAttributeNS(namespace, name, value);
  };

  var createEl = function (tagName, attrs) {
    var el = document.createElement(tagName);
    if (attrs) {
      setAttrs(el, attrs);
    }
    return el;
  };
  var createElNS = function (namespace, tagName, attrs) {
    var el = document.createElementNS(namespace, tagName);
    if (attrs) {
      setAttrs(el, attrs);
    }
    return el;
  };

  /**
   * Create SVG element
   * @param {String} tagName
   * @param {Object} [attrs]
   * @returns {SVGElement}
   */
  var createSVGEl = function (tagName, attrs) {
    return createElNS("http://www.w3.org/2000/svg", tagName, attrs);
  };

  /**
   * Element
   */
  var Element = function (tagName, attrs, defs) {
    this.tagName = tagName;
    this.attrs = attrs || {};
    this.children = [];
    this.defs = defs;
    this.isDefs = false; // Is this element a defs
  };

  extend(Element.prototype, {
    /**
     * Append element
     * @param {Element} element
     */
    add: function (element) {
      if (element.isDefs) {
        this.defs.add(element);
      } else {
        this.children.push(element);
      }
    },
    /**
     * Set attributes
     * @param {String|Object} name
     * @param {mixed} value
     */
    set: function (name, value) {
      if (isObject(name)) {
        var attrs = name;
        extend(this.attrs, attrs);
      } else {
        this.attrs[name] = value;
      }
    },
    /**
     * Remove attribute
     * @param {String} name
     */
    remove: function (name) {
      delete this.attrs[name];
    },
    /**
     * To SVG string
     */
    toString: function () {
      var attrs = [];
      for (var name in this.attrs) {
        var value = this.attrs[name];
        if (isFunction(value)) {
          value = value();
        }
        if (isDefined(value) && !isFunction(value)) {
          // convert to string
          if (constants.PX_ATTRS.indexOf(name) !== -1 && isNumber(value)) {
            value = toDP(value, 4);
          } else {
            value = value.toString();
          }
          if (value.indexOf('"') !== -1) {
            value = value.replace(/"/g, "'");
          }
          attrs.push(name + '="' + value + '"');
        }
      }
      attrs = attrs.join(' ');
      var result = '<' + this.tagName + (attrs.length > 0 ? ' ' + attrs : '');
      if (this.children.length > 0) {
        result += '>';
        this.children.forEach(function (child) {
          result += child.toString();
        });
        result += '</' + this.tagName + '>';
      } else {
        result += ' />';
      }
      return result;
    },
    /**
     * toDom
     * @param {SVGElement} [svg] if provided, will append el to svg
     */
    toDom: function (svg) {
      var i;
      var el = createSVGEl(this.tagName, this.attrs);
      for (i = 0; i < this.children.length; i++) {
        this.children[i].toDom(el);
      }
      if (svg) {
        svg.appendChild(el);
      }
      return el;
    }
  });

  /**
   * Defs
   */
  var Defs = function () {
    Element.call(this, 'defs');
    this.isDefs = true;
    this.store = {};
  };

  Defs.prototype = extend({}, Element.prototype, {
    /**
     * @override
     */
    add: function (element) {
      var id = element.attrs.id;
      if (!id) {
        throw new Error('Can not add element without id to defs');
      }
      if (this.store[id]) {
        return;
      }
      this.store[id] = element;
      this.children.push(element);
    }
  });

  /**
   * Convert to string with given precision
   */
  var toFixed = function (n, p) {
    if (isUndefined(p)) {
      p = 4;
    }
    return n.toFixed(p);
  };
  var pointsToString = function (points) {
    var result = '';
    var p;
    for (var i = 0; i < points.length; i++) {
      p = points[i];
      result += toFixed(p.x) + ',' + toFixed(p.y);
      if (i !== points.length - 1) {
        result += ' ';
      }
    }
    return result;
  };
  var Path = function (attrs, defs) {
    Element.call(this, 'path', attrs, defs);
    this.commands = [];
  };

  Path.prototype = extend({}, Element.prototype, {
    moveTo: function (x, y) {
      this.commands.push('M' + toFixed(x) + ' ' + toFixed(y));
    },
    lineTo: function (x, y) {
      this.commands.push('L' + toFixed(x) + ' ' + toFixed(y));
    },
    bezierCurveTo: function (x1, y1, x2, y2, x, y) {
      this.commands.push('C' + toFixed(x1) + ' ' + toFixed(y1) + ' ' + toFixed(x2) + ' ' + toFixed(y2) + ' ' + toFixed(x) + ' ' + toFixed(y));
    },
    quadraticCurveTo: function (x1, y1, x, y) {
      this.commands.push('Q' + toFixed(x1) + ' ' + toFixed(y1) + ' ' + toFixed(x) + ' ' + toFixed(y));
    },
    closePath: function () {
      this.commands.push('Z');
    },
    /**
     * @override
     */
    toString: function () {
      if (this.commands.length > 0) {
        this.attrs.d = this.commands.join(' ');
      }
      return Element.prototype.toString.call(this);
    }
  });

  var Style = function (attrs, defs) {
    Element.call(this, 'style', attrs, defs);
  };
  Style.prototype = extend({}, Element.prototype, {
    /**
     * @override
     */
    toString: function () {
      var result = '<style>';
      var rules = '';
      this.children.forEach(function (child) {
        rules += child;
      });
      if (rules) {
        result += "\n" + rules + "\n";
      }
      result += '</style>';
      return result;
    }
  });

  /**
   * A class to store current p5 options
   */
  var G = function (p) {
    this.p = p;
    this.options = {};
  };
  G.prototype.save = function () {
    this.options = this.p.get();
  };
  G.prototype.restore = function () {
    this.p.set(this.options);
  };

  // https://www.w3.org/TR/SVG/propidx.html
  var defaultSVGAttrs = {
    'font-family': 'sans-serif',
    'font-size': '12px',
    fill: '#000',
    stroke: 'none',
    'stroke-width': 1,
    'stroke-linecap': 'butt',
    'stroke-linejoin': 'miter',
    'stroke-miterlimit': 4,
    'stroke-dasharray': 'none',
    'stroke-dashoffset': 0,
    'stroke-opacity': 1,
    'fill-opacity': 1,
    'text-anchor': 'start'
  };

  /**
   * Get SVG attribute
   *
   * @param {String} name
   */
  var getSVGAttribute = function (name) {
    var p = this;
    var value = p[name];
    if (isFunction(value)) {
      value = value();
    }
    if (isUndefined(value) || value === null) {
      value = defaultSVGAttrs[name];
    }
    if (name.indexOf('color') > -1) {
      return value.toString();
    }
    return value;
  };
  var getSVGAttributes = function () {
    var p = this;
    var result = {};
    Object.keys(defaultSVGAttrs).forEach(function (key) {
      result[key] = getSVGAttribute.call(p, key);
    });
    return result;
  };

  var colorMaps = {
    'fill': 'fill',
    'stroke': 'stroke'
  };
  var p5Filters = {
    'NORMAL': 'source-over',
    'ADD': 'lighter',
    'SCREEN': 'screen',
    'MULTIPLY': 'multiply',
    'DIFFERENCE': 'difference',
    'LIGHTEST': 'lighten',
    'DARKEST': 'darken'
  };

  var Renderer = function (p) {
    this.p = p;
    this.defs = new Defs();
    this.g = new G(p);
  };
  extend(Renderer.prototype, {
    /**
     * Get an object with all valid svg properties
     */
    getProps: function () {
      var p = this.p;
      var props = {};
      var _this = this;

      //
      // General properties
      //
      ['fill', 'stroke'].forEach(function (name) {
        var color = p.get(name);
        if (color) {
          if (color.mode) {
            // color is a p5.Color object
            if (color.mode === 'rgb' && color.alpha === 255) {
              props[name] = color.toString('#rrggbb');
            } else {
              props[name] = color.toString('rgba');
            }
          } else if (isString(color)) {
            // color is a string
            props[name] = color;
          }
        } else {
          // color is null or undefined
          props[name] = 'none';
        }
      });
      ['stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset'].forEach(function (name) {
        var value = p.get(name);
        if (isDefined(value)) {
          props[name] = value;
        }
      });
      ['stroke-opacity', 'fill-opacity'].forEach(function (name) {
        var colorName = name.split('-')[0];
        var color = p.get(colorName);
        if (color && color.alpha) {
          props[name] = toDP(color.alpha / 255, 3);
        }
      });
      var blendMode = p.get('blendMode');
      if (blendMode && p5Filters[blendMode]) {
        var filter = p5Filters[blendMode];
        props['filter'] = 'url(#' + _this.addFilter(filter) + ')';
      }
      return props;
    },
    addFilter: function (filter) {
      var id = 'filter-' + filter;
      var el = new Element('filter', {
        id: id
      });
      var fe = new Element('feBlend', {
        'in': 'SourceGraphic',
        in2: 'BackgroundImage',
        mode: filter
      });
      el.add(fe);
      this.defs.add(el);
      return id;
    },
    /**
     * Set context to current p5 settings
     * @param {Element} el
     * @param {Object} [props]
     */
    setContext: function (el, props) {
      if (isUndefined(props)) {
        props = this.getProps();
      }
      el.set(props);
      var _this = this;
      var p = this.p;
      Object.keys(colorMaps).forEach(function (key) {
        var name = colorMaps[key];
        var color = p.get(name);
        if (isObject(color) && color.gradient) {
          var gradient = _this.getGradient(name, color);
          el.set(key, 'url(#' + gradient.id + ')');
          _this.defs.add(gradient.element);
        }
      });
    },
    getGradient: function (name, color) {
      var p = this.p;
      var w = p.width;
      var h = p.height;
      var x1 = w * color.x1;
      var y1 = h * color.y1;
      var x2 = w * color.x2;
      var y2 = h * color.y2;
      var id = 'gradient-' + [name, x1, y1, x2, y2].join('-');
      color.stops.forEach(function (stop, i) {
        id += '-' + i + stop.color + stop.offset;
      });
      var attrs = {
        id: id,
        gradientUnits: 'userSpaceOnUse',
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
      };
      var gradient = new Element('linearGradient', attrs, this.defs);
      color.stops.forEach(function (stop) {
        gradient.add(new Element('stop', {
          offset: stop.offset,
          'stop-color': stop.color
        }));
      });
      return {
        id: id,
        element: gradient
      };
    },
    //
    // background
    //
    background: function () {
      var p = this.p;
      var color = p.get('background');
      var a = Array.prototype.slice.call(arguments);
      if (a.length) {
        color = p5__default["default"].prototype.color.apply(p, a);
      }
      var opacity = toDP(color.alpha / 255, 3);
      var el = new Element('rect', {
        x: 0,
        y: 0,
        width: p.width,
        height: p.height,
        fill: color.toString('#rrggbb'),
        'fill-opacity': opacity
      });
      return el;
    },
    //
    // arc
    //
    arc: function (x, y, w, h, start, stop, mode) {
      var p = this.p;
      if (p.get('angleMode') === 'DEGREES') {
        start = p.radians(start);
        stop = p.radians(stop);
      }
      var rx = w / 2;
      var ry = h / 2;
      var sx = rx * Math.cos(start) + x;
      var sy = ry * Math.sin(start) + y;
      var ex = rx * Math.cos(stop) + x;
      var ey = ry * Math.sin(stop) + y;
      var largeArcFlag = stop - start <= Math.PI ? '0' : '1';
      var sweepFlag = '1';
      var commands = [];
      if (mode === 'CHORD' || mode === 'PIE') {
        commands.push('M' + x + ',' + y);
        commands.push('L' + sx + ',' + sy);
      } else {
        commands.push('M' + sx + ',' + sy);
      }
      commands.push('A' + rx + ',' + ry + ',0,' + largeArcFlag + ',' + sweepFlag + ',' + ex + ',' + ey);
      if (mode === 'CHORD') {
        commands.push('Z');
      } else if (mode === 'PIE') {
        commands.push('L' + x + ',' + y);
      }
      return new Element('path', {
        d: commands.join(' ')
      });
    },
    //
    // circle
    //
    circle: function (x, y, r) {
      return new Element('ellipse', {
        cx: x,
        cy: y,
        rx: r,
        ry: r
      });
    },
    //
    // ellipse
    //
    ellipse: function (x, y, w, h) {
      return new Element('ellipse', {
        cx: x,
        cy: y,
        rx: w / 2,
        ry: h / 2
      });
    },
    //
    // line
    //
    line: function (x1, y1, x2, y2) {
      return new Element('line', {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
      });
    },
    //
    // point
    //
    point: function (x, y) {
      return new Element('line', {
        x1: x,
        y1: y,
        x2: x,
        y2: y
      });
    },
    //
    // quad
    //
    quad: function (x1, y1, x2, y2, x3, y3, x4, y4) {
      return new Element('polygon', {
        points: [x1, y1, x2, y2, x3, y3, x4, y4].join(',')
      });
    },
    //
    // rect
    //
    rect: function (x, y, w, h, tl, tr, br, bl) {
      if (isUndefined(tl)) {
        return new Element('rect', {
          x: x,
          y: y,
          width: w,
          height: h
        });
      }
      if (isUndefined(tr)) {
        return new Element('rect', {
          x: x,
          y: y,
          width: w,
          height: h,
          rx: tl,
          ry: tl
        });
      }
      // Reference: https://www.w3.org/TR/SVG/shapes.html#RectElement
      var commands = [];
      commands.push('M' + (x + tl) + ',' + y);
      commands.push('H' + (x + w - tr));
      commands.push('A' + tr + ',' + tr + ' 0 0 1 ' + (x + w) + ',' + (y + tr));
      commands.push('V' + (y + h - br));
      commands.push('A' + br + ',' + br + ' 0 0 1 ' + (x + w - br) + ',' + (y + h));
      commands.push('H' + (x + bl));
      commands.push('A' + bl + ',' + bl + ' 0 0 1 ' + x + ',' + (y + h - bl));
      commands.push('V' + (y + tl));
      commands.push('A' + tl + ',' + tl + ' 0 0 1 ' + (x + tl) + ',' + y);
      commands.push('Z');
      return new Element('path', {
        d: commands.join(' ')
      });
    },
    //
    // triangle
    //
    triangle: function (x1, y1, x2, y2, x3, y3) {
      return new Element('polygon', {
        points: [x1, y1, x2, y2, x3, y3].join(',')
      });
    },
    //
    // shape
    //
    beginShape: function () {
      this.path = new Path();
    },
    endShape: function () {
      var p = this.p;
      var path = this.path;
      var closeShape = p.get('closeShape');
      if (closeShape) {
        path.closePath();
      }
      p.set('closeShape', false);
      this.setContext(path);
      var el = this.p.getCurrentElement();
      el.add(path);
      this.path = null;
    },
    //
    // vertex
    //
    vertex: function (x, y) {
      var p = this.p;
      if (this.path) {
        if (this.path.commands.length === 0) {
          this.path.moveTo(x, y);
        } else {
          var curveVertex = p.get('curveVertex');
          if (curveVertex) {
            this.path.quadraticCurveTo(curveVertex.x, curveVertex.y, x, y);
          } else {
            this.path.lineTo(x, y);
          }
        }
        p.set('curveVertex', null);
      }
    },
    curveVertex: function (x, y) {
      this.p.set('curveVertex', {
        x: x,
        y: y
      });
    },
    bezierVertex: function (x1, y1, x2, y2, x, y) {
      if (this.path) {
        this.path.bezierCurveTo(x1, y1, x2, y2, x, y);
      }
    },
    quadraticVertex: function (x1, y1, x, y) {
      if (this.path) {
        this.path.quadraticCurveTo(x1, y1, x, y);
      }
    },
    //
    // text
    //
    text: function (str, x, y) {
      var p = this.p;
      var textFont = p.get('textFont');
      var textLeading = p.get('textLeading');
      var textSize = p.get('textSize');
      var textAlign = p.get('textAlign');
      var textStyle = p.get('textStyle');
      var props = this.getProps();
      var attrs = {};
      var dy = 0;
      var anchor;
      if (textAlign) {
        if (textAlign === 'center') {
          anchor = 'middle';
        } else if (textAlign === 'right') {
          anchor = 'end';
        } else {
          anchor = 'start';
        }
      }
      attrs['text-anchor'] = anchor;
      if (textFont) {
        attrs['font-family'] = textFont;
      }
      if (textSize) {
        attrs['font-size'] = textSize;
      }
      if (textStyle) {
        attrs['font-style'] = textStyle;
      }

      // dy
      if (p.get('textAlignVertical') === p.CENTER) {
        dy = textSize * 0.1;
      } else if (p.get('textAlignVertical') === p.TOP) {
        dy = textSize * 0.8;
      } else if (p.get('textAlignVertical') === p.BOTTOM) {
        dy = textSize * -0.3;
      }
      if (isString(str)) {
        str = str.split('\n');
      }
      var el = new Element('text', {
        x: x,
        y: y,
        dy: dy
      });
      this.setContext(el, props);
      el.set(attrs);
      if (isArray(str)) {
        str.forEach(function (line, i) {
          var tspan = new Element('tspan', {
            x: x,
            dy: i === 0 ? 0 : textLeading
          });
          tspan.children.push(line);
          el.add(tspan);
        });
      } else {
        el.children.push(str);
      }
      return el;
    },
    //
    // image
    //
    image: function (p5Image, x, y, w, h) {
      var _this = this;
      var data;
      var isLoaded = function (img) {
        if (img.canvas) {
          var canvas = img.canvas;
          data = canvas.toDataURL("image/png");
        } else if (img.src && img.src.indexOf('data:image') === 0) {
          data = img.src;
        }
      };
      if (p5Image.canvas) {
        isLoaded(p5Image);
      } else if (p5Image.elt && p5Image.elt.localName === 'img') {
        if (p5Image.elt.complete) {
          isLoaded(p5Image);
        }
      }
      if (isUndefined(data)) {
        // Fallback to use url if it's not a data url
        if (p5Image.elt && p5Image.elt.localName === 'img' && p5Image.elt.src) {
          data = p5Image.elt.src;
        }
      }
      if (isDefined(data)) {
        var image = new Element('image', {
          x: x,
          y: y,
          width: w,
          height: h
        });
        setNamespacedAttr(image, "http://www.w3.org/1999/xlink", "href", data);
        var p = this.p;
        var blendMode = p.get('blendMode');
        if (blendMode && p5Filters[blendMode]) {
          var filter = p5Filters[blendMode];
          image.set('filter', 'url(#' + _this.addFilter(filter) + ')');
        }
        return image;
      }
    },
    //
    // clear
    //
    clear: function () {
      var svg = this.p.getCurrentElement();
      svg.children = [];
    },
    //
    // push & pop
    //
    push: function () {
      this.g.save();
    },
    pop: function () {
      this.g.restore();
    },
    //
    // transformations
    //
    applyMatrix: function (a, b, c, d, e, f) {
      var svg = this.p.getCurrentElement();
      var g = new Element('g', {
        transform: 'matrix(' + [a, b, c, d, e, f].join(',') + ')'
      });
      svg.add(g);
      this.p.setCurrentElement(g);
    },
    scale: function (x, y) {
      if (isUndefined(y)) {
        y = x;
      }
      var svg = this.p.getCurrentElement();
      var g = new Element('g', {
        transform: 'scale(' + x + ',' + y + ')'
      });
      svg.add(g);
      this.p.setCurrentElement(g);
    },
    rotate: function (r) {
      var p = this.p;
      var angleMode = p.get('angleMode');
      if (angleMode === 'DEGREES') {
        r = p.radians(r);
      }
      var deg = toDP(r / Math.PI * 180, 4);
      var svg = this.p.getCurrentElement();
      var g = new Element('g', {
        transform: 'rotate(' + deg + ')'
      });
      svg.add(g);
      this.p.setCurrentElement(g);
    },
    translate: function (x, y) {
      var svg = this.p.getCurrentElement();
      var g = new Element('g', {
        transform: 'translate(' + x + ',' + y + ')'
      });
      svg.add(g);
      this.p.setCurrentElement(g);
    },
    //
    // clip
    //
    clip: function (path) {
      var defs = this.defs;
      var svg = this.p.getCurrentElement();
      var id = 'clip-' + (defs.children.length + 1);
      var clipPath = new Element('clipPath', {
        id: id
      });
      clipPath.add(path);
      defs.add(clipPath);
      var g = new Element('g', {
        'clip-path': 'url(#' + id + ')'
      });
      svg.add(g);
      this.p.setCurrentElement(g);
    }
  });

  var Context = function (p) {
    this.p = p;
    this.renderer = new Renderer(p);
    this.svgelements = {};
  };
  extend(Context.prototype, {
    /**
     * Set attributes for SVG
     */
    attributes: function (name, value) {
      var p = this.p;
      var svg = p.elt;
      if (isObject(name)) {
        setAttrs(svg, name);
      } else {
        setAttr(svg, name, value);
      }
    },
    /**
     * Create a SVG element in p.elt
     *
     * @param {String} name
     * @param {Object} [attributes]
     * @returns {SVGElement}
     */
    createElement: function (name, attributes) {
      var p = this.p;
      var svg = p.elt;
      var el = createSVGEl(name, attributes);
      svg.appendChild(el);
      return el;
    },
    /**
     * Draw an SVGElement to canvas
     *
     * @param {SVGElement} el
     * @param {Number} x
     * @param {Number} y
     * @param {Number} [width]
     * @param {Number} [height]
     */
    drawElement: function (el, x, y, width, height) {
      var p = this.p;
      if (el instanceof p5__default["default"].Element) {
        el = el.elt;
      }
      var svg = p.elt;
      var id;
      if (isString(el)) {
        // it's a selector
        var result = svg.querySelector(el);
        if (result) {
          el = result;
          id = getAttr(el, 'id');
        } else {
          return;
        }
      }
      if (!id) {
        id = getAttr(el, 'id');
        if (!id) {
          id = 'svgelement-' + Date.now();
          setAttr(el, 'id', id);
        }
      }
      var use;
      var defs = svg.querySelector('defs');
      if (!defs) {
        defs = createSVGEl('defs');
        svg.insertBefore(defs, svg.firstChild);
      }
      if (!this.svgelements[id]) {
        this.svgelements[id] = el;
        defs.appendChild(el);
      } else if (this.svgelements[id] !== el) {
        // replace existing element
        defs.replaceChild(el, this.svgelements[id]);
        this.svgelements[id] = el;
      }
      var attrs = {
        x: x,
        y: y
      };
      if (isDefined(width)) {
        attrs.width = width;
      }
      if (isDefined(height)) {
        attrs.height = height;
      }
      use = createSVGEl('use', attrs);
      setNamespacedAttr(use, "http://www.w3.org/1999/xlink", "href", '#' + id);
      p.getCurrentElement().toDom(p.elt).appendChild(use);
    },
    /**
     * Render element
     */
    render: function (element) {
      var p = this.p;
      var renderer = this.renderer;
      var svg = p.getCurrentElement();
      if (!svg) {
        return;
      }
      var g = new Element('g');
      p.setCurrentElement(g);
      var args = Array.prototype.slice.call(arguments, 1);
      var name = element.nodeName.toLowerCase();
      var handle = renderer[name];
      if (isFunction(handle)) {
        handle.apply(renderer, args);
      }
      p.setCurrentElement(svg);
      svg.add(g);
    },
    /**
     * Append a element to current SVG
     */
    elt: function (tagName, attrs, children) {
      var p = this.p;
      var svg = p.getCurrentElement();
      if (!svg) {
        return;
      }
      var el = new Element(tagName, attrs);
      if (children) {
        children.forEach(function (child) {
          el.add(child);
        });
      }
      svg.add(el);
    },
    //
    // Main
    //
    /**
     * Create SVG
     *
     * @param {Number} width
     * @param {Number} height
     */
    create: function (width, height) {
      var p = this.p;
      var svg = createSVGEl('svg', {
        width: width,
        height: height,
        version: '1.1',
        xmlns: "http://www.w3.org/2000/svg"
      });
      setNamespacedAttr(svg, "http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
      var style = createEl('style');
      style.innerHTML = 'svg{background-color:transparent;}';
      svg.appendChild(style);
      p.elt = svg;
      var root = new Element('g');
      p.root = root;
      p.setCurrentElement(root);

      // default styles
      p.stroke('#000');
      p.fill('#fff');
    },
    /**
     * Convert SVG to string
     *
     * @param {Boolean} [isForExport=false]
     * @returns {String}
     */
    serialize: function (isForExport) {
      var p = this.p;
      var root = p.root;
      var defs = this.renderer.defs;
      var width = getAttr(p.elt, 'width');
      var height = getAttr(p.elt, 'height');
      var svg = new Element('svg', {
        width: width,
        height: height,
        version: '1.1',
        xmlns: "http://www.w3.org/2000/svg"
      });
      setNamespacedAttr(svg, "http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

      // style
      if (isForExport) {
        var style = new Style();
        var defaultStyles = '';
        Object.keys(defaultSVGAttrs).forEach(function (key) {
          defaultStyles += key + ': ' + defaultSVGAttrs[key] + ';';
        });
        style.add('svg{' + defaultStyles + 'background-color:transparent;}');
        svg.add(style);
      }
      svg.add(defs);
      svg.add(root);
      return svg.toString();
    },
    /**
     * Get SVG DOM Element
     */
    toElement: function () {
      var p = this.p;
      var root = p.root;
      var defs = this.renderer.defs;
      var width = getAttr(p.elt, 'width');
      var height = getAttr(p.elt, 'height');
      var svg = createSVGEl('svg', {
        width: width,
        height: height,
        version: '1.1',
        xmlns: "http://www.w3.org/2000/svg"
      });
      setNamespacedAttr(svg, "http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
      var style = createEl('style');
      style.innerHTML = 'svg{background-color:transparent;}';
      svg.appendChild(style);
      defs.toDom(svg);
      root.toDom(svg);
      return svg;
    },
    /**
     * Download SVG
     */
    save: function (filename) {
      var p = this.p;
      var svgString = this.serialize(true);
      var blob = new Blob([svgString], {
        type: "image/svg+xml"
      });
      p5__default["default"].prototype.saveAs(blob, filename, 'svg');
    }
  });

  var Context2D = p5__default["default"].prototype.Renderer2D;
  var SVG = function (el, p, isMainCanvas) {
    Context2D.call(this, el, p, isMainCanvas);
    this.isSVG = true;
    var _this = this;
    var svg = new Context(p);
    this.svg = svg;
    var p5Events = ['background', 'clear', 'push', 'pop', 'applyMatrix', 'scale', 'rotate', 'translate', 'stroke', 'strokeWeight', 'strokeCap', 'strokeJoin', 'strokeMiterLimit', 'noStroke', 'fill', 'noFill', 'arc', 'ellipse', 'line', 'point', 'quad', 'rect', 'triangle', 'beginShape', 'endShape', 'vertex', 'curveVertex', 'bezierVertex', 'quadraticVertex', 'text', 'textAlign', 'textLeading', 'textSize', 'textStyle', 'textFont', 'image', 'blendMode', 'clip'];
    p5Events.forEach(function (name) {
      var context2dImpl = _this[name];
      if (context2dImpl) {
        _this[name] = function () {
          var args = Array.prototype.slice.call(arguments);
          var g = _this.p.getCurrentElement();
          var el;
          if (_this.svg.renderer[name]) {
            el = _this.svg.renderer[name].apply(_this.svg.renderer, args);
          }
          if (el) {
            _this.svg.renderer.setContext(el);
            g.add(el);
          }
          if (name === 'endShape') {
            g.children.pop();
          }
        };
      }
    });

    // p.createGroup = function() {
    //     return new Element('g');
    // };
  };

  SVG.prototype = Object.create(Context2D.prototype);
  SVG.prototype.resize = function (w, h) {
    if (!this.canvas) {
      return;
    }
    if (this.width !== w || this.height !== h) {
      // canvas is not a p5.Element
      this.width = w;
      this.height = h;
      setAttrs(this.canvas, {
        width: this.width,
        height: this.height
      });
    }
  };
  SVG.prototype.remove = function () {
    var svg = this.p.elt;
    if (svg) {
      svg.parentNode.removeChild(svg);
    }
  };
  p5__default["default"].SVG = SVG;
  var _init = p5__default["default"].prototype._init;
  p5__default["default"].prototype._init = function () {
    _init.apply(this, arguments);
    var p = this;
    p.extendContext = function (name, handler) {
      p.prototype[name] = handler;
    };
    p.getCurrentElement = function () {
      return p.curElement;
    };
    p.setCurrentElement = function (el) {
      p.curElement = el;
    };
    p.registerSVGFilter = function (name, filter) {
      p5Filters[name] = filter;
    };
  };
  var createCanvas = p5__default["default"].prototype.createCanvas;
  p5__default["default"].prototype.createCanvas = function (w, h, renderer) {
    if (renderer === 'svg') {
      var p = this;
      var c = createCanvas.call(this, w, h); // return a p5.Element
      var svg = new SVG(c.elt, p, true);
      p._renderer = svg;
      svg.svg.create(w, h);
      return c;
    }
    return createCanvas.apply(this, arguments);
  };
  var p5Save = p5__default["default"].prototype.save;
  p5__default["default"].prototype.save = function (filename) {
    var p = this;
    var renderer = p._renderer;
    if (renderer.isSVG && (isUndefined(filename) || filename.indexOf('.svg') > -1)) {
      renderer.svg.save(filename);
    } else {
      p5Save.apply(this, arguments);
    }
  };

  /**
   * Polyfill for p5.Graphics
   */
  var p5Graphics;
  var createGraphics = p5__default["default"].prototype.createGraphics;
  p5__default["default"].prototype.createGraphics = function (w, h, renderer, path) {
    if (renderer !== 'svg') {
      return createGraphics.apply(this, arguments);
    }
    if (!p5Graphics) {
      p5Graphics = function (w, h, renderer, p) {
        p5__default["default"].call(this, function (sketch) {
          sketch.setup = function () {
            sketch.createCanvas(w, h, renderer);
          };
        });
        this.width = w;
        this.height = h;

        // do setup
        this._setup();
      };
      p5Graphics.prototype = Object.create(p5__default["default"].prototype);
    }
    var pg = new p5Graphics(w, h, renderer, this);
    return pg;
  };
  p5__default["default"].prototype.saveXML = function (data, filename) {
    var p = this;
    if (data.elt && data.elt.nodeName.toLowerCase() === 'svg') {
      // assume it's a p5.Element
      var svg = data.elt;
      var content = svg.outerHTML;
      p.saveStrings([content], filename, 'svg');
    }
  };

  return SVG;

}));