# EVE Reprocess Trading WordPress Shortcode

Adds a shortcode `[eve_reprocess_trading]` to display a tool for calculating reprocess trading margins and generating a market quickbar.

A secondary shortcode `[eve_reprocess_clear_cache]` can be used to display a button which forcibly clears the cache. It will be visible only to administrators (with WordPress `manage_options` capability).

This plugin is designed to replace and enhance my current [EVE Reprocessing Master 2.0.1 spreadsheet](https://docs.google.com/spreadsheets/d/13WKDTn-dqjOnJ2HG1KWYh4hZ8Pxv87vWsUtC65It5Mw/edit?usp=sharing) 🔗

### The plugin is still in development, but version 0.6.0 is in a usable state.

## Version 0.6.0 Features

- [x] Trade Hub selection
  - [x] Secondary Trade Hub consideration (Perimeter/Ashab/Frarn/Nakugard/Botane)
- [x] Skill and standing consideration (for sales tax, brokerage, and reprocessing fees)
- [x] Sell to buy orders, or sell orders options
- [x] Price generation up to 9× faster than previous versions
- [x] Margin filter (set minimum/maximum margin)
- [x] Enable/Disable meta level 2 items (T2 modules/ships etc.)

### Caches refresh with updated prices independently:
- Adjusted price data if the cache is greater than 24 hours old
- Price data if the cache is greater than 6 hours old

### How to read 0.6.0 results:
`Item Name [Item Buy Price / Item Reprocessed Value / Regional Volume / Margin%]`

- **Item Reprocessed Value** = The value of the reprocessed materials from reprocessing 1 item, and selling them to your selected market, at your selected price, minus relevant taxes/fees (e.g. Buying from Jita, Selling to Sell Orders, minus brokerage fee, sales tax, and reprocessing tax if applicable).
- **Regional Volume** = The number of transactions for this item in the past 24 hours in this region. This helps when deciding QTY for buy orders.

#### Example:
`Medium Armor Maintenance Bot I [30210 / 36195 / 281 / 19.81%]`

### Copy to market quickbar
The item price value will be omitted from the data copied to the clipboard. This is because you can only have 25 characters as a "note" on an item in the quickbar.

#### Example in-game quickbar:
`Medium Armor Maintenance Bot I [36195|281|19.81%]`

## To-Do List
- [x] Add market volume filters (there's no point putting a buy order up for something that only sells 1 or 2 units per day)
  - [ ] Add optional buy order QTY suggestion (a set % of total regional daily volume)
- [ ] Possibly relist fee consideration - I would need to think about how this would be handled, maybe with a "update x times per day" to calculate the brokerage fee for updating
- [x] Differentiation between T1 and Meta modules. ~~(Meta modules i.e. `Pitfall Compact Warp Disruption Field Generator` have a meta level of 1, but so do T1 modules i.e. `Warp Disruption Fild Generator I`. I need to find a way to tell the difference from the SDE, but I do not think it is possible. I might have to MacGyver a solution.)~~ I was overthinking this. If the item is meta level 1 and does not have a blueprint, it's a meta module. ezpz.
- [x] Reprocessing stack size. Many modules, if reprocessed individually, lose valuable minerals. If reprocessed in batches, for example, of 100, those minerals are yielded (you can't 5% 5, but you can 5% 100). The plugin currently ignores these <1 results, so an option to include a stack size will help refine the results to display a far more accurate representation of the items value.
- [ ] Add "Exclude T1" to more groups than just Ship Equipment. (Need to think on this, as it would auto hide all ships. Maybe just have it show on all, but not on ships)
- [ ] Code cleanup and optimization

## Post-release
- [ ] Investigate using a centralised database which calls price data, and the plugin calls from the database. (This will dramatically decrease price fetch times)
