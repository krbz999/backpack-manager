# Backpack Manager

Make container management easy for your players. This module is useful for you if you:
- Like managing the containers and inventory of your character.
- Prefer using an actor in the Actor directory as a backpack or bag of holding.
- Find it a bit annoying to have to open multiple sheets and drag-and-drop to transfer items.
- Wonder why there is no option to just move an item instead of copying it between two actors.

With this module, you can designate an actor in the sidebar to be a 'container actor'. To set it up, follow these steps:
- Give the player ownership of an actor that serves as the container.
- Copy the UUID of the container actor (right-click the book icon in its header).
- Edit the Container item on the player character and paste the uuid of the actor in the new field that has been added.
- The uuid is the id of the container actor, prepended with `Actor.`. For example `Actor.5hfpenhg8fh49Ef5`.

Now when the player uses the Container item, it will open an interface to stow or retrieve items.
- Stow or retrieve an item, or stack of items, by clicking the box icon or the double arrow icon.
- Adjust how many items you want to stow or retrieve by using the left or right arrow buttons.
- Holding Shift changes the value by 5 instead of 1. Holding Ctrl changes the value by 50 instead of 1.
- Stow or retrieve currencies between the actors. Same modifier keys apply here.

## Can multiple players use the same container?
Yes! Just give them all ownership of the container actor, and follow the setup steps above for each player.

It even updates for each player in real time. The interface is tied to the actor that has the container item and the actor acting as the container. When either actor is updated, as in when they receive, adjust, or delete an item, the interface is also updated. This is then shown in real time for each client.

## Does a GM need to be logged in for any of this to work?
No.

## What can I stow or retrieve through the interface?
The interface is automatically populated with a list of each actor's items. These item types have been explicitly excluded:
- class, subclass, and background-type items.
- feature and spell-type items.

Currency can be exchanged with the backpack actor.

## What changes are made to the items when they are moved from actor to actor?
- Attunement state, equipped status, and proficiency are all adjusted as if you had dropped the item onto the actor sheet.
- The quantity of the item is adjusted by the choices made in the interface itself.
No other changes are made to the items.

<h1>Compatibility</h1>
<p>You should not expect this module to work with modules that overhaul or destroy core roll behaviour, particularly WIRE and MIDI. These modules are unsupported, and any compatiblity is nothing but a happy accident.</p>
