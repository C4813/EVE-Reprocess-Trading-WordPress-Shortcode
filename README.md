# EVE Reprocess Trading WordPress Shortcode
Adds a shortcode [eve_reprocess_trading] to show a tool to calculate reprocess trading margins and generate a market quickbar

### ! Early development stage, full functionality has not been added yet !

This plugin is designed to replace and enhance my current [EVE Reprocessing Master 2.0.1 spreadsheet](https://docs.google.com/spreadsheets/d/13WKDTn-dqjOnJ2HG1KWYh4hZ8Pxv87vWsUtC65It5Mw/edit?usp=sharing) 🔗

## To-do list
- [x] Trade hub select
  - [x] price and volume data based on slected trade hub
  - [x] secondary trade hub consideration (e.g. if the buy value is higher in Perimeter, use the Perimeter value)
- [ ] filter invTypes by market group ID to generate a list of modules/ships
  - [ ] optional settings to fine-tune results
- [ ] calculate yielded materials from fine-tuned results (e.g. include only meta modules)
  - [ ] add scrapmetal reprocessing skill
- [ ] value the yilded results
  - [ ] compare to mineral buy/sell values
    - [ ] consider brokerage and reprocessing fees and sales tax
  - [ ] generate pastable market quickbar
    - [ ] based on user-defined margin percentage
       
  - [ ] Code cleanup and optimization
