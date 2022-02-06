## What this does

This is a AWS CDK application that uses Lambda and DynamoDB to recompress and serve small thumbnail images with very long cache times. It's purpose is to allow you to use small 3rd party images in your web apps without hotlinking to the source, which is both rude and flaky.

Input images are specified using the `/dl` method, downloaded from the source url, rescaled at a fixed width, recompressed and stored as webp. The default width is 350 pixels but can be overridden using parameters specified in AWS Systems Manager Parameter Store.

Alternatively binary files may be uploaded directly with the `/add/{type}` method

Please note this application is written for my own use. While you are very welcome to use please note there are no official versions or releases yet, there may still be showstopper bugs, there are no tests so far, some things that should be parameterized are probably hard coded, and the API may change without warning! 

If you have a need for something like this please get in touch though. I'd  like to hear other people's use cases and requirements and, if anyone else wants to use it I could prioritize making it more general, parameterized and stable. Likewise if you want to contribute that would be welcome, there's no shortage of things to improve here!

---

## Things you need to run it

- An Amazon AWS account
- A lambda layer with ImageMagick binaries. [Instructions here](https://github.com/serverlesspub/imagemagick-aws-lambda-2)
- The following Parameter Store parameter (read at runtime)...
	- `/imagecache/secret` (Secure String) Secret value for Bearer token.

## Optional parameters

These Parameter Store parameters are read at deployment time...

- `/imagecache/resizeDefault` (String::pixels, default 350) The width to resize images to
- `/imagecache/maxCookedFileSize` (String::bytes, default 350,000) Reject recompressed images larger than
- `/imagecache/maxRawFileSize` (String::bytes, default 2,000,000) Reject downloads larger than
- `/imagecache/downloadTimeout` (String::bytes, default 2,000,000) Reject downloads larger than

## Upload tool

If you wish to use the `icUp` command line tool to upload images from the command line then you need to provide the following environment variables.

- IC_ENDPOINT (Your deployment's endpoint with no trailing slash)
- IC_SECRET (The bearer token value specified in)

You may specify them in the shell or in a .env file in the project root.

---

## Useful commands

 - `npm run build` to run typescript compiler
 - `cdk deploy` to deploy
 - `npm run go` to build and deploy

---

## API Methods

- `POST /add/{type}`
	- Upload binary file with a specified file extension.
	- Permitted extensions are webp, png, jpg, jpeg, svg, & txt
	- `{type}` is the file extension.
	- POST body is binary data
	- `Authorization` header must be set with prefix `"Bearer "`

<br>

- `POST /dl`
	- Specify a URL to an image file for the system to download
	- POST body is JSON `{url: http://example.com/img.png}`
	- `Authorization` header must be set with prefix `"Bearer "`

<br>

- `GET /get/{fileName}`
	- Download the file