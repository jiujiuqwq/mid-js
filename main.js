"ui"; 



ui.layout(
  <vertical> 
    <button w="120dp" marginTop="200dp" marginLeft="100dp" text="开启悬浮窗" id="but"/> 
  </vertical>
);
let engine;
let tf=true;
ui.but.on("click",function(){
  if(!engine&&tf){
    tf=false;
    engine=(engines.execScriptFile("./suspension.js")).getEngine();
    setTimeout(function(){
      tf=true;
    },1000)
  }else{
    toastLog("悬浮窗运行中ing...")
  }
})