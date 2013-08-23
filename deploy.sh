#!/bin/bash
grunt build
s3cmd sync -P dist/ s3://preferences.theglobalmail.org
grunt clean:dist
