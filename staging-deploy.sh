#!/bin/bash
grunt build:staging
s3cmd sync -P dist/ s3://preferences-staging.theglobalmail.org
grunt clean:dist
