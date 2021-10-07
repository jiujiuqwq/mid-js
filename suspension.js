let MidiFile = require('./MidiFile.js');
let Tool = require('./Tool.js');
let to16 = Tool.to16;
let pathToArray = Tool.pathToArray;
let integration = require('./integration.js');
//请不要盗我的屎山代码
let width = device.height;
let height = device.width;
let control = 23;
let me = 0;
let Xbi = (width - me) / 2340;
let Ybi = height / 1080;
let status = context.resources.configuration.orientation;
let src = "/sdcard/脚本/";
let file = files.listDir(src, function (name) {
  return name.endsWith(".mid");
});
let intobj;
let stopmasg = true;
/**
 * 播放暂停控制变量
 */

String.prototype.getJsName = function () {
  return {
    name: files.getNameWithoutExtension(this),
    suffix: files.getExtension(this)
  };
}
String.prototype.getJsPath = function (content, suffix) {
  content = content ? content : "";
  suffix = suffix ? "." + suffix : "." + files.getExtension(this);
  return files.getNameWithoutExtension(this) + content + suffix;
}
//新建组建用以自定义button
var ColoredButton = (function () {
  util.extend(ColoredButton, ui.Widget);
  function ColoredButton() {
    ui.Widget.call(this);
    this.defineAttr("color", (view, name, defaultGetter) => {
      return this._color;
    }, (view, name, value, defaultSetter) => {
      this._color = value;
      view.attr("backgroundTint", value);
    });
    this.defineAttr("onClick", (view, name, defaultGetter) => {
      return this._onClick;
    }, (view, name, value, defaultSetter) => {
      this._onClick = value;
    });
  }
  ColoredButton.prototype.render = function () {
    return (
      <button textSize="12sp" style="Widget.AppCompat.Button.Colored" w="auto" />
    );
  }
  ColoredButton.prototype.onViewCreated = function (view) {
    view.on("click", () => {
      if (this._onClick) {
        eval(this._onClick);
      }
    });
  }
  ui.registerWidget("colored-button", ColoredButton);
  return ColoredButton;
})();
let w = floaty.rawWindow(
  <vertical w="320dp" h="auto" id="body">
    <frame w="*" h="120dp" marginTop="0dp" id="horleft" >
      <horizontal w="*" h="40dp" radius="5.0dp" bg="#cc0355a7" id="shang">
        <text textColor="#ffb924" marginTop="10dp" marginLeft="10dp" id="musName" ellipsize="marquee" ems="6" h="18dp" textSize="14sp">曲子</text>
        <text textColor="#ffb924" marginTop="10dp" id="time" w="35dp">00:00</text>
        <text w="0" id="mill">0000</text>
        <img w="24dp" h="24dp" radius="10dp" marginTop="9dp" marginLeft="15dp" scaleType="fitXY" src="file://./images/转换.png" alpha="0.7" id="transformation" />
        <img w="25dp" h="25dp" radius="10dp" marginTop="8dp" marginLeft="15dp" scaleType="fitXY" src="file://./images/暂停.png" alpha="0.7" id="stop" />
        <img w="25dp" h="25dp" radius="10dp" marginTop="8dp" marginLeft="14dp" scaleType="fitXY" src="file://./images/展开.png" alpha="0.7" id="up" />
        <img w="25dp" h="25dp" radius="10dp" marginTop="8dp" marginLeft="14dp" scaleType="fitXY" src="file://./images/移动.png" alpha="0.7" id="move" />
      </horizontal>
      <horizontal w="*" h="0dp" id="middle" marginTop="40dp" radius="5.0dp" bg="#cc03B7C9">
        <input text="1.0" id="input" textColor="#ffffff" w="40dp" />
        <colored-button text="完成" color="#EA5A7E" width="60dp" marginLeft="5dp" marginTop="-5dp" id="ok" h="40dp" />
        <progressbar progress="20" w="180dp" marginTop="10dp" marginLeft="20dp" id="progss" style="Base.Widget.AppCompat.ProgressBar.Horizontal" />
      </horizontal>
      <horizontal w="*" h="0dp" marginTop="80dp" radius="5.0dp" bg="#cc00afe8" id="lower">
        <text w="20dp" textColor="#ffffff" marginLeft="5dp">宽</text>
        <input id="widthis" text="2340" textSize="14dp" textColor="#ffffff" w="40dp" />
        <text w="20dp" textColor="#ffffff">高</text>
        <input id="heightis" text="1080" textSize="14dp" textColor="#ffffff" w="40dp" />
        <text w="35dp" textColor="#ffffff">黑边</text>
        <input id="blackedge" text="81" textSize="14dp" textColor="#ffffff" w="40dp" />
        <colored-button text="确认" color="#EA5A7E" width="90dp" marginLeft="20dp" marginTop="0dp" id="equipment" h="40dp" />
      </horizontal>
    </frame>
  </vertical>
);

