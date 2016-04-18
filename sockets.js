var chalk = require('chalk');

var socketFunctions = function(server){
  var io = require('socket.io').listen(server);
  var users = {}; //hash of users to be populated below;


  io.sockets.on('connection', function(socket) {

    socket.on('new user', function(data, callback){
      //Error checking here ---
      callback(true);
      socket.user = data;
      users[socket.user] = socket;
      updateUsers();
    });


    function updateUsers(){
      io.sockets.emit('usernames', Object.keys(users));
    };

    socket.on('send message', function(data){
      io.sockets.emit('new message', {"msg": data, "user": socket.user});
    });

    socket.on('disconnect', function(data){
      delete users[socket.user];
      updateUsers;
    }); 

    socket.on('send private message', function(data){
      io.sockets.emit('new private message', {"msg": data, "user": socket.user});
    });

    socket.on('get live code', function(data){
      socket.broadcast.emit('receive code output', data);
    });

    socket.on('receive input from code', function(data){
      //To be continued.....
      var compiled;
      console.log(data);

      function Evaluator(cons) {
        this.env = {};
        this.cons = cons;
      }

      Evaluator.prototype.evaluate = function(str){
       try {
            str = rewriteDeclarations(str);
            var __environment__ = this.env;
            var console = this.cons;
            with (__environment__) {
                return JSON.stringify(eval(str));
            }
        } catch (e) {
            return e.toString();
        }
      }

      function rewriteDeclarations(str) {
        // Prefix a newline so that search and replace is simpler
        str = "\n" + str;
    
        str = str.replace(/\nvar\s+(\w+)\s*=/g,
                          "\n__environment__.$1 =");  // (3)
        str = str.replace(/\nfunction\s+(\w+)/g,
                          "\n__environment__.$1 = function");
    
        return str.slice(1); // remove prefixed newline
    }
    var cons = { log: function (m) { return(m) } };
    var e = new Evaluator(cons);
    compiled = e.evaluate(data.toString())
    // console.log(compiled);

    io.sockets.emit('compiled-code', compiled);
    });

    //HTML Canvas socket handling ---
    socket.on('receive canvas drawing', function(data){
      // -keep track of :
      // - color
      // - cursor position
      // - cursor width 
      // - coordinates
      console.log(data);


    }); 


  });
}

module.exports = socketFunctions;












