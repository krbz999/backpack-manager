import { MODULE } from "./constants.mjs";

export function isValidItem(item) {
  if ([
    "class", "subclass", "feat", "spell", "background", "race"
  ].includes(item.type)) return false;
  if (item.system.quantity < 1) return false;
  if (item.type !== "backpack") return true;

  // if backpack:
  const uuid = item.getFlag(MODULE, "containerActorUuid");
  if (!uuid) return true;

  const backpack = fromUuidSync(uuid);
  if (!backpack) return true;
  if (backpack === item.parent) return true;

  return false;
}
