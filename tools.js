(async() => {
    if(process.argv[2] == "setup") {
        setup()
    } else if(process.argv[2] == "destroy") {
        destroy(false)
    } else if(process.argv[2] == "destroy-really") {
        destroy(true)
    } else if(process.argv[2] == "info") {
        info()
    }
})()

async function info() {
    // Grab the service SID
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('.twilio-functions'));

    // Grab the domain name
    let r = await execCmd("twilio api:serverless:v1:services:environments:list --service-sid "+
                        config.serviceSid+" -o json")
    const envInfo = JSON.parse(r.stdout)

    console.log("URL: https://"+envInfo[0].domainName+"/index.html")

    r = await execCmd("twilio api:core:incoming-phone-numbers:list --friendly-name number-"+config.serviceSid+" -o json")
    const numbers = JSON.parse(r.stdout)
    console.log("Phone number: "+numbers[0].phoneNumber)
}

async function destroy(really) {
    // Grab the service SID
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('.twilio-functions'));

    // Delete the phone number
    let r = await execCmd("twilio api:core:incoming-phone-numbers:list --friendly-name number-"+config.serviceSid+" -o json")
    let number = null
    if(r.stdout) {
        const numbers = JSON.parse(r.stdout)
        if(numbers && numbers[0]) {
            number = numbers[0]
        }
    }

    if(really) {
        if(number) {
            await execCmd("twilio api:core:incoming-phone-numbers:remove --sid "+number.sid)
        } else {
            console.log("No number found named number-"+config.serviceSid)
        }
        await execCmd("twilio api:serverless:v1:services:remove --sid "+config.serviceSid)
        await execCmd("rm .twilio-functions")
    } else {
        if(number) {
            console.log("Planning on releasing "+number.phoneNumber)
        }
        console.log("Planning on deleting service "+config.serviceSid)
        console.log("Use npm run destroy-really to really do this")
    }
    

}

async function setup() {
    // Deploy functions and assets
    let r = await execCmd("twilio serverless:deploy")
    console.log("Deployed assets and functions")

    // Grab the service SID
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('.twilio-functions'));

    // Grab the domain name
    r = await execCmd("twilio api:serverless:v1:services:environments:list --service-sid "+
                        config.serviceSid+" -o json")
    const envInfo = JSON.parse(r.stdout)

    const callbackUrl = "https://"+envInfo[0].domainName+"/callback-function"

    // Buy a phone number
    r = await execCmd("twilio api:core:incoming-phone-numbers:create --area-code 323"+
                      " --sms-url https://"+envInfo[0].domainName+"/sms-callback"+
                      " --voice-url https://"+envInfo[0].domainName+"/voice-callback"+
                      " --friendly-name number-"+config.serviceSid+
                      " -o json")

    const number = JSON.parse(r.stdout)[0].phoneNumber
    console.log("Purchased phone number: "+number)

    // Set environment variables
    r = await execCmd("twilio api:serverless:v1:services:environments:variables:create"+
                      " --service-sid "+config.serviceSid+
                      " --environment-sid "+envInfo[0].sid+
                      " --key CALLER_ID --value "+number)


    if(process.env.AUTHORIZED_USERS) {
        r = await execCmd("twilio api:serverless:v1:services:environments:variables:create"+
                        " --service-sid "+config.serviceSid+
                        " --environment-sid "+envInfo[0].sid+
                        " --key AUTHORIZED_USERS --value '"+process.env.AUTHORIZED_USERS+"'")
    }

    if(process.env.DIRECTORY) {
        r = await execCmd("twilio api:serverless:v1:services:environments:variables:create"+
                      " --service-sid "+config.serviceSid+
                      " --environment-sid "+envInfo[0].sid+
                      " --key DIRECTORY --value '"+process.env.DIRECTORY+"'")
    }
    console.log("SERVICE_SID="+config.serviceSid)
    console.log("ENVIRONMENT_SID="+envInfo[0].sid)
    console.log("DOMAIN="+envInfo[0].domainName)
    console.log("PHONE_NUMBER="+number)
}


async function execCmd(cmd) {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
     exec(cmd, (code, stdout, stderr) => {
      if (code) {
       console.warn(code);
      }
      resolve({code: code, stdout: stdout, stderr: stderr});
     });
    });
}

