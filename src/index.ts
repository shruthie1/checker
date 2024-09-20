import express from 'express';
import { fetchWithTimeout } from './fetchWithTimeout';
import { parseError, sleep } from './utils';
import { Checker } from './CheckerClass';

const app = express();
const port = process.env.PORT || 3000;
async function setEnv() {
  await getDataAndSetEnvVariables(`https://mytghelper.glitch.me/configuration`);
}

setEnv();

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
  const result = await fetchWithTimeout(`https://uptimechecker2.glitch.me/maskedcls`);
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
  const result = await fetchWithTimeout(`https://uptimechecker2.glitch.me/maskedcls`);
  const clients = result?.data;
  for (const client of clients) {
    if (client.clientId.toLowerCase().includes('2')) {
      await fetchWithTimeout(`${client.repl}/exit`);
      await sleep(40000);
    }
  }
});

app.get('/promoteconnect/:num', async (req, res, next) => {
  try {
    const clientId = req.query.clientId;
    const processId = req.params.num;
    const connectResp = await fetchWithTimeout(`https://${clientId}.glitch.me/getprocessid`, { timeout: 10000 });
    if (connectResp.data.ProcessId === processId) {
      await fetchWithTimeout(`https://${clientId}.glitch.me/tryToConnect/${processId}`, { timeout: 10000 });
      res.send(true);
    } else {
      console.log(`Actual Process Id from https://${clientId}.glitch.me/getprocessid :: `, connectResp.data.ProcessId, " but received : ", processId);
      console.log("Request received from Unknown process");
      res.send(false);
    }
  } catch (error) {
    parseError(error, "Some Error here:")
    res.send(false);
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

export async function getDataAndSetEnvVariables(url: string) {
  try {
      const response = await fetch(url);
      const jsonData: any = await response.json();
      for (const key in jsonData) {
          console.log("Setting Key", key)
          process.env[key] = jsonData[key];
      }
      console.log('Environment variables set successfully!');
  } catch (error) {
      console.error('Error retrieving data or setting environment variables:', error);
  }
}

Checker.getinstance();
async function setClients() {
  const result = await fetchWithTimeout(`https://uptimechecker2.glitch.me/maskedcls`);
  await Checker.setClients(result.data)
}
setClients()

