import * as cdk from '@aws-cdk/core'
import * as ssm from '@aws-cdk/aws-ssm'
import * as lambda from '@aws-cdk/aws-lambda'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as apigateway from '@aws-cdk/aws-apigateway'

export class ImageCacheStack extends cdk.Stack {
	constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
		super(scope, id, props)

		// PARAMS
		// PARAMS
		// PARAMS

		const icsecret = ssm.StringParameter.fromSecureStringParameterAttributes (
			this, 'icsecret', {parameterName: "/imagecache/secret", version: 1}
		)
		const resizeDefault = ssm.StringParameter.fromStringParameterAttributes(
			this, 'resizeDefault', {parameterName: "/imagecache/resizeDefault"}
		)
		const maxRawFileSize = ssm.StringParameter.fromStringParameterAttributes(
			this, 'maxRawFileSize', {parameterName: "/imagecache/maxRawFileSize"}
		)
		const maxCookedFileSize = ssm.StringParameter.fromStringParameterAttributes(
			this, 'maxCookedFileSize', {parameterName: "/imagecache/maxCookedFileSize"}
		)
		const cacheLength = ssm.StringParameter.fromStringParameterAttributes(
			this, 'cacheLength', {parameterName: "/imagecache/cacheLength"}
		)

		// DATABASE
		// DATABASE
		// DATABASE

		const tableName = "imagecache"

		const table = new dynamodb.Table(this, tableName, {
			partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			tableName
		})

		// LAMBDAS
		// LAMBDAS
		// LAMBDAS

		const authLambda = new lambda.Function(this, "authLambdaHandler", {
			runtime: lambda.Runtime.NODEJS_14_X,
			code: lambda.Code.fromAsset("functions"),
			handler: "auth.handler",
		})

		const addLambda = new lambda.Function(this, "addLambdaHandler", {
			runtime: lambda.Runtime.NODEJS_14_X,
			code: lambda.Code.fromAsset("functions"),
			handler: "add.handler",
			environment: {
				TABLE_NAME: tableName,
			}
		})

		// Layer built by following: https://github.com/serverlesspub/imagemagick-aws-lambda-2
		const gmLayerArn = "arn:aws:lambda:eu-west-2:703300139815:layer:myimagemagicklayer:1" // My one
		const gmLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'gmLayer', gmLayerArn)

		const dlLambda = new lambda.Function(this, "dlLambdaHandler", {
			layers: [gmLayer],
			runtime: lambda.Runtime.NODEJS_14_X,
			code: lambda.Code.fromAsset("functions"),
			handler: "dl.handler",
			timeout: cdk.Duration.seconds(15),
			environment: {
				TABLE_NAME: tableName,
				RESIZE_DEFAULT: resizeDefault.stringValue,
				MAX_RAW_FILE_SIZE: maxRawFileSize.stringValue,
				MAX_COOKED_FILE_SIZE: maxCookedFileSize.stringValue
			}
		})

		const getLambda = new lambda.Function(this, "getLambdaHandler", {
			runtime: lambda.Runtime.NODEJS_14_X,
			code: lambda.Code.fromAsset("functions"),
			handler: "get.handler",
			environment: {
				TABLE_NAME: tableName,
				CACHE_LENGTH: cacheLength.stringValue
			}
		})

		const testLambda = new lambda.Function(this, "testLambdaHandler", {
			runtime: lambda.Runtime.NODEJS_14_X,
			code: lambda.Code.fromAsset("functions"),
			handler: "test.handler"
		})

		// PERMISSIONS
		// PERMISSIONS
		// PERMISSIONS

		table.grantReadWriteData(addLambda)
		table.grantReadWriteData(dlLambda)
		table.grantReadData(getLambda)

		icsecret.grantRead(authLambda)

		// resizeDefault.grantRead(addLambda)

		// API
		// API
		// API

		const api = new apigateway.RestApi(this, "image-cache-api", {
			restApiName: "image cache",
			description: "Caches images and serve with very long expiry",
			binaryMediaTypes: ["*/*"],
			deployOptions: {
				methodOptions: {
					'/*/*': {
						throttlingBurstLimit: 50,
						throttlingRateLimit: 10
					},
					'/ImageCacheStack/POST': {
						throttlingBurstLimit: 10,
						throttlingRateLimit: 5
					}
				}
			}
		})

		// TEST
		const test = api.root.addResource("test")
		test.addMethod("GET", new apigateway.LambdaIntegration(testLambda))

		// ADD
		const addRoot = api.root.addResource("add")
		const addAuth = new apigateway.TokenAuthorizer(this, 'addAuthorizer', {
			handler: authLambda
		})
		const addMethodOptions = {
			authorizationType: apigateway.AuthorizationType.CUSTOM,
			authorizer: addAuth
		}
		const add = addRoot.addResource("{type}")
		const addOptions = { contentHandling: apigateway.ContentHandling.CONVERT_TO_TEXT }
		add.addMethod("POST", new apigateway.LambdaIntegration(addLambda, addOptions), addMethodOptions)

		// DL
		const dl = api.root.addResource("dl")
		const dlAuth = new apigateway.TokenAuthorizer(this, 'dlAuthorizer', {
			handler: authLambda
		})
		const dlMethodOptions = {
			authorizationType: apigateway.AuthorizationType.CUSTOM,
			authorizer: dlAuth
		}
		dl.addMethod("POST", new apigateway.LambdaIntegration(dlLambda), dlMethodOptions)

		// GET
		const get = api.root.addResource("get")
		const getWithId = get.addResource("{file}")
		const getIntegrationOptions = {
			contentHandling: apigateway.ContentHandling.CONVERT_TO_BINARY
		}
		getWithId.addMethod("GET", new apigateway.LambdaIntegration(
			getLambda,
			getIntegrationOptions
		))


		// TERMINAL OUTPUT
		// TERMINAL OUTPUT
		// TERMINAL OUTPUT

		new cdk.CfnOutput(this, "API URL", {
			value: api.url ?? "Deploy problems"
		})

		new cdk.CfnOutput(this, 'IMAGE CACHE RESIZE DEFAULT', {
			value: resizeDefault.stringValue
		})

	}
}
