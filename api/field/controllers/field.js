"use strict";
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi
      .query("field")
      .findOne({ pathname: id }, ["plantations", "plantations.variety"]);

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

    // if (ctx.is('multipart')) {
    //   const { data, files } = parseMultipartData(ctx);
    //   entity = await strapi.services.field.update({ id }, data, {
    //     files,
    //   });
    // } else {
    // }

    entity = await strapi
      .query("field")
      .findOne({ pathname: id }, ["plantations", "plantations.variety"]);
    return sanitizeEntity(entity, { model: strapi.models.field });
  },
  async summary(ctx) {
    console.log(ctx.query);
    if (ctx.query.type_in) ctx.query.type_in = ctx.query.type_in.split(",");
    if (ctx.query.category_in)
      ctx.query.category_in = ctx.query.category_in.split(",");

    const fields = await strapi.query("field").find(ctx.query);
    const stats = fields.reduce(
      (acc, field) => {
        if (!acc[field.type]) {
          acc[field.type] = 0;
        }
        acc[field.type] += field.size;
        acc.all += field.size;
        return acc;
      },
      { all: 0 }
    );

    return { ...stats, fields: fields.map((field) => field.pathname) };
  },
  async areaSummary(ctx) {},
};
