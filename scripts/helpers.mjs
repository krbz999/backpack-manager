import { BackpackManager } from "./backpack-manager.mjs";
import { MODULE } from "./constants.mjs";

/**
 * Whether this is a valid item to put in a backpack.
 */
export function isValidItem(item) {
  if (game.system.id === "dnd5e") {
    if ([
      "class", "subclass", "feat",
      "spell", "background", "race"
    ].includes(item.type)) return false;
    if (item.system.quantity < 1) return false;
    if (item.type !== "backpack") return true;
  }


  // it must not be setup with this module:
  const uuid = item.getFlag(MODULE, "containerActorUuid");
  if (!uuid) return true;

  const backpack = fromUuidSync(uuid);
  if (!backpack) return true;
  // if for some ungodly reason, you put yourself in yourself:
  if (backpack === item.parent) return true;

  return false;
}

/**
 * Change system specific values when an item is stowed or retrieved.
 * itemData is the item.toObject() and 'data' is any extra values needed.
 * (currently just the new quantity)
 */
export function setSystemSpecificValues(itemData, data) {
  if (game.system.id === "dnd5e") {
    itemData.system.quantity = data.quantity;
    if (itemData.system.equipped) itemData.system.equipped = false;
    const { ATTUNED, REQUIRED } = CONFIG.DND5E.attunementTypes;
    if (itemData.system.attunement === ATTUNED) {
      itemData.system.attunement = REQUIRED;
    }
  }
}

/**
 * Update the quantity of the item in the system-specific way.
 */
export async function updateSystemSpecificQuantity(item, max, value) {
  if (game.system.id === "dnd5e") {
    return item.update({ "system.quantity": max - value });
  }
}

export function _renderBackpackManager(browsingActor, backpackActor, options = {}) {
  const render = !Object.values(backpackActor.apps).some(app => {
    return app.constructor.name === "BackpackManager";
  });
  if (!render) return null;
  return new BackpackManager({
    backpack: backpackActor,
    actor: browsingActor,
    item: null
  }, foundry.utils.mergeObject(
    {
      title: game.i18n.format("BACKPACK_MANAGER.TITLE", {
        actor: browsingActor.name,
        bag: backpackActor.name
      })
    },
    options
  )
  ).render(true, options);
}
