exports.handler = function(context, event, callback) {
    let twiml = new Twilio.twiml.VoiceResponse();
    twiml.dial({callerId: context.CALLER_ID})['number']({}, event.to)
    callback(null, twiml);
};
