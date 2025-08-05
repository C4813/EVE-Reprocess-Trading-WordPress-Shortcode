# EVE Reprocess Trading WordPress Shortcode

Adds a shortcode `[eve_reprocess_trading]` to display a tool for calculating reprocess trading margins and generating a market quickbar.

### ⚠️ Early development stage – full functionality has not been added yet! ⚠️

This plugin is designed to replace and enhance my current [EVE Reprocessing Master 2.0.1 spreadsheet](https://docs.google.com/spreadsheets/d/13WKDTn-dqjOnJ2HG1KWYh4hZ8Pxv87vWsUtC65It5Mw/edit?usp=sharing) 🔗

## Version 0.5.3 Features

- [x] Trade Hub selection
  - [x] Secondary Trade Hub consideration (Perimeter/Ashab/Frarn/Nakugard/Botane)
- [x] Skill and standing consideration (for sales tax and brokerage fees)
- [x] Sell to buy orders, or sell orders options
- [x] Price generation up to 9× faster than previous versions

### How to read 0.5.3 results:
`Item Name [Item Buy Price / Item Reprocessed Value / Regional Volume / Margin%]`

- **Item Reprocessed Value** = The value of the reprocessed materials from reprocessing 1 item, and selling them to your selected market, at your selected price, minus relevant taxes/fees (e.g. Jita, Sell Orders).
- **Regional Volume** = The number of transactions for this item in the past 24 hours in this region. This helps when deciding QTY for buy orders.

#### Example:
`Bantam [118000.00 / 145043.72 / 96 / 22.92%]`

## To-Do List

- [x] Margin filter (set minimum/maximum margin) (0.5.4)
- [x] Additional market groups for selection (e.g. some implants are profitable for reprocess trading, but there is currently no way to select them) (0.5.6)
- [x] Enable/Disable T2 modules (Faction/Deadspace/Officer/Abyssal modules are disabled by default. These modules are not profitable for large-scale reprocess trading and are therefore irrelevant.) (0.5.5)
- [x] Reprocessing tax consideration (currently does **NOT** factor into prices) (0.5.7)
- [ ] "Copy Results" button for easy market quickbar import
- [ ] Code cleanup and optimization
