import { MODULE } from "./constants.mjs";
import { isValidItem, setSystemSpecificValues, updateSystemSpecificQuantity } from "./helpers.mjs";

export class BackpackManager extends FormApplication {
  constructor(object, options) {
    super(object, options);
    this.hideOwnInventory = options.hideOwnInventory === true;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 450,
      template: `modules/${MODULE}/templates/${MODULE}.hbs`,
      height: 750,
      classes: [MODULE],
      scrollY: [".stowed-content", ".inventory-content"],
      resizable: true
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

  get item() {
    return this.object.item;
  }

  async getData() {
    const data = await super.getData();
    data.bag = this.bag.name;
    data.actor = this.actor.name;
    data.hideOwnInventory = this.hideOwnInventory;

    if (game.system.id === "dnd5e") {
      const type = this.item.system.capacity.type;
      if (type === "weight") {
        data.bagValue = this.bag.system.attributes.encumbrance?.value;
      } else if (type === "items") {
        data.bagValue = this.stowed.reduce((acc, item) => {
          return acc + item.system.quantity;
        }, 0);
      }
      data.bagMax = this.item.system.capacity.value;
      data.showCapacity = !!data.bagValue && !!data.bagMax;
      data.items = this.items.map(item => ({ item, quantity: item.system.quantity }));
      data.stowed = this.stowed.map(item => ({ item, quantity: item.system.quantity }));
      data.actorValue = this.actor.system.attributes.encumbrance.value;
      data.actorMax = this.actor.system.attributes.encumbrance.max;
    }

    return data;
  }

  async _updateObject(...T) {
    return;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html[0].addEventListener("click", async (event) => {
      const a = event.target.closest("a");
      if (!a) return;
      a.style.pointerEvents = "none";
      const type = a.dataset.type;
      const uuid = a.closest(".item").querySelector(".item-details").dataset.uuid;
      const item = fromUuidSync(uuid);
      const qtyField = a.closest(".item").querySelector(".current");
      const max = qtyField ? Number(qtyField.dataset.max) : 1;
      const value = qtyField ? Number(qtyField.value) : 1;
      const { ctrlKey, shiftKey } = event;

      if (!type) {
        item.sheet.render(true);
        if (a) a.style.pointerEvents = "";
        return;
      }

      else if (type === "more") {
        const newValue = ctrlKey ? value + 50 : shiftKey ? value + 5 : value + 1;
        qtyField.value = Math.clamped(newValue, 1, max);
        if (a) a.style.pointerEvents = "";
        return;
      }

      else if (type === "less") {
        const newValue = ctrlKey ? value - 50 : shiftKey ? value - 5 : value - 1;
        qtyField.value = Math.clamped(newValue, 1, max);
        if (a) a.style.pointerEvents = "";
        return;
      }

      else if (type === "retrieve") {
        // move item from this actor to the owner.
        const itemData = item.toObject();
        setSystemSpecificValues(itemData, {
          quantity: value, target: this.actor, src: this.bag
        });

        const [c] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
        if (c) {
          if (value === max) await item.delete({ itemsWithSpells5e: { alsoDeleteChildSpells: true } });
          else await updateSystemSpecificQuantity(item, max, value);
          if (a) a.style.pointerEvents = "";
          return;
        }
      }

      else if (type === "delete") {
        // delete the item from the bag.
        await item.deleteDialog({ itemsWithSpells5e: { alsoDeleteChildSpells: true } });
        if (a) a.style.pointerEvents = "";
        return;
      }

      else if (type === "stow") {
        // stow item in bag.
        const itemData = item.toObject();
        setSystemSpecificValues(itemData, {
          quantity: value, target: this.bag, src: this.actor
        });

        const [c] = await this.bag.createEmbeddedDocuments("Item", [itemData]);
        if (c) {
          if (value === max) await item.delete({ itemsWithSpells5e: { alsoDeleteChildSpells: true } });
          else await updateSystemSpecificQuantity(item, max, value);
          if (a) a.style.pointerEvents = "";
          return;
        }
      }

      if (a) a.style.pointerEvents = "";
      return;
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
