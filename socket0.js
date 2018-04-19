// ------------------------------  OPEN-AUTOMATION ----------------------------------- //
// -----------------  https://github.com/physiii/dash-relay  -------------------- //
// ---------------------------------- socket.js -------------------------------------- //


var TAG = "[Dash_Relay_socket.js]";
var database = require('./database.js');
var utils = require('./utils.js');
var crypto = require('crypto');
var fs = require('fs');
var start_time = Date.now();
var find_index = utils.find_index;

module.exports = {
  start: start
}

function start(server) {
  // -------------  socket.io server  ---------------- //
  var io = require('socket.io').listen(server);

  //io.set('origins', '*');
  io.on('connection', function (socket) {
    console.info(socket.id + " | client connected");

    socket.on('get token', function (data) {
      var mac = data.mac;
      //var name = data.name;
      //var salt = data.salt //some random value
      var token = crypto.createHash('sha512').update(mac).digest('hex');
      data.token = token;
      var public_ip = socket.request.connection.remoteAddress;
      public_ip = public_ip.slice(7);
      data.public_ip = public_ip;
      socket.emit('get token', data);
      var index = find_index(device_objects, 'token', token);
      if (index > -1) {
        //database.store_device_object(data);
        device_objects[index].socket = socket;
        console.log('get token | updated socket', mac);
      } else {
        data.groups = [mac];
        data.socket = socket;
        device_objects.push(data);
        database.store_device_object(data);
        console.log('get token | added device', mac);
      }

      //if (!groups) groups = [];
      index = find_index(groups, 'group_id', mac);
      if (index < 0) {
        var group = { group_id: mac, mode: 'init', type: ['alarm'], members: [mac] };
        groups.push(group);
        database.store_group(group);
      }
      console.log("get token", mac);
    });

    socket.on('load settings', function (data) {
      console.log(TAG, 'load settings', data.mac);
      var device_index = find_index(device_objects, 'token', data.token);
      if (device_index < 0) return console.log("device not found", data.mac);
      var group_index = find_index(groups, 'group_id', device_objects[device_index].mac);
      if (group_index < 0) return console.log("group_id not found", data.mac);
      for (var i = 0; i < groups[group_index].members.length; i++) {
        //console.log("load settings2 | member",groups[group_index].members[i]);
        message_user(groups[group_index].members[i], 'load settings', data);
      }
    });

    socket.on('get settings', function (data) {
      var index = find_index(device_objects, 'token', data.token);
      if (index < 0) return console.log(TAG, "get settings | device not found", data.token);
      if (device_objects[index].wsTokens) return device_objects[index].wsTokens.emit('get settings', data);
      console.log("get settings", device_objects[index].mac);
      if (!device_objects[index].socket) return console.log(TAG, "get settings | socket no found", device_objects[index].mac);
      device_objects[index].socket.emit('get settings', data);
    });

    socket.on('update', function (data) {
      var device_index = find_index(device_objects, 'token', data.token);
      if (device_index < 0) return console.log('update | device not found', data.mac);
      if (!device_objects[device_index].socket) return console.log('update | socket not found', data.mac);
      device_objects[device_index].socket.emit('update', data);
    });

    socket.on('command', function (data) {
      var device_index = find_index(device_objects, 'token', data.token);
      if (device_index < 0) return console.log("device not found");
      if (device_objects[device_index].socket)
        device_objects[device_index].socket.emit('command', data);
    });

    socket.on('command result', function (data) {
      var device_index = find_index(device_objects, 'token', data.token);
      var mac = device_objects[device_index].mac;
      var group_index = find_index(groups, 'group_id', mac);
      if (group_index < 0) return console.log("command result | group not found");
      for (var i = 0; i < groups[group_index].members.length; i++) {
        for (var j = 0; j < user_objects.length; j++) {
          console.log('command result', user_objects[j].user);
          if (user_objects[j].user == groups[group_index].members[i]) {
            user_objects[j].socket.emit('command result', data);
          }
        }
      }
    });

    socket.on('disconnect', function () {
      console.info(socket.id + " | client disconnected");
      var index = find_index(device_objects, 'socket', socket);
      if (index < 0) {
        console.log("No device connected");
        return;
      }
      var device = device_objects[index];
      for (var j = 0; j < device.groups.length; j++) {
        //message group members
        var group_index = find_index(groups, 'group_id', device.groups[j]);
        var group = groups[group_index];
        if (!group.contacts) continue;
        for (var k = 0; k < group.contacts.length; k++) {
          var contactNumber = group.contacts[k].number;
          if (contactNumber) {
            var message = device.type+" "+device.mac+" disconnected";
            sendMessage(contactNumber, "Disconnected", message);
          }
        }
      }
      if (index > -1) device_objects.splice(index, 1);
    });
    //------Socket.on  Indention

  //------Do not write below this line-----------------------
}); // Ent of io.on for socket connections-----------------
} // End of function -----------------------

function list_devices () {

  console.log("device list: ",devices)
}
