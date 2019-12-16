//Socket.IO Chat
//Version 0.0.1
//Author: Matthias Schülein (751450), Philipp Kriegeskorte (761341)


$(function () {
    var name = ''
    var socket = io();
    $('#chat').hide();
    $('#userinput').hide();
    $('#name').focus();

    //function for the click on the "send message" button
    $('#send').click(function (e) {
        e.preventDefault(); //prevents page reloading
        var msg = $('#m').val().trim();
        if(msg.length > 0){
            socket.emit('chat message', $('#m').val());
            $('#messages').append('<span id="own" style="text-align: left;background-color:rgb(187, 255, 160)"><Strong>'+ name + '</strong>: <i style="font-size: 10px"> Sent on: ' + getTimestamp() + ' </i><br>' + $('#m').val() + '<br>' + '</span><span class="date"></span>');
            $('#messages').scrollTop($('#messages')[0].scrollHeight);
            $('#m').val('');
            $('#m').focus();
            return false;
        } else {
            $('<div class="alert alert-warning alert-dismissible">\n' +
                '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
                '    <strong>Don\'t send empty messages!</strong>\n' +
                '  </div>').appendTo('#leftcol')
        }

    });

    //function for the click on the "send file" button
    $('#filebutton').click(function (e) {
        e.preventDefault(); //prevents page reloading
        let blob = new Blob($('#uploadfile').prop('files'), {type: ($('#uploadfile'))[0].files[0].type});
        var filename = ($('#uploadfile'))[0].files[0].name;
        let reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = function () {
            socket.emit('file upload', reader.result, filename);
        }
    });

    //function for the click on the "Ready to Chat" button
    $('#join').click(function (e) {
        e.preventDefault();
        var name = $('#name').val();
        var password = $('#password').val();
        if ((name == '') || (name.includes(' '))){
            $('#alerts').empty();
            $('<div class="alert alert-warning alert-dismissible">\n' +
                '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
                '    <strong>Name can\'t be empty or contain whitespace!</strong>\n' +
                '  </div>').appendTo('#alerts')
        } else {
            socket.emit('CheckName', name, password);
        }
    });

    $('#profilepicture').change(function (e) {
        var filename = ($('#profilepicture'))[0].files[0].name;
        $('#profilepicturelabel').html(filename);
    });

    $('#profilebutton').click(function (e) {
        var filetype = ($('#profilepicture'))[0].files[0].type;
        var filesize = ($('#profilepicture'))[0].files[0].size;
        if((filetype === "image/jpeg" || filetype === "image/tiff" || filetype === "image/gif" || filetype === "image/png") &&
            filesize < 10000000){
            $('#join').prop('disabled', true);
            $('#profilebutton').prop('disabled', true);
            let blob = new Blob($('#profilepicture').prop('files'), {type: filetype});
            let reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = function () {
                socket.emit('profile picture upload', reader.result, filetype);
            }
        } else {
            $('#alerts').empty();
            $('<div class="alert alert-warning alert-dismissible">\n' +
                '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
                '    <strong>Image is larger than 10MB or hast the wrong datatype</strong>\n' +
                '  </div>').appendTo('#alerts')
        }
    });

    //Message that the chosen username is already connected to the chat
    socket.on('AlreadyConnected', function () {
        $('#alerts').empty();
        $('<div class="alert alert-warning alert-dismissible">\n' +
            '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
            '    <strong>User is already connected!</strong>\n' +
            '  </div>').appendTo('#alerts')
    });

    //Message that the chosen username or password is too long
    socket.on('NamePasswordTooLong', function () {
        $('#alerts').empty();
        $('<div class="alert alert-warning alert-dismissible">\n' +
            '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
            '    <strong>Username or password is too long! (max. 20 characters)</strong>\n' +
            '  </div>').appendTo('#alerts')
    });

    //Message that the name the user chose is already in use in the database or typed in the wrong password
    socket.on('WrongPassword', function () {
        $('#alerts').empty();
        $('<div class="alert alert-warning alert-dismissible">\n' +
            '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
            '    <strong>Name is already in use! Or forgot your password?</strong>\n' +
            '  </div>').appendTo('#alerts')
    });

    //Message that the name of the user is not in use and can join
    socket.on('NameOK', function (username) {
        socket.emit('join',username);
        $('#alerts').empty();
        $('#login').detach();
        $('#chat').show();
        $('#userinput').show();
        $('#m').focus();
    });

    //update message for the connection and disconnection of a user
    socket.on('update', function (msg) {
        $('#messages').append($('<li>').text(msg));
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });

    //updates the list of the connected users
    socket.on('update-people',function (people, profilepictures) {
        $("#people").empty();
        $('#people').append('<h3>Users Connected:</h3></li>');
        $.each(people, function(clientid, name) {
            $('#people').append($('<li>').text(name));
        });
    });

    //appends a message from another socket to the message field
    socket.on('chat message', function (people, msg, date) {
        $('#messages').append('<span id="incoming" style="text-align: right;background-color:rgb(91, 222, 255)"> <Strong>'+ people + '</strong>: <i style="font-size: 10px"> Sent on: ' + getTimestamp() + ' </i><br> ' + msg + '<br>' + '</span><span class="date"></span>');
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });

    //generates the link to download a file
    socket.on('file sent', function (data, uploadid, sender, filename) {
        var msg = '<a download="' + filename + '" href='+ data +' id="upload' + uploadid + ' ">' + filename + '</a>'
        $('#messages').append('<span id="incoming" style="text-align: center;background-color:rgb(229, 231, 255)"> <Strong>'+ sender + '</strong>: <i style="font-size: 10px"> Sent you a file on: ' + getTimestamp() + ' </i><br> ' + msg + '<br>' + '</span><span class="date"></span>');
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });

    socket.on('ContainsFace', function () {
        $('#alerts').empty();
        $('#join').prop('disabled', false);
        $('#profilebutton').prop('disabled', false);
        $('<div class="alert alert-success alert-dismissible">\n' +
            '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
            '    <strong>Picture contains a face and can be used</strong>\n' +
            '  </div>').appendTo('#alerts')
    });

    socket.on('NoFace', function () {
        $('#alerts').empty();
        $('#join').prop('disabled', false);
        $('#profilebutton').prop('disabled', false);
        $('<div class="alert alert-warning alert-dismissible">\n' +
            '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
            '    <strong>Picture does not contain a face</strong>\n' +
            '  </div>').appendTo('#alerts')
    });
});

//generates a timestamp in the format dd.mm.yyyy hr:mi:ss
function getTimestamp(){
    var today = new Date();
    if ((String(today.getDate()).length) == 1) {
        var dd = '0' + (today.getDate());
    } else {
        var dd = today.getDate();
    }

    if ((String((today.getMonth() + 1)).length) == 1) {
        var mm = '0' + (today.getMonth()+1);
    } else {
        var mm = today.getMonth() + 1;
    }

    var yyyy = today.getFullYear();
    if ((String(today.getHours()).length) == 1) {
        var hr = '0' + today.getHours();
    } else {
        var hr = today.getHours();
    }

    if ((String(today.getMinutes()).length) == 1) {
        var mi = '0' + today.getMinutes();
    } else {
        var mi = today.getMinutes();
    }

    if ((String(today.getSeconds()).length) == 1) {
        var ss = '0' + today.getSeconds();
    } else {
        var ss = today.getSeconds();
    }
    return (dd + '.' + mm + '.' + yyyy + ' ' + hr + ':' + mi + ':' + ss);
}