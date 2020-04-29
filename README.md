# bitrise-api-sim-crash-detector
Detect iOS Simulator Crashes in Logs using Bitrise API

To run this against your own Bitrise Apps just update the settings in js/app.js

```
const WORKFLOWS = ['primary'];
const PERSONAL_ACCESS_TOKEN = '';
const APP_SLUG = '';
const LAST_BUILD_SLUG = '';
const MIN_BUILD_NUMBER = 0;
```

## WORKFLOWS

An array of workflows to query in your Bitrise app

## PERSONAL_ACCESS_TOKEN

Generate a Personal Access Token following the guide here:

- https://devcenter.bitrise.io/getting-started/account-security/#generating-personal-access-tokens-manually

## APP_SLUG

The Bitrise App Slug of the app you wish to query

You can get the APP_SLUG from the Bitrise URL when viewing your App & Build.

## LAST_BUILD_SLUG

You can get the LAST_BUILD_SLUG from the Bitrise URL when viewing your App & Build.

The LAST_BUILD_SLUG should be the Bitrise build slug of the last build you want to load data up to.

## MIN_BUILD_NUMBER

The last build number to query.

I would recomend to set the MIN_BUILD_NUMBER no more than 1000 below your current build number so it loads fully faster.

