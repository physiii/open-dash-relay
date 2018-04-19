// ------------------------------  OPEN-AUTOMATION ----------------------------------- //
// -----------------  https://github.com/physiii/dash-relay  -------------------- //
// ---------------------------------- socket.js -------------------------------------- //

const crypto = require('crypto');
var os = require('os');
var request = require('request');
var fs = require('fs');
const exec = require('child_process').exec;
var TAG = "[Dash_Relay_socket.js]";
var groups= [];
var device_objects = [];
var device_sockets = [];
var status_objects = [];


module.exports = {
  start: start
}

  // -------------  socket.io server  ---------------- //
function start(server) {
  var io = require('socket.io').listen(server);

  // Io.set('origins', '*');
  io.on('connection', function (socket) {
    console.info(TAG,"Client connected");

    socket.on ('command', function (data) {
      // Recieve command and store data passed by command.
      console.log(TAG, "Recieved command from client", );
      var device = data.device
      var user_token = data.token
      var command = data.command

      // Check to see if user and group for user exists
      var user_object = device_objects[find_index(device_objects, 'token', user_token)];
      if (!user_object) return console.log(TAG,"User not found");
      var user_id = user_object.mac;
      console.log(TAG,"Found user id: " + user_id);

      // Check for group associated with User
      var group_object = groups[find_index(groups, 'group_id',user_id)];
      if (!group_object) return console.log("group not found: " + user_id);

      // Check User Group for Device association.
      var member_found = false;
      for (var i = 0; i < group_object.members.length; i++)
        if (group_object.members[i] == device) member_found = true;
      if (!member_found) return console.log(TAG,device + " is not a member of " + user_id);

      // If all true pass Check device Object Index command to device requested from client.
      var device_object = device_objects[find_index(device_objects, 'mac', device)];
      if (device_object)
        if (device_object.socket)
          device_object.socket.emit('command', {command:command});
    })

    socket.on ('command result', function(data){
      io.sockets.emit('command result', data);
    })

    socket.on('get token', function(data) {
      // Recieve data from client/device and create token if token doesnt already exist
      console.log(TAG,"Recieved Token request:  "+ data.mac);
      var mac = data.mac
      var token = crypto.createHash('sha512').update(mac).digest('hex');
      data.token = token
      socket.emit("token", data);

      // Cross reference client/device with group to see if exists
      index = find_index(groups, 'group_id', mac);
      if (index < 0) {
        console.log(TAG,"User "+mac+" group does not exist. Creating new group")
        var group = { group_id: mac, members: [mac] };
        groups.push(group);
        console.log(groups);

      }

      // Check to see if token has been created in obj and if not create it
      var device_obj = device_objects[find_index(device_objects, 'token', token)];
      if (!device_obj) {
        data.groups = [mac];
        data.socket = socket;
        device_objects.push(data);
        console.log(TAG, "Device "+mac+" not found...Added device.");
        console.log(TAG, "Storing/sending new user token ");
        console.log(TAG, "Stored data:", device_objects);
        return;
      }
      device_obj.socket = socket;
      console.log(TAG, "Device "+mac+" found...Updated device socket");
      console.log(TAG, "Sending stored token");
    })

    socket.on('add device', function(data){
      // Store user/client Token sent via command and the device/mac that is to be linked.
      var user_token = data.token;
      var device_id = data.device;

      // Recreate token for device_id to authenticate and verify device exists on relay.
      var device_token = crypto.createHash('sha512').update(device_id).digest('hex');
      var device_object = device_objects[find_index(device_objects, 'token', device_token)];
      if (!device_object) return console.log(TAG,'link device | device not found', device_id);
      var device_id = device_object.mac;

      // Verify User token exists on relay for linking
      var user_object = device_objects[find_index(device_objects, 'token', user_token)];
      if (!user_object) return console.log(TAG,"link device | no account found");
      var username = user_object.mac;

      // Add user to device for incoming messages
      if (device_object.groups.indexOf(username) < 0) {
        device_object.groups.push(username);
      }

      // Add device to user group
      // Var group_index = find_index(groups, 'group_id', username);
      var user_group = groups[find_index(groups, 'group_id', username)];
      if (!user_group) return console.log(TAG,"add device | no user group found ", groups);
      if (user_group.members.indexOf(device_id) < 0) {
        user_group.members.push(device_id);
      }

      // Add user to device group
      var device_group = groups[find_index(groups, 'group_id', device_id)];
      if (!device_group) {
        console.log(TAG,"add device | group_id not found", device_id);
        var new_group = { "group_id": device_id, members: [device_id, username] };
      }
      else if (device_group.members.indexOf(username) < 0) {
        device_group.members.push(username);
      }
      console.log(TAG, 'added device', groups);
      socket.emit('add device', {result: "Completed link"});
    })

    socket.on('list devices', function(data){
      var username = data.mac;
      var token = data.token;
      console.log(TAG,"Recieved device list request from "+username);

    })


    socket.on('disconnect', function () {
      console.info(TAG,"Client disconnected");
    })

  })
}


//-----------------End of Dash Socket communications-------------------------//


function list_devices () {

  console.log("device list: ",devices)
}

function find_index(array, key, value) {
  for (var i=0; i < array.length; i++) {
    if (array[i][key] == value) {
      return i;
    }
  }
  return -1;
}
