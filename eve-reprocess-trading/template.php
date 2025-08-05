<?php /* template.php */ ?>
<div class="eve-reprocess-wrapper">

    <!-- Trade Hub selection -->
    <label>Trade Hub
        <select id="hub_select" class="eve-input">
            <option value="jita" selected>Jita</option>
            <option value="amarr">Amarr</option>
            <option value="rens">Rens</option>
            <option value="hek">Hek</option>
            <option value="dodixie">Dodixie</option>
        </select>
    </label>

    <!-- Skills & Standings -->
    <div class="eve-skills-columns" style="padding-top: 25px;">
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
                <label><?= $label ?>
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
                <label><span id="faction_label">Base Caldari State Standing</span>
                    <input id="faction_standing_input" type="number" class="eve-input" step="0.01" min="-10" max="10" value="0.0" />
                </label>
                <div id="faction_standing_result" class="output">Effective: 0.00</div>

                <label><span id="corp_label">Base Caldari Navy Standing</span>
                    <input id="corp_standing_input" type="number" class="eve-input" step="0.01" min="-10" max="10" value="0.0" />
                </label>
                <div id="corp_standing_result" class="output">Effective: 0.00</div>
            </div>
            <div id="result_skills" class="eve-result-box" style="margin-top: 10px;"></div>
            <div class="eve-result-box" id="result_main" style="margin-top: 10px;">
                <div><strong>Brokerage Fee:</strong> <span id="broker_fee">0.00%</span></div>
                <div><strong>Reprocessing Tax:</strong> <span id="reprocess_tax">0.00%</span></div>
                <div><strong>Sales Tax:</strong> <span id="sales_tax">0.00%</span></div>
                <div><strong>Reprocessing Yield:</strong> <span id="reprocess_yield">50.00%</span></div>
            </div>
        </div>
    </div>

    <!-- Market Group Filter, now moved below skills/standings -->
    <div id="market_group_filter" style="margin-top: 30px;">
        <label>Filter Market Group
            <select id="market_group_select" class="eve-input">
                <option value="8">Ammunition & Charges</option>
                <option value="11">Drones</option>
                <option value="24">Implants & Boosters</option>
                <option value="4">Ships</option>
                <option value="9" selected>Ship Equipment</option>
                <option value="475">Ship and Module Modifications</option>
            </select>
        </label>
    </div>
    <!-- Include T2? Toggle -->
    <div id="t2_toggle_wrapper" style="margin:18px 0 12px 0;">
        <label>
            Include T2?
            <select id="include_t2" class="eve-input">
                <option value="no" selected>No</option>
                <option value="yes">Yes</option>
            </select>
        </label>
    </div>

    <!-- Generate List Button -->
    <button id="generate_btn">
        <span class="btn-text">Generate List</span>
    </button><br>

    <!-- Controls to show only after list is generated -->
    <div id="after_generate_controls" style="display:none; text-align: center; margin-top: 24px;">
        <!-- Secondary Trade Hubs option -->
        <div style="margin-bottom: 15px;">
            <label style="display:block; margin-bottom:4px;">Include Secondary Trade Hubs?</label>
            <select id="include_secondary" class="eve-input">
                <option value="no">No</option>
                <option value="yes" selected>Yes</option>
            </select>
        </div>
        <!-- Sell To option -->
        <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom:4px;">Sell To</label>
            <select id="sell_to_select" class="eve-input">
                <option value="buy">Buy Orders</option>
                <option value="sell" selected>Sell Orders</option>
            </select>
        </div>

        <!-- Margin % Fields (initially hidden by script.js) -->
        <div id="margin_fields_wrapper" style="display:none; margin-bottom:12px;">
            <label style="display:inline-block; margin-right:12px;">
                Minimum Margin %<br>
                <input id="min_margin" type="number" class="eve-input" min="0" value="5" step="0.01" style="width:80px; text-align:right;">
            </label>
            <label style="display:inline-block;">
                Maximum Margin %<br>
                <input id="max_margin" type="number" class="eve-input" min="0" value="25" step="0.01" style="width:80px; text-align:right;">
            </label>
        </div>
    </div>

    <!-- Prices Button -->
    <button id="generate_prices_btn" style="display:none;">
        <span class="btn-text">Generate Prices</span>
    </button>

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
    <div id="market_group_results_wrapper" style="display:none; margin-top: 20px;">
        <h3>Items in Selected Market Group</h3>
        <ul id="material_list_flat"></ul>
        <ul id="market_group_results"></ul>
    </div>
    <div id="no_results_message" style="display:none; color:#c00; font-weight:bold; margin:18px auto 0; text-align:center;">
    No profitable items within your filter parameters
    </div>
</div>
