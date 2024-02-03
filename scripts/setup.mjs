import {MODULE} from "./constants.mjs";
import {_renderBackpackManager} from "./helpers.mjs";
import {setup_dnd5e} from "./setup_dnd5e.mjs";

Hooks.once("setup", () => {
  game.modules.get(MODULE).api = {
    renderManager: _renderBackpackManager
  };

  if (game.system.id === "dnd5e") setup_dnd5e();
});
