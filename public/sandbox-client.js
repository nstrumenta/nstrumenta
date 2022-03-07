/*! For license information please see sandbox-client.js.LICENSE.txt */
(() => {
  var t = {
      779: function (t, e, i) {
        var r, n, s;
        (n = [i(514)]),
          void 0 ===
            (s =
              'function' ==
              typeof (r = function (t) {
                'use strict';
                var e = function (t, i, n) {
                  if (
                    (void 0 === t && (t = e.DEFAULT_CAPACITY),
                    void 0 === i && (i = e.DEFAULT_ENDIAN),
                    void 0 === n && (n = e.DEFAULT_NOASSERT),
                    !n)
                  ) {
                    if ((t |= 0) < 0) throw RangeError('Illegal capacity');
                    (i = !!i), (n = !!n);
                  }
                  (this.buffer = 0 === t ? r : new ArrayBuffer(t)),
                    (this.view = 0 === t ? null : new Uint8Array(this.buffer)),
                    (this.offset = 0),
                    (this.markedOffset = -1),
                    (this.limit = t),
                    (this.littleEndian = i),
                    (this.noAssert = n);
                };
                (e.VERSION = '5.0.1'),
                  (e.LITTLE_ENDIAN = !0),
                  (e.BIG_ENDIAN = !1),
                  (e.DEFAULT_CAPACITY = 16),
                  (e.DEFAULT_ENDIAN = e.BIG_ENDIAN),
                  (e.DEFAULT_NOASSERT = !1),
                  (e.Long = t || null);
                var i = e.prototype;
                i.__isByteBuffer__,
                  Object.defineProperty(i, '__isByteBuffer__', {
                    value: !0,
                    enumerable: !1,
                    configurable: !1,
                  });
                var r = new ArrayBuffer(0),
                  n = String.fromCharCode;
                function s(t) {
                  var e = 0;
                  return function () {
                    return e < t.length ? t.charCodeAt(e++) : null;
                  };
                }
                function o() {
                  var t = [],
                    e = [];
                  return function () {
                    if (0 === arguments.length) return e.join('') + n.apply(String, t);
                    t.length + arguments.length > 1024 &&
                      (e.push(n.apply(String, t)), (t.length = 0)),
                      Array.prototype.push.apply(t, arguments);
                  };
                }
                function f(t, e, i, r, n) {
                  var s,
                    o,
                    f = 8 * n - r - 1,
                    h = (1 << f) - 1,
                    a = h >> 1,
                    u = -7,
                    l = i ? n - 1 : 0,
                    g = i ? -1 : 1,
                    w = t[e + l];
                  for (
                    l += g, s = w & ((1 << -u) - 1), w >>= -u, u += f;
                    u > 0;
                    s = 256 * s + t[e + l], l += g, u -= 8
                  );
                  for (
                    o = s & ((1 << -u) - 1), s >>= -u, u += r;
                    u > 0;
                    o = 256 * o + t[e + l], l += g, u -= 8
                  );
                  if (0 === s) s = 1 - a;
                  else {
                    if (s === h) return o ? NaN : (1 / 0) * (w ? -1 : 1);
                    (o += Math.pow(2, r)), (s -= a);
                  }
                  return (w ? -1 : 1) * o * Math.pow(2, s - r);
                }
                function h(t, e, i, r, n, s) {
                  var o,
                    f,
                    h,
                    a = 8 * s - n - 1,
                    u = (1 << a) - 1,
                    l = u >> 1,
                    g = 23 === n ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                    w = r ? 0 : s - 1,
                    b = r ? 1 : -1,
                    v = e < 0 || (0 === e && 1 / e < 0) ? 1 : 0;
                  for (
                    e = Math.abs(e),
                      isNaN(e) || e === 1 / 0
                        ? ((f = isNaN(e) ? 1 : 0), (o = u))
                        : ((o = Math.floor(Math.log(e) / Math.LN2)),
                          e * (h = Math.pow(2, -o)) < 1 && (o--, (h *= 2)),
                          (e += o + l >= 1 ? g / h : g * Math.pow(2, 1 - l)) * h >= 2 &&
                            (o++, (h /= 2)),
                          o + l >= u
                            ? ((f = 0), (o = u))
                            : o + l >= 1
                            ? ((f = (e * h - 1) * Math.pow(2, n)), (o += l))
                            : ((f = e * Math.pow(2, l - 1) * Math.pow(2, n)), (o = 0)));
                    n >= 8;
                    t[i + w] = 255 & f, w += b, f /= 256, n -= 8
                  );
                  for (
                    o = (o << n) | f, a += n;
                    a > 0;
                    t[i + w] = 255 & o, w += b, o /= 256, a -= 8
                  );
                  t[i + w - b] |= 128 * v;
                }
                (e.accessor = function () {
                  return Uint8Array;
                }),
                  (e.allocate = function (t, i, r) {
                    return new e(t, i, r);
                  }),
                  (e.concat = function (t, i, r, n) {
                    ('boolean' != typeof i && 'string' == typeof i) ||
                      ((n = r), (r = i), (i = void 0));
                    for (var s, o = 0, f = 0, h = t.length; f < h; ++f)
                      e.isByteBuffer(t[f]) || (t[f] = e.wrap(t[f], i)),
                        (s = t[f].limit - t[f].offset) > 0 && (o += s);
                    if (0 === o) return new e(0, r, n);
                    var a,
                      u = new e(o, r, n);
                    for (f = 0; f < h; )
                      (s = (a = t[f++]).limit - a.offset) <= 0 ||
                        (u.view.set(a.view.subarray(a.offset, a.limit), u.offset), (u.offset += s));
                    return (u.limit = u.offset), (u.offset = 0), u;
                  }),
                  (e.isByteBuffer = function (t) {
                    return !0 === (t && t.__isByteBuffer__);
                  }),
                  (e.type = function () {
                    return ArrayBuffer;
                  }),
                  (e.wrap = function (t, r, n, s) {
                    if (
                      ('string' != typeof r && ((s = n), (n = r), (r = void 0)),
                      'string' == typeof t)
                    )
                      switch ((void 0 === r && (r = 'utf8'), r)) {
                        case 'base64':
                          return e.fromBase64(t, n);
                        case 'hex':
                          return e.fromHex(t, n);
                        case 'binary':
                          return e.fromBinary(t, n);
                        case 'utf8':
                          return e.fromUTF8(t, n);
                        case 'debug':
                          return e.fromDebug(t, n);
                        default:
                          throw Error('Unsupported encoding: ' + r);
                      }
                    if (null === t || 'object' != typeof t) throw TypeError('Illegal buffer');
                    var o;
                    if (e.isByteBuffer(t)) return ((o = i.clone.call(t)).markedOffset = -1), o;
                    if (t instanceof Uint8Array)
                      (o = new e(0, n, s)),
                        t.length > 0 &&
                          ((o.buffer = t.buffer),
                          (o.offset = t.byteOffset),
                          (o.limit = t.byteOffset + t.byteLength),
                          (o.view = new Uint8Array(t.buffer)));
                    else if (t instanceof ArrayBuffer)
                      (o = new e(0, n, s)),
                        t.byteLength > 0 &&
                          ((o.buffer = t),
                          (o.offset = 0),
                          (o.limit = t.byteLength),
                          (o.view = t.byteLength > 0 ? new Uint8Array(t) : null));
                    else {
                      if ('[object Array]' !== Object.prototype.toString.call(t))
                        throw TypeError('Illegal buffer');
                      (o = new e(t.length, n, s)).limit = t.length;
                      for (var f = 0; f < t.length; ++f) o.view[f] = t[f];
                    }
                    return o;
                  }),
                  (i.writeBitSet = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if (!(t instanceof Array)) throw TypeError('Illegal BitSet: Not an array');
                      if ('number' != typeof e || e % 1 != 0)
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    var r,
                      n = e,
                      s = t.length,
                      o = s >> 3,
                      f = 0;
                    for (e += this.writeVarint32(s, e); o--; )
                      (r =
                        (1 & !!t[f++]) |
                        ((1 & !!t[f++]) << 1) |
                        ((1 & !!t[f++]) << 2) |
                        ((1 & !!t[f++]) << 3) |
                        ((1 & !!t[f++]) << 4) |
                        ((1 & !!t[f++]) << 5) |
                        ((1 & !!t[f++]) << 6) |
                        ((1 & !!t[f++]) << 7)),
                        this.writeByte(r, e++);
                    if (f < s) {
                      var h = 0;
                      for (r = 0; f < s; ) r |= (1 & !!t[f++]) << h++;
                      this.writeByte(r, e++);
                    }
                    return i ? ((this.offset = e), this) : e - n;
                  }),
                  (i.readBitSet = function (t) {
                    var e = void 0 === t;
                    e && (t = this.offset);
                    var i,
                      r = this.readVarint32(t),
                      n = r.value,
                      s = n >> 3,
                      o = 0,
                      f = [];
                    for (t += r.length; s--; )
                      (i = this.readByte(t++)),
                        (f[o++] = !!(1 & i)),
                        (f[o++] = !!(2 & i)),
                        (f[o++] = !!(4 & i)),
                        (f[o++] = !!(8 & i)),
                        (f[o++] = !!(16 & i)),
                        (f[o++] = !!(32 & i)),
                        (f[o++] = !!(64 & i)),
                        (f[o++] = !!(128 & i));
                    if (o < n) {
                      var h = 0;
                      for (i = this.readByte(t++); o < n; ) f[o++] = !!((i >> h++) & 1);
                    }
                    return e && (this.offset = t), f;
                  }),
                  (i.readBytes = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if ('number' != typeof e || e % 1 != 0)
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + t > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+' + t + ') <= ' + this.buffer.byteLength
                        );
                    }
                    var r = this.slice(e, e + t);
                    return i && (this.offset += t), r;
                  }),
                  (i.writeBytes = i.append),
                  (i.writeInt8 = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal value: ' + t + ' (not an integer)');
                      if (((t |= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    e += 1;
                    var r = this.buffer.byteLength;
                    return (
                      e > r && this.resize((r *= 2) > e ? r : e),
                      (e -= 1),
                      (this.view[e] = t),
                      i && (this.offset += 1),
                      this
                    );
                  }),
                  (i.writeByte = i.writeInt8),
                  (i.readInt8 = function (t) {
                    var e = void 0 === t;
                    if ((e && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 1 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+1) <= ' + this.buffer.byteLength
                        );
                    }
                    var i = this.view[t];
                    return 128 == (128 & i) && (i = -(255 - i + 1)), e && (this.offset += 1), i;
                  }),
                  (i.readByte = i.readInt8),
                  (i.writeUint8 = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal value: ' + t + ' (not an integer)');
                      if (((t >>>= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    e += 1;
                    var r = this.buffer.byteLength;
                    return (
                      e > r && this.resize((r *= 2) > e ? r : e),
                      (e -= 1),
                      (this.view[e] = t),
                      i && (this.offset += 1),
                      this
                    );
                  }),
                  (i.writeUInt8 = i.writeUint8),
                  (i.readUint8 = function (t) {
                    var e = void 0 === t;
                    if ((e && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 1 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+1) <= ' + this.buffer.byteLength
                        );
                    }
                    var i = this.view[t];
                    return e && (this.offset += 1), i;
                  }),
                  (i.readUInt8 = i.readUint8),
                  (i.writeInt16 = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal value: ' + t + ' (not an integer)');
                      if (((t |= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    e += 2;
                    var r = this.buffer.byteLength;
                    return (
                      e > r && this.resize((r *= 2) > e ? r : e),
                      (e -= 2),
                      this.littleEndian
                        ? ((this.view[e + 1] = (65280 & t) >>> 8), (this.view[e] = 255 & t))
                        : ((this.view[e] = (65280 & t) >>> 8), (this.view[e + 1] = 255 & t)),
                      i && (this.offset += 2),
                      this
                    );
                  }),
                  (i.writeShort = i.writeInt16),
                  (i.readInt16 = function (t) {
                    var e = void 0 === t;
                    if ((e && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 2 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+2) <= ' + this.buffer.byteLength
                        );
                    }
                    var i = 0;
                    return (
                      this.littleEndian
                        ? ((i = this.view[t]), (i |= this.view[t + 1] << 8))
                        : ((i = this.view[t] << 8), (i |= this.view[t + 1])),
                      32768 == (32768 & i) && (i = -(65535 - i + 1)),
                      e && (this.offset += 2),
                      i
                    );
                  }),
                  (i.readShort = i.readInt16),
                  (i.writeUint16 = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal value: ' + t + ' (not an integer)');
                      if (((t >>>= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    e += 2;
                    var r = this.buffer.byteLength;
                    return (
                      e > r && this.resize((r *= 2) > e ? r : e),
                      (e -= 2),
                      this.littleEndian
                        ? ((this.view[e + 1] = (65280 & t) >>> 8), (this.view[e] = 255 & t))
                        : ((this.view[e] = (65280 & t) >>> 8), (this.view[e + 1] = 255 & t)),
                      i && (this.offset += 2),
                      this
                    );
                  }),
                  (i.writeUInt16 = i.writeUint16),
                  (i.readUint16 = function (t) {
                    var e = void 0 === t;
                    if ((e && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 2 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+2) <= ' + this.buffer.byteLength
                        );
                    }
                    var i = 0;
                    return (
                      this.littleEndian
                        ? ((i = this.view[t]), (i |= this.view[t + 1] << 8))
                        : ((i = this.view[t] << 8), (i |= this.view[t + 1])),
                      e && (this.offset += 2),
                      i
                    );
                  }),
                  (i.readUInt16 = i.readUint16),
                  (i.writeInt32 = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal value: ' + t + ' (not an integer)');
                      if (((t |= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    e += 4;
                    var r = this.buffer.byteLength;
                    return (
                      e > r && this.resize((r *= 2) > e ? r : e),
                      (e -= 4),
                      this.littleEndian
                        ? ((this.view[e + 3] = (t >>> 24) & 255),
                          (this.view[e + 2] = (t >>> 16) & 255),
                          (this.view[e + 1] = (t >>> 8) & 255),
                          (this.view[e] = 255 & t))
                        : ((this.view[e] = (t >>> 24) & 255),
                          (this.view[e + 1] = (t >>> 16) & 255),
                          (this.view[e + 2] = (t >>> 8) & 255),
                          (this.view[e + 3] = 255 & t)),
                      i && (this.offset += 4),
                      this
                    );
                  }),
                  (i.writeInt = i.writeInt32),
                  (i.readInt32 = function (t) {
                    var e = void 0 === t;
                    if ((e && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 4 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+4) <= ' + this.buffer.byteLength
                        );
                    }
                    var i = 0;
                    return (
                      this.littleEndian
                        ? ((i = this.view[t + 2] << 16),
                          (i |= this.view[t + 1] << 8),
                          (i |= this.view[t]),
                          (i += (this.view[t + 3] << 24) >>> 0))
                        : ((i = this.view[t + 1] << 16),
                          (i |= this.view[t + 2] << 8),
                          (i |= this.view[t + 3]),
                          (i += (this.view[t] << 24) >>> 0)),
                      (i |= 0),
                      e && (this.offset += 4),
                      i
                    );
                  }),
                  (i.readInt = i.readInt32),
                  (i.writeUint32 = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal value: ' + t + ' (not an integer)');
                      if (((t >>>= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    e += 4;
                    var r = this.buffer.byteLength;
                    return (
                      e > r && this.resize((r *= 2) > e ? r : e),
                      (e -= 4),
                      this.littleEndian
                        ? ((this.view[e + 3] = (t >>> 24) & 255),
                          (this.view[e + 2] = (t >>> 16) & 255),
                          (this.view[e + 1] = (t >>> 8) & 255),
                          (this.view[e] = 255 & t))
                        : ((this.view[e] = (t >>> 24) & 255),
                          (this.view[e + 1] = (t >>> 16) & 255),
                          (this.view[e + 2] = (t >>> 8) & 255),
                          (this.view[e + 3] = 255 & t)),
                      i && (this.offset += 4),
                      this
                    );
                  }),
                  (i.writeUInt32 = i.writeUint32),
                  (i.readUint32 = function (t) {
                    var e = void 0 === t;
                    if ((e && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 4 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+4) <= ' + this.buffer.byteLength
                        );
                    }
                    var i = 0;
                    return (
                      this.littleEndian
                        ? ((i = this.view[t + 2] << 16),
                          (i |= this.view[t + 1] << 8),
                          (i |= this.view[t]),
                          (i += (this.view[t + 3] << 24) >>> 0))
                        : ((i = this.view[t + 1] << 16),
                          (i |= this.view[t + 2] << 8),
                          (i |= this.view[t + 3]),
                          (i += (this.view[t] << 24) >>> 0)),
                      e && (this.offset += 4),
                      i
                    );
                  }),
                  (i.readUInt32 = i.readUint32),
                  t &&
                    ((i.writeInt64 = function (e, i) {
                      var r = void 0 === i;
                      if ((r && (i = this.offset), !this.noAssert)) {
                        if ('number' == typeof e) e = t.fromNumber(e);
                        else if ('string' == typeof e) e = t.fromString(e);
                        else if (!(e && e instanceof t))
                          throw TypeError('Illegal value: ' + e + ' (not an integer or Long)');
                        if ('number' != typeof i || i % 1 != 0)
                          throw TypeError('Illegal offset: ' + i + ' (not an integer)');
                        if ((i >>>= 0) < 0 || i + 0 > this.buffer.byteLength)
                          throw RangeError(
                            'Illegal offset: 0 <= ' + i + ' (+0) <= ' + this.buffer.byteLength
                          );
                      }
                      'number' == typeof e
                        ? (e = t.fromNumber(e))
                        : 'string' == typeof e && (e = t.fromString(e)),
                        (i += 8);
                      var n = this.buffer.byteLength;
                      i > n && this.resize((n *= 2) > i ? n : i), (i -= 8);
                      var s = e.low,
                        o = e.high;
                      return (
                        this.littleEndian
                          ? ((this.view[i + 3] = (s >>> 24) & 255),
                            (this.view[i + 2] = (s >>> 16) & 255),
                            (this.view[i + 1] = (s >>> 8) & 255),
                            (this.view[i] = 255 & s),
                            (i += 4),
                            (this.view[i + 3] = (o >>> 24) & 255),
                            (this.view[i + 2] = (o >>> 16) & 255),
                            (this.view[i + 1] = (o >>> 8) & 255),
                            (this.view[i] = 255 & o))
                          : ((this.view[i] = (o >>> 24) & 255),
                            (this.view[i + 1] = (o >>> 16) & 255),
                            (this.view[i + 2] = (o >>> 8) & 255),
                            (this.view[i + 3] = 255 & o),
                            (i += 4),
                            (this.view[i] = (s >>> 24) & 255),
                            (this.view[i + 1] = (s >>> 16) & 255),
                            (this.view[i + 2] = (s >>> 8) & 255),
                            (this.view[i + 3] = 255 & s)),
                        r && (this.offset += 8),
                        this
                      );
                    }),
                    (i.writeLong = i.writeInt64),
                    (i.readInt64 = function (e) {
                      var i = void 0 === e;
                      if ((i && (e = this.offset), !this.noAssert)) {
                        if ('number' != typeof e || e % 1 != 0)
                          throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                        if ((e >>>= 0) < 0 || e + 8 > this.buffer.byteLength)
                          throw RangeError(
                            'Illegal offset: 0 <= ' + e + ' (+8) <= ' + this.buffer.byteLength
                          );
                      }
                      var r = 0,
                        n = 0;
                      this.littleEndian
                        ? ((r = this.view[e + 2] << 16),
                          (r |= this.view[e + 1] << 8),
                          (r |= this.view[e]),
                          (r += (this.view[e + 3] << 24) >>> 0),
                          (e += 4),
                          (n = this.view[e + 2] << 16),
                          (n |= this.view[e + 1] << 8),
                          (n |= this.view[e]),
                          (n += (this.view[e + 3] << 24) >>> 0))
                        : ((n = this.view[e + 1] << 16),
                          (n |= this.view[e + 2] << 8),
                          (n |= this.view[e + 3]),
                          (n += (this.view[e] << 24) >>> 0),
                          (e += 4),
                          (r = this.view[e + 1] << 16),
                          (r |= this.view[e + 2] << 8),
                          (r |= this.view[e + 3]),
                          (r += (this.view[e] << 24) >>> 0));
                      var s = new t(r, n, !1);
                      return i && (this.offset += 8), s;
                    }),
                    (i.readLong = i.readInt64),
                    (i.writeUint64 = function (e, i) {
                      var r = void 0 === i;
                      if ((r && (i = this.offset), !this.noAssert)) {
                        if ('number' == typeof e) e = t.fromNumber(e);
                        else if ('string' == typeof e) e = t.fromString(e);
                        else if (!(e && e instanceof t))
                          throw TypeError('Illegal value: ' + e + ' (not an integer or Long)');
                        if ('number' != typeof i || i % 1 != 0)
                          throw TypeError('Illegal offset: ' + i + ' (not an integer)');
                        if ((i >>>= 0) < 0 || i + 0 > this.buffer.byteLength)
                          throw RangeError(
                            'Illegal offset: 0 <= ' + i + ' (+0) <= ' + this.buffer.byteLength
                          );
                      }
                      'number' == typeof e
                        ? (e = t.fromNumber(e))
                        : 'string' == typeof e && (e = t.fromString(e)),
                        (i += 8);
                      var n = this.buffer.byteLength;
                      i > n && this.resize((n *= 2) > i ? n : i), (i -= 8);
                      var s = e.low,
                        o = e.high;
                      return (
                        this.littleEndian
                          ? ((this.view[i + 3] = (s >>> 24) & 255),
                            (this.view[i + 2] = (s >>> 16) & 255),
                            (this.view[i + 1] = (s >>> 8) & 255),
                            (this.view[i] = 255 & s),
                            (i += 4),
                            (this.view[i + 3] = (o >>> 24) & 255),
                            (this.view[i + 2] = (o >>> 16) & 255),
                            (this.view[i + 1] = (o >>> 8) & 255),
                            (this.view[i] = 255 & o))
                          : ((this.view[i] = (o >>> 24) & 255),
                            (this.view[i + 1] = (o >>> 16) & 255),
                            (this.view[i + 2] = (o >>> 8) & 255),
                            (this.view[i + 3] = 255 & o),
                            (i += 4),
                            (this.view[i] = (s >>> 24) & 255),
                            (this.view[i + 1] = (s >>> 16) & 255),
                            (this.view[i + 2] = (s >>> 8) & 255),
                            (this.view[i + 3] = 255 & s)),
                        r && (this.offset += 8),
                        this
                      );
                    }),
                    (i.writeUInt64 = i.writeUint64),
                    (i.readUint64 = function (e) {
                      var i = void 0 === e;
                      if ((i && (e = this.offset), !this.noAssert)) {
                        if ('number' != typeof e || e % 1 != 0)
                          throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                        if ((e >>>= 0) < 0 || e + 8 > this.buffer.byteLength)
                          throw RangeError(
                            'Illegal offset: 0 <= ' + e + ' (+8) <= ' + this.buffer.byteLength
                          );
                      }
                      var r = 0,
                        n = 0;
                      this.littleEndian
                        ? ((r = this.view[e + 2] << 16),
                          (r |= this.view[e + 1] << 8),
                          (r |= this.view[e]),
                          (r += (this.view[e + 3] << 24) >>> 0),
                          (e += 4),
                          (n = this.view[e + 2] << 16),
                          (n |= this.view[e + 1] << 8),
                          (n |= this.view[e]),
                          (n += (this.view[e + 3] << 24) >>> 0))
                        : ((n = this.view[e + 1] << 16),
                          (n |= this.view[e + 2] << 8),
                          (n |= this.view[e + 3]),
                          (n += (this.view[e] << 24) >>> 0),
                          (e += 4),
                          (r = this.view[e + 1] << 16),
                          (r |= this.view[e + 2] << 8),
                          (r |= this.view[e + 3]),
                          (r += (this.view[e] << 24) >>> 0));
                      var s = new t(r, n, !0);
                      return i && (this.offset += 8), s;
                    }),
                    (i.readUInt64 = i.readUint64)),
                  (i.writeFloat32 = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if ('number' != typeof t)
                        throw TypeError('Illegal value: ' + t + ' (not a number)');
                      if ('number' != typeof e || e % 1 != 0)
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    e += 4;
                    var r = this.buffer.byteLength;
                    return (
                      e > r && this.resize((r *= 2) > e ? r : e),
                      (e -= 4),
                      h(this.view, t, e, this.littleEndian, 23, 4),
                      i && (this.offset += 4),
                      this
                    );
                  }),
                  (i.writeFloat = i.writeFloat32),
                  (i.readFloat32 = function (t) {
                    var e = void 0 === t;
                    if ((e && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 4 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+4) <= ' + this.buffer.byteLength
                        );
                    }
                    var i = f(this.view, t, this.littleEndian, 23, 4);
                    return e && (this.offset += 4), i;
                  }),
                  (i.readFloat = i.readFloat32),
                  (i.writeFloat64 = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if ('number' != typeof t)
                        throw TypeError('Illegal value: ' + t + ' (not a number)');
                      if ('number' != typeof e || e % 1 != 0)
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    e += 8;
                    var r = this.buffer.byteLength;
                    return (
                      e > r && this.resize((r *= 2) > e ? r : e),
                      (e -= 8),
                      h(this.view, t, e, this.littleEndian, 52, 8),
                      i && (this.offset += 8),
                      this
                    );
                  }),
                  (i.writeDouble = i.writeFloat64),
                  (i.readFloat64 = function (t) {
                    var e = void 0 === t;
                    if ((e && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 8 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+8) <= ' + this.buffer.byteLength
                        );
                    }
                    var i = f(this.view, t, this.littleEndian, 52, 8);
                    return e && (this.offset += 8), i;
                  }),
                  (i.readDouble = i.readFloat64),
                  (e.MAX_VARINT32_BYTES = 5),
                  (e.calculateVarint32 = function (t) {
                    return (t >>>= 0) < 128
                      ? 1
                      : t < 16384
                      ? 2
                      : t < 1 << 21
                      ? 3
                      : t < 1 << 28
                      ? 4
                      : 5;
                  }),
                  (e.zigZagEncode32 = function (t) {
                    return (((t |= 0) << 1) ^ (t >> 31)) >>> 0;
                  }),
                  (e.zigZagDecode32 = function (t) {
                    return ((t >>> 1) ^ -(1 & t)) | 0;
                  }),
                  (i.writeVarint32 = function (t, i) {
                    var r = void 0 === i;
                    if ((r && (i = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal value: ' + t + ' (not an integer)');
                      if (((t |= 0), 'number' != typeof i || i % 1 != 0))
                        throw TypeError('Illegal offset: ' + i + ' (not an integer)');
                      if ((i >>>= 0) < 0 || i + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + i + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    var n,
                      s = e.calculateVarint32(t);
                    i += s;
                    var o = this.buffer.byteLength;
                    for (i > o && this.resize((o *= 2) > i ? o : i), i -= s, t >>>= 0; t >= 128; )
                      (n = (127 & t) | 128), (this.view[i++] = n), (t >>>= 7);
                    return (this.view[i++] = t), r ? ((this.offset = i), this) : s;
                  }),
                  (i.writeVarint32ZigZag = function (t, i) {
                    return this.writeVarint32(e.zigZagEncode32(t), i);
                  }),
                  (i.readVarint32 = function (t) {
                    var e = void 0 === t;
                    if ((e && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 1 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+1) <= ' + this.buffer.byteLength
                        );
                    }
                    var i,
                      r = 0,
                      n = 0;
                    do {
                      if (!this.noAssert && t > this.limit) {
                        var s = Error('Truncated');
                        throw ((s.truncated = !0), s);
                      }
                      (i = this.view[t++]), r < 5 && (n |= (127 & i) << (7 * r)), ++r;
                    } while (0 != (128 & i));
                    return (n |= 0), e ? ((this.offset = t), n) : { value: n, length: r };
                  }),
                  (i.readVarint32ZigZag = function (t) {
                    var i = this.readVarint32(t);
                    return (
                      'object' == typeof i
                        ? (i.value = e.zigZagDecode32(i.value))
                        : (i = e.zigZagDecode32(i)),
                      i
                    );
                  }),
                  t &&
                    ((e.MAX_VARINT64_BYTES = 10),
                    (e.calculateVarint64 = function (e) {
                      'number' == typeof e
                        ? (e = t.fromNumber(e))
                        : 'string' == typeof e && (e = t.fromString(e));
                      var i = e.toInt() >>> 0,
                        r = e.shiftRightUnsigned(28).toInt() >>> 0,
                        n = e.shiftRightUnsigned(56).toInt() >>> 0;
                      return 0 == n
                        ? 0 == r
                          ? i < 16384
                            ? i < 128
                              ? 1
                              : 2
                            : i < 1 << 21
                            ? 3
                            : 4
                          : r < 16384
                          ? r < 128
                            ? 5
                            : 6
                          : r < 1 << 21
                          ? 7
                          : 8
                        : n < 128
                        ? 9
                        : 10;
                    }),
                    (e.zigZagEncode64 = function (e) {
                      return (
                        'number' == typeof e
                          ? (e = t.fromNumber(e, !1))
                          : 'string' == typeof e
                          ? (e = t.fromString(e, !1))
                          : !1 !== e.unsigned && (e = e.toSigned()),
                        e.shiftLeft(1).xor(e.shiftRight(63)).toUnsigned()
                      );
                    }),
                    (e.zigZagDecode64 = function (e) {
                      return (
                        'number' == typeof e
                          ? (e = t.fromNumber(e, !1))
                          : 'string' == typeof e
                          ? (e = t.fromString(e, !1))
                          : !1 !== e.unsigned && (e = e.toSigned()),
                        e.shiftRightUnsigned(1).xor(e.and(t.ONE).toSigned().negate()).toSigned()
                      );
                    }),
                    (i.writeVarint64 = function (i, r) {
                      var n = void 0 === r;
                      if ((n && (r = this.offset), !this.noAssert)) {
                        if ('number' == typeof i) i = t.fromNumber(i);
                        else if ('string' == typeof i) i = t.fromString(i);
                        else if (!(i && i instanceof t))
                          throw TypeError('Illegal value: ' + i + ' (not an integer or Long)');
                        if ('number' != typeof r || r % 1 != 0)
                          throw TypeError('Illegal offset: ' + r + ' (not an integer)');
                        if ((r >>>= 0) < 0 || r + 0 > this.buffer.byteLength)
                          throw RangeError(
                            'Illegal offset: 0 <= ' + r + ' (+0) <= ' + this.buffer.byteLength
                          );
                      }
                      'number' == typeof i
                        ? (i = t.fromNumber(i, !1))
                        : 'string' == typeof i
                        ? (i = t.fromString(i, !1))
                        : !1 !== i.unsigned && (i = i.toSigned());
                      var s = e.calculateVarint64(i),
                        o = i.toInt() >>> 0,
                        f = i.shiftRightUnsigned(28).toInt() >>> 0,
                        h = i.shiftRightUnsigned(56).toInt() >>> 0;
                      r += s;
                      var a = this.buffer.byteLength;
                      switch ((r > a && this.resize((a *= 2) > r ? a : r), (r -= s), s)) {
                        case 10:
                          this.view[r + 9] = (h >>> 7) & 1;
                        case 9:
                          this.view[r + 8] = 9 !== s ? 128 | h : 127 & h;
                        case 8:
                          this.view[r + 7] = 8 !== s ? (f >>> 21) | 128 : (f >>> 21) & 127;
                        case 7:
                          this.view[r + 6] = 7 !== s ? (f >>> 14) | 128 : (f >>> 14) & 127;
                        case 6:
                          this.view[r + 5] = 6 !== s ? (f >>> 7) | 128 : (f >>> 7) & 127;
                        case 5:
                          this.view[r + 4] = 5 !== s ? 128 | f : 127 & f;
                        case 4:
                          this.view[r + 3] = 4 !== s ? (o >>> 21) | 128 : (o >>> 21) & 127;
                        case 3:
                          this.view[r + 2] = 3 !== s ? (o >>> 14) | 128 : (o >>> 14) & 127;
                        case 2:
                          this.view[r + 1] = 2 !== s ? (o >>> 7) | 128 : (o >>> 7) & 127;
                        case 1:
                          this.view[r] = 1 !== s ? 128 | o : 127 & o;
                      }
                      return n ? ((this.offset += s), this) : s;
                    }),
                    (i.writeVarint64ZigZag = function (t, i) {
                      return this.writeVarint64(e.zigZagEncode64(t), i);
                    }),
                    (i.readVarint64 = function (e) {
                      var i = void 0 === e;
                      if ((i && (e = this.offset), !this.noAssert)) {
                        if ('number' != typeof e || e % 1 != 0)
                          throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                        if ((e >>>= 0) < 0 || e + 1 > this.buffer.byteLength)
                          throw RangeError(
                            'Illegal offset: 0 <= ' + e + ' (+1) <= ' + this.buffer.byteLength
                          );
                      }
                      var r = e,
                        n = 0,
                        s = 0,
                        o = 0,
                        f = 0;
                      if (
                        ((n = 127 & (f = this.view[e++])),
                        128 & f &&
                          ((n |= (127 & (f = this.view[e++])) << 7),
                          (128 & f || (this.noAssert && void 0 === f)) &&
                            ((n |= (127 & (f = this.view[e++])) << 14),
                            (128 & f || (this.noAssert && void 0 === f)) &&
                              ((n |= (127 & (f = this.view[e++])) << 21),
                              (128 & f || (this.noAssert && void 0 === f)) &&
                                ((s = 127 & (f = this.view[e++])),
                                (128 & f || (this.noAssert && void 0 === f)) &&
                                  ((s |= (127 & (f = this.view[e++])) << 7),
                                  (128 & f || (this.noAssert && void 0 === f)) &&
                                    ((s |= (127 & (f = this.view[e++])) << 14),
                                    (128 & f || (this.noAssert && void 0 === f)) &&
                                      ((s |= (127 & (f = this.view[e++])) << 21),
                                      (128 & f || (this.noAssert && void 0 === f)) &&
                                        ((o = 127 & (f = this.view[e++])),
                                        (128 & f || (this.noAssert && void 0 === f)) &&
                                          ((o |= (127 & (f = this.view[e++])) << 7),
                                          128 & f || (this.noAssert && void 0 === f)))))))))))
                      )
                        throw Error('Buffer overrun');
                      var h = t.fromBits(n | (s << 28), (s >>> 4) | (o << 24), !1);
                      return i ? ((this.offset = e), h) : { value: h, length: e - r };
                    }),
                    (i.readVarint64ZigZag = function (i) {
                      var r = this.readVarint64(i);
                      return (
                        r && r.value instanceof t
                          ? (r.value = e.zigZagDecode64(r.value))
                          : (r = e.zigZagDecode64(r)),
                        r
                      );
                    })),
                  (i.writeCString = function (t, e) {
                    var i = void 0 === e;
                    i && (e = this.offset);
                    var r,
                      n = t.length;
                    if (!this.noAssert) {
                      if ('string' != typeof t) throw TypeError('Illegal str: Not a string');
                      for (r = 0; r < n; ++r)
                        if (0 === t.charCodeAt(r))
                          throw RangeError('Illegal str: Contains NULL-characters');
                      if ('number' != typeof e || e % 1 != 0)
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    (n = u.calculateUTF16asUTF8(s(t))[1]), (e += n + 1);
                    var o = this.buffer.byteLength;
                    return (
                      e > o && this.resize((o *= 2) > e ? o : e),
                      (e -= n + 1),
                      u.encodeUTF16toUTF8(
                        s(t),
                        function (t) {
                          this.view[e++] = t;
                        }.bind(this)
                      ),
                      (this.view[e++] = 0),
                      i ? ((this.offset = e), this) : n
                    );
                  }),
                  (i.readCString = function (t) {
                    var e = void 0 === t;
                    if ((e && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 1 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+1) <= ' + this.buffer.byteLength
                        );
                    }
                    var i,
                      r = t,
                      n = -1;
                    return (
                      u.decodeUTF8toUTF16(
                        function () {
                          if (0 === n) return null;
                          if (t >= this.limit)
                            throw RangeError(
                              'Illegal range: Truncated data, ' + t + ' < ' + this.limit
                            );
                          return 0 === (n = this.view[t++]) ? null : n;
                        }.bind(this),
                        (i = o()),
                        !0
                      ),
                      e ? ((this.offset = t), i()) : { string: i(), length: t - r }
                    );
                  }),
                  (i.writeIString = function (t, e) {
                    var i = void 0 === e;
                    if ((i && (e = this.offset), !this.noAssert)) {
                      if ('string' != typeof t) throw TypeError('Illegal str: Not a string');
                      if ('number' != typeof e || e % 1 != 0)
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    var r,
                      n = e;
                    (r = u.calculateUTF16asUTF8(s(t), this.noAssert)[1]), (e += 4 + r);
                    var o = this.buffer.byteLength;
                    if (
                      (e > o && this.resize((o *= 2) > e ? o : e),
                      (e -= 4 + r),
                      this.littleEndian
                        ? ((this.view[e + 3] = (r >>> 24) & 255),
                          (this.view[e + 2] = (r >>> 16) & 255),
                          (this.view[e + 1] = (r >>> 8) & 255),
                          (this.view[e] = 255 & r))
                        : ((this.view[e] = (r >>> 24) & 255),
                          (this.view[e + 1] = (r >>> 16) & 255),
                          (this.view[e + 2] = (r >>> 8) & 255),
                          (this.view[e + 3] = 255 & r)),
                      (e += 4),
                      u.encodeUTF16toUTF8(
                        s(t),
                        function (t) {
                          this.view[e++] = t;
                        }.bind(this)
                      ),
                      e !== n + 4 + r)
                    )
                      throw RangeError(
                        'Illegal range: Truncated data, ' + e + ' == ' + (e + 4 + r)
                      );
                    return i ? ((this.offset = e), this) : e - n;
                  }),
                  (i.readIString = function (t) {
                    var i = void 0 === t;
                    if ((i && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 4 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+4) <= ' + this.buffer.byteLength
                        );
                    }
                    var r = t,
                      n = this.readUint32(t),
                      s = this.readUTF8String(n, e.METRICS_BYTES, (t += 4));
                    return (
                      (t += s.length),
                      i ? ((this.offset = t), s.string) : { string: s.string, length: t - r }
                    );
                  }),
                  (e.METRICS_CHARS = 'c'),
                  (e.METRICS_BYTES = 'b'),
                  (i.writeUTF8String = function (t, e) {
                    var i,
                      r = void 0 === e;
                    if ((r && (e = this.offset), !this.noAssert)) {
                      if ('number' != typeof e || e % 1 != 0)
                        throw TypeError('Illegal offset: ' + e + ' (not an integer)');
                      if ((e >>>= 0) < 0 || e + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + e + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    var n = e;
                    (i = u.calculateUTF16asUTF8(s(t))[1]), (e += i);
                    var o = this.buffer.byteLength;
                    return (
                      e > o && this.resize((o *= 2) > e ? o : e),
                      (e -= i),
                      u.encodeUTF16toUTF8(
                        s(t),
                        function (t) {
                          this.view[e++] = t;
                        }.bind(this)
                      ),
                      r ? ((this.offset = e), this) : e - n
                    );
                  }),
                  (i.writeString = i.writeUTF8String),
                  (e.calculateUTF8Chars = function (t) {
                    return u.calculateUTF16asUTF8(s(t))[0];
                  }),
                  (e.calculateUTF8Bytes = function (t) {
                    return u.calculateUTF16asUTF8(s(t))[1];
                  }),
                  (e.calculateString = e.calculateUTF8Bytes),
                  (i.readUTF8String = function (t, i, r) {
                    'number' == typeof i && ((r = i), (i = void 0));
                    var n = void 0 === r;
                    if (
                      (n && (r = this.offset),
                      void 0 === i && (i = e.METRICS_CHARS),
                      !this.noAssert)
                    ) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal length: ' + t + ' (not an integer)');
                      if (((t |= 0), 'number' != typeof r || r % 1 != 0))
                        throw TypeError('Illegal offset: ' + r + ' (not an integer)');
                      if ((r >>>= 0) < 0 || r + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + r + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    var s,
                      f = 0,
                      h = r;
                    if (i === e.METRICS_CHARS) {
                      if (
                        ((s = o()),
                        u.decodeUTF8(
                          function () {
                            return f < t && r < this.limit ? this.view[r++] : null;
                          }.bind(this),
                          function (t) {
                            ++f, u.UTF8toUTF16(t, s);
                          }
                        ),
                        f !== t)
                      )
                        throw RangeError('Illegal range: Truncated data, ' + f + ' == ' + t);
                      return n ? ((this.offset = r), s()) : { string: s(), length: r - h };
                    }
                    if (i === e.METRICS_BYTES) {
                      if (!this.noAssert) {
                        if ('number' != typeof r || r % 1 != 0)
                          throw TypeError('Illegal offset: ' + r + ' (not an integer)');
                        if ((r >>>= 0) < 0 || r + t > this.buffer.byteLength)
                          throw RangeError(
                            'Illegal offset: 0 <= ' +
                              r +
                              ' (+' +
                              t +
                              ') <= ' +
                              this.buffer.byteLength
                          );
                      }
                      var a = r + t;
                      if (
                        (u.decodeUTF8toUTF16(
                          function () {
                            return r < a ? this.view[r++] : null;
                          }.bind(this),
                          (s = o()),
                          this.noAssert
                        ),
                        r !== a)
                      )
                        throw RangeError('Illegal range: Truncated data, ' + r + ' == ' + a);
                      return n ? ((this.offset = r), s()) : { string: s(), length: r - h };
                    }
                    throw TypeError('Unsupported metrics: ' + i);
                  }),
                  (i.readString = i.readUTF8String),
                  (i.writeVString = function (t, i) {
                    var r = void 0 === i;
                    if ((r && (i = this.offset), !this.noAssert)) {
                      if ('string' != typeof t) throw TypeError('Illegal str: Not a string');
                      if ('number' != typeof i || i % 1 != 0)
                        throw TypeError('Illegal offset: ' + i + ' (not an integer)');
                      if ((i >>>= 0) < 0 || i + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + i + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    var n,
                      o,
                      f = i;
                    (n = u.calculateUTF16asUTF8(s(t), this.noAssert)[1]),
                      (o = e.calculateVarint32(n)),
                      (i += o + n);
                    var h = this.buffer.byteLength;
                    if (
                      (i > h && this.resize((h *= 2) > i ? h : i),
                      (i -= o + n),
                      (i += this.writeVarint32(n, i)),
                      u.encodeUTF16toUTF8(
                        s(t),
                        function (t) {
                          this.view[i++] = t;
                        }.bind(this)
                      ),
                      i !== f + n + o)
                    )
                      throw RangeError(
                        'Illegal range: Truncated data, ' + i + ' == ' + (i + n + o)
                      );
                    return r ? ((this.offset = i), this) : i - f;
                  }),
                  (i.readVString = function (t) {
                    var i = void 0 === t;
                    if ((i && (t = this.offset), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 1 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+1) <= ' + this.buffer.byteLength
                        );
                    }
                    var r = t,
                      n = this.readVarint32(t),
                      s = this.readUTF8String(n.value, e.METRICS_BYTES, (t += n.length));
                    return (
                      (t += s.length),
                      i ? ((this.offset = t), s.string) : { string: s.string, length: t - r }
                    );
                  }),
                  (i.append = function (t, i, r) {
                    ('number' != typeof i && 'string' == typeof i) || ((r = i), (i = void 0));
                    var n = void 0 === r;
                    if ((n && (r = this.offset), !this.noAssert)) {
                      if ('number' != typeof r || r % 1 != 0)
                        throw TypeError('Illegal offset: ' + r + ' (not an integer)');
                      if ((r >>>= 0) < 0 || r + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + r + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    t instanceof e || (t = e.wrap(t, i));
                    var s = t.limit - t.offset;
                    if (s <= 0) return this;
                    r += s;
                    var o = this.buffer.byteLength;
                    return (
                      r > o && this.resize((o *= 2) > r ? o : r),
                      (r -= s),
                      this.view.set(t.view.subarray(t.offset, t.limit), r),
                      (t.offset += s),
                      n && (this.offset += s),
                      this
                    );
                  }),
                  (i.appendTo = function (t, e) {
                    return t.append(this, e), this;
                  }),
                  (i.assert = function (t) {
                    return (this.noAssert = !t), this;
                  }),
                  (i.capacity = function () {
                    return this.buffer.byteLength;
                  }),
                  (i.clear = function () {
                    return (
                      (this.offset = 0),
                      (this.limit = this.buffer.byteLength),
                      (this.markedOffset = -1),
                      this
                    );
                  }),
                  (i.clone = function (t) {
                    var i = new e(0, this.littleEndian, this.noAssert);
                    return (
                      t
                        ? ((i.buffer = new ArrayBuffer(this.buffer.byteLength)),
                          (i.view = new Uint8Array(i.buffer)))
                        : ((i.buffer = this.buffer), (i.view = this.view)),
                      (i.offset = this.offset),
                      (i.markedOffset = this.markedOffset),
                      (i.limit = this.limit),
                      i
                    );
                  }),
                  (i.compact = function (t, e) {
                    if (
                      (void 0 === t && (t = this.offset),
                      void 0 === e && (e = this.limit),
                      !this.noAssert)
                    ) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal begin: Not an integer');
                      if (((t >>>= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal end: Not an integer');
                      if (((e >>>= 0), t < 0 || t > e || e > this.buffer.byteLength))
                        throw RangeError(
                          'Illegal range: 0 <= ' + t + ' <= ' + e + ' <= ' + this.buffer.byteLength
                        );
                    }
                    if (0 === t && e === this.buffer.byteLength) return this;
                    var i = e - t;
                    if (0 === i)
                      return (
                        (this.buffer = r),
                        (this.view = null),
                        this.markedOffset >= 0 && (this.markedOffset -= t),
                        (this.offset = 0),
                        (this.limit = 0),
                        this
                      );
                    var n = new ArrayBuffer(i),
                      s = new Uint8Array(n);
                    return (
                      s.set(this.view.subarray(t, e)),
                      (this.buffer = n),
                      (this.view = s),
                      this.markedOffset >= 0 && (this.markedOffset -= t),
                      (this.offset = 0),
                      (this.limit = i),
                      this
                    );
                  }),
                  (i.copy = function (t, i) {
                    if (
                      (void 0 === t && (t = this.offset),
                      void 0 === i && (i = this.limit),
                      !this.noAssert)
                    ) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal begin: Not an integer');
                      if (((t >>>= 0), 'number' != typeof i || i % 1 != 0))
                        throw TypeError('Illegal end: Not an integer');
                      if (((i >>>= 0), t < 0 || t > i || i > this.buffer.byteLength))
                        throw RangeError(
                          'Illegal range: 0 <= ' + t + ' <= ' + i + ' <= ' + this.buffer.byteLength
                        );
                    }
                    if (t === i) return new e(0, this.littleEndian, this.noAssert);
                    var r = i - t,
                      n = new e(r, this.littleEndian, this.noAssert);
                    return (
                      (n.offset = 0),
                      (n.limit = r),
                      n.markedOffset >= 0 && (n.markedOffset -= t),
                      this.copyTo(n, 0, t, i),
                      n
                    );
                  }),
                  (i.copyTo = function (t, i, r, n) {
                    var s, o;
                    if (!this.noAssert && !e.isByteBuffer(t))
                      throw TypeError('Illegal target: Not a ByteBuffer');
                    if (
                      ((i = (o = void 0 === i) ? t.offset : 0 | i),
                      (r = (s = void 0 === r) ? this.offset : 0 | r),
                      (n = void 0 === n ? this.limit : 0 | n),
                      i < 0 || i > t.buffer.byteLength)
                    )
                      throw RangeError(
                        'Illegal target range: 0 <= ' + i + ' <= ' + t.buffer.byteLength
                      );
                    if (r < 0 || n > this.buffer.byteLength)
                      throw RangeError(
                        'Illegal source range: 0 <= ' + r + ' <= ' + this.buffer.byteLength
                      );
                    var f = n - r;
                    return 0 === f
                      ? t
                      : (t.ensureCapacity(i + f),
                        t.view.set(this.view.subarray(r, n), i),
                        s && (this.offset += f),
                        o && (t.offset += f),
                        this);
                  }),
                  (i.ensureCapacity = function (t) {
                    var e = this.buffer.byteLength;
                    return e < t ? this.resize((e *= 2) > t ? e : t) : this;
                  }),
                  (i.fill = function (t, e, i) {
                    var r = void 0 === e;
                    if (
                      (r && (e = this.offset),
                      'string' == typeof t && t.length > 0 && (t = t.charCodeAt(0)),
                      void 0 === e && (e = this.offset),
                      void 0 === i && (i = this.limit),
                      !this.noAssert)
                    ) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal value: ' + t + ' (not an integer)');
                      if (((t |= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal begin: Not an integer');
                      if (((e >>>= 0), 'number' != typeof i || i % 1 != 0))
                        throw TypeError('Illegal end: Not an integer');
                      if (((i >>>= 0), e < 0 || e > i || i > this.buffer.byteLength))
                        throw RangeError(
                          'Illegal range: 0 <= ' + e + ' <= ' + i + ' <= ' + this.buffer.byteLength
                        );
                    }
                    if (e >= i) return this;
                    for (; e < i; ) this.view[e++] = t;
                    return r && (this.offset = e), this;
                  }),
                  (i.flip = function () {
                    return (this.limit = this.offset), (this.offset = 0), this;
                  }),
                  (i.mark = function (t) {
                    if (((t = void 0 === t ? this.offset : t), !this.noAssert)) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal offset: ' + t + ' (not an integer)');
                      if ((t >>>= 0) < 0 || t + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + t + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    return (this.markedOffset = t), this;
                  }),
                  (i.order = function (t) {
                    if (!this.noAssert && 'boolean' != typeof t)
                      throw TypeError('Illegal littleEndian: Not a boolean');
                    return (this.littleEndian = !!t), this;
                  }),
                  (i.LE = function (t) {
                    return (this.littleEndian = void 0 === t || !!t), this;
                  }),
                  (i.BE = function (t) {
                    return (this.littleEndian = void 0 !== t && !t), this;
                  }),
                  (i.prepend = function (t, i, r) {
                    ('number' != typeof i && 'string' == typeof i) || ((r = i), (i = void 0));
                    var n = void 0 === r;
                    if ((n && (r = this.offset), !this.noAssert)) {
                      if ('number' != typeof r || r % 1 != 0)
                        throw TypeError('Illegal offset: ' + r + ' (not an integer)');
                      if ((r >>>= 0) < 0 || r + 0 > this.buffer.byteLength)
                        throw RangeError(
                          'Illegal offset: 0 <= ' + r + ' (+0) <= ' + this.buffer.byteLength
                        );
                    }
                    t instanceof e || (t = e.wrap(t, i));
                    var s = t.limit - t.offset;
                    if (s <= 0) return this;
                    var o = s - r;
                    if (o > 0) {
                      var f = new ArrayBuffer(this.buffer.byteLength + o),
                        h = new Uint8Array(f);
                      h.set(this.view.subarray(r, this.buffer.byteLength), s),
                        (this.buffer = f),
                        (this.view = h),
                        (this.offset += o),
                        this.markedOffset >= 0 && (this.markedOffset += o),
                        (this.limit += o),
                        (r += o);
                    } else new Uint8Array(this.buffer);
                    return (
                      this.view.set(t.view.subarray(t.offset, t.limit), r - s),
                      (t.offset = t.limit),
                      n && (this.offset -= s),
                      this
                    );
                  }),
                  (i.prependTo = function (t, e) {
                    return t.prepend(this, e), this;
                  }),
                  (i.printDebug = function (t) {
                    'function' != typeof t && (t = console.log.bind(console)),
                      t(
                        this.toString() +
                          '\n-------------------------------------------------------------------\n' +
                          this.toDebug(!0)
                      );
                  }),
                  (i.remaining = function () {
                    return this.limit - this.offset;
                  }),
                  (i.reset = function () {
                    return (
                      this.markedOffset >= 0
                        ? ((this.offset = this.markedOffset), (this.markedOffset = -1))
                        : (this.offset = 0),
                      this
                    );
                  }),
                  (i.resize = function (t) {
                    if (!this.noAssert) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal capacity: ' + t + ' (not an integer)');
                      if ((t |= 0) < 0) throw RangeError('Illegal capacity: 0 <= ' + t);
                    }
                    if (this.buffer.byteLength < t) {
                      var e = new ArrayBuffer(t),
                        i = new Uint8Array(e);
                      i.set(this.view), (this.buffer = e), (this.view = i);
                    }
                    return this;
                  }),
                  (i.reverse = function (t, e) {
                    if (
                      (void 0 === t && (t = this.offset),
                      void 0 === e && (e = this.limit),
                      !this.noAssert)
                    ) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal begin: Not an integer');
                      if (((t >>>= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal end: Not an integer');
                      if (((e >>>= 0), t < 0 || t > e || e > this.buffer.byteLength))
                        throw RangeError(
                          'Illegal range: 0 <= ' + t + ' <= ' + e + ' <= ' + this.buffer.byteLength
                        );
                    }
                    return t === e || Array.prototype.reverse.call(this.view.subarray(t, e)), this;
                  }),
                  (i.skip = function (t) {
                    if (!this.noAssert) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal length: ' + t + ' (not an integer)');
                      t |= 0;
                    }
                    var e = this.offset + t;
                    if (!this.noAssert && (e < 0 || e > this.buffer.byteLength))
                      throw RangeError(
                        'Illegal length: 0 <= ' +
                          this.offset +
                          ' + ' +
                          t +
                          ' <= ' +
                          this.buffer.byteLength
                      );
                    return (this.offset = e), this;
                  }),
                  (i.slice = function (t, e) {
                    if (
                      (void 0 === t && (t = this.offset),
                      void 0 === e && (e = this.limit),
                      !this.noAssert)
                    ) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal begin: Not an integer');
                      if (((t >>>= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal end: Not an integer');
                      if (((e >>>= 0), t < 0 || t > e || e > this.buffer.byteLength))
                        throw RangeError(
                          'Illegal range: 0 <= ' + t + ' <= ' + e + ' <= ' + this.buffer.byteLength
                        );
                    }
                    var i = this.clone();
                    return (i.offset = t), (i.limit = e), i;
                  }),
                  (i.toBuffer = function (t) {
                    var e = this.offset,
                      i = this.limit;
                    if (!this.noAssert) {
                      if ('number' != typeof e || e % 1 != 0)
                        throw TypeError('Illegal offset: Not an integer');
                      if (((e >>>= 0), 'number' != typeof i || i % 1 != 0))
                        throw TypeError('Illegal limit: Not an integer');
                      if (((i >>>= 0), e < 0 || e > i || i > this.buffer.byteLength))
                        throw RangeError(
                          'Illegal range: 0 <= ' + e + ' <= ' + i + ' <= ' + this.buffer.byteLength
                        );
                    }
                    if (!t && 0 === e && i === this.buffer.byteLength) return this.buffer;
                    if (e === i) return r;
                    var n = new ArrayBuffer(i - e);
                    return new Uint8Array(n).set(new Uint8Array(this.buffer).subarray(e, i), 0), n;
                  }),
                  (i.toArrayBuffer = i.toBuffer),
                  (i.toString = function (t, e, i) {
                    if (void 0 === t)
                      return (
                        'ByteBufferAB(offset=' +
                        this.offset +
                        ',markedOffset=' +
                        this.markedOffset +
                        ',limit=' +
                        this.limit +
                        ',capacity=' +
                        this.capacity() +
                        ')'
                      );
                    switch (('number' == typeof t && (i = e = t = 'utf8'), t)) {
                      case 'utf8':
                        return this.toUTF8(e, i);
                      case 'base64':
                        return this.toBase64(e, i);
                      case 'hex':
                        return this.toHex(e, i);
                      case 'binary':
                        return this.toBinary(e, i);
                      case 'debug':
                        return this.toDebug();
                      case 'columns':
                        return this.toColumns();
                      default:
                        throw Error('Unsupported encoding: ' + t);
                    }
                  });
                var a = (function () {
                  for (
                    var t = {},
                      e = [
                        65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83,
                        84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106,
                        107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
                        122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 43, 47,
                      ],
                      i = [],
                      r = 0,
                      n = e.length;
                    r < n;
                    ++r
                  )
                    i[e[r]] = r;
                  return (
                    (t.encode = function (t, i) {
                      for (var r, n; null !== (r = t()); )
                        i(e[(r >> 2) & 63]),
                          (n = (3 & r) << 4),
                          null !== (r = t())
                            ? (i(e[63 & ((n |= (r >> 4) & 15) | ((r >> 4) & 15))]),
                              (n = (15 & r) << 2),
                              null !== (r = t())
                                ? (i(e[63 & (n | ((r >> 6) & 3))]), i(e[63 & r]))
                                : (i(e[63 & n]), i(61)))
                            : (i(e[63 & n]), i(61), i(61));
                    }),
                    (t.decode = function (t, e) {
                      var r, n, s;
                      function o(t) {
                        throw Error('Illegal character code: ' + t);
                      }
                      for (; null !== (r = t()); )
                        if (
                          (void 0 === (n = i[r]) && o(r),
                          null !== (r = t()) &&
                            (void 0 === (s = i[r]) && o(r),
                            e(((n << 2) >>> 0) | ((48 & s) >> 4)),
                            null !== (r = t())))
                        ) {
                          if (void 0 === (n = i[r])) {
                            if (61 === r) break;
                            o(r);
                          }
                          if ((e((((15 & s) << 4) >>> 0) | ((60 & n) >> 2)), null !== (r = t()))) {
                            if (void 0 === (s = i[r])) {
                              if (61 === r) break;
                              o(r);
                            }
                            e((((3 & n) << 6) >>> 0) | s);
                          }
                        }
                    }),
                    (t.test = function (t) {
                      return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
                        t
                      );
                    }),
                    t
                  );
                })();
                (i.toBase64 = function (t, e) {
                  if (
                    (void 0 === t && (t = this.offset),
                    void 0 === e && (e = this.limit),
                    (e |= 0),
                    (t |= 0) < 0 || e > this.capacity || t > e)
                  )
                    throw RangeError('begin, end');
                  var i;
                  return (
                    a.encode(
                      function () {
                        return t < e ? this.view[t++] : null;
                      }.bind(this),
                      (i = o())
                    ),
                    i()
                  );
                }),
                  (e.fromBase64 = function (t, i) {
                    if ('string' != typeof t) throw TypeError('str');
                    var r = new e((t.length / 4) * 3, i),
                      n = 0;
                    return (
                      a.decode(s(t), function (t) {
                        r.view[n++] = t;
                      }),
                      (r.limit = n),
                      r
                    );
                  }),
                  (e.btoa = function (t) {
                    return e.fromBinary(t).toBase64();
                  }),
                  (e.atob = function (t) {
                    return e.fromBase64(t).toBinary();
                  }),
                  (i.toBinary = function (t, e) {
                    if (
                      (void 0 === t && (t = this.offset),
                      void 0 === e && (e = this.limit),
                      (e |= 0),
                      (t |= 0) < 0 || e > this.capacity() || t > e)
                    )
                      throw RangeError('begin, end');
                    if (t === e) return '';
                    for (var i = [], r = []; t < e; )
                      i.push(this.view[t++]),
                        i.length >= 1024 &&
                          (r.push(String.fromCharCode.apply(String, i)), (i = []));
                    return r.join('') + String.fromCharCode.apply(String, i);
                  }),
                  (e.fromBinary = function (t, i) {
                    if ('string' != typeof t) throw TypeError('str');
                    for (var r, n = 0, s = t.length, o = new e(s, i); n < s; ) {
                      if ((r = t.charCodeAt(n)) > 255) throw RangeError('illegal char code: ' + r);
                      o.view[n++] = r;
                    }
                    return (o.limit = s), o;
                  }),
                  (i.toDebug = function (t) {
                    for (
                      var e, i = -1, r = this.buffer.byteLength, n = '', s = '', o = '';
                      i < r;

                    ) {
                      if (
                        (-1 !== i &&
                          ((n +=
                            (e = this.view[i]) < 16
                              ? '0' + e.toString(16).toUpperCase()
                              : e.toString(16).toUpperCase()),
                          t && (s += e > 32 && e < 127 ? String.fromCharCode(e) : '.')),
                        ++i,
                        t && i > 0 && i % 16 == 0 && i !== r)
                      ) {
                        for (; n.length < 51; ) n += ' ';
                        (o += n + s + '\n'), (n = s = '');
                      }
                      i === this.offset && i === this.limit
                        ? (n += i === this.markedOffset ? '!' : '|')
                        : i === this.offset
                        ? (n += i === this.markedOffset ? '[' : '<')
                        : i === this.limit
                        ? (n += i === this.markedOffset ? ']' : '>')
                        : (n +=
                            i === this.markedOffset ? "'" : t || (0 !== i && i !== r) ? ' ' : '');
                    }
                    if (t && ' ' !== n) {
                      for (; n.length < 51; ) n += ' ';
                      o += n + s + '\n';
                    }
                    return t ? o : n;
                  }),
                  (e.fromDebug = function (t, i, r) {
                    for (
                      var n,
                        s,
                        o = t.length,
                        f = new e(((o + 1) / 3) | 0, i, r),
                        h = 0,
                        a = 0,
                        u = !1,
                        l = !1,
                        g = !1,
                        w = !1,
                        b = !1;
                      h < o;

                    ) {
                      switch ((n = t.charAt(h++))) {
                        case '!':
                          if (!r) {
                            if (l || g || w) {
                              b = !0;
                              break;
                            }
                            l = g = w = !0;
                          }
                          (f.offset = f.markedOffset = f.limit = a), (u = !1);
                          break;
                        case '|':
                          if (!r) {
                            if (l || w) {
                              b = !0;
                              break;
                            }
                            l = w = !0;
                          }
                          (f.offset = f.limit = a), (u = !1);
                          break;
                        case '[':
                          if (!r) {
                            if (l || g) {
                              b = !0;
                              break;
                            }
                            l = g = !0;
                          }
                          (f.offset = f.markedOffset = a), (u = !1);
                          break;
                        case '<':
                          if (!r) {
                            if (l) {
                              b = !0;
                              break;
                            }
                            l = !0;
                          }
                          (f.offset = a), (u = !1);
                          break;
                        case ']':
                          if (!r) {
                            if (w || g) {
                              b = !0;
                              break;
                            }
                            w = g = !0;
                          }
                          (f.limit = f.markedOffset = a), (u = !1);
                          break;
                        case '>':
                          if (!r) {
                            if (w) {
                              b = !0;
                              break;
                            }
                            w = !0;
                          }
                          (f.limit = a), (u = !1);
                          break;
                        case "'":
                          if (!r) {
                            if (g) {
                              b = !0;
                              break;
                            }
                            g = !0;
                          }
                          (f.markedOffset = a), (u = !1);
                          break;
                        case ' ':
                          u = !1;
                          break;
                        default:
                          if (!r && u) {
                            b = !0;
                            break;
                          }
                          if (
                            ((s = parseInt(n + t.charAt(h++), 16)),
                            !r && (isNaN(s) || s < 0 || s > 255))
                          )
                            throw TypeError('Illegal str: Not a debug encoded string');
                          (f.view[a++] = s), (u = !0);
                      }
                      if (b) throw TypeError('Illegal str: Invalid symbol at ' + h);
                    }
                    if (!r) {
                      if (!l || !w) throw TypeError('Illegal str: Missing offset or limit');
                      if (a < f.buffer.byteLength)
                        throw TypeError(
                          'Illegal str: Not a debug encoded string (is it hex?) ' + a + ' < ' + o
                        );
                    }
                    return f;
                  }),
                  (i.toHex = function (t, e) {
                    if (
                      ((t = void 0 === t ? this.offset : t),
                      (e = void 0 === e ? this.limit : e),
                      !this.noAssert)
                    ) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal begin: Not an integer');
                      if (((t >>>= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal end: Not an integer');
                      if (((e >>>= 0), t < 0 || t > e || e > this.buffer.byteLength))
                        throw RangeError(
                          'Illegal range: 0 <= ' + t + ' <= ' + e + ' <= ' + this.buffer.byteLength
                        );
                    }
                    for (var i, r = new Array(e - t); t < e; )
                      (i = this.view[t++]) < 16
                        ? r.push('0', i.toString(16))
                        : r.push(i.toString(16));
                    return r.join('');
                  }),
                  (e.fromHex = function (t, i, r) {
                    if (!r) {
                      if ('string' != typeof t) throw TypeError('Illegal str: Not a string');
                      if (t.length % 2 != 0)
                        throw TypeError('Illegal str: Length not a multiple of 2');
                    }
                    for (
                      var n, s = t.length, o = new e((s / 2) | 0, i), f = 0, h = 0;
                      f < s;
                      f += 2
                    ) {
                      if (
                        ((n = parseInt(t.substring(f, f + 2), 16)),
                        !r && (!isFinite(n) || n < 0 || n > 255))
                      )
                        throw TypeError('Illegal str: Contains non-hex characters');
                      o.view[h++] = n;
                    }
                    return (o.limit = h), o;
                  });
                var u = (function () {
                  var t = {
                    MAX_CODEPOINT: 1114111,
                    encodeUTF8: function (t, e) {
                      var i = null;
                      for (
                        'number' == typeof t &&
                        ((i = t),
                        (t = function () {
                          return null;
                        }));
                        null !== i || null !== (i = t());

                      )
                        i < 128
                          ? e(127 & i)
                          : i < 2048
                          ? (e(((i >> 6) & 31) | 192), e((63 & i) | 128))
                          : i < 65536
                          ? (e(((i >> 12) & 15) | 224), e(((i >> 6) & 63) | 128), e((63 & i) | 128))
                          : (e(((i >> 18) & 7) | 240),
                            e(((i >> 12) & 63) | 128),
                            e(((i >> 6) & 63) | 128),
                            e((63 & i) | 128)),
                          (i = null);
                    },
                    decodeUTF8: function (t, e) {
                      for (
                        var i,
                          r,
                          n,
                          s,
                          o = function (t) {
                            t = t.slice(0, t.indexOf(null));
                            var e = Error(t.toString());
                            throw ((e.name = 'TruncatedError'), (e.bytes = t), e);
                          };
                        null !== (i = t());

                      )
                        if (0 == (128 & i)) e(i);
                        else if (192 == (224 & i))
                          null === (r = t()) && o([i, r]), e(((31 & i) << 6) | (63 & r));
                        else if (224 == (240 & i))
                          (null === (r = t()) || null === (n = t())) && o([i, r, n]),
                            e(((15 & i) << 12) | ((63 & r) << 6) | (63 & n));
                        else {
                          if (240 != (248 & i)) throw RangeError('Illegal starting byte: ' + i);
                          (null === (r = t()) || null === (n = t()) || null === (s = t())) &&
                            o([i, r, n, s]),
                            e(((7 & i) << 18) | ((63 & r) << 12) | ((63 & n) << 6) | (63 & s));
                        }
                    },
                    UTF16toUTF8: function (t, e) {
                      for (var i, r = null; null !== (i = null !== r ? r : t()); )
                        i >= 55296 && i <= 57343 && null !== (r = t()) && r >= 56320 && r <= 57343
                          ? (e(1024 * (i - 55296) + r - 56320 + 65536), (r = null))
                          : e(i);
                      null !== r && e(r);
                    },
                    UTF8toUTF16: function (t, e) {
                      var i = null;
                      for (
                        'number' == typeof t &&
                        ((i = t),
                        (t = function () {
                          return null;
                        }));
                        null !== i || null !== (i = t());

                      )
                        i <= 65535
                          ? e(i)
                          : (e(55296 + ((i -= 65536) >> 10)), e((i % 1024) + 56320)),
                          (i = null);
                    },
                    encodeUTF16toUTF8: function (e, i) {
                      t.UTF16toUTF8(e, function (e) {
                        t.encodeUTF8(e, i);
                      });
                    },
                    decodeUTF8toUTF16: function (e, i) {
                      t.decodeUTF8(e, function (e) {
                        t.UTF8toUTF16(e, i);
                      });
                    },
                    calculateCodePoint: function (t) {
                      return t < 128 ? 1 : t < 2048 ? 2 : t < 65536 ? 3 : 4;
                    },
                    calculateUTF8: function (t) {
                      for (var e, i = 0; null !== (e = t()); )
                        i += e < 128 ? 1 : e < 2048 ? 2 : e < 65536 ? 3 : 4;
                      return i;
                    },
                    calculateUTF16asUTF8: function (e) {
                      var i = 0,
                        r = 0;
                      return (
                        t.UTF16toUTF8(e, function (t) {
                          ++i, (r += t < 128 ? 1 : t < 2048 ? 2 : t < 65536 ? 3 : 4);
                        }),
                        [i, r]
                      );
                    },
                  };
                  return t;
                })();
                return (
                  (i.toUTF8 = function (t, e) {
                    if (
                      (void 0 === t && (t = this.offset),
                      void 0 === e && (e = this.limit),
                      !this.noAssert)
                    ) {
                      if ('number' != typeof t || t % 1 != 0)
                        throw TypeError('Illegal begin: Not an integer');
                      if (((t >>>= 0), 'number' != typeof e || e % 1 != 0))
                        throw TypeError('Illegal end: Not an integer');
                      if (((e >>>= 0), t < 0 || t > e || e > this.buffer.byteLength))
                        throw RangeError(
                          'Illegal range: 0 <= ' + t + ' <= ' + e + ' <= ' + this.buffer.byteLength
                        );
                    }
                    var i;
                    try {
                      u.decodeUTF8toUTF16(
                        function () {
                          return t < e ? this.view[t++] : null;
                        }.bind(this),
                        (i = o())
                      );
                    } catch (i) {
                      if (t !== e)
                        throw RangeError('Illegal range: Truncated data, ' + t + ' != ' + e);
                    }
                    return i();
                  }),
                  (e.fromUTF8 = function (t, i, r) {
                    if (!r && 'string' != typeof t) throw TypeError('Illegal str: Not a string');
                    var n = new e(u.calculateUTF16asUTF8(s(t), !0)[1], i, r),
                      o = 0;
                    return (
                      u.encodeUTF16toUTF8(s(t), function (t) {
                        n.view[o++] = t;
                      }),
                      (n.limit = o),
                      n
                    );
                  }),
                  e
                );
              })
                ? r.apply(e, n)
                : r) || (t.exports = s);
      },
      514: function (t, e) {
        var i, r;
        void 0 ===
          (r =
            'function' ==
            typeof (i = function () {
              'use strict';
              function t(t, e, i) {
                (this.low = 0 | t), (this.high = 0 | e), (this.unsigned = !!i);
              }
              function e(t) {
                return !0 === (t && t.__isLong__);
              }
              t.prototype.__isLong__,
                Object.defineProperty(t.prototype, '__isLong__', {
                  value: !0,
                  enumerable: !1,
                  configurable: !1,
                }),
                (t.isLong = e);
              var i = {},
                r = {};
              function n(t, e) {
                var n, s, f;
                return e
                  ? (f = 0 <= (t >>>= 0) && t < 256) && (s = r[t])
                    ? s
                    : ((n = o(t, (0 | t) < 0 ? -1 : 0, !0)), f && (r[t] = n), n)
                  : (f = -128 <= (t |= 0) && t < 128) && (s = i[t])
                  ? s
                  : ((n = o(t, t < 0 ? -1 : 0, !1)), f && (i[t] = n), n);
              }
              function s(t, e) {
                if (isNaN(t) || !isFinite(t)) return e ? v : b;
                if (e) {
                  if (t < 0) return v;
                  if (t >= l) return m;
                } else {
                  if (t <= -g) return E;
                  if (t + 1 >= g) return p;
                }
                return t < 0 ? s(-t, e).neg() : o(t % u | 0, (t / u) | 0, e);
              }
              function o(e, i, r) {
                return new t(e, i, r);
              }
              (t.fromInt = n), (t.fromNumber = s), (t.fromBits = o);
              var f = Math.pow;
              function h(t, e, i) {
                if (0 === t.length) throw Error('empty string');
                if ('NaN' === t || 'Infinity' === t || '+Infinity' === t || '-Infinity' === t)
                  return b;
                if (
                  ('number' == typeof e ? ((i = e), (e = !1)) : (e = !!e),
                  (i = i || 10) < 2 || 36 < i)
                )
                  throw RangeError('radix');
                var r;
                if ((r = t.indexOf('-')) > 0) throw Error('interior hyphen');
                if (0 === r) return h(t.substring(1), e, i).neg();
                for (var n = s(f(i, 8)), o = b, a = 0; a < t.length; a += 8) {
                  var u = Math.min(8, t.length - a),
                    l = parseInt(t.substring(a, a + u), i);
                  if (u < 8) {
                    var g = s(f(i, u));
                    o = o.mul(g).add(s(l));
                  } else o = (o = o.mul(n)).add(s(l));
                }
                return (o.unsigned = e), o;
              }
              function a(e) {
                return e instanceof t
                  ? e
                  : 'number' == typeof e
                  ? s(e)
                  : 'string' == typeof e
                  ? h(e)
                  : o(e.low, e.high, e.unsigned);
              }
              (t.fromString = h), (t.fromValue = a);
              var u = 4294967296,
                l = u * u,
                g = l / 2,
                w = n(1 << 24),
                b = n(0);
              t.ZERO = b;
              var v = n(0, !0);
              t.UZERO = v;
              var c = n(1);
              t.ONE = c;
              var y = n(1, !0);
              t.UONE = y;
              var d = n(-1);
              t.NEG_ONE = d;
              var p = o(-1, 2147483647, !1);
              t.MAX_VALUE = p;
              var m = o(-1, -1, !0);
              t.MAX_UNSIGNED_VALUE = m;
              var E = o(0, -2147483648, !1);
              t.MIN_VALUE = E;
              var I = t.prototype;
              return (
                (I.toInt = function () {
                  return this.unsigned ? this.low >>> 0 : this.low;
                }),
                (I.toNumber = function () {
                  return this.unsigned
                    ? (this.high >>> 0) * u + (this.low >>> 0)
                    : this.high * u + (this.low >>> 0);
                }),
                (I.toString = function (t) {
                  if ((t = t || 10) < 2 || 36 < t) throw RangeError('radix');
                  if (this.isZero()) return '0';
                  if (this.isNegative()) {
                    if (this.eq(E)) {
                      var e = s(t),
                        i = this.div(e),
                        r = i.mul(e).sub(this);
                      return i.toString(t) + r.toInt().toString(t);
                    }
                    return '-' + this.neg().toString(t);
                  }
                  for (var n = s(f(t, 6), this.unsigned), o = this, h = ''; ; ) {
                    var a = o.div(n),
                      u = (o.sub(a.mul(n)).toInt() >>> 0).toString(t);
                    if ((o = a).isZero()) return u + h;
                    for (; u.length < 6; ) u = '0' + u;
                    h = '' + u + h;
                  }
                }),
                (I.getHighBits = function () {
                  return this.high;
                }),
                (I.getHighBitsUnsigned = function () {
                  return this.high >>> 0;
                }),
                (I.getLowBits = function () {
                  return this.low;
                }),
                (I.getLowBitsUnsigned = function () {
                  return this.low >>> 0;
                }),
                (I.getNumBitsAbs = function () {
                  if (this.isNegative()) return this.eq(E) ? 64 : this.neg().getNumBitsAbs();
                  for (
                    var t = 0 != this.high ? this.high : this.low, e = 31;
                    e > 0 && 0 == (t & (1 << e));
                    e--
                  );
                  return 0 != this.high ? e + 33 : e + 1;
                }),
                (I.isZero = function () {
                  return 0 === this.high && 0 === this.low;
                }),
                (I.isNegative = function () {
                  return !this.unsigned && this.high < 0;
                }),
                (I.isPositive = function () {
                  return this.unsigned || this.high >= 0;
                }),
                (I.isOdd = function () {
                  return 1 == (1 & this.low);
                }),
                (I.isEven = function () {
                  return 0 == (1 & this.low);
                }),
                (I.equals = function (t) {
                  return (
                    e(t) || (t = a(t)),
                    (this.unsigned === t.unsigned || this.high >>> 31 != 1 || t.high >>> 31 != 1) &&
                      this.high === t.high &&
                      this.low === t.low
                  );
                }),
                (I.eq = I.equals),
                (I.notEquals = function (t) {
                  return !this.eq(t);
                }),
                (I.neq = I.notEquals),
                (I.lessThan = function (t) {
                  return this.comp(t) < 0;
                }),
                (I.lt = I.lessThan),
                (I.lessThanOrEqual = function (t) {
                  return this.comp(t) <= 0;
                }),
                (I.lte = I.lessThanOrEqual),
                (I.greaterThan = function (t) {
                  return this.comp(t) > 0;
                }),
                (I.gt = I.greaterThan),
                (I.greaterThanOrEqual = function (t) {
                  return this.comp(t) >= 0;
                }),
                (I.gte = I.greaterThanOrEqual),
                (I.compare = function (t) {
                  if ((e(t) || (t = a(t)), this.eq(t))) return 0;
                  var i = this.isNegative(),
                    r = t.isNegative();
                  return i && !r
                    ? -1
                    : !i && r
                    ? 1
                    : this.unsigned
                    ? t.high >>> 0 > this.high >>> 0 ||
                      (t.high === this.high && t.low >>> 0 > this.low >>> 0)
                      ? -1
                      : 1
                    : this.sub(t).isNegative()
                    ? -1
                    : 1;
                }),
                (I.comp = I.compare),
                (I.negate = function () {
                  return !this.unsigned && this.eq(E) ? E : this.not().add(c);
                }),
                (I.neg = I.negate),
                (I.add = function (t) {
                  e(t) || (t = a(t));
                  var i = this.high >>> 16,
                    r = 65535 & this.high,
                    n = this.low >>> 16,
                    s = 65535 & this.low,
                    f = t.high >>> 16,
                    h = 65535 & t.high,
                    u = t.low >>> 16,
                    l = 0,
                    g = 0,
                    w = 0,
                    b = 0;
                  return (
                    (w += (b += s + (65535 & t.low)) >>> 16),
                    (g += (w += n + u) >>> 16),
                    (l += (g += r + h) >>> 16),
                    (l += i + f),
                    o(
                      ((w &= 65535) << 16) | (b &= 65535),
                      ((l &= 65535) << 16) | (g &= 65535),
                      this.unsigned
                    )
                  );
                }),
                (I.subtract = function (t) {
                  return e(t) || (t = a(t)), this.add(t.neg());
                }),
                (I.sub = I.subtract),
                (I.multiply = function (t) {
                  if (this.isZero()) return b;
                  if ((e(t) || (t = a(t)), t.isZero())) return b;
                  if (this.eq(E)) return t.isOdd() ? E : b;
                  if (t.eq(E)) return this.isOdd() ? E : b;
                  if (this.isNegative())
                    return t.isNegative() ? this.neg().mul(t.neg()) : this.neg().mul(t).neg();
                  if (t.isNegative()) return this.mul(t.neg()).neg();
                  if (this.lt(w) && t.lt(w))
                    return s(this.toNumber() * t.toNumber(), this.unsigned);
                  var i = this.high >>> 16,
                    r = 65535 & this.high,
                    n = this.low >>> 16,
                    f = 65535 & this.low,
                    h = t.high >>> 16,
                    u = 65535 & t.high,
                    l = t.low >>> 16,
                    g = 65535 & t.low,
                    v = 0,
                    c = 0,
                    y = 0,
                    d = 0;
                  return (
                    (y += (d += f * g) >>> 16),
                    (c += (y += n * g) >>> 16),
                    (y &= 65535),
                    (c += (y += f * l) >>> 16),
                    (v += (c += r * g) >>> 16),
                    (c &= 65535),
                    (v += (c += n * l) >>> 16),
                    (c &= 65535),
                    (v += (c += f * u) >>> 16),
                    (v += i * g + r * l + n * u + f * h),
                    o(
                      ((y &= 65535) << 16) | (d &= 65535),
                      ((v &= 65535) << 16) | (c &= 65535),
                      this.unsigned
                    )
                  );
                }),
                (I.mul = I.multiply),
                (I.divide = function (t) {
                  if ((e(t) || (t = a(t)), t.isZero())) throw Error('division by zero');
                  if (this.isZero()) return this.unsigned ? v : b;
                  var i, r, n;
                  if (this.unsigned) {
                    if ((t.unsigned || (t = t.toUnsigned()), t.gt(this))) return v;
                    if (t.gt(this.shru(1))) return y;
                    n = v;
                  } else {
                    if (this.eq(E))
                      return t.eq(c) || t.eq(d)
                        ? E
                        : t.eq(E)
                        ? c
                        : (i = this.shr(1).div(t).shl(1)).eq(b)
                        ? t.isNegative()
                          ? c
                          : d
                        : ((r = this.sub(t.mul(i))), (n = i.add(r.div(t))));
                    if (t.eq(E)) return this.unsigned ? v : b;
                    if (this.isNegative())
                      return t.isNegative() ? this.neg().div(t.neg()) : this.neg().div(t).neg();
                    if (t.isNegative()) return this.div(t.neg()).neg();
                    n = b;
                  }
                  for (r = this; r.gte(t); ) {
                    i = Math.max(1, Math.floor(r.toNumber() / t.toNumber()));
                    for (
                      var o = Math.ceil(Math.log(i) / Math.LN2),
                        h = o <= 48 ? 1 : f(2, o - 48),
                        u = s(i),
                        l = u.mul(t);
                      l.isNegative() || l.gt(r);

                    )
                      l = (u = s((i -= h), this.unsigned)).mul(t);
                    u.isZero() && (u = c), (n = n.add(u)), (r = r.sub(l));
                  }
                  return n;
                }),
                (I.div = I.divide),
                (I.modulo = function (t) {
                  return e(t) || (t = a(t)), this.sub(this.div(t).mul(t));
                }),
                (I.mod = I.modulo),
                (I.not = function () {
                  return o(~this.low, ~this.high, this.unsigned);
                }),
                (I.and = function (t) {
                  return e(t) || (t = a(t)), o(this.low & t.low, this.high & t.high, this.unsigned);
                }),
                (I.or = function (t) {
                  return e(t) || (t = a(t)), o(this.low | t.low, this.high | t.high, this.unsigned);
                }),
                (I.xor = function (t) {
                  return e(t) || (t = a(t)), o(this.low ^ t.low, this.high ^ t.high, this.unsigned);
                }),
                (I.shiftLeft = function (t) {
                  return (
                    e(t) && (t = t.toInt()),
                    0 == (t &= 63)
                      ? this
                      : t < 32
                      ? o(this.low << t, (this.high << t) | (this.low >>> (32 - t)), this.unsigned)
                      : o(0, this.low << (t - 32), this.unsigned)
                  );
                }),
                (I.shl = I.shiftLeft),
                (I.shiftRight = function (t) {
                  return (
                    e(t) && (t = t.toInt()),
                    0 == (t &= 63)
                      ? this
                      : t < 32
                      ? o((this.low >>> t) | (this.high << (32 - t)), this.high >> t, this.unsigned)
                      : o(this.high >> (t - 32), this.high >= 0 ? 0 : -1, this.unsigned)
                  );
                }),
                (I.shr = I.shiftRight),
                (I.shiftRightUnsigned = function (t) {
                  if ((e(t) && (t = t.toInt()), 0 == (t &= 63))) return this;
                  var i = this.high;
                  return t < 32
                    ? o((this.low >>> t) | (i << (32 - t)), i >>> t, this.unsigned)
                    : o(32 === t ? i : i >>> (t - 32), 0, this.unsigned);
                }),
                (I.shru = I.shiftRightUnsigned),
                (I.toSigned = function () {
                  return this.unsigned ? o(this.low, this.high, !1) : this;
                }),
                (I.toUnsigned = function () {
                  return this.unsigned ? this : o(this.low, this.high, !0);
                }),
                (I.toBytes = function (t) {
                  return t ? this.toBytesLE() : this.toBytesBE();
                }),
                (I.toBytesLE = function () {
                  var t = this.high,
                    e = this.low;
                  return [
                    255 & e,
                    (e >>> 8) & 255,
                    (e >>> 16) & 255,
                    (e >>> 24) & 255,
                    255 & t,
                    (t >>> 8) & 255,
                    (t >>> 16) & 255,
                    (t >>> 24) & 255,
                  ];
                }),
                (I.toBytesBE = function () {
                  var t = this.high,
                    e = this.low;
                  return [
                    (t >>> 24) & 255,
                    (t >>> 16) & 255,
                    (t >>> 8) & 255,
                    255 & t,
                    (e >>> 24) & 255,
                    (e >>> 16) & 255,
                    (e >>> 8) & 255,
                    255 & e,
                  ];
                }),
                t
              );
            })
              ? i.apply(e, [])
              : i) || (t.exports = r);
      },
      66: function (t, e, i) {
        'use strict';
        var r =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule ? t : { default: t };
          };
        Object.defineProperty(e, '__esModule', { value: !0 }),
          (e.deserializeByteBuffer =
            e.deserializeWireMessage =
            e.deserializeBlob =
            e.makeBusMessageFromBuffer =
            e.makeBusMessageFromJsonObject =
            e.BusMessageType =
            e.BusMessage =
              void 0);
        const n = r(i(779));
        class s extends n.default {}
        var o;
        (e.BusMessage = s),
          (function (t) {
            (t[(t.BUS_MESSAGE_TYPES_BEGIN = 100)] = 'BUS_MESSAGE_TYPES_BEGIN'),
              (t[(t.Json = 101)] = 'Json'),
              (t[(t.Buffer = 102)] = 'Buffer'),
              (t[(t.BUS_MESSAGE_TYPES_END = 103)] = 'BUS_MESSAGE_TYPES_END');
          })((o = e.BusMessageType || (e.BusMessageType = {}))),
          (e.makeBusMessageFromJsonObject = (t, e) =>
            new n.default().writeUint32(o.Json).writeIString(t).writeIString(JSON.stringify(e))),
          (e.makeBusMessageFromBuffer = (t, e) =>
            new n.default().writeUint32(o.Buffer).writeIString(t).append(e)),
          (e.deserializeBlob = async (t) => {
            const i = await t.arrayBuffer(),
              r = new n.default(i.byteLength);
            return (
              new Uint8Array(i).forEach((t) => {
                r.writeUint8(t);
              }),
              r.flip(),
              (0, e.deserializeByteBuffer)(r)
            );
          }),
          (e.deserializeWireMessage = (t) => {
            if (t instanceof ArrayBuffer) {
              const i = new n.default(t.byteLength);
              return (
                new Uint8Array(t).forEach((t) => {
                  i.writeUint8(t);
                }),
                i.flip(),
                (0, e.deserializeByteBuffer)(i)
              );
            }
            {
              const i = new n.default(t.byteLength);
              return (i.buffer = t), (0, e.deserializeByteBuffer)(i);
            }
          }),
          (e.deserializeByteBuffer = (t) => {
            const e = t.readInt32();
            if (e <= o.BUS_MESSAGE_TYPES_BEGIN || e >= o.BUS_MESSAGE_TYPES_END)
              throw `unknown busMessageType ${e}: ${t}`;
            const i = t.readIString();
            let r;
            switch (e) {
              case o.Json:
                r = JSON.parse(t.readIString());
                break;
              case o.Buffer:
                r = t.buffer.slice(t.offset);
            }
            return { channel: i, busMessageType: e, contents: r };
          });
      },
      847: function (t, e, i) {
        'use strict';
        var r =
            (this && this.__awaiter) ||
            function (t, e, i, r) {
              return new (i || (i = Promise))(function (n, s) {
                function o(t) {
                  try {
                    h(r.next(t));
                  } catch (t) {
                    s(t);
                  }
                }
                function f(t) {
                  try {
                    h(r.throw(t));
                  } catch (t) {
                    s(t);
                  }
                }
                function h(t) {
                  var e;
                  t.done
                    ? n(t.value)
                    : ((e = t.value),
                      e instanceof i
                        ? e
                        : new i(function (t) {
                            t(e);
                          })).then(o, f);
                }
                h((r = r.apply(t, e || [])).next());
              });
            },
          n =
            (this && this.__generator) ||
            function (t, e) {
              var i,
                r,
                n,
                s,
                o = {
                  label: 0,
                  sent: function () {
                    if (1 & n[0]) throw n[1];
                    return n[1];
                  },
                  trys: [],
                  ops: [],
                };
              return (
                (s = { next: f(0), throw: f(1), return: f(2) }),
                'function' == typeof Symbol &&
                  (s[Symbol.iterator] = function () {
                    return this;
                  }),
                s
              );
              function f(s) {
                return function (f) {
                  return (function (s) {
                    if (i) throw new TypeError('Generator is already executing.');
                    for (; o; )
                      try {
                        if (
                          ((i = 1),
                          r &&
                            (n =
                              2 & s[0]
                                ? r.return
                                : s[0]
                                ? r.throw || ((n = r.return) && n.call(r), 0)
                                : r.next) &&
                            !(n = n.call(r, s[1])).done)
                        )
                          return n;
                        switch (((r = 0), n && (s = [2 & s[0], n.value]), s[0])) {
                          case 0:
                          case 1:
                            n = s;
                            break;
                          case 4:
                            return o.label++, { value: s[1], done: !1 };
                          case 5:
                            o.label++, (r = s[1]), (s = [0]);
                            continue;
                          case 7:
                            (s = o.ops.pop()), o.trys.pop();
                            continue;
                          default:
                            if (
                              !(
                                (n = (n = o.trys).length > 0 && n[n.length - 1]) ||
                                (6 !== s[0] && 2 !== s[0])
                              )
                            ) {
                              o = 0;
                              continue;
                            }
                            if (3 === s[0] && (!n || (s[1] > n[0] && s[1] < n[3]))) {
                              o.label = s[1];
                              break;
                            }
                            if (6 === s[0] && o.label < n[1]) {
                              (o.label = n[1]), (n = s);
                              break;
                            }
                            if (n && o.label < n[2]) {
                              (o.label = n[2]), o.ops.push(s);
                              break;
                            }
                            n[2] && o.ops.pop(), o.trys.pop();
                            continue;
                        }
                        s = e.call(t, o);
                      } catch (t) {
                        (s = [6, t]), (r = 0);
                      } finally {
                        i = n = 0;
                      }
                    if (5 & s[0]) throw s[1];
                    return { value: s[0] ? s[1] : void 0, done: !0 };
                  })([s, f]);
                };
              }
            };
        Object.defineProperty(e, '__esModule', { value: !0 });
        var s,
          o = i(66);
        !(function (t) {
          var e = (function () {
            function t() {
              var t = this;
              (this.messageBuffer = []),
                console.log('SandboxClient constructor'),
                (this.listeners = new Map()),
                (this.subscriptions = new Map()),
                (this.subscribe = this.subscribe.bind(this)),
                addEventListener('message', function (e) {
                  return r(t, void 0, void 0, function () {
                    var t,
                      i,
                      r,
                      s,
                      f,
                      h,
                      a = this;
                    return n(this, function (n) {
                      switch (n.label) {
                        case 0:
                          return (
                            n.trys.push([0, 4, , 5]),
                            'undefined' != typeof Blob && e.data instanceof Blob
                              ? [4, o.deserializeBlob(e.data)]
                              : [3, 2]
                          );
                        case 1:
                          return (s = n.sent()), [3, 3];
                        case 2:
                          (s = o.deserializeWireMessage(e.data)), (n.label = 3);
                        case 3:
                          return (
                            (i = (t = s).channel),
                            (r = t.contents),
                            '_command' === i &&
                              'reload' === r.command &&
                              (console.log('reloading sandbox'), window.location.reload()),
                            this.sendMessageToParent ||
                              (this.sendMessageToParent = function (t) {
                                e.source.postMessage(t.buffer, e.origin, [t.buffer]);
                              }),
                            this.messageBuffer.forEach(function (t) {
                              a.sendMessageToParent(t);
                            }),
                            (this.messageBuffer = []),
                            console.log('sandbox-client message from parent'),
                            null === (h = this.subscriptions.get(i)) ||
                              void 0 === h ||
                              h.forEach(function (t) {
                                t(r);
                              }),
                            [3, 5]
                          );
                        case 4:
                          return (
                            (f = n.sent()), console.error('sandox-client message error', f), [3, 5]
                          );
                        case 5:
                          return [2];
                      }
                    });
                  });
                });
            }
            return (
              (t.prototype.bufferedSendToParent = function (t) {
                this.sendMessageToParent
                  ? this.sendMessageToParent(t)
                  : (console.log('adding to messageBuffer, length:', this.messageBuffer.length),
                    this.messageBuffer.push(t));
              }),
              (t.prototype.send = function (t, e) {
                console.log('sandbox-client send', t, e),
                  this.bufferedSendToParent(o.makeBusMessageFromJsonObject(t, e));
              }),
              (t.prototype.subscribe = function (t, e) {
                console.log('sandbox-client subscribe', t),
                  this.subscriptions.get(t) || this.subscriptions.set(t, []),
                  this.subscriptions.get(t).push(e),
                  this.bufferedSendToParent(
                    o.makeBusMessageFromJsonObject('_command', { command: 'subscribe', channel: t })
                  );
              }),
              (t.prototype.addListener = function (t, e) {
                this.listeners.get(t) || this.listeners.set(t, []), this.listeners.get(t).push(e);
              }),
              t
            );
          })();
          t.SandboxClient = e;
        })(s || (s = {})),
          (window.Nstrumenta = s),
          window.initNstrumenta();
      },
    },
    e = {};
  !(function i(r) {
    if (e[r]) return e[r].exports;
    var n = (e[r] = { exports: {} });
    return t[r].call(n.exports, n, n.exports, i), n.exports;
  })(847);
})();
