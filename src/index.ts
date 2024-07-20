import express from 'express';
import { fetchWithTimeout } from './fetchWithTimeout';
import { sleep } from './utils';
import { Checker } from './CheckerClass';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.get('/', (req, res) => {
  res.send("Hello World");
})
app.get('/sendtoall', (req, res, next) => {
  res.send(`Sending ${req.query.query}`);
  next()
}, async (req, res) => {
  const endpoint = <string>req.query.query;
  await sendToAll(endpoint)
});

app.get('/exitPrimary', (req, res, next) => {
  res.send(`exitting Primary`);
  next()
}, async (req, res) => {
  const result = await fetchWithTimeout(`https://uptimechecker2.onrender.com/maskedcls`);
  const clients = result?.data;
  for (const client of clients) {
    if (client.clientId.toLowerCase().includes('1')) {
      await fetchWithTimeout(`${client.repl}/exit`);
      await sleep(40000);
    }
  }
});


app.get('/tgclientoff/:processId', (req, res, next) => {
  const clientId = <string>req.query.clientId
  Checker.getinstance().getClientOff(clientId, req.params.processId);
  res.send("Ok")
})

app.get('/receive', (req, res, next) => {
  const clientId = <string>req.query.clientId
  Checker.getinstance().receivePing(clientId);
  res.send("Ok")
})

app.get('/exitSecondary', (req, res, next) => {
  res.send(`exitting Secondary`);
  next()
}, async (req, res) => {
  const result = await fetchWithTimeout(`https://uptimechecker2.onrender.com/maskedcls`);
  const clients = result?.data;
  for (const client of clients) {
    if (client.clientId.toLowerCase().includes('2')) {
      await fetchWithTimeout(`${client.repl}/exit`);
      await sleep(40000);
    }
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


async function sendToAll(endpoint: string) {
  const result = await fetchWithTimeout(`https://uptimechecker2.onrender.com/maskedcls`);
  const clients = result?.data;
  for (const client of clients) {
    const url = `${client.repl}/${endpoint}`
    console.log("Trying : ", url)
    await fetchWithTimeout(url);
    await sleep(500)
  }
}

Checker.getinstance()
Checker.setClients([{
  clientId:"sneha1",
  promoteRepl: "https://snehaProm1.glitch.me"
}])