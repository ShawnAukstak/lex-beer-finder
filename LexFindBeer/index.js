'use strict';

const rp = require('request-promise');

// --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message, responseCard) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
            responseCard,
        },
    };
}

function confirmIntent(sessionAttributes, intentName, slots, message, responseCard) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ConfirmIntent',
            intentName,
            slots,
            message,
            responseCard,
        },
    };
}

function close(sessionAttributes, fulfillmentState, message, responseCard) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
            responseCard,
        },
    };
}

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

// Build a responseCard with a title, subtitle, and an optional set of options which should be displayed as buttons.
function buildResponseCard(title, subTitle, options) {
    let buttons = null;
    if (options !== null) {
        buttons = [];
        for (let i = 0; i < Math.min(5, options.length); i++) {
            buttons.push(options[i]);
        }
    }
    return {
        contentType: 'application/vnd.amazonaws.card.generic',
        version: 1,
        genericAttachments: [{
            title,
            subTitle,
            buttons,
        }],
    };
}

// ---------------- Helper Functions --------------------------------------------------

function buildValidationResult(isValid, violatedSlot, messageContent) {
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

 // --------------- Functions that control the skill's behavior -----------------------

var http = require('http');
const BREWERYDB_KEY = '';

/**
 * Performs dialog management and fulfillment for booking a dentists appointment.
 *
 * Beyond fulfillment, the implementation for this intent demonstrates the following:
 *   1) Use of elicitSlot in slot validation and re-prompting
 *   2) Use of confirmIntent to support the confirmation of inferred slot values, when confirmation is required
 *      on the bot model and the inferred slot values fully specify the intent.
 */
function findBeer(intentRequest, callback) {
    const vintageYear = intentRequest.currentIntent.slots.vintageYear;
    const abv = intentRequest.currentIntent.slots.abv;
    const source = intentRequest.invocationSource;
    const outputSessionAttributes = intentRequest.sessionAttributes || {};

    if (source === 'DialogCodeHook') {
        callback(close(outputSessionAttributes, 'Fulfilled', { contentType: 'PlainText',
       content: `DialogCodeHook` }));
        return;
    }

    const beerNameSlot = intentRequest.currentIntent.slots.beerName;

    var options = {
        uri: 'http://api.brewerydb.com/v2/beers',
        qs: {
            key: BREWERYDB_KEY,
            format: 'json',
            order: 'random',
            randomCount:'1',
            name: beerNameSlot
        },
        json: true // Automatically parses the JSON string in the response
    };

    rp(options)
        .then(function (result) {
            if (result.data === null) {
                callback(close(outputSessionAttributes, 'Fulfilled', { contentType: 'PlainText', content: `We ain't found shit!` }));
                return;
            }

            const beerName = result.data[0].nameDisplay;
            const beerDescription = result.data[0].description;
            callback(close(outputSessionAttributes, 'Fulfilled', { contentType: 'PlainText',
                    content: `We got you a ${beerName}.  ${beerDescription}` }));
        })
        .catch(function (err) {
            callback(close(outputSessionAttributes, 'Fulfilled', { contentType: 'PlainText', content: `We ain't found shit!!` }));
        });

}

 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    // console.log(JSON.stringify(intentRequest, null, 2));
    console.log(`dispatch userId=${intentRequest.userId}, intent=${intentRequest.currentIntent.name}`);

    const name = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (name === 'FindBeer') {
        return findBeer(intentRequest, callback);
    }
    throw new Error(`Intent with name ${name} not supported`);
}

// --------------- Main handler -----------------------

function loggingCallback(response, originalCallback) {
    // console.log(JSON.stringify(response, null, 2));
    originalCallback(null, response);
}

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);

        /**
         * Uncomment this if statement and populate with your Lex bot name and / or version as
         * a sanity check to prevent invoking this Lambda function from an undesired Lex bot or
         * bot version.
         */
        /*
        if (event.bot.name !== 'MakeAppointment') {
             callback('Invalid Bot Name');
        }
        */
        dispatch(event, (response) => loggingCallback(response, callback));
    } catch (err) {
        callback(err);
    }
};
