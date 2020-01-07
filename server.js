const fastify = require('fastify')({ logger: true })

// Declare a route
fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

fastify.get('/api/timestamp/:date_string', async (request, reply) => {
  const DATE_STRING = request.params.date_string;

  if (DATE_STRING === "") {
    const date = new Date(Date.now());
    return {"unix": date.getTime() ,"utc": date.toUTCString()};
  } else if (DATE_STRING.includes("-")) {
    const date = new Date(DATE_STRING);
    return {"unix": date.getTime() ,"utc": date.toUTCString()};
  } else {
    const unixtime = new Date(DATE_STRING * 1000);
    console.log(unixtime.toString())
    if (unixtime.toString() !== "Invalid Date") {
      return {"unix": unixtime.getTime() ,"utc": unixtime.toUTCString()};
    } else {
      return {"error" : "Invalid Date" };
    }
  }
})

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