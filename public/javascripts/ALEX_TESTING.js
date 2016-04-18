
jQuery(function($){

  var socket = io.connect(); //Connect to Socket
  var $name_Form = $('#name_Input'); //Enter username
  var $active_User_Div = $('.userList'); 
  var message = $('#message'); //Normal chat message
  var $chat_Form = $('#chat'); //Normal chat form
  var $chat_Box_Div = $('#chatBox'); //Normal chat div where the messages will be appended;
  var name = ""; // Placeholder for current keeping track of usernames on the serverside;
  var $userClick = 'p#user-click'; //Refers to the user that has been clicked on the list;
  var leavePrivateChat = $('#leaveChat'); //Button to leave private chat;
  var privChat = $('#private_message_row');
  var $privateMessageForm = $('#privateMessaging');
  var $privateChatBox = $('#privateChat');
  var $code_Form = $('#codeForm');

  // Receive Username Data
  $name_Form.on('submit', function(event){
    event.preventDefault();
    name = $('#name').val();
    var element = $(this);
    //send the new user to the server
    socket.emit('new user', name, function(data){
      //Error testing here ---
      if (data === true){
        $('#active_user_list').show();
        element.hide();
        console.log('Welcome to the chat!');
      } else {
        console.log("Must enter a username! or error====");
      }
    });
  });

  //Append all new users and existing users to user list div
  //Receives all new users from server as array
  socket.on('usernames', function(data){
    var html = ""; //Placeholder
    for (var i = 0; i < data.length; i++) {
      html += "<p id='user-click'>" + data[i] + "<br></p>"; 
    }
    $active_User_Div.html(html);
  });


  //Sending and receiving normal chat messages
  $chat_Form.on('submit', function(event){
    event.preventDefault();
    //Send message to server here ---
    socket.emit('send message', message.val());
    message.val('');
  });

  socket.on('new message', function(data){
    $chat_Box_Div.append("<b>" + data.user + ": </b>" + data.msg + "<br/>");
  });


  //Private message -setup, sending and receiving messages
  //setup
  $active_User_Div.on('click', $userClick, function(){
    var userClickedName = $(this).text();
    //User cannot click on himself
    if (userClickedName === name){
      return;
    }
    privChat.children().children('h1').text('Private Chat with: '+userClickedName); //Set title
    privChat.show();
    $privateMessageForm.submit(function(event){
      event.preventDefault();
      var private_message = $('#p_message'); //Get value of message and send to server below
      socket.emit('send private message', private_message.val());
      private_message.val('');
    });
  });

  //receiving message from server and appending to private chat box
  socket.on('new private message', function(data){
    $privateChatBox.append("<b>" + data.user + ": </b>" + data.msg + "<br/>");
  });

  //Leaving private chat
  leavePrivateChat.click(function(){
    privChat.hide();
  });


  //Sending code to the server ==== more work to be done here
  //Implement CodeMirror;;;

  var inputCodeMirror = CodeMirror(document.getElementById("code-input-box"), {
    mode:  "javascript",
    theme: "monokai",
    lineNumbers: true,
  });

  var outputCodeMirror = CodeMirror(document.getElementById("code-output-box"),{
    mode: "javascript",
    theme: "monokai",
    lineNumbers: true,
  });

  inputCodeMirror.on('keyup', function(e){
    // var cursorPosition = inputCodeMirror.getCursor();
    socket.emit('get live code', e.getValue());
  });

  socket.on('receive code output', function(data){
    inputCodeMirror.setValue(data);
  });

  $('#compile').click(function(){
    socket.emit('receive input from code', inputCodeMirror.getValue());
  });
  
  socket.on('compiled-code', function(compiled){
    if (compiled === null){
      outputCodeMirror.replaceRange("\n" + "Cannot compile blank!" + "\n", CodeMirror.Pos(outputCodeMirror.lastLine()));
    }else {
    outputCodeMirror.replaceRange("\n" + compiled.toString() + "\n", CodeMirror.Pos(outputCodeMirror.lastLine()));
    }
  });

  //Whiteboard

  //Initiate Variables ----
  var canvas = false;
  var ctx = false;
  var flag = false;
  var dot_flag = false;
  var previous_x_coord = 0;
  var current_x_coord = 0;
  var previous_y_coord = 0;
  var current_y_coord = 0;

  var x = "black"; //Default color
  var y = 2; //Default size

  //Find cursor position function

  find_X_Y = function(result, e){
    if (result == 'down'){
      previous_x_coord = current_x_coord;
      previous_y_coord = current_y_coord;
      current_x_coord = e.clientX - canvas.offsetLeft;
      current_y_coord = e.clientY - canvas.offsetTop;

      flag = true;
      // dot_flag = true;

      if (dot_flag) {
        ctx.beginPath();
        ctx.fillStyle = x;
        ctx.fillRect(current_y_coord, current_y_coord, 2, 2);
        ctx.closePath();
        dot_flag = false;
      }
    }
    if (result == 'up' || result == 'out'){
      flag = false;
    }
    if (result == 'move'){
      if (flag){
        previous_x_coord = current_x_coord;
        previous_y_coord = current_y_coord;
        current_x_coord = e.clientX - canvas.offsetLeft;
        current_y_coord = e.clientY - canvas.offsetTop;
        draw();
      }
    }
  }

  draw = function(){
    ctx.beginPath();
    ctx.moveTo(previous_x_coord, previous_y_coord);
    ctx.lineTo(current_x_coord, current_y_coord);
    ctx.strokeStyle = x; // set color
    ctx.lineWidth = y; //set line width
    ctx.globalCompositeOperation = "source-over";
    if (x === "rgba(0,0,0,1)"){
      ctx.globalCompositeOperation = "destination-out";
    }
    ctx.stroke();
    ctx.closePath();  
  }

  erase = function(){
    var response = confirm("Are you sure you want to clear this canvas?");
    if (response) {
      ctx.clearRect(0, 0, w, h);
    }
  }

  width = function(obj){
    switch(obj.id){
      case "small":
        y = 5;
        break;
      case "medium":
        y = 10;
        break;
      case "large":
        y = 15;
        break;
      case "extra-large":
        y = 20;
        break;
    }
  };

  color = function(obj){
    switch(obj.id){
      case "green":
        x = "green";
        break;
      case "blue":
        x = "blue";
        break;
      case "red":
        x = "red";
        break;
      case "yellow":
        x = "yellow";
        break;
      case "erase":
        x = "rgba(0,0,0,1)";
        break;
    }
  };

  var data = function() {
    return {x: x, width: y, position: ""}
  }; //Information to send to server

  window.onload = function initCanvas(){
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;

    canvas.addEventListener("mousemove", function(e){
      find_X_Y('move', e);
      var mouse_data = find_X_Y('move', e);
      data.position = mouse_data;
      socket.emit('receive canvas drawing', data());
    }, false);
    canvas.addEventListener("mousedown", function(e){
      find_X_Y('down', e);
    }, false);
    canvas.addEventListener("mouseup", function(e){
      find_X_Y('up', e);
    }, false);
    canvas.addEventListener("mouseout", function(e){
      find_X_Y('out', e);
    }, false);
  };


  ///WEB RTC VIDEO AND VOICE CHAT
  // // var webrtc = new SimpleWebRTC({
  // //   localVideoEl: 'localVideo',
  // //   remoteVideosEl: 'remotesVideos',
  // //   autoRequestMedia: true
  // // });

  // // webrtc.on('readyToCall', function (){
  // //   webrtc.joinRoom('alex');
  // });

  
});


















