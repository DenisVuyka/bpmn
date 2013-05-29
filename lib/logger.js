/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */

var winston = require('winston');

/**
 * @enum {number}
 */
logLevels = {
        silly: 0, // winston
        verbose: 1, // winston
        info: 2, // winston
        warn: 3, // winston
        debug: 4, // winston
        trace: 5,
        error: 6, // winston
        none: 7
};
exports.logLevels = logLevels;

logLevelColors = {
    silly: 'yellow',
    verbose: 'blue',
    info: 'green',
    warn: 'orange',
    debug: 'black', // does not work in WebStorm
    trace: 'grey',
    error: 'red'
};

/**
 * @param {BPMNProcess} process
 * @constructor
 */
function Logger(process) {
    this.logLevel = logLevels.error;
    this.processDefinition = process.processDefinition;
    this.processId = process.processId;
    /** {function(string)} */
    this.logAppender = null; // used for example to test log messages
    this.winstonLogger = new (winston.Logger)({
         transports: [
            new (winston.transports.Console)({
                colorize: true
            }),
            new (winston.transports.File)({
                level: 'verbose',
                filename: './process.log',
                maxsize: 64 * 1024 * 1024,
                maxFiles: 100,
                timestamp: function() {
                    return Date.now();
                }
            })
        ],
        levels: logLevels,
        colors: logLevelColors
    });
}
exports.Logger = Logger;

/**
 * Add winston log transport (semantic like winston add() [https://github.com/flatiron/winston])
 * @param winstonTransport
 * @param options
 */
Logger.prototype.addTransport = function(winstonTransport, options) {
   var name = winstonTransport.prototype.name;
   if (name === 'file' || name === 'console') {
       this.winstonLogger.remove(winstonTransport);
   }
   this.winstonLogger.add(winstonTransport, options);
};

/**
 * Remove winston log transport (semantic like winston remove() [https://github.com/flatiron/winston])
 * @param winstonTransport
 */
Logger.prototype.removeTransport = function(winstonTransport) {
    this.winstonLogger.remove(winstonTransport);
};

    /**
 * @param {LogLevels|number} logLevel
 * @param {String} description
 * @param {Object=} data
 */
Logger.prototype.log = function(logLevel, description, data) {
    if (logLevel >= this.logLevel) {
        var processId = this.processId;
        var processName = this.processDefinition.name;

        if (this.logAppender) {

            var dataMessage = data ? "[" + getMessageString(data) + "]" : "";
            var formattedMessage = "[" + getLogLevelString(logLevel) + "][" + processName + "][" + processId + "][" + description + "]" + dataMessage;
            this.logAppender(formattedMessage);

        } else {

            var messageObject = {
                process: processName,
                id: processId,
                description: description
            };
            if (data) {
                messageObject.data = data;
            }
            this.winstonLogger.log(getLogLevelString(logLevel), JSON.stringify(messageObject), function(error) {
                if (error) {
                    console.log("Error while logging: " + error);
                }
            });

        }
    }
 };

/**
 * @param {String} handlerName
 * @param {Error} error
 */
Logger.prototype.logHandlerError = function(handlerName, error) {
    this.log(logLevels.error, "Error in handler '" + handlerName + "': " + error.toString());
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 * @param {String} reason
 */
Logger.prototype.logCallDefaultEventHandler = function(eventType, currentFlowObjectName, handlerName, reason) {
    this.log(logLevels.error, "Unhandled event: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'. Reason: " + reason);
};

/**
 * @param {String} messageFlowName
 * @param {BPMNFlowObject} source
 * @param {BPMNFlowObject} target
 * @param {Object=} data
 */
Logger.prototype.logSendMessage = function(messageFlowName, source, target, data) {
    var messageName = messageFlowName || "";
    var sourceName = source.name || "";
    var targetName = target.name || "";
    var message = "Send '" + messageName + "' from '" + sourceName + "' to '" + targetName + "'.";
    this.log(logLevels.trace, message, data);
};

/**
 * @param {BPMNFlowObject} event
 * @param {Object=} data
 */
Logger.prototype.logTriggerEvent = function(event, data) {
    this.log(logLevels.trace, "Trigger " + event.type + " '" + event.name + "'", data);
};

/**
 * @param {String} taskName
 * @param {Object=} data
 */
Logger.prototype.logTaskDone = function(taskName, data) {
    this.log(logLevels.trace, "Task '" + taskName + " ' done.", data);
};

/**
 * @param {String} eventName
 * @param {Object=} data
 */
Logger.prototype.logCatchBoundaryEvent = function(eventName, data) {
    this.log(logLevels.trace, "Catch boundary event '" + eventName + " ' done.", data);
};

/**
 * @param {BPMNFlowObject} event
 */
Logger.prototype.logTriggerDeferredEvents = function(event) {
    this.log(logLevels.trace, "Emit deferred events " + event.type + " '" + event.name + "'", event.data);
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 * @param {Object=} data
 */
Logger.prototype.logCallHandler = function(eventType, currentFlowObjectName, handlerName, data) {
    this.log(logLevels.trace, "Call handler for: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'.", data);
};

/**
 * @param {String} eventType
 * @param {String?} currentFlowObjectName
 * @param {String} handlerName
 */
Logger.prototype.logCallHandlerDone = function(eventType, currentFlowObjectName, handlerName) {
    this.log(logLevels.trace, "Call handlerDone for: '" + eventType + "' for flow object '" + currentFlowObjectName + "'. Handler name: " + handlerName + "'.");
};

/**
 * @param {String} flowObjectName
 * @param {Object=} data
 */
Logger.prototype.logPutTokenAt = function(flowObjectName, data) {
    this.log(logLevels.debug, "Token was put on '" + flowObjectName + "'", data);
};

/**
 * @param {BPMNFlowObject} flowObject
 * @param {Object=} data
 */
Logger.prototype.logTokenArrivedAt = function(flowObject, data) {
    this.log(logLevels.debug, "Token arrived at " + flowObject.type + " '" + flowObject.name + "'", data);
};

/**
 * @param {Object=} savedData
 */
Logger.prototype.logDoneSaving = function(savedData) {
    this.log(logLevels.debug, "SavedData", savedData);
};

function getLogLevelString(logLevel) {
    var result = "unknown";
    var keys = Object.keys(logLevels);
    keys.forEach(function(key) {
        if (logLevels[key] === logLevel) {
            result = key;
        }
    });
    return result;
}

function getMessageString(data) {
    return (typeof data === 'object' ? JSON.stringify(data) : data.toString());
}