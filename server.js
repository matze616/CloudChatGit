//Socket.IO Chat
//Version 0.0.1
//Author: Matthias Schülein (751450), Philipp Kriegeskorte (761341)


var express = require('express');
var helmet = require('helmet');
var bcrypt = require('bcryptjs');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var fs = require('fs');
var app = express();
var port = (process.env.PORT || process.env.VCAP_APP_PORT || 8080);
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});
var vcapApplication = JSON.parse(process.env.VCAP_APPLICATION);
var logPrefix= vcapApplication.application_name + vcapApplication.instance_index;
// var https = require('https');
//var http = require('http');//.createServer(app);

var io = require('socket.io').listen(server);
var uploadid;
var accesstoken;
var people = {};
var profilepictures = {};
var visualRecognition = new VisualRecognitionV3({
    version: '2018-03-19',
    iam_apikey: 'sycCyMLBkbSzpKnS6Ub2-wp5-w30gG00QpkU6sf4liZr'
});

//------ WICHTIG !!!! diese Funktion muss immer die erste app.use Funktion im Code Sein !!!
app.use (function (req, res, next) {
    if (req.secure) {
        next();
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }
});

app.use(helmet());
/*
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'code.jquery.com', 'maxcdn.bootstrapcdn.com', 'stackpath.bootstrapcdn.com'],
        scriptSrc: ["'self'", 'code.jquery.com', 'maxcdn.bootstrapcdn.com']
    }
}));
*/
app.use(express.static(__dirname + '/user'));


app.enable('trust proxy');





const GetAccessToken = new Promise(
    function (resolve, reject) {
        var result;
        const Http = new XMLHttpRequest();
        const url = 'https://dashdb-txn-sbox-yp-lon02-02.services.eu-gb.bluemix.net/dbapi/v4/auth/tokens';
        var body = JSON.stringify({ "userid": "chk51071", "password": "xt2r3mjzwp-lr2t9"});
        Http.open("POST", url);
        Http.send(body);
        Http.onreadystatechange=function(){
            if(this.readyState==4 && this.status==200){
                result = JSON.parse(Http.responseText);
                resolve(result);
            }
        };

    }).catch(err => {
    console.log("error: ", err);
});
GetAccessToken.then(function (answer) {
    accesstoken = answer.token;
});



