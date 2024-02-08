const captcha = require('trek-captcha');
const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// {
//   '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d': {
//     token: 'opbvv',
//     timestamp: 1707377491642,
//   }
// }
const captchaDb = {}; // Should use a real db in production. Redis with key expiration would be a good fit for this

app.get('/captcha-image', async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'No id' });
  }

  const { token, buffer } = await captcha({ size: 6 });

  captchaDb[id] = {
    token,
    timestamp: Date.now() + 3 * 60 * 1000, // valid for 3 minutes
  };

  return res.contentType('image/png').send(buffer);
});

app.post('/data', async (req, res) => {
  const { id, token, data } = req.body;

  if (!id || !token) {
    return res.status(400).json({ message: 'No token' });
  }

  if (
    !captchaDb[id] ||
    captchaDb[id].token !== token ||
    Date.now() > captchaDb[id].timestamp
  ) {
    return res.status(400).json({ message: 'Verification failed!' });
  }

  // delete verified captcha
  delete captchaDb[id];

  // then process the data such as putting it in db or something

  return res.status(200).send({ message: 'Data submitted successfully' });
});

app.listen(4000, () => {
  console.log('Server running on port 4000');
});
