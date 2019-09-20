/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
var crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    var speechText = 'Welcome to the Vault, you can add or see your passwords.';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(speechText)
      .getResponse();
  },
};

const SavePasswordIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'SavePassIntent';
  },
  async handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const passWD = slots.pass.value;
    const userName = slots.username.value;
    var newPassword = encrypt(passWD);
    const attributesManager = handlerInput.attributesManager;    
    const attributes = await attributesManager.getPersistentAttributes() || {};
    attributes[userName] = {
      encryptedPassword:newPassword
    };

    attributesManager.setPersistentAttributes(attributes);
    await attributesManager.savePersistentAttributes();  
          var speechText = `Your password, for ${userName} has been saved.`;
              
          return handlerInput.responseBuilder
          .speak(speechText)
          .withSimpleCard(speechText)
          .getResponse();
  },
};

const ShowPasswordIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'ShowPassIntent';
  },
  async handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const userName = slots.username.value;
    
    if(Object.keys(attributes).indexOf( userName ) >= 0 ){
      const attributesManager = handlerInput.attributesManager;    
      const attributes = await attributesManager.getPersistentAttributes() || {};
      var currentEncryptedPass = attributes[userName].encryptedPassword;
      var currentName = attributes[userName];
      var passWD =  decrypt(currentEncryptedPass);
      var speechText = `Here is your Password with name of ${currentName}. ${passWD}`;

    }else{
      var speechText = `You do not have Password with name of ${currentName}, you can add it by saying add`;
    }
     
    return handlerInput.responseBuilder
          .speak(speechText)
          .getResponse();
    
  },
};
const InProgressRemovePasswordIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'RemovePasswordIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  },
};

const RemovePasswordIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'RemovePasswordIntent';
  },
  async handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const userName = slots.username.value;   
 
    if( Object.keys(attributes).indexOf( userName ) >= 0 ) {
      const attributesManager = handlerInput.attributesManager;    
      const attributes = await attributesManager.getPersistentAttributes() || {}; 
      delete attributes[username];
      attributesManager.setPersistentAttributes(attributes);
      await attributesManager.savePersistentAttributes();  
    var speechText = `You have removed Password with name of ${userName}, you can add another one by saying add`;
    }else{
      var speechText = `You do not have Password with name of ${userName}, you can add it by saying add`;
    }


    return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(speechText)
          .getResponse();
      
  },
};
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    SavePasswordIntentHandler,
    ShowPasswordIntentHandler,
    InProgressRemovePasswordIntentHandler,
    RemovePasswordIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName("Vault2")
  .withAutoCreateTable(true)
  .lambda();



function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

function decrypt(text) {
  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text.encryptedData, 'hex');
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}