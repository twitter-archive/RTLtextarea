var static = require('node-static');
var sys = require('sys');
var root = new (static.Server)('./tests/public');

require('http').createServer(function(request, response){
  request.addListener('end', function(){
    root.serve(request, response, function(err, result){
      if (err) { // There was an error serving the file
          sys.error("Error serving " + request.url + " - " + err.message);

          // Respond to the client
          response.writeHead(err.status, err.headers);
          response.end();
      }
    });
  });
}).listen(8085);