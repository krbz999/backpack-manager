import { MODULE } from "./scripts/constants.mjs";
import { _renderBackpackManager } from "./scripts/helpers.mjs";
import { setup_dnd5e } from "./scripts/setup_dnd5e.mjs";

Hooks.once("setup", () => {
  game.modules.get(MODULE).api = {
    renderManager: _renderBackpackManager
  }

  if (game.system.id === "dnd5e") setup_dnd5e();
});
