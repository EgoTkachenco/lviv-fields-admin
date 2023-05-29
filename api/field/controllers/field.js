"use strict";
const { sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");

module.exports = {
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.field.search(ctx.query);
    } else {
      entities = await strapi.services.field.find(ctx.query, [
        "area",
        "plantations",
        "plantations.variety",
      ]);
    }

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.field })
    );
  },
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.query("field").findOne({ pathname: id }, [
      "plantations",
      "plantations.variety",
      // "owner_files",
      // "owner_avatar",
      // "contract_files",
      "files",
      "owners",
    ]);

    return sanitizeEntity(entity, { model: strapi.models.field });
  },
  async update(ctx) {
    const { id } = ctx.params;
    let body = ctx.request.body;

    // if (!body.area) return ctx.badRequest("area required");
    if (body.area) {
      const area = await strapi.services.area.findOne({ path: body.area });
      if (!area) return ctx.badRequest("area not found");
      body.area = area.id;
    }

    if (!body.contract_start) delete body.contract_start;
    if (!body.contract_due) delete body.contract_due;

    if (body.contract_start && body.contract_due)
      body.contract_term =
        new Date(body.contract_due).getFullYear() -
        new Date(body.contract_start).getFullYear();

    if (!body.size) delete body.size;

    const field = await strapi.services.field.findOne({ pathname: id });
    let entity;

    if (field) {
      entity = await strapi.services.field.update(
        { id: field.id },
        ctx.request.body
      );
    } else {
      entity = await strapi.services.field.create(ctx.request.body);
    }

    entity = await strapi.query("field").findOne({ pathname: id }, [
      "plantations",
      "plantations.variety",
      // "owner_files",
      // "owner_avatar",
      // "contract_files",
      "files",
      "owners",
    ]);
    return sanitizeEntity(entity, { model: strapi.models.field });
  },
  async summary(ctx) {
    let query = _.pick(ctx.query, [
      "area_in",
      "type_in",
      "category_in",
      "cadastr_in",
      "varieties_in",
      "contract_start_gte",
      "contract_due_lte",
      "plantation_year_gte",
      "plantation_year_lte",
    ]);
    query._limit = -1;
    let isVariety = false;
    let area = null;
    if (query.type_in) query.type_in = query.type_in.split(",");
    if (query.category_in) query.category_in = query.category_in.split(",");
    if (query.cadastr_in) query.cadastr_in = query.cadastr_in.split(",");

    let is_plantations_filter = false;
    let plantation_filter = { _limit: -1 };

    if (query.varieties_in) {
      isVariety = true;
      const varieties = ctx.query.varieties_in.split(",");
      delete query.varieties_in;
      is_plantations_filter = true;
      plantation_filter.variety_in = varieties;
    }
    if (query.plantation_year_gte) {
      is_plantations_filter = true;
      plantation_filter.year_gte = query.plantation_year_gte;
      delete query.plantation_year_gte;
    }
    if (query.plantation_year_lte) {
      is_plantations_filter = true;
      plantation_filter.year_lte = query.plantation_year_lte;
      delete query.plantation_year_lte;
    }

    if (query.area_in) {
      area = await strapi.query("area").findOne({ path: query.area_in });
      query.area_in = area.id;
    }

    if (is_plantations_filter) {
      let plantations = await strapi
        .query("plantation")
        .find(plantation_filter, []);
      query.id_in = _.uniq(plantations.map((p) => p.field));
    }

    let varieties = {};
    const fields = await strapi
      .query("field")
      .find(query, ["plantations", "plantations.variety"]);
    const stats = fields.reduce(
      (acc, field) => {
        if (!acc[field.type]) {
          acc[field.type] = 0;
        }
        if (isVariety) {
          field.plantations.forEach((plantation) => {
            if (
              !plantation_filter.variety_in.includes(
                plantation.variety.id.toString()
              )
            )
              return;
            if (varieties[plantation.variety.name]) {
              varieties[plantation.variety.name] += plantation.size;
            } else {
              varieties[plantation.variety.name] = plantation.size;
            }
          });
        }
        acc[field.type] += field.size;
        acc.all += field.size;
        return acc;
      },
      { all: 0 }
    );
    const isFilter =
      Object.keys(query).filter((key) => !["area_in", "_limit"].includes(key))
        .length > 0;
    return {
      ...stats,
      fields: isFilter ? fields.map((field) => field.pathname) : [],
      varieties: isVariety ? varieties : {},
      area,
    };
  },
  async export(ctx) {
    try {
      return await strapi.services.field.exportFields();
    } catch (error) {
      console.log(error.messase);
    }
  },
  async exportToXLSX(ctx) {
    try {
      return await strapi.services.export.exportFields(ctx.query);
    } catch (error) {
      console.log("error");
      console.log(error);
    }
  },
};
