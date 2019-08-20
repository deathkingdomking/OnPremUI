const chokidar = require('chokidar'); 
const createError = require('http-errors');
const express = require('express');
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const services = require('./service/db_service');
const cors = require('cors');
const indexRouter = require('./routes/index');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/public',express.static('public'));
app.use(cookieParser());

app.use('/recognition', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


let wss;
function handleWsConnection(wbserver) {
    if(!wss) wss = wbserver;
    return function (ws, req) {
      console.log("a new client has received---");
    }
}

services.consume((msgs) => {
    if(msgs.length === 0) return;
    if(wss) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(msgs))
            }
        })
    }
});

module.exports =  {
  app: app,
  wsHandler: handleWsConnection,
};
