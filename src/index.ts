import express from 'express';
import { fetchWithTimeout } from './fetchWithTimeout';
import { parseError, sleep } from './utils';
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

app.get('/forward*', async (req, res) => {
  let targetHost = <string>process.env.tgcms;
  if (req.query.host) {
    targetHost = <string>req.query.host;
  }
  try {
    console.log(req.url);
    const finalUrl = `${targetHost}${req.url.replace('/forward', '')}`
    console.log("final:", finalUrl)
    const response = await fetchWithTimeout(finalUrl)
    res.status(response?.status).send(response?.data);
  } catch (error) {
    console.log(parseError(error))
    res.status(500).send('Internal Server Error');
  }
});

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
  const clients = await Checker.getClients();
  for (const client of clients) {
    const url = `${client.promoteRepl}/${endpoint}`
    console.log("Trying : ", url)
    await fetchWithTimeout(url);
    await sleep(500)
  }
}

Checker.getinstance()
Checker.setClients([
  {
    clientId: "sneha1",
    promoteRepl: "https://snehaProm1.glitch.me"
  },
  {
    clientId: "arpitha1",
    promoteRepl: "https://arpithaprom1.glitch.me"
  },
  {
    clientId: "nidhi1",
    promoteRepl: "https://nidhiprom1.glitch.me"
  },
  {
    clientId: "divya1",
    promoteRepl: "https://divyaprom1.glitch.me"
  },
  {
    clientId: "ramya2",
    promoteRepl: "https://ramyaprom2.glitch.me"
  },
  {
    clientId: "keerthi2",
    promoteRepl: "https://keerthiprom2.glitch.me"
  },
  {
    clientId: "arpitha2",
    promoteRepl: "https://arpithaprom2.glitch.me"
  },
  {
    clientId: "divya2",
    promoteRepl: "https://divyaprom2.glitch.me"
  },
  {
    clientId: "meghana1",
    promoteRepl: "https://meghanaprom1.glitch.me"
  },
  {
    clientId: "kavya2",
    promoteRepl: "https://kavyaprom2.glitch.me"
  },
  {
    clientId: "shruthi2",
    promoteRepl: "https://shruthiprom2.glitch.me"
  },
  {
    clientId: "sowmya2",
    promoteRepl: "https://sowmyaprom2.glitch.me"
  }

])