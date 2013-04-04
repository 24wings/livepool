
var http = require('http'),
    https = require('https'),
    httpProxy = require('http-proxy'),
    proxy = new httpProxy.RoutingProxy(),
    fs = require('fs'),
    net = require('net'),
    path = require('path'),
    _ = require('underscore');

var request = require('./request'),
    response = require('./response');

var httpServer, httpsServer, https2http;

var livepool = module.exports = {};
livepool.verson = '0.0.1';
livepool.startTime = (new Date()).getTime();

var config = liveRequire('config'),
    logger = liveRequire('logger'),
    util = liveRequire('util'),
    eventCenter = liveRequire('event');

var global = config.global,
    httpPort = global.http,
    httpsPort = global.https,
    proxyAgent = global.proxy || '',
    proxyAgent = proxyAgent.split(':'),
    localName = 'localhost';

function publish(source, methodName, newMethodName) {
    livepool[newMethodName || methodName] = source[methodName].bind(source);
}

function liveRequire(module){
    return livepool[module] = require('./livepool/' + module);
}

livepool.run = function (){
    logger.writeline();
    logger.log('livepool'.cyan + ' is running, port: ' + String(httpPort).cyan);

    // 加载替换和路由规则
    config.init(eventCenter);
    config.loadRules();

    var options = {
        key: fs.readFileSync('keys/key.pem'),
        cert: fs.readFileSync('keys/cert.pem')
    };

    httpServer = http.createServer(function (req, res){

        var reqInfo = request.getReqInfo(req);
        var handler = config.getHandler(reqInfo);
        if(handler){
            var responder = require('./livepool/responder/local');
            responder(filepath, req, res);
        }else{
            var host = req.headers.host;
            proxy.proxyRequest(req, res, {
                host: proxyAgent[0] || host,
                port: proxyAgent[1] || 80
            });
        }
        
    }).listen(httpPort);

    https2http = new httpProxy.HttpProxy({
        target: {
            host: localName,
            port: httpPort
        }
    });

    httpsServer = https.createServer(options, function (req, res){
        console.log('https request proxied...');
        https2http.proxyRequest(req, res);
    }).listen(httpsPort);

    proxyHttps();
};

// proxy https request from httpServer to httpsServer, stolen form nproxy
function proxyHttps() {
    httpServer.on('connect', function(req, socket, upgradeHead) {
        var netClient = net.createConnection(httpsPort);

        netClient.on('connect', function() {
            // logger.info('connect to https server successfully!');
            socket.write("HTTP/1.1 200 Connection established\r\nProxy-agent: Netscape-Proxy/1.1\r\n\r\n");
        });

        socket.on('data', function(chunk) {
            netClient.write(chunk);
        });
        socket.on('end', function() {
            netClient.end();
        });
        socket.on('close', function() {
            netClient.end();
        });
        socket.on('error', function(err) {
            logger.error('socket error ' + err.message);
            netClient.end();
        });

        netClient.on('data', function(chunk) {
            socket.write(chunk);
        });
        netClient.on('end', function() {
            socket.end();
        });
        netClient.on('close', function() {
            socket.end();
        });
        netClient.on('error', function(err) {
            logger.error('netClient error ' + err.message);
            socket.end();
        });

    });
};

livepool.stop = function (){
    if(httpSever){
        httpSever.close();
    }
};

livepool.run();

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function (chunk){
    if(chunk == "stop\r\n"){
        livepool.stop();
        process.exit(1);
    }
});

process.stdin.on('end', function () {
    process.stdout.write('end');
});
