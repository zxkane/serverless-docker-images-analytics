#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ServerlessDockerImagesAnalyticsStack } from '../lib/serverless-docker-images-analytics-stack';

const app = new cdk.App();
new ServerlessDockerImagesAnalyticsStack(app, 'ServerlessDockerImagesAnalyticsStack');
