let MidiFile = require('./MidiFile.js');//记得迁移出去
//拿代码请标明出处"玖酒"

function integration(data, Xbi, Ybi, window, ability) {
  this.Xbi = Xbi;
  this.Ybi = Ybi;
  let window = window;
  let data = data;
  /**
   *私有变量
   *音符元数据，mid解析完成返回的数据对象
   */
  this.tdTime = data.tickTime / data.ticksPerBeat;
  /**
   * 私有变量
   * 一个tick时间
   */
  this.ability = (function (window, ability) {
    function abilityF(window) {
      this.stop = function (window) { };
      this.progressBar = function (window) { };
    }
    let abilityU = new abilityF(window);
    if (!ability) {
      return abilityU;
    }
    if (ability.stop) {
      abilityU.stop = ability.stop;
    }
    if (ability.progressBar) {
      abilityU.progressBar = ability.progressBar;
    }
    console.log(abilityU)
    return abilityU;
  })(window, ability)
  /**
   * 脚本运行时悬浮窗控制对象
   * 格式:
   * {
   *    stop:[函数类型]乐曲播放结束后控制函数
   *    progressBar:[函数类型]进度条控制函数
   * }
   */
  this.keySignature = (function (data) {
    let keySignature = data.keySignature ? data.keySignature[0] : 0;
    switch (parseInt(keySignature)) {
      case 0:
        keySignature = 0;
        break;
      case 1:
        keySignature = 7;
        break;
      case 2:
        keySignature = 2;
        break;
      case 3:
        keySignature = 9;
        break;
      case 4:
        keySignature = 4;
        break;
      case 5:
        keySignature = 11;
        break;
      case 6:
        keySignature = 6;
        break;
      case 7:
        keySignature = 1;
        break;
      case 255:
        keySignature = 5;
        break;
      case 254:
        keySignature = 10;
        break;
      case 253:
        keySignature = 3;
        break;
      case 252:
        keySignature = 8;
        break;
      case 251:
        keySignature = 1;
        break;
      case 250:
        keySignature = 6;
        break;
      case 249:
        keySignature = -1;
        break;
      default:
        break;
    }
    return keySignature;
  })(data)
  /**
   * 私有变量
   * 自然大调
   * 建议移出
   */
  let sequence = (function (data) {
    let chArr = new Array(data.tracks.length);
    for (let index in data.tracks) {
      let addTime = 0;
      chArr[index] = new Array;
      let i = 0;
      for (let item of data.tracks[index]) {
        if (i != 0) {
          if (item.subtype == "noteOn") {
            item.aTrack = index;
            item.addTime = addTime;
            chArr[index].push(item);
            addTime += item.deltaTime;
          } else {
            addTime += item.deltaTime;
          }
        } else {
          if (item.subtype == "noteOn") {
            addTime += item.deltaTime;
            item.aTrack = index;
            item.addTime = addTime;
            chArr[index].push(item);
          } else {
            addTime += item.deltaTime;
          }
        }
      }
    }
    let smallLength = chArr[0].length;
    chArr.forEach(item => {
      smallLength = smallLength < item.length ? smallLength : item.length;
    })
    let sequence = [];
    for (let item of chArr) {
      sequence = sequence.concat(item);
    }
    sequence.sort(function (x, y) {
      if (x.addTime < y.addTime) {
        return -1;
      } else if (x.addTime > y.addTime) {
        return 1;
      } else {
        return 0;
      }
    });
    for (let index in sequence) {
      if (index != 0) {
        sequence[index].deltaTime = sequence[index].addTime - sequence[index - 1].addTime;
      }
    }
    return sequence;
  })(data)
  /**
   * 音符对象数据集
   * 建议移出
   */
  let Arr = function () {
    let Arr = [];
    for (let i = 0; i < 52; i++) {
      Arr[i] = i * 45 + 25;
    }
    for (var i = 0, len = Arr.length - 2; i < len; i++) {
      if (i % 7 == 0 || i % 7 == 1 || i % 7 == 3 || i % 7 == 4 || i % 7 == 5) {
        Arr.push(Arr[i + 2] + 25);
      }
    }
    Arr.push(Arr[0] + 25);
    Arr.sort(function (x, y) {
      if (x < y) {
        return -1;
      } else if (x > y) {
        return 1;
      } else {
        return 0;
      }
    });
    return Arr;
  }();
  /**
   * 琴键坐标系,记得抽取出去
   */
  this.speed = 1.0;
  /*
  乐曲播放速度默认1.0
  */
  this.noteSequence = [];
  /*
  音符元数据解析后的初始数据，并没有经过速度同步
  */
  this.lnSequence = [];
  /*
  乐曲最终数据，播放的数据来源于此
  */
  this.playIsTrue = true;
  /*
  防抖变量，防止重复点击播放按钮
   */
  this.music_progress = -1;
  /*
  乐曲播放进度控制变量
  */
  this.stop_progress = 0;
  /*
  乐曲暂停数据暂存变量
  */
  this.initialNoteSequence = function (control) {
    zTime = 0;
    this.noteSequence = [];
    for (let item of sequence) {
      if (item.subtype == "noteOn") {
        this.noteSequence.push({ i: item.noteNumber + this.keySignature - control, time: Math.floor((item.deltaTime + zTime) * this.tdTime / 1000) })
        zTime = 0;
      } else {
        zTime += item.deltaTime;
      }
    }
    this.initialLnSequence();
  }
  /**
   * 初始化NoteSequence
   */
  this.initialLnSequence = function () {
    zTime = 0;
    this.lnSequence = [];
    for (let i = 0, len = this.noteSequence.length; i < len; i++) {
      let time;
      let initialTime = this.noteSequence[i].time;
      //初始音符持续时间
      if (initialTime >= 10) {
        time = Math.floor(this.noteSequence[i].time / this.speed);
      } else {
        time = Math.floor(this.noteSequence[i].time);
      }
      //限定10毫秒以上才参与变速
      let obj = { i: this.noteSequence[i].i, time: time };
      this.lnSequence.push(obj);
    }
  }
  /**
   * 初始化lnSequence
   */
  this.setMusicProgress = function (music_progress, window) {
    this.stop_progress = Math.floor(music_progress / 100 * this.lnSequence.length);
    let total_time = 0;
    for (let i = 0; i < this.stop_progress; i++) {
      total_time += this.lnSequence[i].time;
    }
    var miao = Math.floor(total_time / 1000) % 60;
    var fen = Math.floor(total_time / 1000 / 60);
    var millis = total_time % 1000 + "";
    miao = miao > 9 ? miao : "0" + miao;
    fen = fen > 9 ? fen : "0" + fen;
    ui.run(function () {
      window.time.setText(fen + ":" + miao);
      window.mill.setText(millis);
    })
  }
  /**
   * 播放进度设置函数
   */
  this.setSpeed = function (speed) {
    this.speed = speed;
    this.initialLnSequence();
  }
  /**
   * 乐曲速度设置函数
   */
  this.getSpeed = function () {
    return this.speed;
  }
  /**
   * 乐曲速度读取函数
   */
  this.play = function (str) {
    if (typeof str != "string") {
      let gesturesAry = []
      this.lnSequence.forEach((item, index) => {
        let time = 0;
        time = index < this.lnSequence.length - 1 ? this.lnSequence[index + 1].time : 0;
        time = time ? time : 8;
        gesturesAry.push([[0, time, [Arr[item.i] * this.Xbi, 900 * this.Ybi]]]);
      });
      let that = this;
      threads.start(function () {
        that.playIsTrue = false;

        for (; that.music_progress < gesturesAry.length; that.music_progress++) {
          if (!that.Xbi) { throw "Xbi不能为空" }
          if (!that.Ybi) { throw "Ybi不能为空" }
          gestures.apply(null, gesturesAry[that.music_progress]);
          // if (that.music_progress >= 0) {
          //   window.seekbar.setProgress(Math.floor(100 / gesturesAry.length * that.music_progress))
          // } else {
          //   window.seekbar.setProgress(Math.floor(100 / gesturesAry.length * that.stop_progress))
          // }
          if (that.music_progress > 0) {
            that.ability.progressBar(window, that.music_progress, gesturesAry.length)
          } else {
            that.ability.progressBar(window, that.stop_progress, gesturesAry.length)
          }


          if (that.music_progress < 0) {
            break;
          };
          if (that.music_progress >= gesturesAry.length - 1) {
            that.playIsTrue = true;
          }
          sleep(5);
          // console.log(this.music_progress)

        }
        that.playIsTrue = true;
        that.ability.stop();
      })
      console.log("播放")

    } else {
      let strHater;
      let strFooter;
      if (files.exists("./header.txt")) {
        strHater = files.read("./header.txt", "utf8");
      } else {
        throw "header文件缺失";
      }
      if (files.exists("./footer.txt")) {
        strFooter = files.read("./footer.txt", "utf8");
      } else {
        throw "footer文件缺失";
      }
      files.create(src + "宁清/");
      let jsContent = "\nlet noteSequence='" + JSON.stringify(this.lnSequence) + "';\n";
      let i = '';
      let strI = i;
      if (!files.create(src + "宁清/" + str.getJsName().name + strI + ".js")) {
        i = 1;
        strI = '(' + i + ')';
        while (!files.create(src + "宁清/" + str.getJsName().name + strI + ".js")) {
          i++;
          strI = '(' + i + ')';
        }
      }
      files.write(src + "宁清/" + str.getJsName().name + strI + ".js", strHater + jsContent + strFooter, "utf-8");
      toast("转换完成脚本位置:" + src + "宁清/" + str.getJsName().name + strI + ".js");
    }
  }
  /**
   * 乐曲播放及打印函数
   */
  this.stop = function () {
    this.stop_progress = this.music_progress;
    this.music_progress = -1;
    console.log(this.music_progress)
  }
  this.start = function () {
    if (this.playIsTrue) {
      this.music_progress = this.stop_progress;
      this.play();
    }
    console.log(this.music_progress)

  }
}

