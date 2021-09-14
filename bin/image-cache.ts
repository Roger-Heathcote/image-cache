#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ImageCacheStack } from '../lib/image-cache-stack';

const app = new cdk.App();
new ImageCacheStack(app, 'ImageCacheStack');
