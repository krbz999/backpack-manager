import { MODULE } from "./constants.mjs";
import { isValidItem } from "./helpers.mjs";

export class BackpackManager extends FormApplication {
  constructor(object, options) {
    super(object, options);
    this.max = options.max;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 450,
      template: `/modules/${MODULE}/templates/${MODULE}.hbs`,
      height: "auto",
      classes: [MODULE]
    });
  }

  get id() {
    return `${MODULE}-${this.object.backpack.id}`;
  }

  get stowed() {
    return this.bag.items.filter((item) => {
      return isValidItem(item);
    }).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  get items() {
    return this.actor.items.filter((item) => {
      return isValidItem(item);
    }).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  get isOwner() {
    const { OWNER } = CONST.DOCUMENT_OWNERSHIP_LEVELS;
    return this.bag.testUserPermission(game.user, OWNER, { exact: true });
  }

  get actor() {
    return this.object.actor;
  }

  get bag() {
    return this.object.backpack;
  }

  async getData() {
    const data = await super.getData();
    data.stowed = this.stowed;
    data.bag = this.bag.name;
    data.items = this.items;
    data.actor = this.actor.name;
    data.value = this.bag.system.attributes.encumbrance.value;
    data.max = this.max;

    return data;
  }

  async _updateObject(...T){
    return;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html[0].addEventListener("click", async (event) => {
      const a = event.target.closest("a");
      if (!a) return;
      const type = a.dataset.type;
      const uuid = a.closest(".item").querySelector(".item-details").dataset.uuid;
      const item = fromUuidSync(uuid);
      const qtyField = a.closest(".item").querySelector(".current");
      const max = qtyField ? Number(qtyField.dataset.max) : 1;
      const value = qtyField ? Number(qtyField.value) : 1;
      const { ctrlKey, shiftKey } = event;

      if (!type) {
        return item.sheet.render(true);
      }

      if (type === "more") {
        const newValue = ctrlKey ? value + 50 : shiftKey ? value + 5 : value + 1;
        qtyField.value = Math.clamped(newValue, 1, max);
      }

      else if (type === "less") {
        const newValue = ctrlKey ? value - 50 : shiftKey ? value - 5 : value - 1;
        qtyField.value = Math.clamped(newValue, 1, max);
      }

      else if (type === "retrieve") {
        // move item from this actor to the owner.
        const itemData = item.toObject();
        itemData.system.quantity = value;
        if (itemData.system.equipped) itemData.system.equipped = false;
        const { ATTUNED, REQUIRED } = CONFIG.DND5E.attunementTypes;
        if (itemData.system.attunement === ATTUNED) {
          itemData.system.attunement = REQUIRED;
        }

        const [c] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
        if (c) {
          if (value === max) await item.delete();
          else await item.update({ "system.quantity": max - value });
        }
      }

      else if (type === "delete") {
        // delete the item from the bag.
        return item.deleteDialog();
      }

      else if (type === "stow") {
        // stow item in bag.
        const itemData = item.toObject();
        itemData.system.quantity = value;
        if (itemData.system.equipped) itemData.system.equipped = false;
        const { ATTUNED, REQUIRED } = CONFIG.DND5E.attunementTypes;
        if (itemData.system.attunement === ATTUNED) {
          itemData.system.attunement = REQUIRED;
        }

        const [c] = await this.bag.createEmbeddedDocuments("Item", [itemData]);
        if (c) {
          if (value === max) await item.delete();
          else await item.update({ "system.quantity": max - value });
        }
      }
    });
  }

  async render(force, options = {}) {
    this.bag.apps[this.appId] = this;
    this.actor.apps[this.appId] = this;
    return super.render(force, options);
  }

  async close(options = {}) {
    await super.close(options);
    delete this.bag.apps[this.appId];
    delete this.actor.apps[this.appId];
  }
}