io.on('connection', function (socket) {
    console.log(logPrefix);
    //uploadid for file uploading
    uploadid = 0;

    //Connection message of a socket, sending out all update messages
    socket.on('join', function (name) {
        people[socket.id] = name;
        console.log(name + ' connected to the server');
        //io.emit('update', 'You have connected to the server');
        io.sockets.emit('update', name + ' has joined the server');
        io.sockets.emit('update-people', people, profilepictures);
    });

    //sending chat message
    socket.on('chat message', function (msg) {

        const translatedmsg = new Promise(

            function (resolve, reject) {
                var result;
                const Http = new XMLHttpRequest();
                const url = 'https://eu-de.functions.cloud.ibm.com/api/v1/web/cb82dc99-bde9-4300-900d-ca3e8a0d53f6/hrt-demo/identify-and-translate/?text=' + msg;
                Http.open("GET", url);
                Http.send();

                Http.onreadystatechange=function(){
                    if(this.readyState==4 && this.status==200){
                        result = JSON.parse(Http.responseText);
                        console.log(result.translations);
                        resolve(result.translations);
                    }
                };
            }
        );

        translatedmsg.then(function (va1) {
            var date = getTimestamp();
            if (va1.charAt(0) === '@'){
                var index = 0;
                /*
                Split + Slice: @Username@Username@Username blblablaba -> ['Username@Username@Username','blblablaba']
                Split: Username@Username@Username -> ['Username','Username','Username']
                */
                var recepientString = (va1.split(' ')[0]).slice(1);
                var recepients = recepientString.split('@');
                var keys = Object.keys(people);
                var values = Object.values(people);
                recepients.forEach(function (recepient) {
                    if(values.includes(recepient)){
                        var RecepientIndex = values.indexOf(recepient);
                        io.to(keys[RecepientIndex]).emit('chat message', people[socket.id], va1.trim(), date)
                    }
                })
            } else {
                console.log(translatedmsg);
                socket.broadcast.emit('chat message', people[socket.id], va1.trim(), date);
            }
        })
    });

    //disconnection message, updating the people array
    socket.on('disconnect', function () {
        io.sockets.emit('update', people[socket.id] + ' has left the server');
        delete people[socket.id];
        io.sockets.emit('update-people', people, profilepictures)
    });

    //checks if the name the user has chosen is already in use
    socket.on('CheckName', function (name, password) {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, function (err, hashedPassword) {
                console.log(hashedPassword);
                if (Object.values(people).includes(name.trim())){
                    io.to(socket.id).emit('AlreadyConnected');
                } else if ((name.trim().length > 20) || (password.length > 20)) {
                    io.to(socket.id).emit('NamePasswordTooLong');
                } else {

                    //Get all informations from the database and check if the username exists and the password is correct
                    var SQLRun;
                    var body = JSON.stringify({
                        "commands": "SELECT * FROM USERINFORMATION;",
                        "limit": "100",
                        "separator": ";",
                        "stop_on_error": "no"
                    });
                    var xhr = new XMLHttpRequest();
                    xhr.withCredentials = true;
                    xhr.addEventListener("readystatechange", function () {
                        if (this.readyState === 4) {
                            SQLRun = JSON.parse(this.responseText);
                            var rows;
                            var usernamelist = [];
                            var passwords = [];
                            var xhr2 = new XMLHttpRequest();
                            xhr2.withCredentials = true;
                            xhr2.addEventListener("readystatechange", function () {
                                if (this.readyState === 4) {
                                    rows = JSON.parse(this.responseText);
                                    for (i = 0; i < rows.results[0].rows.length; i++) {
                                        usernamelist.push(rows.results[0].rows[i][0]);
                                        passwords.push(rows.results[0].rows[i][1]);
                                    }
                                    console.log(usernamelist);
                                    console.log(passwords);
                                    if(!(usernamelist.includes(name.trim()))){
                                        console.log(hashedPassword);
                                        var body3 = JSON.stringify({
                                            "commands": "INSERT INTO USERINFORMATION VALUES (\'" + name.trim() + "\',\'" + hashedPassword + "\');",
                                            "limit": "100",
                                            "separator": ";",
                                            "stop_on_error": "no"
                                        });
                                        var xhr3 = new XMLHttpRequest();
                                        xhr3.withCredentials = true;
                                        xhr3.addEventListener('readystatechange', function () {
                                            if (this.readyState === 4) {
                                                console.log("NameOk");
                                                io.to(socket.id).emit('NameOK', name.trim());
                                            }
                                        });
                                        xhr3.open("POST", "https://dashdb-txn-sbox-yp-lon02-02.services.eu-gb.bluemix.net/dbapi/v4/sql_jobs");
                                        xhr3.setRequestHeader("Content-Type", "application/json");
                                        xhr3.setRequestHeader("Authorization", "Bearer " + accesstoken);
                                        xhr3.send(body3);
                                    } else {
                                        bcrypt.compare(password, passwords[usernamelist.indexOf(name)], function (err, res) {
                                            if (res){
                                                io.to(socket.id).emit('NameOK', name.trim());
                                            } else {
                                                io.to(socket.id).emit('WrongPassword');
                                            }
                                        })
                                    }
                                }
                            });
                            xhr2.open("GET", "https://dashdb-txn-sbox-yp-lon02-02.services.eu-gb.bluemix.net/dbapi/v4/sql_jobs/" + SQLRun.id);
                            xhr2.setRequestHeader("Content-Type", "application/json");
                            xhr2.setRequestHeader("Authorization", "Bearer " + accesstoken);
                            xhr2.send();
                        }
                    });
                    xhr.open("POST", "https://dashdb-txn-sbox-yp-lon02-02.services.eu-gb.bluemix.net/dbapi/v4/sql_jobs");
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.setRequestHeader("Authorization", "Bearer " + accesstoken);
                    xhr.send(body);
                }


            })
        });
    });

    //sends the data from the sending sockets to all other connected sockets
    socket.on('file upload', function (data, filename) {
        io.sockets.emit('file sent', data, uploadid, people[socket.id], filename);
        uploadid++;
    });

    socket.on('profile picture upload', function (data, filetype) {
        var type = filetype.split('/')[1];
        var base64data = data.split('base64,')[1];
        let buff = Buffer.from(base64data, 'base64');
        fs.writeFileSync('Verification.' + type, buff);
        VerifyProfilePicture(socket.id, type, data);
    })
});

function VerifyProfilePicture(socketid, type, data) {
    var imageFile = fs.createReadStream('./Verification.' + type);
    var classifier_ids = ["default"];
    var threshold = 0.4;
    var classifierArray = [];
    var sortedClassifiers = [];

    var params = {
        images_file: imageFile,
        classifier_ids: classifier_ids,
        threshold: threshold
    };

    visualRecognition.classify(params, function (err, response) {
        if (err){
            console.log(err);
        } else {
            //console.log("response: " + response);
            classifierArray = response.images[0].classifiers[0].classes;
            //console.log("classifierArray: " + classifierArray);
            var ArrayLength = classifierArray.length;
            for(var i = 0; i < ArrayLength; i++){
                sortedClassifiers.push(classifierArray[i].class);
            }
            //console.log(sortedClassifiers);
            if(sortedClassifiers.includes('face')){
                profilepictures[socketid] = data;
                io.to(socketid).emit('ContainsFace');
            } else {
                io.to(socketid).emit('NoFace');
            }
        }
    });
}

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

/*
http.listen(8080, function () {
    console.log('listening on *:8080');
});
*/

/*
Sequence Diagram:
- Sending: https://sequencediagram.org/index.html#initialData=C4S2BsFMAIFlIM4IIYHNIHoBiIrQMqQB2AJiEagFADC4IxwAjALQB8hATgG6QcBc0AMYALZMGgBbRCnQAaaADNcMAK4AHcAHtkJSpx4c2tekWAAmASLGTpaSPKV4EDPbwNG6DAMyXR4qUh2NJ6mLOxuvAIA7sIgCGq8NoHorty8HibAPtAxcQkcSTKQQA
- Login: https://sequencediagram.org/index.html#initialData=C4S2BsFMAIBkHsDmIB20AKAneBjSBnfAKAGFwRIVgBGAWgD4BlSTANxYC5oSALSHANYA5AIYBbSEWZsWDMhSrUuoiQHkA0qXKUaDae0xcAUvFRSWBudqoAmLgFcADgBMRwSABpoT1+9qPIeEcocxlMKwVgAGYHFzdPbzi-AKCoIA
 */