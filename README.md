# EVE Reprocess Trading WordPress Shortcode

Adds a shortcode `[eve_reprocess_trading]` to display a tool for calculating reprocess trading margins in all five major trade hubs, and provides easy import to the in-game market quickbar.

*Due to the nature of the plugin, the shortcode should only be used on pages or posts. Functionality and display cannot be guaranteed if used in other locations, such as, sidebar widget blocks.*

A secondary shortcode `[eve_reprocess_clear_cache]` can be used to display a button which forcibly clears the cache. It will be visible only to administrators (with WordPress `manage_options` capability).
## Key Features
- [x] Trade Hub selection (Including secondary hub consideration, such as Perimeter/Ashab/Frarn/Nakugard/Botane)
- [x] Skills and standings consideration (automatically calculates and applies sales tax, brokerage, and reprocessing fees)
- [x] Choose to calculate selling to buy orders, or sell orders
- [x] Exclude T1 (show blueprint-less 'meta' only), Capital-Sized, and T2. (Dependent on which market group is selected)
- [x] Market Quickbar import tool
### Caches refresh with updated prices independently
- Adjusted price data if the cache is greater than 24 hours old
- Price data if the cache is greater than 6 hours old
- Cache files are automatically generated and saved to `wp-content/uploads/eve-reprocess-trading/cache`
## Detailed User Manual
### On Page Load
You will see trade hub selection, skills and standings input, and market group selection and filters.
<img width="624" height="874" alt="on_load" src="https://github.com/user-attachments/assets/f11b088c-6dd9-42fd-8390-6c362d2c1a56" />
#### Trade Hub
`Jita`, `Amarr`, `Dodixie`, `Rens`, or `Hek`<br/>
_Price data will be called from the selected trade hub and the region that hub belongs to._
#### Skills
_Drop-down value_ `0-5`
- **Accounting**: reduces sales tax from 7.5% at level 0, to 3.37% at level 5<br/>
- **Broker Relations**: reduces brokerage fee from 3% at level 0, to 1.5% at level 5
  - Positive Faction and Corp standing and Broker Relations 5 reduces brokerage fee to a minimum of 1.0% at +10/+10<br />
- **Advanced Broker Relations**: reduces relist fee from 50% at level 0 to 80% at level 5 <br/>
- **Connections**: increases effective standing if the base standing is positive<br />
  - Effective Corp standing reduces reprocessing tax:<br />
    - At _effective_ Corp standing of 0.00, reprocessing tax is 5%<br />
    - At _effective_ Corp standing of 6.67, reprocessing tax is 0%<br/>
- **Diplomacy**: increases effective standing if the base standing is negative<br/>
- **Scrapmetal Processing**: increases the reprocessing yield from 50% at level 0 to 55% at level 5<br/>
#### Standings
_Values between_ `-10.00` _and_ `+10.00`<br/>
_Effective standing, fees, taxes and yield are automatically calculated on user input_
#### Item filters
- **Filter Market Group**: allows you to select which market group to look at (Ship Equipment, Drones, Ships, etc.)<br/>
- **Exclude T2?**: excludes T2 items<br/><br/>
_These options show only under specific circumstances_<br/>
- **Exclude Capital-Sized?**: excludes capital-sized items<br/>
- **Exclude T1 Modules?**: excludes modules which have a blueprint (to show meta-only)<br/>
#### Generate List Button
_Generates the item list based on all of the inputs above the button._
### After List Generation
When you click _Generate List_, the item list will generate based on the market group filters you have selected.<br />
Additional basic (left column) and advanced (right column) filters will now be visible, as well as the _Generate Prices_ button and initial (unfiltered) item list.<br />
<img width="599" height="783" alt="after_list_generate" src="https://github.com/user-attachments/assets/6b2d45d5-c6a0-4f99-9f62-c73135b8bc13" />
#### Basic Settings
- **Include Secondary Trade Hubs?**: If 'Yes', includes the chosen `Trade Hub`'s secondary market in ESI price pulls.<br />
  - (Perimeter/Ashab/Frarn/Nakugard/Botane)<br/>
- **Sell To** select how you are selling your yielded materials<br/>
- **Minimum Margin %**: filter results to show only those with the set minimum margin<br/>
- **Maximum Margin %**: filter results to show only those with the set maximum margin<br/>
- **Minimum Daily Volume**: filter results to show only those with the set minimum daily volume<br />
  (daily volume is the average daily volume, over 7 days, for the region the trade hub is located in)<br/>
- **Stack Size**: how many of each item should be reprocessed at the same time?<br >
  If you reprocess a single item, you may lose potential yielded materials compared to reprocessing a **stack size** of 100.<br />
  _(you can't 5% 5, but you can 5% 100)_
#### Advanced Settings
- **Buy order QTY recommendations?**<br/>
  If `Yes`<br/>
- **% of Daily Volume**: after price data is loaded, they will display this percentage of the daily volume, not the daily volume<br/>
- **Re-list brokerage fees?**<br/>
  If `Yes`<br/>
- **Order updates**: how many times do you expect to update your order? This calculates the re-list fee<br/>
  _This is not exact, but helps provide a more accurate item value_
#### Generate Prices
Generates prices based on all of the above user-specified settings<br/>
**! After price generation, if you change any of the basic or advanced settings, the list will be hidden and you must "Regenerate List & Prices"**<br/>
_The auto-hide behavior is to prevent settings being changed and then misreading the results if you forget to regenerate the prices, as the prices do not automatically update_
### How to read results
`Item Name [Item Buy Price / Item Reprocessed Value / Regional Volume / Margin%]`
- **Item Reprocessed Value** = The ISK gain from selling the materials yielded from reprocessing a **stack** of that item, minus relevant taxes/fees<br />
(e.g. Buying from Jita, Selling to Sell Orders, minus brokerage fee, sales tax, and reprocessing tax if *effective* corp standing is <6.67)
- **Regional Volume** = The average daily transactions for this item in the selected market hub's region (average over 7 days)<br/>
_(If **% of Daily Volume** is set, the displayed value will be x% of the regional volume._
#### Example:
`Medium Armor Maintenance Bot I [30210 / 36195 / 281 / 19.81%]`
### Copy to market quickbar
The item price value will be omitted from the data copied to the clipboard. This is to ensure the relevant data fits within the 25 character limit for item notes in the quickbar
#### Example in-game quickbar:
`Item Name [Reprocessed Value|Regional Volume|Margin%]`<br/><br />
`Medium Armor Maintenance Bot I [36195|281|19.81%]`<br /><br />
Having imported your market quickbar, you can now click through each item and have the relevant price info ready to quickly create buy orders. Using the above in-game example, and assuming this is 50% of the daily volume, and this is your target for that item, you can quickly see the item's value, set your buy price to something lower than this, set the QTY to 281, and hit submit, before moving onto the next item in the list.
