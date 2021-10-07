/**
 * 功能函数集
 */

//16进制转换
function to16(str) {
  // -3
  // 0 0000 0011
  // 1 0000 0011
  // 0 1111 1100
  // 0 1111 1101
  let strf = str.toString(2);
  if (str < 0) {
    str = Math.abs(str)
    strf = str.toString(2);
    for (let i = strf.length; i < 8; i++) {
      strf = "0" + strf
    }
    strf = ("1" + strf).split("");
    for (let i = 0; i < 9; i++) {
      let num = parseInt(strf[i]);
      if (num) {
        strf[i] = "0";
      } else {
        strf[i] = "1";
      }
    }
    strf = strf.join("");
    strf = (parseInt(strf, 2) + 1).toString(16);
  } else {
    strf = (parseInt(strf, 2) + 0).toString(16);
  }
  if (strf.length < 2) {
    strf = "0" + strf
  }
  return strf;
}

//遍历文件夹下子文件
function pathToArray(dir) {
  current_dir_array = new Array();
  current_dir_array = ["返回上级目录"];
  files.listDir(dir.join("")).forEach((i, value) => {
    if (files.isDir(dir.join("") + i)) {
      current_dir_array.push(i + "/");
    } else if (files.isFile(dir.join("") + i)) {
      if (i.endsWith(".mid")) {
        current_dir_array.push(i);
      }
    }
  });
  return current_dir_array;
}

module.exports= {
  to16:to16,
  pathToArray:pathToArray
};