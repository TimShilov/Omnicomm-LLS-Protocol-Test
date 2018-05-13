const debug = true;
console.log('\x1Bc'); //clear the console

const SerialPort = require('serialport');
const PORT_ADDRESS = 'COM9';
let port = new SerialPort(PORT_ADDRESS, {
  baudRate: 19200
});

let CURR_TEMP = 15;
let CURR_FREQ = 2950;
let CURR_ADDRESS = '01';

let START_LEVEL = 1142;
let CURR_LEVEL = 1142;
let GOAL_LEVEL = START_LEVEL - 310;

let unanswered_count = 0;

let STEP_RATIO = 0.6;
let MAX_STEP = 50;
let STEP_DIRECTION = -1;
let WAIT_STEPS = 12;

const CRC = require('crc-full').CRC;
var crc = new CRC("CRC8_MAXIM", 8, 0x31, 0x00, 0x00, true, true);
crc.compute([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21]);

port.on("open", function () {
   port.on('data', function(data) {
      if (data.toString('hex').substring(0, 2) == "31") {
         unanswered_count++;
         if (unanswered_count > 3) {
            destruct_data(data.toString('hex'));
         }
      } else {
         unanswered_count = 0;
         init_construct(data.toString('hex'));
      }

      show_interface();
   });
});

function answer(data) {
   let values = calculate_values();
   var hash = crc.compute(Buffer.from('3e' + data + values, "hex")).toString(16);
   if (hash.length === 1) { hash = '0' + hash; }

   let message = '3e' + data + values + hash;

   port.write(new Buffer(message, "hex"), function(err, results) {
      if(err) console.log('err ' + err);
      if(results) console.log('results ' + results);
   });
}

function destruct_data(data = 0) {
   if (data === 0 || data.substring(0, 2) != "31") return;
   let address = CURR_ADDRESS;

   let operation = data.substring(4, 6);

   answer(address + operation);
}

function init_construct(data) {
   CURR_ADDRESS = data.substring(2, 4);
   CURR_TEMP = data.substring(6, 8);
   CURR_FREQ = data.substring(12, 16);

   START_LEVEL = parseInt(data.substring(10, 12) + data.substring(8, 10), 16);
   CURR_LEVEL = START_LEVEL;
   GOAL_LEVEL = START_LEVEL - 310;
}

function calculate_values() {
   make_step();

   return CURR_TEMP + num_to_hexstring(CURR_LEVEL) + CURR_FREQ;
}

function make_step() {
   if (CURR_LEVEL === START_LEVEL && STEP_DIRECTION === 1) { return; }
   let LEVEL_STEP = (Math.floor(Math.random() * MAX_STEP) + 1);

   if (Math.random() < STEP_RATIO) {
      if (Math.abs(CURR_LEVEL - GOAL_LEVEL) < LEVEL_STEP) LEVEL_STEP = Math.abs(CURR_LEVEL - GOAL_LEVEL);

      CURR_LEVEL = CURR_LEVEL + (LEVEL_STEP * STEP_DIRECTION);

      if (CURR_LEVEL === GOAL_LEVEL && STEP_DIRECTION === -1) {
         STEP_DIRECTION = 0;
         GOAL_LEVEL = START_LEVEL;
      }
   }

   if (STEP_DIRECTION === 0) {
      WAIT_STEPS--;
      if (WAIT_STEPS <= 0) {
         STEP_DIRECTION = 1;
         WAIT_STEPS = 50;
      }
   }
}

function num_to_hexstring(n) {
   let hex = new Number(CURR_LEVEL).toString(16);

   if (hex.length === 1) { hex = '0' + hex; }
   if (hex.length === 2) { hex = '0' + hex; }
   if (hex.length === 3) { hex = '0' + hex; }
   hex = hex.substring(2, 4) + hex.substring(0, 2);
   return hex;
}


function show_interface() {
   console.log('\x1Bc'); //clear the console

   console.log(`Port: ${PORT_ADDRESS}`);
   console.log(`Network address: ${CURR_ADDRESS}`);
   console.log(`Current level: ${CURR_LEVEL}, Goal: ${GOAL_LEVEL}, Initial level: ${START_LEVEL}`);
   console.log();

   switch (STEP_DIRECTION) {
      case -1:
         console.log('Dumping fuel...');
         break;
      case 0:
         console.log(`Waiting: ${WAIT_STEPS}`);
         break;
      case 1:
         if (CURR_LEVEL < START_LEVEL) { console.log('Fueling...'); }
            else { console.log(`Dumping and fueling completed! \\(^_^)/`); }
         break;
   }


   if (debug) {
      console.log();
      console.log();
      console.log();
   }
}
