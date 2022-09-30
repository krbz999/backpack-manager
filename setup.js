import { MODULE } from "./scripts/constants.mjs";
import { BackpackManager } from "./scripts/backpack-manager.mjs";

Hooks.on("renderItemSheet", ({ object: item }, html) => {
  if (item.type !== "backpack") return;
  const name = "[name='system.capacity.weightless']";
  const weightless = html[0].querySelector(name);
  const label = weightless.closest("label");

  const value = item.getFlag(MODULE, "containerActorUuid") ?? "";
  const template = `
  <label>Backpack:</label>
  <input type="text" name="flags.${MODULE}.containerActorUuid" value="${value}" placeholder="Backpack actor uuid">`;
  const DIV = document.createElement("DIV");
  DIV.innerHTML = template;
  label.after(...DIV.children);
});

Hooks.on("dnd5e.preUseItem", (item) => {
  if (item.type !== "backpack") return;

  const uuid = item.getFlag(MODULE, "containerActorUuid");
  if (!uuid) return;

  const backpack = fromUuidSync(uuid);
  if (!backpack) {
    const string = "BACKPACK_MANAGER.NO_ACTOR_FROM_UUID";
    const locale = game.i18n.format(string, { item: item.name });
    ui.notifications.warn(locale);
    return;
  }

  const render = !Object.values(backpack.apps).some(app => {
    return app.constructor.name === "BackpackManager";
  });
  const actor = item.parent;
  if (render) {
    const pack = new BackpackManager({ backpack, actor }, {
      title: game.i18n.format("BACKPACK_MANAGER.TITLE", {
        actor: item.parent.name,
        bag: backpack.name
      }),
      max: item.system.capacity.value
    });
    if (pack.isOwner) pack.render(true);
    else {
      const string = "BACKPACK_MANAGER.NOT_OWNER";
      const locale = game.i18n.localize(string);
      ui.notifications.error(locale);
      return;
    }
  }

  return false;
});

Hooks.once("setup", () => {
  Handlebars.registerHelper("checkqty", function (qty) {
    return qty > 1;
  });
});
