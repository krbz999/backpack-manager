import {MODULE} from "./constants.mjs";
import {isValidItem, setSystemSpecificValues, updateSystemSpecificQuantity} from "./helpers.mjs";

export class BackpackManager extends Application {
  constructor(object, options = {}) {
    super(options);
    this.hideOwnInventory = (options.hideOwnInventory === true);
    this.object = object;
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
    return `${MODULE}-${this.object.backpack.uuid.replaceAll(".", "-")}`;
  }

  /**
   * The valid items stowed on the Backpack Actor.
   * @returns {Item[]}      The filtered array of valid items.
   */
  get stowed() {
    return this.bag.items.filter((item) => {
      return isValidItem(item);
    }).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * The items held on the Actor viewing the backpack.
   * @returns {Item[]}      The filtered array of valid items.
   */
  get items() {
    return this.actor.items.filter((item) => {
      return isValidItem(item);
    }).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get whether the current user has permission to view this backpack.
   * @returns {boolean}     Whether the user has permission to view the backpack.
   */
  get isOwner() {
    return this.bag.testUserPermission(game.user, "OWNER");
  }

  /**
   * The actor viewing the backpack.
   * @returns {Actor}     The actor.
   */
  get actor() {
    return this.object.actor;
  }

  /**
   * The backpack being viewed.
   * @returns {Actor}     The backpack.
   */
  get bag() {
    return this.object.backpack;
  }

  /**
   * The viewing actor's container-type item that links to the Backpack Actor.
   * @returns {Item|null}     The item if it exists, otherwise null.
   */
  get item() {
    return this.object.item ?? null;
  }

  /** @override */
  async getData() {
    const data = await super.getData();
    data.bag = this.bag.name;
    data.actor = this.actor.name;
    data.hideOwnInventory = this.hideOwnInventory;

    if (game.system.id === "dnd5e") {
      // CAPACITY
      const type = (this.item !== null) ? this.item.system.capacity.type : null;
      if (type === "weight") {
        const currencyWeight = game.settings.get("dnd5e", "currencyWeight");
        const coinW = !currencyWeight ? 0 : Object.keys(CONFIG.DND5E.currencies).reduce((acc, c) => {
          return acc + (this.bag.system.currency[c] || 0);
        }, 0);
        data.bagValue = this.stowed.reduce((acc, item) => {
          return acc + (item.system.weight * item.system.quantity);
        }, Math.floor(coinW / 50));
      } else if (type === "items") {
        data.bagValue = this.stowed.reduce((acc, item) => {
          return acc + item.system.quantity;
        }, 0);
      }
      data.bagMax = (this.item !== null) ? this.item.system.capacity.value : null;
      data.showCapacity = !!data.bagMax && (data.bagValue >= 0);
      data.items = this.items.map(item => ({item, quantity: item.system.quantity, showQty: item.system.quantity > 1}));
      data.stowed = this.stowed.map(item => ({item, quantity: item.system.quantity, showQty: item.system.quantity > 1}));
      data.actorValue = this.actor.system.attributes.encumbrance.value;
      data.actorMax = this.actor.system.attributes.encumbrance.max;

      // CURRENCY
      data.currencies = Object.keys(CONFIG.DND5E.currencies).map((key) => {
        return {class: key, label: key.toUpperCase(), max: {bag: this.bag.system.currency[key], actor: this.actor.system.currency[key]}};
      });
    }

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html[0].addEventListener("click", async (event) => {
      const a = event.target.closest("a");
      if (!a) return;
      const form = a.closest("form.backpack-manager");
      form.style.pointerEvents = "none";
      const type = a.dataset.type ?? a.dataset.action;

      if (["takeCurrency", "stowCurrency"].includes(type)) {
        await this._adjustCurrency(event);
        form.style.pointerEvents = "";
        return;
      }

      const uuid = a.closest(".item").querySelector(".item-details")?.dataset.uuid ?? "";
      const item = fromUuidSync(uuid);
      const qtyField = a.closest(".item").querySelector(".current");
      const max = qtyField ? Number(qtyField.dataset.max) : 1;
      const value = qtyField ? Number(qtyField.value) : 1;
      const {ctrlKey, shiftKey} = event;

      if (!type) {
        item.sheet.render(true);
        form.style.pointerEvents = "";
        return;
      }

      else if (type === "more") {
        const newValue = ctrlKey ? value + 50 : shiftKey ? value + 5 : value + 1;
        qtyField.value = Math.clamped(newValue, 1, max);
        form.style.pointerEvents = "";
        return;
      }

      else if (type === "less") {
        const newValue = ctrlKey ? value - 50 : shiftKey ? value - 5 : value - 1;
        qtyField.value = Math.clamped(newValue, 1, max);
        form.style.pointerEvents = "";
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
          if (value === max) await item.delete({itemsWithSpells5e: {alsoDeleteChildSpells: true}});
          else await updateSystemSpecificQuantity(item, max, value);
          form.style.pointerEvents = "";
          return;
        }
      }

      else if (type === "delete") {
        // delete the item from the bag.
        await item.deleteDialog({itemsWithSpells5e: {alsoDeleteChildSpells: true}});
        form.style.pointerEvents = "";
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
          if (value === max) await item.delete({itemsWithSpells5e: {alsoDeleteChildSpells: true}});
          else await updateSystemSpecificQuantity(item, max, value);
          form.style.pointerEvents = "";
          return;
        }
      }

      form.style.pointerEvents = "";
      return;
    });
  }

