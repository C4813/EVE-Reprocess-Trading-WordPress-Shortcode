# EVE Reprocess Trading WordPress Shortcode

Adds a shortcode `[eve_reprocess_trading]` to display a tool for calculating reprocess trading margins and generating a market quickbar.

A secondary shortcode `[eve_reprocess_clear_cache]` can be used to display a button which forcibly clears the cache. It will be visible only to administrators (with WordPress `manage_options` capability).

This plugin is designed to replace and enhance my current [EVE Reprocessing Master 2.0.1 spreadsheet](https://docs.google.com/spreadsheets/d/13WKDTn-dqjOnJ2HG1KWYh4hZ8Pxv87vWsUtC65It5Mw/edit?usp=sharing) 🔗

### The plugin is still in development, but version 0.6.8 is in a usable state.

## Version 0.6.8 Features

- [x] Trade Hub selection
  - [x] Secondary Trade Hub consideration (Perimeter/Ashab/Frarn/Nakugard/Botane)
- [x] Skill and standing consideration (for sales tax, brokerage, and reprocessing fees)
- [x] Sell to buy orders, or sell orders options
- [x] Margin filter (set minimum/maximum margin)
- [x] Enable/Disable meta level 2 items (T2 modules/ships etc.) or capital-sized items
- [x] Percentage of daily volume option for the quickbar. (Instead of just showing the daily volume, show a user-defined percentage of that number to aid in speed of creating orders)

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
- [ ] Possibly relist fee consideration - I would need to think about how this would be handled, maybe with a "update x times per day" to calculate the brokerage fee for updating
- [ ] Code cleanup and optimization

## Post-release
- [ ] Investigate using a centralised database which calls price data, and the plugin calls from the database. (This will dramatically decrease price fetch times)
