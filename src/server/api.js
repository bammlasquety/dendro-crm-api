// src/server/api.js
const handler = {};

handler.handleRequest = ({ req, res }) => {
  const routeURL = req.url.substring(4);

  const payload = {}; // your payload logic here

  // example response
  res.json({ route: routeURL, payload });
};

export default handler;
