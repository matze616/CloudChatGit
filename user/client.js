

$(function () {
    var name = ''
    var socket = io();
    $('#chat').hide();
    $('#userinput').hide();
    $('#name').focus();

    $('#send').click(function (e) {
        e.preventDefault(); //prevents page reloading
        if($('#m').val().length > 0){
            socket.emit('chat message', $('#m').val());
            $('#messages').append('<span id="own" style="text-align: left;background-color:rgb(187, 255, 160)"><Strong>'+ name + '</strong>: <i style="font-size: 10px"> Sent on: ' + getTimestamp() + ' </i><br>' + $('#m').val() + '<br>' + '</span><span class="date"></span>');
            $('#messages').scrollTop($('#messages')[0].scrollHeight);
            $('#m').val('');
            $('#m').focus();
            return false;
        } else {
            //alert('Don\'t send empty messages!' );
            $('<div class="alert alert-warning alert-dismissible">\n' +
                '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
                '    <strong>Don\'t send empty messages!</strong>\n' +
                '  </div>').appendTo('#leftcol')
        }

    });

    $('#filebutton').click(function (e) {
        e.preventDefault();
        let blob = new Blob($('#uploadfile').prop('files'), {type: ($('#uploadfile'))[0].files[0].type});
        var filename = ($('#uploadfile'))[0].files[0].name;
        let reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = function () {
            socket.emit('file upload', reader.result, filename);
        }
    });

    $('#join').click(function (e) {
        e.preventDefault();
        var name = $('#name').val();
        if (name == ''){
            $('<div class="alert alert-warning alert-dismissible">\n' +
                '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
                '    <strong>Name can\'t be empty!</strong>\n' +
                '  </div>').appendTo('#login')
        } else {
            socket.emit('CheckName', name);
        }
    });

    socket.on('NameAlreadyInUse', function () {
        alert('Name is already in use');
    });

    socket.on('NameOK', function (username) {
        name = username;
        socket.emit('join',name);
        $('#login').detach();
        $('#chat').show();
        $('#userinput').show();
        $('#m').focus();
    });

    socket.on('update', function (msg) {
        $('#messages').append($('<li>').text(msg));
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });

    socket.on('update-people',function (people) {
        $("#people").empty();
        $('#people').append('<h3>Users Connected:</h3></li>');
        $.each(people, function(clientid, name) {
            $('#people').append("<li>" + name + "</li>");
        });
    });

    socket.on('chat message', function (people, msg, date) {
        $('#messages').append('<span id="incoming" style="text-align: right;background-color:rgb(91, 222, 255)"> <Strong>'+ people + '</strong>: <i style="font-size: 10px"> Sent on: ' + getTimestamp() + ' </i><br> ' + msg + '<br>' + '</span><span class="date"></span>');
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });
    
    socket.on('file sent', function (data, uploadid, sender, filename) {
        var msg = '<a download="' + filename + '" href='+ data +' id="upload' + uploadid + ' ">' + filename + '</a>'
        $('#messages').append('<span id="incoming" style="text-align: center;background-color:rgb(229, 231, 255)"> <Strong>'+ sender + '</strong>: <i style="font-size: 10px"> Sent you a file on: ' + getTimestamp() + ' </i><br> ' + msg + '<br>' + '</span><span class="date"></span>');
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    })
});

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