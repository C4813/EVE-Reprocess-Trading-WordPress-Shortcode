# EVE Reprocess Trading WordPress Shortcode

Adds a shortcode `[eve_reprocess_trading]` to display a tool for calculating reprocess trading margins and generating a market quickbar.

A secondary shortcode `[eve_reprocess_clear_cache]` can be used to display a button which forcibly clears the cache. It will be visible only to administrators (with WordPress `manage_options` capability).

This plugin is designed to replace and enhance my current [EVE Reprocessing Master 2.0.1 spreadsheet](https://docs.google.com/spreadsheets/d/13WKDTn-dqjOnJ2HG1KWYh4hZ8Pxv87vWsUtC65It5Mw/edit?usp=sharing) 🔗

### The plugin is still in development, but version 0.6.9 is in a usable state.

## Version 0.6.9 Features

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
- Cache files are located in `wp-content/uploads/eve-reprocess-trading/cache`

### How to read results:
`Item Name [Item Buy Price / Item Reprocessed Value / Regional Volume / Margin%]`

- **Item Reprocessed Value** = The value of the reprocessed materials from reprocessing a stack, and selling the yielded materials to your selected market, at your selected price, minus relevant taxes/fees (e.g. Buying from Jita, Selling to Sell Orders, minus brokerage fee, sales tax, and reprocessing tax if applicable).
- **Regional Volume** = The average daily transactions for this item in the selected region (average over 7 days).

#### Example:
`Medium Armor Maintenance Bot I [30210 / 36195 / 281 / 19.81%]`

### Copy to market quickbar
The item price value will be omitted from the data copied to the clipboard. This is because you can only have 25 characters as a "note" on an item in the quickbar.

#### Example in-game quickbar:
`Medium Armor Maintenance Bot I [36195|281|19.81%]`

### Buy-Order QTY Recommendation:
This changes the volume figure with x% (that you set) of that figure. This is to help speed things up when creating buy orders. You can just click the item, read it's value, see how many you can expect to buy each day, and put up a buy order.

#### Example before setting the %
`Medium Armor Maintenance Bot I [36195|281|19.81%]`

#### Example after setting the % to 10%
`Medium Armor Maintenance Bot I [36195|28|19.81%]`

## To-Do List
- [ ] Investigate relist fee calculation. This may be making things too complicated, but I'm thinking it could be as simple as entering "Update orders x times per day" and then basing it on your Buy-Order QTY Recommendation.
- [ ] Code optimization

## Post-release
- [ ] Investigate using a centralised database which calls price data, and the plugin calls from the database. (This will dramatically decrease price fetch times)
