<?php /* template.php */ ?>
<div class="eve-reprocess-wrapper">

    <!-- Trade Hub selection -->
    <label>
        Trade Hub
        <select id="hub_select" class="eve-input">
            <option value="jita" selected>Jita</option>
            <option value="amarr">Amarr</option>
            <option value="rens">Rens</option>
            <option value="hek">Hek</option>
            <option value="dodixie">Dodixie</option>
        </select>
    </label>

    <!-- Skills & Standings -->
    <div class="eve-skills-columns">
        <div class="eve-col eve-border-right">
            <?php
            $skills = [
                'Accounting' => 'skill_accounting',
                'Broker Relations' => 'skill_broker',
                'Connections' => 'skill_connections',
                'Criminal Connections' => 'skill_criminal',
                'Diplomacy' => 'skill_diplomacy',
                'Scrapmetal Processing' => 'skill_scrapmetal'
            ];
            foreach ($skills as $label => $id): ?>
                <label>
                    <?= $label ?>
                    <select id="<?= $id ?>" class="eve-input">
                        <?php for ($i = 0; $i <= 5; $i++): ?>
                            <option value="<?= $i ?>" <?= $i === 5 ? 'selected' : '' ?>><?= $i ?></option>
                        <?php endfor; ?>
                    </select>
                </label>
            <?php endforeach; ?>
        </div>
        <div class="eve-col">
            <div id="standing_inputs_wrapper">
                <label>
                    <span id="faction_label">Base Caldari State Standing</span>
                    <input id="faction_standing_input" type="number" class="eve-input" step="0.001" min="-10" max="10" value="0.00" />
                </label>
                <div id="faction_standing_result" class="output">Effective: 0.00</div>

                <label>
                    <span id="corp_label">Base Caldari Navy Standing</span>
                    <input id="corp_standing_input" type="number" class="eve-input" step="0.001" min="-10" max="10" value="0.00" />
                </label>
                <div id="corp_standing_result" class="output">Effective: 0.00</div>
            </div>
            <div id="result_skills" class="eve-result-box"></div>
            <div id="result_main" class="eve-result-box">
                <div><strong>Brokerage Fee:</strong> <span id="broker_fee">0.00%</span></div>
                <div><strong>Reprocessing Tax:</strong> <span id="reprocess_tax">0.00%</span></div>
                <div><strong>Sales Tax:</strong> <span id="sales_tax">0.00%</span></div>
                <div><strong>Reprocessing Yield:</strong> <span id="reprocess_yield">50.00%</span></div>
            </div>
        </div>
    </div>

    <!-- Market Group Filter -->
    <div id="market_group_filter">
        <label>
            Filter Market Group
            <select id="market_group_select" class="eve-input">
                <option value="11">Ammunition & Charges</option>
                <option value="157">Drones</option>
                <option value="27">Implants</option>
                <option value="4">Ships</option>
                <option value="9" selected>Ship Equipment</option>
                <option value="955">Ship and Module Modifications</option>
            </select>
        </label>
    </div>
    
    <div id="exclude_capital_wrapper" style="margin-bottom:12px;">
      <label for="exclude_capital" style="font-weight:bold;">Exclude Capital-Sized?</label>
      <select id="exclude_capital" class="eve-input">
        <option value="yes" selected>Yes</option>
        <option value="no">No</option>
      </select>
    </div>

    <!-- Exclude T1 Modules? (Meta only) -->
    <div id="exclude_t1_wrapper" style="display:none;">
        <label>
            Exclude T1 Modules? (Meta only?)
            <select id="exclude_t1" class="eve-input">
                <option value="yes" selected>Yes</option>
                <option value="no">No</option>
            </select>
        </label>
    </div>

    <!-- Include T2? Toggle -->
    <div id="t2_toggle_wrapper">
        <label>
            Include T2?
            <select id="include_t2" class="eve-input">
                <option value="yes" selected>Yes</option>
                <option value="no">No</option>
            </select>
        </label>
    </div>

    <!-- Generate List Button -->
    <button id="generate_btn" type="button" class="eve-btn">Generate List</button>

    <!-- Controls to show only after list is generated -->
    <div id="after_generate_controls" style="display:none;">

        <!-- Secondary Trade Hubs option -->
        <div id="secondary_trade_hub_wrapper">
            <label>Include Secondary Trade Hubs?</label>
            <select id="include_secondary" class="eve-input">
                <option value="yes" selected>Yes</option>
                <option value="no">No</option>
            </select>
        </div>
        <!-- Sell To option -->
        <div id="sell_to_wrapper">
            <label>Sell To</label>
            <select id="sell_to_select" class="eve-input">
                <option value="buy">Buy Orders</option>
                <option value="sell" selected>Sell Orders</option>
            </select>
        </div>

        <!-- Margin Filter Inputs -->
        <div id="margin_fields_wrapper" style="display:none;">
            <label>
                Minimum Margin %
                <input type="number" id="min_margin" class="eve-input" min="0" value="5" step="0.01" />
            </label>
            <label>
                Maximum Margin %
                <input type="number" id="max_margin" class="eve-input" min="0" value="25" step="0.01" />
            </label>
        </div>

        <!-- Minimum Daily Volume -->
        <div id="min_daily_volume_wrapper">
            <label for="min_daily_volume">
                Minimum Daily Volume
                <input id="min_daily_volume" type="number" min="1" step="1" value="1" class="eve-input" />
            </label>
        </div>
        <!-- Stack Size -->
        <div id="stack_size_wrapper">
            <label for="stack_size">
                Stack Size
                <input id="stack_size" type="number" min="1" step="1" value="100" class="eve-input" />
            </label>
        </div>
        <!-- QTY Recommendation -->
        <div id="buy_qty_recommendation_wrapper" style="display:none;">
          <label for="buy_qty_recommendation">Buy-order QTY recommendation?</label>
          <select id="buy_qty_recommendation" class="eve-input">
            <option value="no" slected>No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div id="buy_qty_percentage_wrapper" style="display:none;">
          <label for="buy_qty_percentage">% of Daily Volume</label>
          <input id="buy_qty_percentage" type="number" min="0" max="100" step="1" value="10" class="eve-input">
        </div>
        <!-- Action Buttons -->
        <div id="market_action_buttons">
            <button id="generate_prices_btn" style="display:none;" type="button" class="eve-btn">Generate Prices</button>
            <button id="copy_market_quickbar_btn" style="display:none;" type="button" class="eve-btn">Copy Market Quickbar</button>
        </div>
    </div>

    <!-- Price Table -->
    <div id="price_table_wrapper" style="display:none;">
        <table id="output_price_table" class="eve-reprocess-table">
            <thead>
                <tr>
                    <th>Mineral</th>
                    <th>Buy Price</th>
                    <th>Sell Price</th>
                    <th id="region_volume_header">Daily Volume</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>

    <!-- Material & Item Breakdown -->
    <div id="market_group_results_wrapper" style="display:none;">
        <h3>Items in Selected Market Group</h3>
        <ul id="material_list_flat"></ul>
        <ul id="market_group_results"></ul>
    </div>

    <!-- No Results Message -->
    <div id="no_results_message" style="display:none; color:#c00; font-weight:bold;">
        No profitable items within your filter parameters.<br />Try increasing stack size or widening margins.
    </div>
</div>
