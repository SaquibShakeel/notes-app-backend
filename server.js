require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const { logger, logEvents } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');
var cron = require('node-cron');
const PORT = process.env.PORT || 3500;

connectDB();

app.use(logger);

app.use(cors(corsOptions));

app.use(express.json());

cron.schedule("*/14 * * * *", () => {
  console.log("running a task every 14 minute");
});

app.use(cookieParser());

// Serve static files....
app.use('/', express.static(path.join(__dirname , 'public')));

app.use('/', require('./routes/root'));

app.use('/auth', require('./routes/authRoutes'));

app.use('/users', require('./routes/userRoutes'));

app.use('/notes', require('./routes/noteRoutes'));

app.all('*', (req, res) => {
    res.status(404);
    if(req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    }else if(req.accepts('json')) {
        res.json({error: '404 Not found'});
    }else {
        res.type('txt').send('404 Not found');
    }
    });

app.use(errorHandler);

mongoose.connection.once('open', () => {
    console.log("Connected to database");
    app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    });
});

mongoose.connection.on('error', (err) => {
    console.log(err);
    logEvents(
      `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
      "mongoErrLog.log"
    );
    }
);
