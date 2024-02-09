import { Hono } from 'https://deno.land/x/hono@v3.12.11/mod.ts';
import { serveStatic } from 'https://deno.land/x/hono@v3.12.11/middleware.ts';
import captcha from 'npm:trek-captcha@0.4.0';

const captchaDb = {}; // Should use a real db in production. Redis with key expiration would be a good fit for this
// {
//   '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d': {
//     token: 'opbvv',
//     timestamp: 1707377491642,
//   }
// }

const app = new Hono();

app.use('*', serveStatic({ root: './static' }));

app.get('/captcha-image', async c => {
  const id = c.req.query('id');

  if (!id) {
    c.status(400);
    return c.json({ message: 'No id' });
  }

  const { token, buffer } = await captcha({ size: 6 });

  captchaDb[id] = {
    token,
    timestamp: Date.now() + 3 * 60 * 1000, // valid for 3 minutes
  };

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
    },
  });
});

app.post('/data', async c => {
  const { id, token, data } = await c.req.json();

  if (!id || !token) {
    c.status(400);
    return c.json({ message: 'No token' });
  }

  if (
    !captchaDb[id] ||
    captchaDb[id].token !== token ||
    Date.now() > captchaDb[id].timestamp
  ) {
    c.status(400);
    return c.json({ message: 'Verification failed!' });
  }

  // delete verified captcha
  delete captchaDb[id];

  // then process the data such as putting it in db or something

  return c.json({ message: 'Data submitted successfully' });
});

Deno.serve(app.fetch);
