var fs = require('fs');

var config = {
  "use_ssl": false,
  "use_dev": true,
  "relay_port": 7500,
  "relay_secure_port": 4443,
  "relay_server": "127.0.0.1"
}

module.exports = {
 config: config
}

try {
  var config = require('./config.json');
} catch (e) {
  var config_str = JSON.stringify(config).replace(",","\,\n  ");
  config_str = config_str.replace("{","{\n  ").replace("}","\n}");
  fs.writeFile(__dirname + "/config.json", config_str, (err) => {
    if (err) throw err;
    console.log("created config.json");
  });
}
