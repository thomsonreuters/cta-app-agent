# Execution Data Service Application Program Interface

#### Rest API
* [Send a Result](#send-a-result)

#### Send a Result
**Request**
```ruby
POST /results
{
  "status": String (ok, partial, inconclusive, failed),
}
```
**Example**
```ruby
POST /results
{
  "status": "failed",
}
```
**Response**
```ruby
201
{
  "result": {
    "queue": "cta.eds",
    "messageCount": 0,
    "consumerCount": 1
  },
  "params": {
    "queue": "cta.eds",
    "json": {
      "nature": {
        "type": "result",
        "quality": "create"
      },
      "payload": {
        "status": "failed",
        "executionId": "582bbd88a0350537b899ff87",
        "testSuiteId": "582bbd88b73a104839b50971",
        "testId": "582bbd88b73a104839b50972",
        "index": 1,
        "ip": "10.194.187.27",
        "hostname": "mymachine",
        "timestamp": 1479261582375
      }
    },
    "autoDelete": false,
    "expires": 0,
    "buffer": "none"
  }
}
```