  /** @override */
  async render(force, options = {}) {
    this.bag.apps[this.appId] = this;
    this.actor.apps[this.appId] = this;
    return super.render(force, options);
  }

  /** @override */
  async close(options = {}) {
    await super.close(options);
    delete this.bag.apps[this.appId];
    delete this.actor.apps[this.appId];
  }

  /**
   * Adjust the currency on the viewing Actor and the Backpack Actor.
   * @param {PointerEvent} event      The initiating click event.
   * @returns {Actor[]}               The two updated Actor documents.
   */
  async _adjustCurrency(event) {
    const data = event.target.closest(".currency-item").dataset;
    const type = event.target.closest("A").dataset.action === "takeCurrency" ? "take" : "stow";
    const ph = game.i18n.localize("BACKPACK_MANAGER.AdjustCurrency" + type.capitalize());
    const ct = game.i18n.format("BACKPACK_MANAGER.AdjustCurrencyContentAmounts", {
      actor: this.actor.system.currency[data.denom],
      bag: this.bag.system.currency[data.denom],
      denom: data.denom
    });
    const content = `
    <p>${ct}</p>
    <form>
      <div class="form-group">
        <label>${data.denom.toUpperCase()}</label>
        <div class="form-fields">
          <input type="number" placeholder="${ph}" autofocus>
        </div>
      </div>
    </form>`;
    const amount = await Dialog.prompt({
      title: game.i18n.localize("BACKPACK_MANAGER.AdjustCurrency"),
      content,
      rejectClose: false,
      label: game.i18n.localize("BACKPACK_MANAGER.AdjustCurrencyLabel" + type.capitalize()),
      callback: (html) => html[0].querySelector("input").valueAsNumber
    });
    if (!amount) return;

    const bagCoin = this.bag.system.currency[data.denom];
    const actorCoin = this.actor.system.currency[data.denom];
    const newValue = Math.clamped(amount, 0, type === "take" ? bagCoin : actorCoin);
    const updates = type === "take" ? [
      {_id: this.bag.id, [`system.currency.${data.denom}`]: bagCoin - newValue},
      {_id: this.actor.id, [`system.currency.${data.denom}`]: actorCoin + newValue}
    ] : [
      {_id: this.bag.id, [`system.currency.${data.denom}`]: bagCoin + newValue},
      {_id: this.actor.id, [`system.currency.${data.denom}`]: actorCoin - newValue}
    ];
    return Actor.updateDocuments(updates);
  }
}
