## Classes

<dl>
<dt><a href="#JobBroker">JobBroker</a></dt>
<dd><p>JobBroker class</p>
</dd>
<dt><a href="#JobBrokerHelper">JobBrokerHelper</a></dt>
<dd><p>JobBrokerHelper class</p>
</dd>
<dt><a href="#JobQueue">JobQueue</a> ⇐ <code>PriorityQueue</code></dt>
<dd><p>JobQueue class</p>
</dd>
<dt><a href="#CommandLine">CommandLine</a> ⇐ <code><a href="#Executor">Executor</a></code></dt>
<dd><p>Executor CommandLine class</p>
</dd>
<dt><a href="#Executor">Executor</a></dt>
<dd><p>Executor class</p>
</dd>
<dt><a href="#JobHandler">JobHandler</a> ⇐ <code>Brick</code></dt>
<dd><p>JobHandler class</p>
</dd>
<dt><a href="#JobHandlerHelper">JobHandlerHelper</a></dt>
<dd><p>JobHandlerHelper class</p>
</dd>
<dt><a href="#ResultCollector">ResultCollector</a></dt>
<dd><p>ResultCollector class</p>
</dd>
<dt><a href="#ResultCollectorHelper">ResultCollectorHelper</a></dt>
<dd><p>ResultCollectorHelper class</p>
</dd>
<dt><a href="#ResultsHandler">ResultsHandler</a></dt>
<dd><p>Handler class for RESTAPI handlers : RESULTS
Converts old CTA TestStatus and StepStatus to Results objects</p>
</dd>
<dt><a href="#ResultsHandler">ResultsHandler</a></dt>
<dd><p>Handler class for RESTAPI handlers : RESULTS</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#CommandLineJob">CommandLineJob</a> : <code><a href="#Job">Job</a></code></dt>
<dd></dd>
<dt><a href="#Stage">Stage</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#EnvironmentVariable">EnvironmentVariable</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ChildProcess">ChildProcess</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#_createFileResponse">_createFileResponse</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#processExitCallback">processExitCallback</a> : <code>function</code></dt>
<dd><p>Callback called after a process has ended.</p>
</dd>
<dt><a href="#ackResponse">ackResponse</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#finishResponse">finishResponse</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Job">Job</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="JobBroker"></a>

