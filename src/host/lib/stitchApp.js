const axios = require('axios');
const YAML = require('yamljs');
module.exports = class StitchApp {
  constructor({id, name, source, config, version, assets, type}) {
    this.id = id;
    this.name = config.name || this.id;
    this.config = config;
    this.version = version;
    this.source = source;
    this.type = config.type;
    this.assets = assets;
  }




}
