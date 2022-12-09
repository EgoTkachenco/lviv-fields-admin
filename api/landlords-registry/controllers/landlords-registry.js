"use strict";
const { sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");

const date_keys = [
  "contract_date",
  "state_registration_date",
  "assessment_date",
  "state_act_date",
  "passport_date",
];

module.exports = {
  async find(ctx) {
    let entities;
    const search = ctx.query.search;
    const limit = ctx.query._limit;
    const start = ctx.query._start;
    delete ctx.query.search;
    if (search) ctx.query._limit = -1;
    entities = await strapi.services["landlords-registry"].find(ctx.query);
    if (search)
      entities = entities
        .filter(
          (el) =>
            el.landlord_by_public_cadastral.toLowerCase().search(search) !==
              -1 || el.cadastr.toLowerCase().search(search) !== -1
        )
        .splice(start, limit);

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models["landlords-registry"] })
    );
  },
  async count(ctx) {
    let entities;
    const search = ctx.query.search;
    delete ctx.query.search;
    delete ctx.query._start;
    ctx.query._limit = -1;
    entities = await strapi.services["landlords-registry"].find(ctx.query);
    if (search)
      entities = entities.filter(
        (el) =>
          el.landlord_by_public_cadastral.toLowerCase().search(search) !== -1 ||
          el.cadastr.toLowerCase().search(search) !== -1
      );
    return entities.length;
  },
  async findOnMap(ctx) {
    let entities;
    const search = ctx.query.search;
    delete ctx.query.search;
    delete ctx.query._start;
    ctx.query._limit = -1;
    entities = await strapi.services["landlords-registry"].find(ctx.query);
    if (search)
      entities = entities.filter(
        (el) =>
          el.landlord_by_public_cadastral.toLowerCase().search(search) !== -1 ||
          el.cadastr.toLowerCase().search(search) !== -1
      );
    const cadastrs = _.union(entities.map((e) => e.cadastr));
    return cadastrs;
    // const fields = await strapi.services.field.find({
    //   cadastr_in: cadastrs,
    //   _limit: -1,
    // });
    // return fields.map((field) => field.pathname);
  },
  async importFromFile(ctx) {
    const data = require("../../../public/output.json");
    for (let i = 0; i < data.length; i++) {
      let element = data[i];
      Object.keys(element).forEach((key) => {
        if (date_keys.includes(key)) {
          element[key] =
            element[key] && !isNaN(new Date(element[key]).getTime())
              ? new Date(element[key])
              : null;
          // console.log("DATE", element[key]);
        } else {
          element[key] = element[key].toString();
        }
      });
      await strapi.services["landlords-registry"].create(element);
      console.log(`${i + 1} / ${data.length}`);
    }
    ctx.send("OK");
  },
};
