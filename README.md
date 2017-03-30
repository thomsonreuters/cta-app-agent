# Agent Service for Compass Test Automation

[![build status](https://git.sami.int.thomsonreuters.com/compass/cta-app-agent/badges/master/build.svg)](https://git.sami.int.thomsonreuters.com/compass/cta-app-agent/commits/master)[![coverage report](https://git.sami.int.thomsonreuters.com/compass/cta-app-agent/badges/master/coverage.svg)](https://git.sami.int.thomsonreuters.com/compass/cta-app-agent/commits/master)
------
* General Overview
  * [Overview](#overview)
  * [Features](#features)
* Getting Started
  * A
  * A
* Development Guide
  * [Contributing](#contributing)
  * [More Information](#more-information)

------

## General Overview
### Overview
Agent is a service that consist of many bricks. Agent will run executions on the machine and receive test status then report back to the systems.
### Features
* Receive executions from RabbitMQ queue and run it
* Able to receive test status from test and report to the systems

You can check more [feature guide](https://git.sami.int.thomsonreuters.com/compass/cta/blob/master/features.md) for a list of all features provided by CTA-OSS.

------

## Getting Started
### Prerequisites
 1. Front End skills required include `HTML`, `CSS`, `JavaScript`, `JSON`. 
 2. Back End development using `Node.js`, `Express,` and `MongoDB`. It also important concept of source control using `Git`.

### Installation & Startup
The easiest way to get started is to clone the repository:
```bash
git clone git@git.sami.int.thomsonreuters.com:compass/cta-app-executiondataservice.git
```
Then install NPM dependencies:
```bash
npm install
```
To start the service
```bash
npm start
```
Service will startup and running on default port `3001`


# Development Guide

## Contributing
You can follow [these steps](https://git.sami.int.thomsonreuters.com/compass/cta/blob/master/contributing.md) to contribute.

## More Information
Our service is composed of different components working together to schedule, run, collect tests results and more. You can find additional information for more understand in Execution Data Service.
We also cover in detail :
* The [Rest API](https://git.sami.int.thomsonreuters.com/compass/cta-app-agent/wikis/restapi) is composed of multiple REST service to perform actions on CTA.
* A [DataContract](https://git.sami.int.thomsonreuters.com/compass/cta-app-agent/wikis/datacontract) is a formal agreement between a bricks.
* The [Document](https://git.sami.int.thomsonreuters.com/compass/cta-app-agent/wikis/document) associated with a software project and the system being.
* A [Sequence Diagrams](https://git.sami.int.thomsonreuters.com/compass/cta-app-agent/wikis/sequencediagram) is an interaction diagram that shows how objects operate with one another and in what order.

------

This code is running live at [CTA-OSS](https://www.). We also have [CTA Central Document](https://git.sami.int.thomsonreuters.com/compass/cta)
