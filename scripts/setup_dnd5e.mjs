import { BackpackManager } from "./backpack-manager.mjs";
import { MODULE } from "./constants.mjs";

export function setup_dnd5e() {
  Hooks.on("renderItemSheet", ({ object: item }, html) => {
    if (item.type !== "backpack") return;
    const selector = "[name='system.capacity.weightless']";
    const weightless = html[0].querySelector(selector);
    const label = weightless.closest("label");

    const labelText = game.i18n.localize("ITEM.TypeContainer");
    const name = `flags.${MODULE}.containerActorUuid`;
    const value = item.getFlag(MODULE, "containerActorUuid") ?? "";
    const placeholder = `Actor.a1s2d3f4g5h6j7k8...`;
    const template = `
    <label data-tooltip="BACKPACK_MANAGER.PlaceUuidHere">${labelText}:</label>
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
    if (!backpack || !(backpack instanceof Actor)) {
      const string = "BACKPACK_MANAGER.UuidActorNotFound";
      const locale = game.i18n.format(string, { item: item.name });
      ui.notifications.warn(locale);
      return;
    }
    if (backpack === item.parent) {
      ui.notifications.warn("BACKPACK_MANAGER.CannotUseSelf", { localize: true });
      return;
    }

    const render = !Object.values(backpack.apps).some(app => {
      return app.constructor.name === "BackpackManager";
    });
    const actor = item.parent;
    // backpack: the actor acting as the backpack.
    // actor: the actor stowing or retriving items.
    // item: the item linked to the backpack.
    if (render) {
      const pack = new BackpackManager({ backpack, actor, item }, {
        title: game.i18n.format("BACKPACK_MANAGER.Title", {
          actor: item.parent.name,
          bag: backpack.name
        })
      });
      if (pack.isOwner) pack.render(true);
      else {
        ui.notifications.error("BACKPACK_MANAGER.NotOwner", { localize: true });
        return;
      }
    }

    return false;
  });
}
