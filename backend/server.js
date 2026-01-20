const http = require('http');
const chalk = require('chalk').default;

const app = require('./app/app');

let server;
server = http.createServer(app);
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}.`);
});
