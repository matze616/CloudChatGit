

$(function () {
    var name = ''
    var socket = io();
    //var ctx = document.getElementById('canvas').getContext('2d');
    $('#chat').hide();
    $('#userinput').hide();
    $('#name').focus();

    $('#send').click(function (e) {
        e.preventDefault(); //prevents page reloading
        if($('#m').val().length > 0){
            socket.emit('chat message', $('#m').val());
            $('#messages').append('<span id="own" class="w3-animate-bottom w3-border" style="text-align: left;background-color:rgb(187, 255, 160)"><Strong>'+ name + '</strong>: <i style="font-size: 10px"> Sent on: ' + getTimestamp() + ' </i><br>' + $('#m').val() + '<br>' + '</span><span class="date"></span>');
            //$('#messages').append($('<li id="own" class="w3-animate-bottom w3-border" style="text-align: left;background-color:rgb(187, 255, 160);font-size: 10px">').text(getTimestamp() + ' ' + name + ' says: \n' + $('#m').val()));
            //$('#messages').append($('<p id="own" class="w3-animate-bottom w3-border">').text(getTimestamp() + ' ' + name + ' says: ' + $('#m').val()));
            $('#m').val('');
            $('#m').focus();
            return false;
        } else {
            alert('Don\'t send empty messages!' );
        }

    });

    $('#filebutton').click(function (e) {
        e.preventDefault();
        let blob = new Blob($('#uploadfile').prop('files'), {type: ($('#uploadfile'))[0].files[0].type});
        //console.log(($('#uploadfile'))[0].files[0]);
        var filename = ($('#uploadfile'))[0].files[0].name;
        let reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = function () {
            socket.emit('file upload', reader.result, filename);
        }
        /*
    fs.readFile(__dirname + '/images/image.jpg', function (err, buf) {
        socket.emit('image', {image: true, buffer: buf.toString('base64')});
        console.log('image file is initialized');
    });
    */
    })

    $('#join').click(function () {
        var name = $('#name').val();
        if (name == ''){
            alert('Name cannot be empty!')
        } else {
            socket.emit('CheckName', name);
        }
    });

    /*
    socket.on('image', function (info) {
        if (info.image) {
            var img = new Image();
            console.log(info.buffer)
            img.src = 'data:image/jpeg;base64,' + info.buffer;
            ctx.drawImage(img, 0,0)
        }
    })
    */

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
    });

    socket.on('update-people',function (people) {
        $("#people").empty();
        $('#people').append('<h3>Users Connected:</h3></li>');
        $.each(people, function(clientid, name) {
            $('#people').append("<li>" + name + "</li>");
        });
    });
/*
    socket.on('update-people', function (people) {
        console.log('update-people');
        $('#people').empty();
        $.each(people, function (clientid, name) {
            $(#people).append('<li>' + name + '</li>')
        });
    });
*/
    socket.on('chat message', function (people, msg, date) {
        $('#messages').append('<span id="incoming" class="w3-animate-bottom w3-border"style="text-align: right;background-color:rgb(91, 222, 255)"> <Strong>'+ people + '</strong>: <i style="font-size: 10px"> Sent on: ' + getTimestamp() + ' </i><br> ' + msg + '<br>' + '</span><span class="date"></span>');
       
        //$('#messages').append($('<li id="incoming" class="w3-animate-bottom w3-border" style="text-align: right;background-color:rgb(0, 204, 255);font-size: 10px">').text(date + ' ' + people + ' says: ' + msg));
        //$('#messages').append($('<p id="own" class="w3-animate-bottom w3-border">').text(getTimestamp() + ' ' + name + ' says: ' + $('#m').val()));
    });
    
    socket.on('file sent', function (data, uploadid, sender, filename) {
        //<li><a download="test.jpg" href='#' id="testlink">test</a></li>
        var msg = '<a download="' + filename + '" href='+ data +' id="upload' + uploadid + ' ">' + filename + '</a>'
        $('#messages').append('<span id="incoming" class="w3-animate-bottom w3-border"style="text-align: center;background-color:rgb(91, 222, 255)"> <Strong>'+ sender + '</strong>: <i style="font-size: 10px"> Sent you a file on: ' + getTimestamp() + ' </i><br> ' + msg + '<br>' + '</span><span class="date"></span>');
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