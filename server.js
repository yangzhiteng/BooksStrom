var http = require('http'),
    fs = require('fs'),
    url = require('url'),
    mime = require('mime');
function readBooks(callback) {
    fs.readFile('./books.json', 'utf-8', function (err, data) {
        if (err || data == '') {
            callback([])
        } else {
            callback(JSON.parse(data))
        }
    })
}
function writeBooks(data, callback) {
    fs.writeFile('./books.json', JSON.stringify(data), callback)
}
var server = http.createServer(function (req, res) {
    var urlObj = url.parse(req.url, true),
        pathname = urlObj.pathname;
    if (pathname == '/') {
        res.writeHead(200, {'content-type': 'text/html;charset=utf-8'});
        fs.createReadStream('./index.html').pipe(res);
    } else if (/^\/books(\/\d+)?$/.test(pathname)) {
        var id = pathname.match(/^\/books(\/\d+)?$/)[1];
        switch (req.method) {
            case 'GET':
                if (id) {
                    readBooks(function (data) {
                        var book = data.find(function (item) {
                            return item.id == id.slice(1);
                        });
                        if (book) {
                            res.end(JSON.stringify(book));
                        } else {
                            res.end(JSON.stringify({}));
                        }
                    })
                } else {
                    readBooks(function (data) {
                        res.end(JSON.stringify(data));
                    })
                }
                break;
            case 'POST':
                var str = '';
                req.on('data', function (chunk) {
                    str += chunk;
                });
                req.on('end', function () {
                    var book = JSON.parse(str);
                    readBooks(function (data) {
                        book.id = data.length ? parseFloat(data[data.length - 1]['id'] + 1) : 1;
                        data.push(book);
                        writeBooks(data, function () {
                            res.end(JSON.stringify(book));
                        })
                    })
                });
                break;
            case 'PUT':
                if (id) {
                    var str = '';
                    req.on('data', function (chunk) {
                        str += chunk;
                    });
                    req.on('end', function () {
                        var book = JSON.parse(str);
                        readBooks(function (data) {
                            data = data.map(function (item) {
                                if (item.id == id.slice(1)) {
                                    return book;
                                }
                                return item;
                            });
                            writeBooks(data, function () {
                                res.end(JSON.stringify(book));
                            })
                        })
                    })
                }
                break;
            case 'DELETE':
                if (id) {
                    readBooks(function (data) {
                        data = data.filter(function (item) {
                            return item.id != id.slice(1);
                        });
                        writeBooks(data, function () {
                            res.end(JSON.stringify({}));
                        })
                    })
                }
                break;
        }
    } else {
        fs.exists('.' + pathname, function (flag) {
            if (flag) {
                res.writeHead(200, {'content-type': mime.lookup(pathname) + ';charset=utf-8'});
                fs.createReadStream('.' + pathname).pipe(res);
            } else {
                res.statusCode = 404;
                res.end('Not Found');
            }
        })
    }
});
server.listen(1234, function () {
    console.log('成功')
});
