import express from 'express';
import { fetchWithTimeout } from './fetchWithTimeout';
import { parseError, sleep } from './utils';
import { Checker } from './CheckerClass';
import axios from 'axios';
import cors from 'cors'

const app = express();
const port = process.env.PORT || 3000;
async function setEnv() {
  // await getDataAndSetEnvVariables(`https://mytghelper.glitch.me/configuration`);
  await getDataAndSetEnvVariables(`https://api.npoint.io/cc57d60feea67e47b6c4`);
}

setEnv();

app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Accept'] // Allowed headers
}));

// const BLOCKED_IPS = []; // Add IPs to block

// app.use((req, res, next) => {
//     // Extract IP from rawHeaders
//     let ip;
//     const rawHeaders = req.rawHeaders;
//     const index = rawHeaders.findIndex(header => header.toLowerCase() === 'true-client-ip');
//     if (index !== -1 && rawHeaders[index + 1]) {
//         ip = rawHeaders[index + 1];
//     } else {
//         ip = req.ip; // Fallback to req.ip if header is missing
//     }

//     console.log(`Client IP: ${ip}`); // Log the IP for debugging

//     if (BLOCKED_IPS.includes(ip)) {
//         return res.status(403).send('Access Denied');
//     }
//     next();
// });
app.use(express.urlencoded({ extended: true }));
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
      await fetchWithTimeout(`${client.promoteRepl}/exit`);
      await sleep(40000);
    }
  }
});


app.get('/tgclientoff/:processId', (req, res, next) => {
  const clientId = <string>req.query.clientId
  Checker.getinstance().getClientOff(clientId, req.params.processId);
  res.send("Ok")
})
app.get('/exit', (req, res) => {
  process.exit(1);
  res.send("Exitting");
})
app.get('/receive', (req, res, next) => {
  const clientId = <string>req.query.clientId
  Checker.getinstance().receivePing(clientId);
  res.send("Ok")
})

app.get('/forward*', async (req, res) => {
  let targetHosts = [process.env.tgcms, process.env.uptimeChecker, process.env.tgHelper]; // Default target host from environment variable

  if (req.query.host) {
    targetHosts = (<string>req.query.host).split(','); // Expect multiple hosts to be provided as a comma-separated list
  }

  try {
    console.log(req.url);
    const endpoint = req.url.replace('/forward', ''); // The endpoint part of the URL to append
    let response = null;

    // Loop through target hosts and attempt to fetch from each until a successful response
    for (const targetHost of targetHosts) {
      const finalUrl = `${targetHost}${endpoint}`;
      console.log("Trying URL:", finalUrl);

      try {
        response = await fetchWithTimeout(finalUrl);
        if (response && response.status >= 200 && response.status < 400) {
          // If a successful response is received, break the loop
          console.log("Success with URL:", finalUrl);
          break;
        }
      } catch (error) {
        console.log(`Error fetching from ${finalUrl}:`, parseError(error));
        // Continue to the next targetHost in case of error
      }
    }

    if (response) {
      res.status(response.status).send(response.data);
    } else {
      res.status(500).send('All target hosts failed.');
    }
  } catch (error) {
    console.log("Unexpected error:", parseError(error));
    res.status(500).send('Internal Server Error');
  }
});


app.get('/bridge/forward', async (req, res) => {
  const externalUrl = <string>req.query.url;
  const queryParams = { ...req.query };
  delete queryParams.url;
  if (!externalUrl) {
    return res.status(400).json({
      error: 'The "url" query parameter is required.',
    });
  }

  try {
    const response = await axios.get(externalUrl, { params: queryParams });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: `Error forwarding request: ${error.message}`,
    });
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
      await fetchWithTimeout(`${client.promoteRepl}/exit`);
      await sleep(40000);
    }
  }
});

app.get('/promoteconnect/:num', async (req, res, next) => {
  try {
    const clientId = req.query.clientId;
    const processId = req.params.num;
    const connectResp = await fetchWithTimeout(`https://${clientId}.glitch.me/getprocessid`, { timeout: 10000 });
    console.log(connectResp.data)
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
  const result = await fetchWithTimeout(`https://api.npoint.io/1781b67a7eff56a10bb8`);
  await Checker.setClients(result.data)
}
setInterval(async () => {
  try {
    await setClients();
  } catch (error) {
    parseError(error, "Error in Refreshing Clients")
  }
}, 1000 * 60 * 5);
setClients()

