exports.handler = function(context, event, callback) {
    const client = context.getTwilioClient();
    let twiml = new Twilio.twiml.MessagingResponse();
    const words = event.Body.split(" ")
    const authorizedNumbers = context.AUTHORIZED_USERS.split(",")
    const directory = JSON.parse(context.DIRECTORY)
    if(!authorizedNumbers.includes(event.From)) {
        twiml.message("Sorry you are not authorized to use this service")
        callback(null, twiml);
        return
    }

    let number = words.find( (word) => {
        return isAValidPhoneNumber(word)
    })

    const alias = words.find( (word) => {
        return word.charAt(0) == '@'
    })

    if(alias && directory[alias.substring(1)]) {
        number = directory[alias.substring(1)]        
    }

    if(number) {
        client.calls.create({
            url: 'https://' + context.DOMAIN_NAME + '/voice-callback?to='+number,
            to: event.From,
            from: context.CALLER_ID
          }, (err, result) => {
            if(err) {
                twiml.message("Something went wrong: "+err)
            } else {
                twiml.message("Your phone should be ringing any second...")
            }
            callback(null, twiml);
          });
    } else {
        twiml.message("Hi "+event.From+". What number do you want me to connect you to?")
        callback(null, twiml);
    }

};

function isAValidPhoneNumber(number) {
    return /^[\d\+\-\(\) ]+$/.test(number);
}