function shua(window) {
  status = context.resources.configuration.orientation;
  if (status == 2) {
    ui.run(function () {
      window.setPosition(width / 2 - 700 / 2, 100);
    })
  } else {
    ui.run(function () {
      window.setPosition(height / 2 - 350, 100);
    })
  }
}
/**
 * 反转屏幕时依然保持位置
 */
function runtime() {
  this.isStop;
  this.startTime = function (dTime, sTime) {
    sTime = sTime ? sTime : 0;
    let date;
    this.isStop = setInterval(() => {
      date = new Date();
      var time = date.getTime() - dTime + sTime;
      var miao = Math.floor(time / 1000) % 60;
      var fen = Math.floor(time / 1000 / 60);
      var millis = time % 1000 + "";
      miao = miao > 9 ? miao : "0" + miao;
      fen = fen > 9 ? fen : "0" + fen;
      ui.run(function () {
        w.time.setText(fen + ":" + miao);
        w.mill.setText(millis);
      })
    }, 500);
  }
  this.stopTime = function () {
    if (this.isStop) clearInterval(this.isStop);
  }
}
/**
 * 时间控制对象
 */
function funBut(w, getFile) {
  var x = 0, y = 0;
  var windowX, windowY;
  var downTime = 0;
  let setTime = new runtime(w.time, w.mill);
  let stime = 0;

  events.setKeyInterceptionEnabled("volume_down", true);
  events.observeKey();
  w.transformation.click(function () {
    threads.start(function () {
      intobj.play(getFile)
    });
  });
  /**
   * 打印控制
   */
  let upmasg = 1;
  w.up.on("click", function () {
    upmasg = upmasg >= 3 ? 1 : upmasg + 1;
    if (upmasg == 1) {
      w.middle.attr("h", "0dp");
      w.lower.attr("h", "0dp");
      w.up.attr("src", "file://./images/展开.png");
      compatible(w, 40);
    } else if (upmasg == 2) {
      w.middle.attr("h", "40dp");
      w.up.attr("src", "file://./images/展开一阶.png");
      compatible(w, 80);
    } else if (upmasg == 3) {
      w.lower.attr("h", "40dp");
      w.up.attr("src", "file://./images/展开二阶.png");
      compatible(w, 120);
    }

  })
  w.move.setOnTouchListener(function (view, event) {
    switch (event.getAction()) {
      case event.ACTION_DOWN:
        x = event.getRawX();
        y = event.getRawY();
        windowX = w.getX();
        windowY = w.getY();
        //双击退出
        if (new Date().getTime() - downTime < 500) {
          exit();
        }
        downTime = new Date().getTime();
        return true;
      case event.ACTION_MOVE:
        //移动手指时调整悬浮窗位置
        w.setPosition(windowX + (event.getRawX() - x), windowY + (event.getRawY() - y));
        return true;
    }
    return true;
  });
  /**
   * 手势控制
   */
  w.input.on("key", function (keyCode, event) {
    if (event.getAction() == event.ACTION_DOWN && keyCode == keys.back) {
      w.disableFocus();
      event.consumed = true;
    }
  });

  w.input.on("touch_down", () => {
    w.requestFocus();
    w.input.requestFocus();
  });

  w.ok.on("click", () => {
    speed = parseFloat(w.input.text());
    w.disableFocus()
    intobj.setSpeed(speed);
    intobj.initialLnSequence();
    toast("转换完成")
  })
  /**
   * 速度控制
   */
  w.widthis.on("key", function (keyCode, event) {
    if (event.getAction() == event.ACTION_DOWN && keyCode == keys.back) {
      w.disableFocus();
      event.consumed = true;
    }
  });

  w.widthis.on("touch_down", () => {
    w.requestFocus();
    w.widthis.requestFocus();
  });
  /**
   * 设备宽度控制
   */
  w.heightis.on("key", function (keyCode, event) {
    if (event.getAction() == event.ACTION_DOWN && keyCode == keys.back) {
      w.disableFocus();
      event.consumed = true;
    }
  });

  w.heightis.on("touch_down", () => {
    w.requestFocus();
    w.heightis.requestFocus();
  });
  /**
   * 设备高度控制
   */
  w.blackedge.on("key", function (keyCode, event) {
    if (event.getAction() == event.ACTION_DOWN && keyCode == keys.back) {
      w.disableFocus();
      event.consumed = true;
    }
  });

  w.blackedge.on("touch_down", () => {
    w.requestFocus();
    w.blackedge.requestFocus();
  });
  /**
   * 设备黑边控制
   */
  w.equipment.on("click", function () {
    let equipmentObj = {
      width: parseInt(w.widthis.text()),
      height: parseInt(w.heightis.text()),
      blackEdge: parseInt(w.blackedge.text())
    }

    let equipmentJson = JSON.stringify(equipmentObj);
    try {
      files.write("./equipment.json", equipmentJson, "utf-8");
    } catch (error) {
      throw "equipment.json写入错误"
    }
    if (intobj) {
      intobj.Xbi = (equipmentObj.width - equipmentObj.blackEdge) / 2340;
      intobj.Ybi = equipmentObj.height / 1080;
    }

  })
  /**
   * 设备配置设置函数
   */
  let progress_bar_value = 0;
  w.progss.setOnTouchListener(function (view, event) {
    if (intobj) {
      switch (event.getAction()) {
        case event.ACTION_DOWN:
          //手指按下
          progress_bar_value = Math.floor(event.x / view.getWidth() * 10000) / 100;
          w.progss.setProgress(progress_bar_value);
          return true;
        case event.ACTION_UP:
          //手指抬起
          intobj.setMusicProgress(progress_bar_value, w);
          return true;
        case event.ACTION_MOVE:
          //手指移动
          progress_bar_value = Math.floor(event.x / view.getWidth() * 10000) / 100;
          w.progss.setProgress(progress_bar_value);
          return true;
      }
    }

    return true;
  })
  /**
   * 进度条控制
   */
  w.stop.click(function () {
    if (stopmasg) {
      if (intobj) {
        w.stop.attr("src", "file://./images/播放.png");
        intobj.start();
        var objArr = w.time.getText().split(":");
        stime = parseInt(objArr[0]) * 60 * 1000 + parseInt(objArr[1]) * 1000 + parseInt(w.mill.getText());
        setTime.startTime((new Date).getTime(), stime);
        stopmasg = !stopmasg;
        console.log("播放");
      } else {
        toast("请选择mid文件");
      }
    } else {
      w.stop.attr("src", "file://./images/暂停.png");
      intobj.stop();
      setTime.stopTime();
      stopmasg = !stopmasg;
      console.log("暂停");
    }
  });
  //悬浮窗播放和暂停
  events.onKeyDown("volume_down", function () {
    if (stopmasg) {
      if (intobj) {
        w.stop.attr("src", "file://./images/播放.png");
        intobj.start();
        var objArr = w.time.getText().split(":");
        stime = parseInt(objArr[0]) * 60 * 1000 + parseInt(objArr[1]) * 1000 + parseInt(w.mill.getText());
        setTime.startTime((new Date).getTime(), stime);
        stopmasg = !stopmasg;
        console.log("播放");
      } else {
        toast("请选择mid文件");
      }
    } else {
      w.stop.attr("src", "file://./images/暂停.png");
      intobj.stop();
      setTime.stopTime();
      stopmasg = !stopmasg;
      console.log("暂停");
    }
  })
  /**
   * 音量减控制
   */
  w.musName.click(() => {
    let current_dir_array, dir = [src];
    function file_select(select_index) {
      switch (select_index) {
        case undefined:
          break;
        case -1:
          return;
        case 0:
          if (dir.length > 1) {
            dir.pop();
          }
          break;
        default:
          if (files.isFile(files.join(dir.join(""), current_dir_array[select_index]))) {
            let file_name = (files.join(dir.join(""), current_dir_array[select_index]))
            getFile = file_name;
            inPlay(getFile);

            ui.run(function () {
              w.musName.setText(files.getNameWithoutExtension(file_name));
              w.time.setText("00:00")
            })

            /**
             * 刷新乐曲对象
             */
            createFile(file_name);
            return;
          } else if (files.isDir(files.join(dir.join(""), current_dir_array[select_index]))) {
            dir.push(current_dir_array[select_index]);
          }
      };
      current_dir_array = pathToArray(dir)
      dialogs.select("文件选择", current_dir_array).then(n => {
        file_select(n);
      });
    };
    file_select();
  });
}

