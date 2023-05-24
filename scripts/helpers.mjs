import {BackpackManager} from "./backpack-manager.mjs";
import {MODULE} from "./constants.mjs";

/* Whether this is a valid item to put in a backpack. */
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
  const uuid = item.flags[MODULE]?.containerActorUuid;
  if (!uuid) return true;

  const backpack = fromUuidSync(uuid);
  if (!backpack) return true;
  // if for some ungodly reason, you put yourself in yourself:
  if (backpack === item.actor) return true;

  return false;
}

/**
 * Change system specific values when an item is stowed or retrieved.
 * itemData is the item.toObject() and 'data' is any extra values needed.
 */
export async function setSystemSpecificValues(itemData, data) {
  if (game.system.id === "dnd5e") {
    itemData.system.quantity = data.quantity;
    const create = await data.target.sheet._onDropSingleItem(itemData);
    // 'create' is explicitly false if creation is otherwise handled.
    return create !== false;
  }
}

/* Update the quantity of the item in the system-specific way. */
export async function updateSystemSpecificQuantity(item, max, value) {
  if (game.system.id === "dnd5e") {
    return item.update({"system.quantity": max - value});
  }
}

/**
 * Render the application.
 * @param {Actor} actor           The actor viewing the bag.
 * @param {Actor} bag             The actor acting as a bag.
 * @param {object} options        Rendering options.
 * @returns {BackpackManager}     The rendered application, or null if already rendered.
 */
export function _renderBackpackManager(actor, backpack, options = {}) {
  const doNotRender = Object.values(backpack.apps).some(app => app.constructor.name === "BackpackManager");
  if (doNotRender) return null;
  const title = game.i18n.format("BACKPACK_MANAGER.Title", {actor: actor.name, bag: backpack.name});
  const config = foundry.utils.mergeObject({title}, options);
  return new BackpackManager({backpack, actor, item: null}, config).render(true, options);
}
