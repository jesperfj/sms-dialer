# SMS Dialer

This app lets you start a phone call by sending an SMS with the number you want to dial. 

## Prerequisites

* Sign up for a Twilio account
* Install Node.js and Twilio CLI and log into your Twilio account
* Install the Twilio CLI serverless plugin

## Setup

Set a list of authorized phone numbers as an environment variable:

    export AUTHORIZED_USERS=+14151231234,+12127891234

You can also optionally set up a simple phone book:

    export DIRECTORY='{"jane": "+11231231234", "joe": "+13213214321"}'

Now set up the app with:

    npm run setup

NOTE: This will purchase a phone number at the cost of $1.00 / month. You will also incur charges on your Twilio account for SMS messages and phone calls made via this app.

The setup will print the phone number in the terminal. Send an SMS to the phone number with something like this: "Call +12120120123". This will trigger the app to call your phone and then connect you to the phone number you supplied.

If you provided a directory, then you can also call via the aliases you specified by prepending a '@'. E.g. send an SMS with "Call @jane" to call the number you mapped to Jane above.

## Clean up

Run 

    npm run destroy-really

To release the phone number and delete the functions.
