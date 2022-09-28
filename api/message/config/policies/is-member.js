module.exports = async (ctx, next) => {
  const { task } = ctx.request.body;

  let chat = await strapi.services.task.findOne({ id: task }, ["users"]);
  if (!chat) return ctx.badRequest("No task found");

  if (ctx.state.user.role.name === "Admin") return await next();

  const isInChat = chat.users
    .map((user) => user.id)
    .includes(ctx.state.user?.id);

  if (isInChat) return await next();

  ctx.unauthorized(`You're not allowed to perform this action!`);
};
