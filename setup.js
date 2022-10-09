import { setup_dnd5e } from "./scripts/setup_dnd5e.mjs";

Hooks.once("setup", () => {
  Handlebars.registerHelper("backpackManagerCheckqty", function (qty) {
    return qty > 1;
  });

  if (game.system.id === "dnd5e") setup_dnd5e();
});
