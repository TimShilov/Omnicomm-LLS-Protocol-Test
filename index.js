const SerialPort = require('serialport');
const PORT_ADDRESS = 'COM9';
let port = new SerialPort(PORT_ADDRESS, {
  baudRate: 19200
});

port.on("open", function () {
     console.log(`${PORT_ADDRESS} is openned`);

     setInterval(function () { requestLevel(port) }, 2000);

     port.on('data', function(data) {
      console.log('data received: ' + data.toString('hex'));
      destruct_data(data.toString('hex'));

      console.log();
     });

   });

function requestLevel(port) {
   port.write(new Buffer("3101066C", "hex"), function(err, results) {
    if(err) console.log('err ' + err);
    if(results) console.log('results ' + results);
   });
   // port.write(new Buffer('DO','ascii'), function(err, results) {
   //  console.log('err ' + err);
   //  console.log('results ' + results);
   // });
}

function destruct_data(data = 0) {
   if (data === 0 || data.substring(0, 2) != "3e") return;
   let address = data.substring(2, 4);
   console.log(`Network address: ${address}`);
   let operation = data.substring(4, 6);
   if (operation === "06") { console.log(`Operation: 06 (One time data request)`); } else { console.log(`Operation: ${operation}`); }

   let temp = parseInt(data.substring(6, 8), 16);
   console.log(`Temperature: ${temp}`);

   let level = parseInt(data.substring(10, 12) + data.substring(8, 10), 16);
   console.log(`Fuel Level: ${level}`);

   let freq = parseInt(data.substring(14, 16) + data.substring(12, 14), 16);
   console.log(`Frequency: ${freq}`);
}
