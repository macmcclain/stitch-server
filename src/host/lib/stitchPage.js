var path = require('path');
var fs = require('fs');
const cheerio = require('cheerio');

module.exports = class StitchPage {
  constructor({ path, stitchAppManager, assetHostUrl }) {
    this.path = path;
    this.assetHostUrl = assetHostUrl;
    this.stitchAppManager = stitchAppManager;

    this.page = {
      html: null
    };

    this.generatePage();
  }

  // generate the page
  generatePage () {


    // get the app for this route. Right now we only handle one app per route and we pull in the route by app id


    const html = this.buildTemplate();
    this.page.html = html;


    console.log("html", html);

  }

  buildTemplate() {
    // get the template html
    const templatePath = path.join(process.cwd(), 'src', 'host', 'templates', 'default.html');
    const templateHtml = fs.readFileSync(templatePath, {encoding: "utf8"});

    // load the template for parsing.
    const $ = cheerio.load(templateHtml, {xmlMode: false});


    // load the header
    const stitchHeader = this.stitchAppManager.getAppById('header');
    this.addAppToTemplate($, stitchHeader, `header`);


    // add the app
    const stitchApp = this.stitchAppManager.getAppById(this.path);
    this.addAppToTemplate($, stitchApp, `main`);



    // add the footer: todo: add footer support


    // merge and add assets to the page.
    const assets = this.mergeAssets([stitchApp, stitchHeader]);
    assets.forEach((asset) => {
      if(asset.type === 'style') {
        const assetElementStyle = `<link type="text/css" rel="stylesheet" href="${asset.path}">`
        $('head').append(assetElementStyle);
      }

      if(asset.type === 'script') {
        const assetElementScript = `<script src='${asset.path}'></script>`
        $('body').append(assetElementScript);

        const assetElementScriptPreload = `<link href="${asset.path}" rel="preload" as="script">`
        $('head').append(assetElementScriptPreload)
      }

    });

    // add the config to the page
    const config = {
      settings: {
        name: 'Stitch'
      },
      apps: this.stitchAppManager.getApps(),
      currentApp: stitchApp
    }
    const configElement = `<script id="stitch-config" type="application/json">${JSON.stringify(config)}</script>`
    $('body').append(configElement);

    //return the compiled template
    return $.html();
  }

  addAppToTemplate($, app, sectionId) {
    //`stitch-app-${app.id}`
    let appPlaceholder = null;
    if(app) {
      appPlaceholder = `<div id="stitch-app-${app.id}"></div>`
    } else {
      appPlaceholder = `<div style="width: 100%; text-align: center; padding: 20px;">App not found. Please contact support.</div>`;
    }

    // add the app to the main area.
    const section = $('#' + sectionId);
    section.append(appPlaceholder);

  }

  // merge all the assets into an array
  mergeAssets(apps) {
    const assets = [];
    apps.forEach((app) => {
      if(app) {
        app.assets.forEach((asset) => {
          const assetPath = `${this.assetHostUrl}/${app.source}${asset}`;
          let type = null;
          if(asset.endsWith(".css")) {
            type = 'style'
          }
          else if(asset.endsWith(".js")) {
            type = 'script'
          }

          assets.push({
            type: type,
            path: assetPath
          });
        });
      }
    });

    return assets;
  }

  // stitch the apps together and return the html.
  getPage() {
    return this.page;
  }



}
