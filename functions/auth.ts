const aws = require('aws-sdk')
const ssm = new aws.SSM()

interface authLambdaProps {
	type: string,
	authorizationToken: string
	methodArn: string
}

async function getSecret() {
    const params = {Name: 'icsecret', WithDecryption: true}
    const result = await ssm.getParameter(params).promise()
    return result.Parameter.Value || ""
}

exports.handler = async function(event: authLambdaProps){

	const secret = await getSecret()
	const token = event.authorizationToken
	const methodArn = event.methodArn
	const authOK = secret.length && (token === "Bearer " + secret)
	const Effect = authOK ? "Allow" : "Deny"

	// What difference does principalId make???
	const response = {
		principalId: "monkeyfunk@example.com",
		policyDocument: {
			Version: '2012-10-17',
			Statement: [{
				Effect,
				Action: 'execute-api:Invoke',
				Resource: methodArn
			}]
		},
	}

	return response
}
