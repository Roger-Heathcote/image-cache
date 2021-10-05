import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as apigateway from '@aws-cdk/aws-apigateway';

export class ImageCacheStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DATABASE

    const tableName = "imagecache"

    const table = new dynamodb.Table(this, tableName, {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName
    })
    
    // LAMBDAS

    const addLambda = new lambda.Function(this, "addLambdaHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("functions"),
      handler: "add.handler",
      environment: {
        TABLE_NAME: tableName
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

    // DATABASE PERMISSIONS

    table.grantReadWriteData(addLambda)

    // API

    const api = new apigateway.RestApi(this, "image-cache-api", {
      restApiName: "image cache",
      description: "Caches images and serve with very long expiry",
      deployOptions: {
        methodOptions: {
          '/*/*': {
            throttlingBurstLimit: 30,
            throttlingRateLimit: 1
          },
          '/ImageCacheStack/POST': {
            throttlingBurstLimit: 1,
            throttlingRateLimit: 1
          },
          '/ImageCacheStack/PUT': {
            throttlingBurstLimit: 1,
            throttlingRateLimit: 1
          },
        }
      }
    })

    // TEST
    const test = api.root.addResource("test")
    test.addMethod("GET", new apigateway.LambdaIntegration(testLambda))



    // ADD
    const add = api.root.addResource("add")
    add.addMethod("POST", new apigateway.LambdaIntegration(addLambda))
    // To convert binary to b64 here add an options object as second parameter to .lambdaIntegration
    // { contentHandling: apigateway.ContentHandling.CONVERT_TO_TEXT }
    // TO add auth add options obj as third param to add Method...
    // {
    //   authorizationType: apigateway.AuthorizationType.IAM,
    //   apiKeyRequired: true
    // }



    // GET
    const options = {
      // proxy: false,
      // requestParameters: {
      //   "integration.request.path.id" : "method.request.path.id"
      // },
      requestTemplate: {
        "id": "$input.params('id')",
      }
    }
    const get = api.root.addResource("get")
    const getWithId = get.addResource("{id}")
    getWithId.addMethod("GET", new apigateway.LambdaIntegration(getLambda, options))



    // api.root
    //   .resourceForPath("add")
    //   .addMethod("POST", new apigateway.LambdaIntegration(addLambda))
    
    // api.root
    //   .resourceForPath("get/{id}")
    //   .addMethod("GET", new apigateway.LambdaIntegration(getLambda))
    

    // api.root
    //   .resourceForPath("test")
    //   .addMethod("GET", new apigateway.LambdaIntegration(testLambda))

    // TERMINAL OUTPUT

    new cdk.CfnOutput(this, "API URL", {
      value: api.url ?? "Deploy problems"
    })

  }
}
