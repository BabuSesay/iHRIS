var express = require("express");
var router = express.Router();
var axios = require("axios");
const fs = require('fs')
const URI = require('urijs');
const env = process.env.NODE_ENV || 'development';

var config = require(__dirname + '/../config/config.json')[env];
if(env === "production") {
  config = JSON.parse(fs.readFileSync(`/run/secrets/server_config`, 'utf8'))[env];
}

router.get("/all/:definition", async function (req, res, next) {
  let previousUrl = null;
  let url = URI(config.fhir.server).segment('fhir').segment(req.params.definition);
  let results = [];

  url.addQuery("_count", 500);
  url = url.toString();

  do {
    previousUrl = url;

    let response = await axios.get(url, {
      params: {},
      withCredentials: true,
      auth: {
        username: config.fhir.username,
        password: config.fhir.password
      }
    });

    if (response.data.link) {
      for (var i in response.data.link) {
        let link = response.data.link[i];

        if (link.relation === "next") {
          url = link.url;
        }
      }
    }

    results = results.concat(response.data.entry);
  } while (url !== previousUrl);

  res.status(201).json(results);
});

/**
 * Save a new structure definition
 */
router.post("/add", function (req, res, next) {
  let data = req.body;

  let url = URI(config.fhir.server).segment('fhir').segment(data["resourceType"]).toString()
  axios.post(url, data, {
    withCredentials: true,
    auth: {
      username: config.fhir.username,
      password: config.fhir.password
    }
  }).then(response => {
    res.status(201).json(response.data);
  }).catch(err => {
    res.status(400).json(err);
  });
});

/**
 * Get a reference definition
 */
router.get("/get/:definition/:id", function (req, res, next) {
  let url = URI(config.fhir.server).segment('fhir').segment(req.params.definition).segment(req.params.id).toString();

  axios.get(url, {
    params: {},
    withCredentials: true,
    auth: {
      username: config.fhir.username,
      password: config.fhir.password
    }
  }).then(response => {
    res.status(201).json(response.data);
  }).catch(err => {
    res.status(400).json(err);
  });
});

/**
 * Upload multiple structure definitions
 */
router.post("/upload", function (req, res, next) {
  let data = req.body;

  let bundle = {
    resourceType: "Bundle",
    type: "transaction",
    entry: []
  };

  let content = JSON.parse(data.bundle);

  for (element in content) {
    content[element].resourceType = data.definition;

    let record = {
      resource: content[element],
      request: {
        method: "POST",
        url: data.definition
      }
    };
  }

  let url = URI(config.fhir.server).segment('fhir').toString();

  axios.post(url, bundle, {
    withCredentials: true,
    auth: {
      username: config.fhir.username,
      password: config.fhir.password
    }
  }).then(response => {
    res.status(201).json({ success: true, count: JSON.parse(data.bundle).length });
  }).catch(err => {
    res.status(400).json(err);
  });
});

/**
 * Get valid structure definitions
 */
router.get("/valid", async function (req, res, next) {
  let url = URI(config.fhir.server).segment('fhir').segment("StructureDefinition");
  url.addQuery("_count", 5000);
  url = url.toString();

  let previousUrl;
  let structureDefinitions = [];

  do {
    previousUrl = url;

    let response = await axios.get(url, {
      params: {},
      withCredentials: true,
      auth: {
        username: config.fhir.username,
        password: config.fhir.password
      }
    });

    if (response.data.link) {
      for (var i in response.data.link) {
        let link = response.data.link[i];

        if (link.relation === "next") {
          url = link.url;
        }
      }
    }

    for (var j in response.data.entry) {
      let entry = response.data.entry[j];
      structureDefinitions.push(entry.resource.id);
    }
  } while (url !== previousUrl);

  res.status(201).json(structureDefinitions);
});

module.exports = router;
