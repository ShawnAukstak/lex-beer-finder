'use strict';

const Alexa = require('alexa-sdk');
const rp = require('request-promise');

// TODO - Set these.
const APP_ID = '';
const BREWERYDB_KEY = '';

const languageStrings = {
    'en': {
        translation: {
            BEST_A_MAN_CAN_GET: 'Gillette, the best a man can get.',
            SKILL_NAME: 'Find me a beer',
            GET_FACT_MESSAGE: "Here's your fact: ",
            HELP_MESSAGE: 'You can ask for a beer, or, you can say exit... What can I help you with?',
            HELP_REPROMPT: 'What can I help you with?',
            STOP_MESSAGE: 'Later Duder',
        },
    },
};


const handlers = {
    'LaunchRequest': function () {
        this.emit('FindBeer');
    },
    'BestAManCanGet': function() {
        this.emit(':tell', this.t('BEST_A_MAN_CAN_GET'));
    },
    'FindBeer': function() {
        if (this.event.request.dialogState !== 'COMPLETED') {
            this.emit(':delegate');
        } else {
            var intentObj = this.event.request.intent;
            const beerNameSlot = intentObj.slots.beerName.value;
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

            rp(options).then((result) => {
                if (result.data === null) {
                    this.emit(':tell', `We ain't found shit!!` );
                    return;
                }

                const beerName = result.data[0].nameDisplay;
                const beerDescription = result.data[0].description;
                this.emit(':tell', `We got you a ${beerName}.  ${beerDescription}` );
            })
            .catch((error) => {
                this.emit(':tell', `We ain't found shit!!`);
            });
        }
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
