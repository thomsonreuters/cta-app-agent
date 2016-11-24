# Execution Data Contracts

## Input
* [Execution Run](#execution-run)
* [Execution Read](#execution-read)
* [Execution Cancel](#execution-cancel)

## Output
* [Send a State](#send-a-state)
* [Send a Result](#send-a-result)
* [Send an Instance Update](#send-an-instance-update)

### Execution Run
Contract
 ```javascript
 {
   "nature": {
     "type": "execution",
     "quality": "run"
   },
   "payload": {
   "execution": {
     "id": Identifier,
     "requestTimestamp": Number,
     "pendingTimeout": Number,
     "runningTimeout": Number
   },
   "testSuite": {
     "id": Identifier,
     "name": String,
     "inputRepository": [{
       "type": 'git',
       "url": "https://….git",
       "mountpoint": "C:/temp"
     }],
     "outputRepository": Array<Repository>,
     "tests": [{
       "id": Identifier,
       "name": String,
       "description": String,
       "type": String, 	// commandLine...
       "stages": [{
         "name": "stage",
         "run": "notepad.exe",
         "stop": "echo Test - Do stop operations...",
         "cwd": "C:\\tmp",
         "env": [{
           "key": "foo", "value": "bar", // user values
           "key": "CTA_EXECUTION_DIR" : "value": execution.id // added by jobmanager
         }],
         "mandatory": true,
         "timeout": 1000
       }]
     }]
   }
 }
 ```

### Execution Read
Contract
```javascript
{
  "nature": {
    "type": "execution",
    "quality": "read"
  },
  "payload": {
    "execution": {
      "id": Identifier,
      "requestTimestamp": Number,
      "pendingTimeout": Number,
      "runningTimeout": Number
    },
    "queue": String 		// probably the execution.id
  }
}
```

### Execution Cancel
Contract
```javascript
{
  "nature": {
    "type": "execution",
    "quality": "cancel"
  },
  "payload": {
    "execution": {
      "id": Identifier,
    },
    "mode": String, // manual, executionTimeout, pendingTimeout
  }
}
```

### Send a State
Contract: 
```javascript
{
  "nature": {
    "type": "state",
    "quality": "create"
    },
  "payload": {
    "executionId": id(Execution),
    "timestamp": Long,
    "status": String,
    "index": Long,
    "hostname": String
  }
}
```
Example: 
```javascript
{
  "nature": {
    "type": "state",
    "quality": "create"
    },
  "payload": {
    "executionId": "57c7edbc327a06452c50c984",
    "timestamp": 10,
    "status": "finished",
    "index": 1,
    "hostname": "mymachine"
  }
}
```

## Send a Result
Contract: 
```javascript
{
  "nature": {
    "type": "result",
    "quality": "create"
    },
  "payload": {
    "executionId": id(Execution),
    "testId": id(Test),
    "timestamp": Long,
    "status": String,
    "index": Long,
    "hostname": String
  }
}
```
Example: 
```javascript
{
  "nature": {
    "type": "result",
    "quality": "create"
    },
  "payload": {
    "executionId": "57c7edbc327a06452c50c984",
    "testId": "57bc0db530b0d82a183ceb91",
    "timestamp": 10,
    "status": "failed",
    "index": 1,
    "hostname": "mymachine"
  }
}
```

### Send an Instance Update:
Contract: 
```javascript
{
    "nature": {
        "type": "instances",
        "quality": "update"
      },
    "payload": {
        "hostname": String,
        "ip": String,
        "properties": Object,
    }
}
```
Example: 
```javascript
{
    "nature": {
        "type": "instances",
        "quality": "update"
      },
    "payload": {
        "hostname": "mymachine",
        "ip": "127.0.0.1",
        "properties": {
            "platform": "win32",
        },
    }
}
```