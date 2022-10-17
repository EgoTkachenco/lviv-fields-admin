"use strict";
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async find(ctx) {
    let entities;
    // const user = ctx.state.user;
    // if (user.role.name !== "Admin") ctx.query.users_in = user.id;
    if (ctx.query._q) {
      entities = await strapi.services.task.search(ctx.query);
    } else {
      entities = await strapi.services.task.find(ctx.query);
    }

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.task })
    );
  },
  async findOne(ctx) {
    const { id } = ctx.params;

    let entity = await strapi.services.task.findOne({ id });
    entity.messagesCount = await strapi.services.message.count({
      task: entity.id,
    });
    return sanitizeEntity(entity, { model: strapi.models.task });
  },
  async create(ctx) {
    let entity;
    ctx.request.body.users = [ctx.state.user.id];
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.task.create(data, { files });
    } else {
      entity = await strapi.services.task.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.task });
  },
  async addMember(ctx) {
    const { id } = ctx.params;
    const { memberId } = ctx.request.body;

    if (!memberId) return ctx.badRequest("User required");

    let task = await strapi.services.task.findOne({ id }, ["users"]);
    if (!task) return ctx.badRequest("Task not found");

    task.users = task.users.map((u) => String(u.id));
    if (task.users.includes(memberId))
      return ctx.badRequest("User already a member");

    await strapi.services.task.update(
      { id },
      { users: [...task.users, memberId] }
    );

    return "OK";
  },
  async deleteMember(ctx) {
    const { id, memberId } = ctx.params;

    let task = await strapi.services.task.findOne({ id }, ["users"]);
    if (!task) return ctx.badRequest("Task not found");

    task.users = task.users.map((u) => String(u.id));
    if (!task.users.includes(memberId))
      return ctx.badRequest("User not a member");

    await strapi.services.task.update(
      { id },
      { users: task.users.filter((u) => u !== memberId) }
    );

    return "OK";
  },
};
