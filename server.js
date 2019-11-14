//Socket.IO Chat
//Version 0.0.1
//Author: Matthias Schülein (751450), Philipp Kriegeskorte (761341)


var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var uploadid;
var people = {};


app.use(express.static(__dirname + '/user'));

io.on('connection', function (socket) {
    //uploadid for file uploading
    uploadid = 0;

    //Connection message of a socket, sending out all update messages
    socket.on('join', function (name) {
        people[socket.id] = name;
        console.log(name + ' connected to the server');
        //io.emit('update', 'You have connected to the server');
        io.sockets.emit('update', name + ' has joined the server');
        io.sockets.emit('update-people', people);
    });

    //sending chat message
    socket.on('chat message', function (msg) {

        var date = getTimestamp();
        if (msg.charAt(0) == '@'){
            var index = 0;
            /*
            Split + Slice: @Username@Username@Username blblablaba -> ['Username@Username@Username','blblablaba']
            Split: Username@Username@Username -> ['Username','Username','Username']
            */
            var recepientString = (msg.split(' ')[0]).slice(1);
            var recepients = recepientString.split('@');
            var keys = Object.keys(people);
            var values = Object.values(people);
            recepients.forEach(function (recepient) {
                if(values.includes(recepient)){
                    var RecepientIndex = values.indexOf(recepient);
                    io.to(keys[RecepientIndex]).emit('chat message', people[socket.id], msg.trim(), date)
                }
            })
        } else {
            socket.broadcast.emit('chat message', people[socket.id], msg.trim(), date);
        }
    });

    //disconnection message, updating the people array
    socket.on('disconnect', function () {
        io.sockets.emit('update', people[socket.id] + ' has left the server');
        delete people[socket.id];
        io.sockets.emit('update-people', people)
    });

    //checks if the name the user has chosen is already in use
    socket.on('CheckName', function (name) {
        var usednames = Object.values(people);
        if (usednames.includes(name.trim())){
            io.to(socket.id).emit('NameAlreadyInUse');
        } else {
            io.to(socket.id).emit('NameOK', name.trim());
        }
    });

    //sends the data from the sending sockets to all other connected sockets
    socket.on('file upload', function (data, filename) {
        io.sockets.emit('file sent', data, uploadid, people[socket.id], filename);
        uploadid++;
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

http.listen(8080, function () {
    console.log('listening on *:3000');
});

/*
Sequence Diagram:
- Sending: https://sequencediagram.org/index.html#initialData=C4S2BsFMAIFlIM4IIYHNIHoBiIrQMqQB2AJiEagFADC4IxwAjALQB8hATgG6QcBc0AMYALZMGgBbRCnQAaaADNcMAK4AHcAHtkJSpx4c2tekWAAmASLGTpaSPKV4EDPbwNG6DAMyXR4qUh2NJ6mLOxuvAIA7sIgCGq8NoHorty8HibAPtAxcQkcSTKQQA
- Login: https://sequencediagram.org/index.html#initialData=C4S2BsFMAIBkHsDmIB20AKAneBjSBnfAKAGFwRIVgBGAWgD4BlSTANxYC5oSALSHANYA5AIYBbSEWZsWDMhSrUuoiQHkA0qXKUaDae0xcAUvFRSWBudqoAmLgFcADgBMRwSABpoT1+9qPIeEcocxlMKwVgAGYHFzdPbzi-AKCoIA
 */