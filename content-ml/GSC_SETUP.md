# Google Search Console setup

This lets `src/gsc.py` read SNKRS CART search data (which pages show up on Google, for which searches, and at what position). It is free. No billing account or card is needed. It takes about 10 minutes, once.

## 1. Create a Google Cloud project

1. Open https://console.cloud.google.com/ and sign in with the Google account that owns the snkrscart.com property in Search Console.
2. Click the project picker at the top of the page, then **New project**.
3. Name it `snkrscart-content` (any name works). Leave the organisation as is and click **Create**.
4. Make sure the new project is selected in the project picker.

If Google asks you to set up billing, skip it. The Search Console API does not need billing.

## 2. Enable the Search Console API

1. Open https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
2. Check that `snkrscart-content` is the selected project.
3. Click **Enable**.

## 3. Create a service account

1. Open https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click **Create service account**.
3. Name: `gsc-reader`. Click **Create and continue**.
4. Skip the optional role and user access steps. Click **Done**.
5. Copy the service account email from the list. It looks like `gsc-reader@snkrscart-content.iam.gserviceaccount.com`. You need it in step 5.

## 4. Download the JSON key

1. Click the `gsc-reader` service account, then the **Keys** tab.
2. Click **Add key**, then **Create new key**, choose **JSON**, and click **Create**. A `.json` file downloads.
3. Move it into the repo and rename it:

```bash
mkdir -p ~/snkrs-cart/content-ml/secrets
mv ~/Downloads/snkrscart-content-*.json ~/snkrs-cart/content-ml/secrets/gsc.json
chmod 600 ~/snkrs-cart/content-ml/secrets/gsc.json
```

`content-ml/secrets/` is git-ignored. Never commit this file or paste it anywhere. If it leaks, delete the key on the **Keys** tab and create a new one.

If your organisation blocks key creation ("Service account key creation is disabled"), create the project under your personal Google account instead, or ask the org admin to allow keys for this one project.

## 5. Give the service account read access in Search Console

1. Open https://search.google.com/search-console and pick the `snkrscart.com` domain property.
2. Go to **Settings**, then **Users and permissions**.
3. Click **Add user**.
4. Paste the service account email from step 3.
5. Permission: **Restricted**. Click **Add**.

Restricted is read-only. The script cannot change anything in Search Console.

## 6. Test it

```bash
cd ~/snkrs-cart/content-ml
commands/gsc-pull.sh
```

A good run prints the date range, how many rows and pages it saved, and the path of the refresh queue. `commands/status.sh` then shows the top pages to refresh.

| Message | Fix |
|---|---|
| `GSC key file not found` | The key is not at `content-ml/secrets/gsc.json`. Move it there or set `GSC_KEY_FILE`. |
| `No access to sc-domain:snkrscart.com` | Step 5 is missing, or the email has a typo. New users can take a few minutes to work. |
| `The Search Console API is not enabled in the Google Cloud project that owns this key` | Step 2 is missing, or it was done in a different project. |
| `Google rejected the service account key` | The key was deleted or the file is damaged. Create a new key (step 4). |

If the property is a URL-prefix property rather than a domain property, set `GSC_SITE=https://snkrscart.com/` before running.
