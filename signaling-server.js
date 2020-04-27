
var PORT = 8082;

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser')
var main = express()
var server = http.createServer(main)
var io = require('socket.io').listen(server);
//io.set('log level', 2);

server.listen(PORT, null, function() {
    console.log("Listening on port " + PORT);
});
//main.use(express.bodyParser());

main.get('/onAir', function(req, res) { res.sendFile(__dirname + '/client.html'); });

var channels = {};
var sockets = {};
var conn = 0;

io.sockets.on('connection', function(socket) {
    socket.channels = {};
    sockets[socket.id] = socket;

    console.log("[" + socket.id + "] connection accepted");
    socket.on('disconnect', function() {
        for (var channel in socket.channels) {
            part(channel);
        }
        conn = conn - 1;
        console.log("No. conn" + conn + "  [" + socket.id + "] disconnected");
        delete sockets[socket.id];
    });


    socket.on('join', function(config) {
        conn = conn + 1;
        console.log(conn + "  [" + socket.id + "] join ", config);
        var channel = config.channel;

        if (channel in socket.channels) {
            console.log("[" + socket.id + "] ERROR: already joined ", channel);
            return;
        }

        if (!(channel in channels)) {
            channels[channel] = {};
        }


        for (id in channels[channel]) {
            console.log("\n\n\n\n" + channels[channel][id] + "\n\n" + socket.id + "\n\n\n\n\n\n")
            channels[channel][id].emit('addPeer', { 'peer_id': socket.id, 'should_create_offer': false });
            socket.emit('addPeer', { 'peer_id': id, 'should_create_offer': true });
        }

        channels[channel][socket.id] = socket;
        socket.channels[channel] = channel;
    });

    function part(channel) {
        console.log("[" + socket.id + "] part ");

        if (!(channel in socket.channels)) {
            console.log("[" + socket.id + "] ERROR: not in ", channel);
            return;
        }

        delete socket.channels[channel];
        delete channels[channel][socket.id];

        for (id in channels[channel]) {
            channels[channel][id].emit('removePeer', { 'peer_id': socket.id });
            socket.emit('removePeer', { 'peer_id': id });
        }
    }
    socket.on('part', part);

    socket.on('relayICECandidate', function(config) {
        var peer_id = config.peer_id;
        var ice_candidate = config.ice_candidate;
        console.log("[" + socket.id + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);

        if (peer_id in sockets) {
            sockets[peer_id].emit('iceCandidate', { 'peer_id': socket.id, 'ice_candidate': ice_candidate });
        }
    });

    socket.on('relaySessionDescription', function(config) {
        var peer_id = config.peer_id;
        var session_description = config.session_description;
        console.log("[" + socket.id + "] relaying session description to [" + peer_id + "] ", session_description);

        if (peer_id in sockets) {
            sockets[peer_id].emit('sessionDescription', { 'peer_id': socket.id, 'session_description': session_description });
        }
    });
});