module.exports = integration;








// function to16(str) {
//   let strf = str.toString(2);
//   if (str < 0) {
//     str = Math.abs(str)
//     strf = str.toString(2);
//     for (let i = strf.length; i < 8; i++) {
//       strf = "0" + strf
//     }
//     strf = ("1" + strf).split("");
//     for (let i = 0; i < 9; i++) {
//       let num = parseInt(strf[i]);
//       if (num) {
//         strf[i] = "0";
//       } else {
//         strf[i] = "1";
//       }
//     }
//     strf = strf.join("");
//     strf = (parseInt(strf, 2) + 1).toString(16);
//   } else {
//     strf = (parseInt(strf, 2) + 0).toString(16);
//   }
//   if (strf.length < 2) {
//     strf = "0" + strf
//   }
//   return strf;
// }

// function inPlay(str) {
//   // if (str == src) {
//   //   toast("请输入正确路径");
//   //   return;
//   // }
//   let data = files.readBytes(str);
//   let midStr = "";
//   let ge = "";

//   for (let i = 0; i < data.length; i++) {
//     midStr = midStr + to16(data[i]) + ge;
//   }
//   return midStr;
// }
// let midiArr = MidiFile(inPlay("/sdcard/脚本/mid/c全音符.mid"));

// let obj = new integration(midiArr, (2340 - 81) / 2340, 1);
// obj.initialNoteSequence(21);
// // obj.stop();
// // obj.play(1);

// events.setKeyInterceptionEnabled("volume_down", true);
// events.observeKey();
// let i = 0;
// events.onKeyDown("volume_down", function () {
//   console.log("进来了");
//   if (i == 0) {
//     obj.start();
//     console.log("开始");
//     i++;
//   } else {
//     i = 0;
//     obj.stops();
//     console.log("暂停");

//   }
// })



// console.log(obj.getSpeed());
// obj.setSpeed(0.5);
// console.log(obj.getSpeed());