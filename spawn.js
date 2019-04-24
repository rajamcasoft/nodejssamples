// On Windows Only ...
const spawn = require('child_process').spawn;
for(i=0;i<10;i++){
    spawn('notepad.exe');
}