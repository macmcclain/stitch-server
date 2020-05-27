const axios = require('axios');
const YAML = require('yamljs');
const StitchApp = require('./stitchApp');
const path = require('path');
const DB = require('../../lib/db');

module.exports = class ModuleManager {
  constructor() {
    this.apps = [];
  }

  loadApps = async () => {
    // query db to get a list of the active modules.
    console.log("getting list of active modules.");

    // get all the records that match the name.
    const result = await DB.query('StitchApp', {
      ExpressionAttributeValues: {
        ':status': 'published'
      },
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      FilterExpression: '#status = :status'
    });

    console.log("apps found", result);

    return result;
  }

  compile = async () => {
    this.apps = [];

    const loadedApps = await this.loadApps();

    // generate the stich apps.
    loadedApps.Items.forEach(async (a) => {
      console.log("module", a);
      const stitchApp = new StitchApp(a)
      this.apps.push(stitchApp);
    });


  }

  getAppById(id) {
    const a = this.apps.find(r => r.id === id);
    return a;
  }

  getApps() {
    return this.apps;
  }


}
