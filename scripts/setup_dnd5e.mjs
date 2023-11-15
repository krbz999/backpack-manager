import {BackpackManager} from "./backpack-manager.mjs";
import {MODULE} from "./constants.mjs";

export function setup_dnd5e() {
  Hooks.on("renderItemSheet", (sheet, html) => {
    if (sheet.item.type !== "backpack") return;
    const label = html[0].querySelector("[name='system.capacity.weightless']").closest("label");

    const name = `flags.${MODULE}.containerActorUuid`;
    const value = sheet.item.flags[MODULE]?.containerActorUuid ?? "";
    const div = document.createElement("DIV");
    div.innerHTML = `
    <label data-tooltip="BACKPACK_MANAGER.PlaceUuidHere">${game.i18n.localize("ITEM.TypeContainer")}:</label>
    <input type="text" name="${name}" value="${value}" placeholder="Actor.${foundry.utils.randomID()}">`;
    label.after(...div.children);
    sheet.setPosition();
  });

  Hooks.on("dnd5e.preUseItem", (item) => {
    if (item.type !== "backpack") return;

    const uuid = item.flags[MODULE]?.containerActorUuid;
    if (!uuid) return;

    const backpack = fromUuidSync(uuid);
    if (!backpack || !(backpack instanceof Actor)) {
      ui.notifications.warn(game.i18n.format("BACKPACK_MANAGER.UuidActorNotFound", {item: item.name}));
      return;
    }

    const actor = item.actor;
    if (backpack === actor) {
      ui.notifications.warn("BACKPACK_MANAGER.CannotUseSelf", {localize: true});
      return;
    }

    const render = !Object.values(backpack.apps).some(app => app.constructor.name === "BackpackManager");
    // backpack: the actor acting as the backpack.
    // actor: the actor stowing or retriving items.
    // item: the item linked to the backpack.
    if (render) {
      const pack = new BackpackManager({backpack, actor, item}, {
        title: game.i18n.format("BACKPACK_MANAGER.Title", {actor: actor.name, bag: backpack.name})
      });
      if (pack.isOwner) {
        pack.render(true);
      } else {
        ui.notifications.error("BACKPACK_MANAGER.NotOwner", {localize: true});
        return;
      }
    }

    return false;
  });
}