function inPlay(str) {
  if (str == src) {
    toast("请输入正确路径");
    return;
  }
  let data = files.readBytes(str);
  let midStr = "";
  let ge = "";

  for (let i = 0; i < data.length; i++) {
    midStr = midStr + to16(data[i]) + ge;
  }
  // console.log(midStr)
  // console.log((new MidiFile(midStr)).tracks[0])
  intobj = new integration(new MidiFile(midStr), Xbi, Ybi, w, {
    stop: function () {
      console.log("播放结束");
    },
    progressBar: function (window, music_progress, music_length) {
      window.progss.setProgress(Math.floor(music_progress / music_length * 10000) / 100);
    }
  });
  intobj.initialNoteSequence(21);

  // intobj.play(1)
}

function readEquipment(w) {
  let equipmentJson;
  try {
    equipmentJson = files.read("./equipment.json");
  } catch (error) {
    throw "equipment.json读取错误,文件可能不存在";
  }
  let equipmentObj = JSON.parse(equipmentJson);
  width = equipmentObj.width;
  height = equipmentObj.height;
  me = equipmentObj.blackEdge;
  Xbi = (width - me) / 2340;
  Ybi = height / 1080;
  ui.run(function () {
    w.widthis.setText(width.toString());
    w.heightis.setText(height.toString());
    w.blackedge.setText(me.toString());
  })
}
/**
 * 设备配置读取函数
 */

function compatible(window, parameter_height) {
  let actual_width = window.shang.getWidth();
  let actual_height = window.shang.getHeight();
  let width_proportion = actual_width / 320;
  let height_proportion = actual_height / 40;
  window.setSize(Math.floor(width_proportion * 320), Math.floor(height_proportion * parameter_height));
}
/**
 * 悬浮窗整体大小兼容函数
 */

function main(win) {
  readEquipment(win);
  compatible(win, 40);
  funBut(win);
  shua(win);
  if (file[0]) {
    inPlay(src + file[0])
    // console.log(file[0])
    ui.run(function () {
      win.musName.setText(file[0].getJsName().name);
    })
  }
}
main(w);

threads.start(function () {
  var istrue = context.resources.configuration.orientation;
  while (true) {
    sleep(500);
    var status = context.resources.configuration.orientation;
    if (istrue != status) {
      istrue = status;
      shua(w);
    }
  }
})