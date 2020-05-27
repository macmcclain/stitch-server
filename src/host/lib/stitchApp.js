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
    this.assets = JSON.parse(assets);
  }

  build = async () => {
    /*
    //getting the config.
    const configResponse = await axios.get(this.url + "/config.yml");
    const config = YAML.parse(configResponse.data);

    this.compiled.routes = config.routes;
     */
  }



}
