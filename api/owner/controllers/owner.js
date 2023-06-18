"use strict";
const { sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async exportToXLSX(ctx) {
    try {
      let entities;
      const search = ctx.query.search;
      delete ctx.query.search;
      if (search) ctx.query._limit = -1;
      entities = await strapi.services.owner.find(ctx.query);
      if (search)
        entities = entities.filter(
          (el) =>
            el.full_name.toLowerCase().search(search) !== -1 ||
            el.cadastr.toLowerCase().search(search) !== -1
        );

      return await strapi.services.export.exportOwners({
        id_in: entities.map((el) => el.id),
      });
    } catch (error) {
      console.log(error);
    }
  },

  async find(ctx) {
    let entities;
    const search = ctx.query.search;
    const limit = ctx.query._limit;
    const start = ctx.query._start;
    delete ctx.query.search;

    if (ctx.query.type) {
      const fields = await strapi
        .query("field")
        .find({ _limit: -1, type: ctx.query.type });
      delete ctx.query.type;
      ctx.query.field_in = fields.map((f) => f.id);
    }

    if (search) ctx.query._limit = -1;
    entities = await strapi.services.owner.find(ctx.query);
    if (search)
      entities = entities
        .filter(
          (el) =>
            el.full_name.toLowerCase().search(search) !== -1 ||
            el.cadastr.toLowerCase().search(search) !== -1
        )
        .splice(start, limit);

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.owner })
    );
  },
  async count(ctx) {
    let entities;
    const search = ctx.query.search;
    delete ctx.query.search;
    delete ctx.query._start;
    ctx.query._limit = -1;

    if (ctx.query.type) {
      const fields = await strapi
        .query("field")
        .find({ _limit: -1, type: ctx.query.type });
      delete ctx.query.type;
      ctx.query.field_in = fields.map((f) => f.id);
    }

    entities = await strapi.services.owner.find(ctx.query);
    if (search)
      entities = entities.filter(
        (el) =>
          el.full_name.toLowerCase().search(search) !== -1 ||
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
    entities = await strapi.services.owner.find(ctx.query);
    if (search)
      entities = entities.filter(
        (el) =>
          el.full_name.toLowerCase().search(search) !== -1 ||
          el.cadastr.toLowerCase().search(search) !== -1
      );
    const cadastrs = _.union(entities.map((e) => e.cadastr));
    return cadastrs;
  },
};
