# EVE Reprocess Trading WordPress Shortcode

Adds a shortcode `[eve_reprocess_trading]` to display a tool for calculating reprocess trading margins and generating a market quickbar.

A secondary shortcode `[eve_reprocess_clear_cache]` can be used to display a button which forcibly clears the cache. It will be visible only to administrators (with WordPress `manage_options` capability).

This plugin is designed to replace and enhance my current [EVE Reprocessing Master 2.0.1 spreadsheet](https://docs.google.com/spreadsheets/d/13WKDTn-dqjOnJ2HG1KWYh4hZ8Pxv87vWsUtC65It5Mw/edit?usp=sharing) 🔗 which is not up to date with the current version of EVE Online.

The plugin is now in a "ready" state where I do not plan to add any new features.<br/>
Before version 1.0 I will thoroughly test to make final changes/fixes.

## Key Features

- [x] Trade Hub selection
  - [x] Secondary Trade Hub consideration (Perimeter/Ashab/Frarn/Nakugard/Botane)
- [x] Skill and standing consideration (for sales tax, brokerage, and reprocessing fees)
- [x] Sell to buy orders, or sell orders consideration
- [x] Margin filter (set minimum/maximum margin)
- [x] Exclude T1 (show blueprint-less 'meta' only), Capital-Sized, and T2. (Dependent on which market group is selected)
- [x] Market Quickbar import tool

### Caches refresh with updated prices independently:
- Adjusted price data if the cache is greater than 24 hours old
- Price data if the cache is greater than 6 hours old
- Cache files are located in `wp-content/uploads/eve-reprocess-trading/cache`

## Detailed overview

### Trade Hub
`Jita`, `Amarr`, `Dodixie`, `Rens`, or `Hek`<br/>
_Price data will be called from the selected trade hub and the region that hub belongs to._

### Skills
_Drop-down value_ `0-5`

- **Accounting** reduces sales tax<br/>
- **Broker Relations** reduces brokerage fee<br/>
- **Advanced Broker Relations** reduces relist fee<br/>
- **Connections** increases effective standing if the base standing is positive. Effective faction and corp standing reduces brokerage fee; effective corp standing reduces reprocessing tax. At effective corp standing of 6.67, reprocessing tax is 0%.<br/>
- **Diplomacy** increases effective standing if the base standing is negative.<br/>
- **Scrapmetal Processing** increases the reprocessing yield from 50% at level 0 to 55% at level 5.<br/>

### Standings
_Values between_ `-10.00` _and_ `+10.00`<br/>
_Effective standing, fees, taxes and yield are automatically calculated._

### Item filters
- **Filter Market Group** allows you to select which market group to look at (Ship Equipment, Drones, Ships, etc.)<br/>
- **Exclude T2?** excludes T2 items.<br/><br/>
_These options show only under specific circumstances._<br/>
- **Exclude Capital-Sized?** excludes capital-sized items in the list<br/>
- **Exclude T1 Modules?** excludes modules which have a blueprint (to show meta-only)<br/>

### Generate List Button
_Generates the item list based on all of the inputs above the button._

### Basic Settings
- **Include Secondary Trade Hubs?** includes the chosen `Trade Hub`'s secondary market. (Perimeter/Ashab/Frarn/Nakugard/Botane).<br/>
- **Sell To** select how you are selling your yielded materials.<br/>
- **Minimum Margin %** filter results to show only those with the set minimum margin.<br/>
- **Maximum Margin %** filter results to show only those with the set maximum margin.<br/>
- **Minimum Daily Volume** filter results to show only those with the set minimum daily volume (daily volume is the average daily volume, over 7 days, for the region the trade hub is located in).<br/>
- **Stack Size** if you reprocess a single item you may lose materials. If the stack size is 100, you get those materials. (i.e. you can't 5% 5, but you can 5% 100).

### Advanced Settings
- **Buy order QTY recommendations?**<br/>
  If `Yes`<br/>
- **% of Daily Volume** updates the final result to show your inputted percentage of the daily volume, not the daily volume.<br/>
- **Re-list brokerage fees?**<br/>
  If `Yes`<br/>
- **Order updates** how many times do you expect to update your order? This calculates the re-list fee.<br/>
  _This is not exact, but helps provide a more accurate item value._

### Generate Prices
Generates prices based on all of the above basic and advanced settings.<br/>
After price generation, if you change any of the basic or advanced settings, the list will be hidden and you must "Regenerate List & Prices".<br/>
The auto-hide behavior is to prevent settings being changed and then misreading the results if you forget to regenerate the prices, as the prices do not automatically update.

## How to read results:
`Item Name [Item Buy Price / Item Reprocessed Value / Regional Volume / Margin%]`

- **Item Reprocessed Value** = The value of the reprocessed materials from reprocessing a stack, and selling the yielded materials to your selected market, at your selected price, minus relevant taxes/fees (e.g. Buying from Jita, Selling to Sell Orders, minus brokerage fee, sales tax, and reprocessing tax if applicable).
- **Regional Volume** = The average daily transactions for this item in the selected region (average over 7 days).<br/>
_(If_ `% of Daily Volume` _is set, the displayed value will be x% of the regional volume._

#### Example:
`Medium Armor Maintenance Bot I [30210 / 36195 / 281 / 19.81%]`

## Copy to market quickbar
The item price value will be omitted from the data copied to the clipboard. This is because you can only have 25 characters as a "note" on an item in the quickbar.

#### Example in-game quickbar:
`Item Name [Reprocessed Value|Regional Volume|Margin%]`<br/>
`Medium Armor Maintenance Bot I [36195|281|19.81%]`
