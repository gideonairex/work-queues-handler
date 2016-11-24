[![BuildStatus](https://travis-ci.org/gideonairex/work-queues-handler.svg?branch=master)](https://travis-ci.org/gideonairex/work-queues-handler)

# Work queues handler
A wrapper for amqplib and using the pattern work-queues with a
additional features. Unlike RPC calls it needs to have a unique queue
that it should return to so this have ways to handle requests.

# Features
1. Can have parallelism
2. Can have serial calls inside a parallel call.
