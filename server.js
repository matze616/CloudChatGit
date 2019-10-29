var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var uploadid;
var people = {};

app.use(express.static(__dirname + '/user'));

io.on('connection', function (socket) {
    uploadid = 0;
    //Connection message
    socket.on('join', function (name) {
        people[socket.id] = name;
        console.log(name + ' connected to the server');
        //io.emit('update', 'You have connected to the server');
        io.sockets.emit('update', name + ' has joined the server');
        io.sockets.emit('update-people', people);
        console.log(Object.keys(people));
        console.log(Object.values((people)));
    });

    //send
    socket.on('chat message', function (msg) {
        var date = getTimestamp();
        if (msg.charAt(0) == '@'){
            var recepient = (msg.split(' ')[0]).slice(1);
            console.log(recepient);
            var keys = Object.keys(people);
            var values = Object.values(people);
            var RecepientIndex = values.indexOf(recepient);
            io.to(keys[RecepientIndex]).emit('chat message', people[socket.id], msg, date)
        } else {
            //io.sockets.emit('chat message', people[socket.id], msg, date);
            socket.broadcast.emit('chat message', people[socket.id], msg, date);
        }
    });

    //disconnect
    socket.on('disconnect', function () {
        io.sockets.emit('update', people[socket.id] + ' has left the server');
        delete people[socket.id];
        io.sockets.emit('update-people', people)
    });

    socket.on('CheckName', function (name) {
        var usednames = Object.values(people);
        if (usednames.includes(name)){
            io.to(socket.id).emit('NameAlreadyInUse');
        } else {
            io.to(socket.id).emit('NameOK', name);
        }
    })
    
    socket.on('file upload', function (data, filename) {
        //<li><a download="test.jpg" href='#' id="testlink">test</a></li>
        io.sockets.emit('file sent', data, uploadid, people[socket.id], filename);
        uploadid++;
    })

    /*
    //Disconnect message
    socket.on('disconnect', function () {
        console.log('user disconnected')
    });

    //sending of chat message to all sockets
    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
    });
     */
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

http.listen(3000, function () {
    console.log('listening on *:3000')
});

/*
Sequence Diagram:
https://sequencediagram.org/index.html#initialData=C4S2BsFMAIGVII4FdIDsDGMAiICGBzAJ1wFs4QSAHKaAYQAtdgAoW8ENYARgFoA+eIQBukQgC469SOgDWAOVKRmgkYX5sOqbhIUlIAeQDSrdp14DRqiQCkA9iFTLLo9aa0AmCUkoATJpAAaaG8-YEgeSkhbaiUVFz4NTgBmL19-IJD-CKiY5lRbMOhbVTo3biDErRSAWUgAZzqCGEpCW0wGk01ufjjxaHRGYGg9BqanYXjK4E9+weH6xvxY5zUEspTZpnnRpc6zHpWJAHd6EDrIwm3F5YnVqY2Ts4urpqA
 */