## JobBroker
JobBroker class

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| queue | <code>PriorityQueue</code> | PriorityQueue of Jobs |
| runningJobs | <code>[Map.&lt;Job&gt;](#Job)</code> | Array of Jobs being processed |


* [JobBroker](#JobBroker)
    * [new JobBroker(cementHelper, config)](#new_JobBroker_new)
    * [.validate(context)](#JobBroker+validate) ⇒ <code>Promise</code>
    * [.process(context)](#JobBroker+process)

<a name="new_JobBroker_new"></a>

### new JobBroker(cementHelper, config)
Create a new JobBroker instance


| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| config | <code>Object</code> | cement configuration of the brick |

<a name="JobBroker+validate"></a>

### jobBroker.validate(context) ⇒ <code>Promise</code>
Validates Job properties

**Kind**: instance method of <code>[JobBroker](#JobBroker)</code>  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Context</code> | a Context |

<a name="JobBroker+process"></a>

### jobBroker.process(context)
Process the context, emit events, create new context and define listeners

**Kind**: instance method of <code>[JobBroker](#JobBroker)</code>  

| Param |
| --- |
| context | 

<a name="JobBrokerHelper"></a>

## JobBrokerHelper
JobBrokerHelper class

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| queue | <code>PriorityQueue</code> | PriorityQueue of Jobs |
| runningJobs | <code>[Map.&lt;Job&gt;](#Job)</code> | Array of Jobs being processed |
| logger | <code>Logger</code> | cta-logger instance |


* [JobBrokerHelper](#JobBrokerHelper)
    * [new JobBrokerHelper(cementHelper, queue, runningJobs, [logger])](#new_JobBrokerHelper_new)
    * [.createContextForExecutionRun(job, [options])](#JobBrokerHelper+createContextForExecutionRun) ⇒ <code>Context</code>
    * [.createContextForExecutionCancel(job, [options])](#JobBrokerHelper+createContextForExecutionCancel) ⇒ <code>Context</code>
    * [.createContextForExecutionRead(job, [options])](#JobBrokerHelper+createContextForExecutionRead) ⇒ <code>Context</code>
    * [.createContextForMessageGet(job, [options])](#JobBrokerHelper+createContextForMessageGet) ⇒ <code>Context</code>
    * [.createContextDefault(job, [options])](#JobBrokerHelper+createContextDefault) ⇒ <code>Context</code>
    * [.processDefault(job)](#JobBrokerHelper+processDefault)
    * [.cancel(cancelationJob)](#JobBrokerHelper+cancel)
    * [.cancelQueuedJob(cancelationJob)](#JobBrokerHelper+cancelQueuedJob)

<a name="new_JobBrokerHelper_new"></a>

### new JobBrokerHelper(cementHelper, queue, runningJobs, [logger])
Create a new JobBrokerHelper instance


| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| queue | <code>PriorityQueue</code> | PriorityQueue of Jobs |
| runningJobs | <code>Object</code> | Object of Maps of Jobs being processed |
| [logger] | <code>Logger</code> | cta-logger instance |

<a name="JobBrokerHelper+createContextForExecutionRun"></a>

### jobBrokerHelper.createContextForExecutionRun(job, [options]) ⇒ <code>Context</code>
createContext submethod for execution-run job

**Kind**: instance method of <code>[JobBrokerHelper](#JobBrokerHelper)</code>  
**Returns**: <code>Context</code> - the created context  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | the Job to send |
| [options] | <code>Object</code> | optional arguments |
| [options.testIndex] | <code>Number</code> | index of the test to run in the tests Array |

<a name="JobBrokerHelper+createContextForExecutionCancel"></a>

### jobBrokerHelper.createContextForExecutionCancel(job, [options]) ⇒ <code>Context</code>
createContext submethod for execution-cancel job

**Kind**: instance method of <code>[JobBrokerHelper](#JobBrokerHelper)</code>  
**Returns**: <code>Context</code> - the created context  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | the Job to send |
| [options] | <code>Object</code> | optional arguments |

<a name="JobBrokerHelper+createContextForExecutionRead"></a>

### jobBrokerHelper.createContextForExecutionRead(job, [options]) ⇒ <code>Context</code>
createContext submethod for execution-read job

**Kind**: instance method of <code>[JobBrokerHelper](#JobBrokerHelper)</code>  
**Returns**: <code>Context</code> - the created context  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | the Job to send |
| [options] | <code>Object</code> | optional arguments |

<a name="JobBrokerHelper+createContextForMessageGet"></a>

### jobBrokerHelper.createContextForMessageGet(job, [options]) ⇒ <code>Context</code>
createContext submethod for execution group job

**Kind**: instance method of <code>[JobBrokerHelper](#JobBrokerHelper)</code>  
**Returns**: <code>Context</code> - the created context  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | the Job to send |
| [options] | <code>Object</code> | optional arguments |

<a name="JobBrokerHelper+createContextDefault"></a>

### jobBrokerHelper.createContextDefault(job, [options]) ⇒ <code>Context</code>
createContext submethod for default case

**Kind**: instance method of <code>[JobBrokerHelper](#JobBrokerHelper)</code>  
**Returns**: <code>Context</code> - the created context  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | the Job to send |
| [options] | <code>Object</code> | optional arguments |

<a name="JobBrokerHelper+processDefault"></a>

### jobBrokerHelper.processDefault(job)
process sub-method for default case (execution-commandline, execution-group)

**Kind**: instance method of <code>[JobBrokerHelper](#JobBrokerHelper)</code>  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | the job to process |

<a name="JobBrokerHelper+cancel"></a>

### jobBrokerHelper.cancel(cancelationJob)
process sub-method for execution-Cancelation case

**Kind**: instance method of <code>[JobBrokerHelper](#JobBrokerHelper)</code>  

| Param | Type | Description |
| --- | --- | --- |
| cancelationJob | <code>[Job](#Job)</code> | the Cancelation job |

<a name="JobBrokerHelper+cancelQueuedJob"></a>

### jobBrokerHelper.cancelQueuedJob(cancelationJob)
cancel sub-method for canceling queued job

**Kind**: instance method of <code>[JobBrokerHelper](#JobBrokerHelper)</code>  

| Param | Type | Description |
| --- | --- | --- |
| cancelationJob | <code>[Job](#Job)</code> | the Cancelation job |

<a name="JobQueue"></a>

## JobQueue ⇐ <code>PriorityQueue</code>
JobQueue class

**Kind**: global class  
**Extends:** <code>PriorityQueue</code>  

* [JobQueue](#JobQueue) ⇐ <code>PriorityQueue</code>
    * [.has(id)](#JobQueue+has) ⇒ <code>Boolean</code>
    * [.isEmpty()](#JobQueue+isEmpty) ⇒ <code>Boolean</code>
    * [.remove(id)](#JobQueue+remove) ⇒ <code>[Job](#Job)</code>
    * [.queue(job)](#JobQueue+queue)

<a name="JobQueue+has"></a>

### jobQueue.has(id) ⇒ <code>Boolean</code>
Checks if job is present in queue

**Kind**: instance method of <code>[JobQueue](#JobQueue)</code>  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id of the job |

<a name="JobQueue+isEmpty"></a>

### jobQueue.isEmpty() ⇒ <code>Boolean</code>
Checks if queue is empty

**Kind**: instance method of <code>[JobQueue](#JobQueue)</code>  
<a name="JobQueue+remove"></a>

### jobQueue.remove(id) ⇒ <code>[Job](#Job)</code>
Removes a specific job

**Kind**: instance method of <code>[JobQueue](#JobQueue)</code>  
**Returns**: <code>[Job](#Job)</code> - the removed job  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id of the job to remove |

<a name="JobQueue+queue"></a>

### jobQueue.queue(job)
Inserts a new job in the queue

**Kind**: instance method of <code>[JobQueue](#JobQueue)</code>  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | job to insert |

<a name="CommandLine"></a>

## CommandLine ⇐ <code>[Executor](#Executor)</code>
Executor CommandLine class

**Kind**: global class  
**Extends:** <code>[Executor](#Executor)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| runningJobs | <code>Object</code> | A Map of all the Jobs being run by this Executor instance |
| DEFAULTS | <code>Object</code> | Defaults options |
| DEFAULTS.JOBTIMEOUT | <code>Number</code> | The default timeout used to cancel Job after expiration |
| DEFAULTS.CMDTIMEOUT | <code>Number</code> | The default timeout used to cancel a Command/Stage of a Job after expiration |


* [CommandLine](#CommandLine) ⇐ <code>[Executor](#Executor)</code>
    * [new CommandLine(defaults, logger)](#new_CommandLine_new)
    * [.validate(job)](#CommandLine+validate) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.process(job, [callback])](#Executor+process) ⇒ <code>[Promise.&lt;ackResponse&gt;](#ackResponse)</code>

<a name="new_CommandLine_new"></a>

### new CommandLine(defaults, logger)
Creates a new Job CommandLine Executor instance


| Param | Type | Description |
| --- | --- | --- |
| defaults | <code>Object</code> | default properties for the executor |
| defaults.JOBTIMEOUT | <code>Number</code> | default job timeout |
| defaults.CMDTIMEOUT | <code>Number</code> | default command timeout |
| logger | <code>Object</code> | logger instance |

<a name="CommandLine+validate"></a>

### commandLine.validate(job) ⇒ <code>Promise.&lt;Object&gt;</code>
Validates Job properties specific to CommandLine Executor

**Kind**: instance method of <code>[CommandLine](#CommandLine)</code>  
**Overrides:** <code>[validate](#Executor+validate)</code>  
**Returns**: <code>Promise.&lt;Object&gt;</code> - - { ok: 0|1 }  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[CommandLineJob](#CommandLineJob)</code> | input job |

<a name="Executor+process"></a>

### commandLine.process(job, [callback]) ⇒ <code>[Promise.&lt;ackResponse&gt;](#ackResponse)</code>
Process the job (cancel or set timeout + execute)

**Kind**: instance method of <code>[CommandLine](#CommandLine)</code>  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | input job |
| [callback] | <code>[processExitCallback](#processExitCallback)</code> | an optional callback ran after execution is finished |

<a name="Executor"></a>

## Executor
Executor class

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| runningJobs | <code>Object</code> | A Map of all the Jobs being run by this Executor instance |
| DEFAULTS | <code>Object</code> | Defaults options |
| DEFAULTS.JOBTIMEOUT | <code>Number</code> | The default timeout used to cancel Job after expiration |


* [Executor](#Executor)
    * [new Executor(defaults, logger)](#new_Executor_new)
    * [.validate(job)](#Executor+validate) ⇒ <code>Promise</code>
    * [.process(job, [callback])](#Executor+process) ⇒ <code>[Promise.&lt;ackResponse&gt;](#ackResponse)</code>

<a name="new_Executor_new"></a>

### new Executor(defaults, logger)
Creates a new Job Executor instance


| Param | Type | Description |
| --- | --- | --- |
| defaults | <code>Object</code> | default properties for the executor |
| defaults.JOBTIMEOUT | <code>Number</code> | default job timeout |
| logger | <code>Object</code> | logger instance |

<a name="Executor+validate"></a>

### executor.validate(job) ⇒ <code>Promise</code>
Validates Job properties specific to Executor

**Kind**: instance method of <code>[Executor](#Executor)</code>  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | input job |
| job.payload.timeout | <code>Number</code> | timeout to cancel execution |

<a name="Executor+process"></a>

### executor.process(job, [callback]) ⇒ <code>[Promise.&lt;ackResponse&gt;](#ackResponse)</code>
Process the job (cancel or set timeout + execute)

**Kind**: instance method of <code>[Executor](#Executor)</code>  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | input job |
| [callback] | <code>[processExitCallback](#processExitCallback)</code> | an optional callback ran after execution is finished |

<a name="JobHandler"></a>

## JobHandler ⇐ <code>Brick</code>
JobHandler class

**Kind**: global class  
**Extends:** <code>Brick</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| executors | <code>[Map.&lt;Executor&gt;](#Executor)</code> | A Map of all the Executors available |
| runningJobs | <code>[Map.&lt;Job&gt;](#Job)</code> | A Map of all the Jobs being run by this JobHandler |
| jobHandlerHelper | <code>[JobHandlerHelper](#JobHandlerHelper)</code> | An instance of JobHandlerHelper |


* [JobHandler](#JobHandler) ⇐ <code>Brick</code>
    * [new JobHandler(cementHelper, config)](#new_JobHandler_new)
    * [.validate(context)](#JobHandler+validate) ⇒ <code>Promise</code>
    * [.process(context)](#JobHandler+process)

<a name="new_JobHandler_new"></a>

### new JobHandler(cementHelper, config)
Create a new JobHandler instance


| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| config | <code>Object</code> | cement configuration of the brick |

<a name="JobHandler+validate"></a>

### jobHandler.validate(context) ⇒ <code>Promise</code>
Validates Job properties

**Kind**: instance method of <code>[JobHandler](#JobHandler)</code>  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Context</code> | a Context |

<a name="JobHandler+process"></a>

### jobHandler.process(context)
Process the context, emit events, create new context and define listeners

**Kind**: instance method of <code>[JobHandler](#JobHandler)</code>  

| Param |
| --- |
| context | 

<a name="JobHandlerHelper"></a>

## JobHandlerHelper
JobHandlerHelper class

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| executors | <code>[Map.&lt;Executor&gt;](#Executor)</code> | A Map of all the Executors available |
| runningJobs | <code>[Map.&lt;Job&gt;](#Job)</code> | A Map of all the Jobs being run by this JobHandler |


* [JobHandlerHelper](#JobHandlerHelper)
    * [new JobHandlerHelper(executors, runningJobs)](#new_JobHandlerHelper_new)
    * [.getExecutor(job)](#JobHandlerHelper+getExecutor) ⇒ <code>[Executor](#Executor)</code>
    * [.runExecutor(executor, job, [callback])](#JobHandlerHelper+runExecutor) ⇒ <code>Promise</code>

<a name="new_JobHandlerHelper_new"></a>

### new JobHandlerHelper(executors, runningJobs)
Create a new JobHandlerHelper instance


| Param | Type | Description |
| --- | --- | --- |
| executors | <code>[Map.&lt;Executor&gt;](#Executor)</code> | A Map of all the Executors available |
| runningJobs | <code>[Map.&lt;Job&gt;](#Job)</code> | A Map of all the Jobs being run by this JobHandler |

<a name="JobHandlerHelper+getExecutor"></a>

### jobHandlerHelper.getExecutor(job) ⇒ <code>[Executor](#Executor)</code>
Retrieve the right executor for a jobReturns undefined if no executor found

**Kind**: instance method of <code>[JobHandlerHelper](#JobHandlerHelper)</code>  

| Param | Type | Description |
| --- | --- | --- |
| job | <code>[Job](#Job)</code> | input job* @param job |

<a name="JobHandlerHelper+runExecutor"></a>

### jobHandlerHelper.runExecutor(executor, job, [callback]) ⇒ <code>Promise</code>
Run an executor with provided job and callback

**Kind**: instance method of <code>[JobHandlerHelper](#JobHandlerHelper)</code>  
**Returns**: <code>Promise</code> - - specific executor response returned after job acknowledgment  

| Param | Type | Description |
| --- | --- | --- |
| executor | <code>[Executor](#Executor)</code> | executor |
| job | <code>[Job](#Job)</code> | input job |
| [callback] | <code>function</code> | called after job completion |

<a name="ResultCollector"></a>

## ResultCollector
ResultCollector class

**Kind**: global class  

* [ResultCollector](#ResultCollector)
    * [new ResultCollector(cementHelper, config)](#new_ResultCollector_new)
    * [.validate(context)](#ResultCollector+validate) ⇒ <code>Promise</code>
    * [.process(context)](#ResultCollector+process)

<a name="new_ResultCollector_new"></a>

### new ResultCollector(cementHelper, config)
Create a new ResultCollector instance


| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| config | <code>Object</code> | cement configuration of the brick |

<a name="ResultCollector+validate"></a>

### resultCollector.validate(context) ⇒ <code>Promise</code>
Validates Job properties

**Kind**: instance method of <code>[ResultCollector](#ResultCollector)</code>  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>Context</code> | a Context |

<a name="ResultCollector+process"></a>

### resultCollector.process(context)
Process the context, emit events, create new context and define listeners

**Kind**: instance method of <code>[ResultCollector](#ResultCollector)</code>  

| Param |
| --- |
| context | 

<a name="ResultCollectorHelper"></a>

## ResultCollectorHelper
ResultCollectorHelper class

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| logger | <code>Logger</code> | cta-logger instance |
| runningJob | <code>Object</code> | the currently running job |

<a name="new_ResultCollectorHelper_new"></a>

### new ResultCollectorHelper(cementHelper, [logger])
Create a new ResultCollectorHelper instance


| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper instance |
| [logger] | <code>Logger</code> | cta-logger instance |

<a name="ResultsHandler"></a>

## ResultsHandler
Handler class for RESTAPI handlers : RESULTSConverts old CTA TestStatus and StepStatus to Results objects

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper from a cta-restapi Brick |


* [ResultsHandler](#ResultsHandler)
    * [new ResultsHandler(cementHelper)](#new_ResultsHandler_new)
    * [new ResultsHandler(cementHelper)](#new_ResultsHandler_new)
    * [.createTestStatus(req, res, next)](#ResultsHandler+createTestStatus)
    * [.create(req, res, next)](#ResultsHandler+create)

<a name="new_ResultsHandler_new"></a>

### new ResultsHandler(cementHelper)

| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper from a cta-restapi Brick |

<a name="new_ResultsHandler_new"></a>

### new ResultsHandler(cementHelper)

| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper from a cta-restapi Brick |

<a name="ResultsHandler+createTestStatus"></a>

### resultsHandler.createTestStatus(req, res, next)
Publishes request body (Result) in an result-create Context

**Kind**: instance method of <code>[ResultsHandler](#ResultsHandler)</code>  

| Param |
| --- |
| req | 
| res | 
| next | 

<a name="ResultsHandler+create"></a>

### resultsHandler.create(req, res, next)
Publishes request body (Result) in an result-create Context

**Kind**: instance method of <code>[ResultsHandler](#ResultsHandler)</code>  

| Param |
| --- |
| req | 
| res | 
| next | 

<a name="ResultsHandler"></a>

## ResultsHandler
Handler class for RESTAPI handlers : RESULTS

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper from a cta-restapi Brick |


* [ResultsHandler](#ResultsHandler)
    * [new ResultsHandler(cementHelper)](#new_ResultsHandler_new)
    * [new ResultsHandler(cementHelper)](#new_ResultsHandler_new)
    * [.createTestStatus(req, res, next)](#ResultsHandler+createTestStatus)
    * [.create(req, res, next)](#ResultsHandler+create)

<a name="new_ResultsHandler_new"></a>

### new ResultsHandler(cementHelper)

| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper from a cta-restapi Brick |

<a name="new_ResultsHandler_new"></a>

### new ResultsHandler(cementHelper)

| Param | Type | Description |
| --- | --- | --- |
| cementHelper | <code>CementHelper</code> | cementHelper from a cta-restapi Brick |

<a name="ResultsHandler+createTestStatus"></a>

### resultsHandler.createTestStatus(req, res, next)
Publishes request body (Result) in an result-create Context

**Kind**: instance method of <code>[ResultsHandler](#ResultsHandler)</code>  

| Param |
| --- |
| req | 
| res | 
| next | 

<a name="ResultsHandler+create"></a>

### resultsHandler.create(req, res, next)
Publishes request body (Result) in an result-create Context

**Kind**: instance method of <code>[ResultsHandler](#ResultsHandler)</code>  

| Param |
| --- |
| req | 
| res | 
| next | 

<a name="CommandLineJob"></a>

## CommandLineJob : <code>[Job](#Job)</code>
**Kind**: global typedef  
**Extends:** <code>[Job](#Job)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id of the job |
| nature | <code>Object</code> | nature description of the job |
| nature.quality | <code>String</code> | quality of the job |
| nature.type | <code>String</code> | type of the job |
| payload | <code>Object</code> | payload of the job |
| payload.timeout | <code>Number</code> | timeout to cancel execution of the job |
| payload.stage | <code>[Array.&lt;Stage&gt;](#Stage)</code> | array of Stage |
| payload.env | <code>[Array.&lt;EnvironmentVariable&gt;](#EnvironmentVariable)</code> | environment variables to set |

<a name="Stage"></a>

## Stage : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id of the stage |
| timeout | <code>Number</code> | timeout to cancel execution of the stage |
| run | <code>String</code> | main script to execute |
| stop | <code>String</code> | script to execute when canceling job |
| cwd | <code>String</code> | current working directory to set |
| env | <code>[Array.&lt;EnvironmentVariable&gt;](#EnvironmentVariable)</code> | environment variables to set |

<a name="EnvironmentVariable"></a>

## EnvironmentVariable : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | name of the variable |
| value | <code>String</code> | value of the variable |

<a name="ChildProcess"></a>

## ChildProcess : <code>Object</code>
**Kind**: global typedef  
**See**: https://nodejs.org/api/child_process.html#child_process_class_childprocess  
<a name="_createFileResponse"></a>

## _createFileResponse : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| ok | <code>Number</code> | 0|1 |
| path | <code>String</code> | path to the created file |

<a name="processExitCallback"></a>

## processExitCallback : <code>function</code>
Callback called after a process has ended.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| error | <code>Error</code> | error |
| response | <code>[finishResponse](#finishResponse)</code> | the final response |

<a name="ackResponse"></a>

## ackResponse : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| ok | <code>Number</code> | 0|1 |
| message | <code>String</code> | additionnal message from the execution |
| process | <code>[ChildProcess](#ChildProcess)</code> | the process spawned by script |
| error | <code>Error</code> | error |

<a name="finishResponse"></a>

## finishResponse : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| ok | <code>Number</code> | 0|1 |
| state | <code>String</code> | the state of the Job |
| message | <code>String</code> | additionnal message from the execution |
| process | <code>[ChildProcess](#ChildProcess)</code> | the process spawned by script |
| code | <code>Number</code> | the exit code of the spawned process |
| error | <code>Error</code> | error |

<a name="Job"></a>

## Job : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id of the job |
| nature | <code>Object</code> | nature description of the job |
| nature.quality | <code>String</code> | quality of the job |
| nature.type | <code>String</code> | type of the job |
| payload | <code>Object</code> | payload of the job |

