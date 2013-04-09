
var fs =require('fs'),
    mime = require('mime'),
    _ = require('underscore');

function respond404(res){
    // logger 
    res.writeHead(404);
    res.end();
}

function comboFiles(target, combos){

    var content = _.map(combos, function(filepath) {
        return fs.readFileSync(filepath);
    }).join('\r\n');

    fs.writeFileSync(target, content);
}

function respondFile(filepath, res){
    fs.stat(filepath, function(err, stat) {

        res.statusCode = 200;
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', mime.lookup(filepath));
        res.setHeader('Server', 'livepool');

        fs.createReadStream(filepath).pipe(res);
    });
}

function comboResponder(handler, req, res, options) {
    var opt = {
        forceUpdate: false
    };
    _.extend(opt, options);

    if(handler && _.isArray(handler.action)){
        var filepath = [], fileNotFound = false, maxMTime = new Date('1970').getTime();
        var target = handler.respond.filepath;
        var targetMTime, targetStat;
        // check all action file is exists
        _.each(handler.action, function(item){
            item = path.resolve(handler.base, item);
            filepath.push(item);
            // fileNotFound
            if(!fs.existSync(item)){
                fileNotFound = true;
                return ;
            }

            var stat = fs.statSync(item);
            if(stat && stat.mtime.getTime() > maxMTime){
                maxMTime = stat.mtime.getTime();
            }
        });

        // one of th combo file not found
        if(fileNotFound){
            respond404(res);
            return ;
        }

        // check target is exits and modify time is shorten than 500ms
        if(opt.forceUpdate || !(fs.existSync(target) && targetStat = fs.statSync(target) && (targetStat.mtime.getTime() - maxMTime) < 500)){
            comboFiles(target, filepath);
        }
        respondFile(target, res);
    }else{
        respond404(res);
    }
}

module.exports = comboResponder;