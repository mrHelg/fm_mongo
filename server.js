const http = require('http');
const express = require('express');
const yup = require('yup');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>{console.log('Server started')});