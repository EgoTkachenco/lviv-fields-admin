"use strict";
const { sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");
const moment = require("date-fns");

module.exports = {
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi
      .query("field")
      .findOne({ pathname: id }, [
        "plantations",
        "plantations.variety",
        "owner_files",
        "owner_avatar",
        "contract_files",
      ]);

    return sanitizeEntity(entity, { model: strapi.models.field });
  },
  async update(ctx) {
    const { id } = ctx.params;
    let body = ctx.request.body;
    if (!body.area) return ctx.badRequest("area required");

    const area = await strapi.services.area.findOne({ name: body.area });
    if (!area) return ctx.badRequest("area not found");

    body.area = area.id;
    if (!body.owner_birthdate) delete body.owner_birthdate;

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

    entity = await strapi
      .query("field")
      .findOne({ pathname: id }, [
        "plantations",
        "plantations.variety",
        "owner_files",
        "owner_avatar",
        "contract_files",
      ]);
    return sanitizeEntity(entity, { model: strapi.models.field });
  },
  async summary(ctx) {
    let query = _.pick(ctx.query, [
      "area_in",
      "type_in",
      "category_in",
      "varieties_in",
      "contract_term_gte",
      "contract_term_lte",
      "plantation_year_gte",
      "plantation_year_lte",
    ]);
    let isVariety = false;
    if (query.type_in) query.type_in = query.type_in.split(",");
    if (query.category_in) query.category_in = query.category_in.split(",");

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
    };
  },
};
