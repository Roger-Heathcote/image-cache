// import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from 'aws-lambda'

exports.handler = async function(event: any){
	const token = event.authorizationToken
	const methodArn = event.methodArn

	return generateAuthResponse('user', 'Allow', methodArn)
}

function generateAuthResponse(principalId:any, effect:any, methodArn:any){
	const policyDocument = generatePolicyDocument(effect,methodArn)
	return {
		principalId,
		policyDocument
	}
}

function generatePolicyDocument(effect:any, methodArn: any){
	if(!effect || !methodArn) return null

	const policyDocument = {
		Version: '2012-10-17',
		Statement: [{
			Action: 'execute-api: Invoke',
			effect: effect,
			Resource: methodArn
		}]
	}

	return policyDocument
}