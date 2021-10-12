import * as cdk from '@aws-cdk/core'
import * as ssm from '@aws-cdk/aws-ssm'
import * as lambda from '@aws-cdk/aws-lambda'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as apigateway from '@aws-cdk/aws-apigateway'

export class ImageCacheStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

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

    const getLambda = new lambda.Function(this, "getLambdaHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("functions"),
      handler: "get.handler",
      environment: {
        TABLE_NAME: tableName
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
    table.grantReadWriteData(getLambda)

    const icsecret = ssm.StringParameter.fromSecureStringParameterAttributes (
      this,
      'icsecret',
      {
        parameterName: "icsecret",
        simpleName: true,
        version: 1
      }
    )
    icsecret.grantRead(authLambda)

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
            throttlingBurstLimit: 30,
            throttlingRateLimit: 1
          },
          '/ImageCacheStack/POST': {
            throttlingBurstLimit: 3,
            throttlingRateLimit: 1
          }
        }
      }
    })

    // TEST
    const test = api.root.addResource("test")
    test.addMethod("GET", new apigateway.LambdaIntegration(testLambda))


    // ADD
    const add = api.root.addResource("add")
    const addAuth = new apigateway.TokenAuthorizer(this, 'addAuthorizer', {
      handler: authLambda
    })
    const addMethodOptions = {
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      authorizer: addAuth
    }
    add.addMethod("POST", new apigateway.LambdaIntegration(addLambda), addMethodOptions)
    // To convert binary to b64 here add an options object as second parameter to .lambdaIntegration
    // { contentHandling: apigateway.ContentHandling.CONVERT_TO_TEXT }

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

  }
}
