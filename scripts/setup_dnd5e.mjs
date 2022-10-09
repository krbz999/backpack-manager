import { BackpackManager } from "./backpack-manager.mjs";
import { MODULE } from "./constants.mjs";

export function setup_dnd5e() {
  Hooks.on("renderItemSheet", ({ object: item }, html) => {
    if (item.type !== "backpack") return;
    const selector = "[name='system.capacity.weightless']";
    const weightless = html[0].querySelector(selector);
    const label = weightless.closest("label");

    const labelText = game.i18n.localize("DND5E.ItemTypeBackpack");
    const title = game.i18n.localize("BACKPACK_MANAGER.PLACE_UUID_HERE");
    const name = `flags.${MODULE}.containerActorUuid`;
    const value = item.getFlag(MODULE, "containerActorUuid") ?? "";
    const placeholder = `Actor.a1s2d3f4g5h6j7k8...`;
    const template = `
    <label title="${title}">${labelText}:</label>
    <input type="text" name="${name}" value="${value}" placeholder="${placeholder}">`;
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
    if (backpack === item.parent) {
      const string = "BACKPACK_MANAGER.BACKPACK_IS_SELF";
      const locale = game.i18n.localize(string);
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
}
