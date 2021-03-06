const fastify = require('fastify')({ logger: true })
require('dotenv').config()

fastify.register(require('fastify-cors'), { 
  // put your options here
  
})

fastify.register(require('fastify-multipart'), {
  addToBody: true,
  sharedSchemaId: 'MultipartFileType',
})

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: String,
  short_url: Number
});

mongoose.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true
});



// Declare a route
fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

fastify.get('/api/timestamp', async (request, reply) => {
  const date = new Date(Date.now());
  return {"unix": date.getTime() ,"utc": date.toUTCString()};
});

fastify.get('/api/timestamp/:date_string', async (request, reply) => {
  const DATE_STRING = request.params.date_string;
  if (DATE_STRING === "") {
    const date = new Date(Date.now());
    return {"unix": date.getTime() ,"utc": date.toUTCString()};
  } else if (DATE_STRING.includes("-") && new Date(DATE_STRING).toString() !== "Invalid Date") {
    const date = new Date(DATE_STRING);
    return {"unix": date.getTime() ,"utc": date.toUTCString()};
  } else {
    const unixtime = new Date(DATE_STRING * 1);
    if (unixtime.toString() !== "Invalid Date") {
      return {"unix": unixtime.getTime() ,"utc": unixtime.toUTCString()};
    } else {
      return {"error" : "Invalid Date" };
    }
  }
});

fastify.get("/api/whoami", async (request, reply) => {
  const userAgent = request.headers;
  return {"ipaddress":userAgent["x-forwarded-for"],"language":userAgent["accept-language"], "software": userAgent["user-agent"]}
});


// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000)
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()