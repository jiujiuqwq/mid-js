function MidiFile(data) {
  function readChunk(stream) {
    var id = stream.read(4);
    var length = stream.readInt32();
    return {
      'id': id,
      'length': length,
      'data': stream.read(length)
    };
  }
  let stream = new Stream(data)
  let headerChunk = readChunk(stream);
  // console.log(headerChunk);
  if (headerChunk.id != '4d546864' || headerChunk.length != 6) {
    throw "bug midi文件没有头";
  }
  let headerStream = new Stream(headerChunk.data);
  let formatType = headerStream.readInt16();
  let trackCount = headerStream.readInt16();
  let timeDivision = headerStream.readInt16();
  let ticksPerBeat;
  if (timeDivision & 0x8000) {
    throw "目前还不支持时分秒";
  } else {
    ticksPerBeat = timeDivision;
  }
  let header = {
    'formatType': formatType,//格式
    'trackCount': trackCount,//轨道数
    'ticksPerBeat': ticksPerBeat//基本时间
  }
  var tracks = [];
  for (var i = 0; i < header.trackCount; i++) {
    tracks[i] = [];
    var trackChunk = readChunk(stream);
    if (trackChunk.id != '4d54726b') {
      throw "不支持的块" + trackChunk.id;
    }
    var trackStream = new Stream(trackChunk.data);
    while (!trackStream.eof()) {
      var event = readEvent(trackStream);
      tracks[i].push(event);
      // console.log(event);
    }
  }
  var lastEventTypeByte;
  let tickTime;
  let keySignature;
  function readEvent(stream) {
    var event = {};
    event.deltaTime = stream.readVarInt();
    var eventTypeByte = stream.readInt8();
    if ((eventTypeByte & 0xf0) == 0xf0) {
      if (eventTypeByte == 0xff) {
        event.type = 'meta';
        var subtypeByte = stream.readInt8();
        var length = stream.readVarInt();
        switch (subtypeByte) {
          case 0x00:
            event.subtype = 'sequenceNumber';
            if (length != 2) throw "Expected length for sequenceNumber event is 2, got " + length;
            event.number = stream.readInt16();
            return event;
          case 0x01:
            event.subtype = '备注';
            event.text = stream.hex2int(stream.read(length));
            return event;
          case 0x02:
            event.subtype = '歌曲版权';
            event.text = stream.hex2int(stream.read(length));
            return event;
          case 0x03:
            event.subtype = '音轨名称';
            event.text = stream.hex2int(stream.read(length));
            return event;
          case 0x04:
            event.subtype = '乐器名称';
            event.text = stream.hex2int(stream.read(length));
            return event;
          case 0x05:
            event.subtype = '歌词';
            event.text = stream.hex2int(stream.read(length));
            return event;
          case 0x06:
            event.subtype = 'marker';
            event.text = stream.hex2int(stream.read(length));
            return event;
          case 0x07:
            event.subtype = 'cuePoint';
            event.text = stream.hex2int(stream.read(length));
            return event;
          case 0x20:
            event.subtype = 'midiChannelPrefix';
            if (length != 1) throw "Expected length for midiChannelPrefix event is 1, got " + length;
            event.channel = stream.readInt8();
            return event;
          case 0x2f:
            event.subtype = '音轨结束标记';
            if (length != 0) throw "Expected length for endOfTrack event is 0, got " + length;
            return event;
          case 0x51:
            event.subtype = '速度';
            if (length != 3) throw "速度一般3节: " + length;
            event.microsecondsPerBeat = stream.hex2int(stream.read(3));
            tickTime = event.microsecondsPerBeat;
            return event;
          case 0x54:
            event.subtype = 'smpteOffset';
            if (length != 5) throw "Expected length for smpteOffset event is 5, got " + length;
            var hourByte = stream.readInt8();
            event.frameRate = {
              0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30
            }[hourByte & 0x60];
            event.hour = hourByte & 0x1f;
            event.min = stream.readInt8();
            event.sec = stream.readInt8();
            event.frame = stream.readInt8();
            event.subframe = stream.readInt8();
            return event;
          case 0x58:
            event.subtype = '节拍';
            if (length != 4) throw "节拍一般有四节: " + length;
            event.numerator = stream.readInt8();
            event.denominator = Math.pow(2, stream.readInt8());
            event.metronome = stream.readInt8();
            event.thirtyseconds = stream.readInt8();
            return event;
          case 0x59:
            keySignature = new Array();
            event.subtype = '调号';
            if (length != 2) throw "调号一般两节: " + length;
            event.key = stream.readInt8(true);
            event.scale = stream.readInt8();
            keySignature.push(event.key);
            keySignature.push(event.scale);
            // console.log(keySignature)
            return event;
          case 0x7f:
            event.subtype = '音序特定信息';
            event.data = stream.read(length);
            return event;
          default:
            event.subtype = '不明'
            event.data = stream.read(length);
            return event;
        }
        event.data = stream.read(length);
        return event;
      } else if (eventTypeByte == 0xf0) {
        event.type = '系统码头';
        var length = stream.readVarInt();
        event.data = stream.read(length);
        return event;
      } else if (eventTypeByte == 0xf7) {
        event.type = '系统码尾';
        var length = stream.readVarInt();
        event.data = stream.read(length);
        return event;
      } else {
        throw "Unrecognised MIDI event type byte: " + eventTypeByte;
      }
    } else {
      var param1;
      if ((eventTypeByte & 0x80) == 0) {
        param1 = eventTypeByte;
        eventTypeByte = lastEventTypeByte;
      } else {
        param1 = stream.readInt8();
        lastEventTypeByte = eventTypeByte;
      }
      var eventType = eventTypeByte >> 4;
      event.channel = eventTypeByte & 0x0f;
      event.type = 'channel';
      switch (eventType) {
        case 0x08:
          event.subtype = 'noteOff';
          event.noteNumber = param1;
          event.velocity = stream.readInt8();
          return event;
        case 0x09:
          event.noteNumber = param1;
          event.velocity = stream.readInt8();
          if (event.velocity == 0) {
            event.subtype = 'noteOff';
          } else {
            event.subtype = 'noteOn';
          }
          return event;
        case 0x0a:
          event.subtype = 'noteAftertouch';
          event.noteNumber = param1;
          event.amount = stream.readInt8();
          return event;
        case 0x0b:
          event.subtype = 'controller';
          event.controllerType = param1;
          event.value = stream.readInt8();
          return event;
        case 0x0c:
          event.subtype = 'programChange';
          event.programNumber = param1;
          return event;
        case 0x0d:
          event.subtype = 'channelAftertouch';
          event.amount = param1;
          return event;
        case 0x0e:
          event.subtype = 'pitchBend';
          event.value = param1 + (stream.readInt8() << 7);
          return event;
        default:
          throw "Unrecognised MIDI event type: " + eventType
      }
    }
  }
  function Stream(arr) {
    this.arr = arr;
    this.position = 0;
    this.eof = function () {
      return this.position >= this.arr.length - 1;
    }
    this.read = function (length) {
      length *= 2;
      var result = this.arr.substr(this.position, length);
      this.position += length;
      return result;
    }
    this.readInt8 = function (signed) {
      return this.hex2int(this.read(1));
    }
    this.readInt16 = function (signed) {
      return this.hex2int(this.read(2));
    }
    this.readInt32 = function (signed) {
      return this.hex2int(this.read(4));
    }
    this.hex2int = function (hex) {
      var len = hex.length, a = new Array(len), code;
      for (var i = 0; i < len; i++) {
        code = hex.charCodeAt(i);
        if (48 <= code && code < 58) {
          code -= 48;
        } else {
          code = (code & 0xdf) - 65 + 10;
        }
        a[i] = code;
      }
      return a.reduce(function (acc, c) {
        acc = 16 * acc + c;
        return acc;
      }, 0);
    }
    this.readVarInt = function () {
      var result = 0;
      let arr = new Array;
      let isTrue = true;
      while (isTrue) {
        let b = this.readInt8();
        if (b & 0x80) {
          arr.unshift(b - 128);
          isTrue = true;
        } else {
          arr.unshift(b);
          isTrue = false;
        }
      }
      for (let index in arr) {
        result += (Math.pow(128, index) * arr[index]);
      }
      return result;
    }
  }
  return { tracks: tracks, ticksPerBeat: header.ticksPerBeat, tickTime: tickTime, keySignature: keySignature };
}

// MidiFile
module.exports= MidiFile;