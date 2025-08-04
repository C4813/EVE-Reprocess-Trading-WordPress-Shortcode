<?php /* template.php */ ?>
<div class="eve-reprocess-wrapper">
    <label>Trade Hub
        <select id="hub_select" class="eve-input">
            <option value="jita" selected>Jita</option>
            <option value="amarr">Amarr</option>
            <option value="rens">Rens</option>
            <option value="hek">Hek</option>
            <option value="dodixie">Dodixie</option>
            <option value="private">Private Hub</option>
        </select>
    </label>

    <div id="custom_prices_wrapper" style="display:none; margin-top: 20px;">
        <table class="eve-reprocess-table">
            <thead>
                <tr>
                    <th>Mineral</th>
                    <th>Custom Buy Price</th>
                    <th>Custom Sell Price</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $minerals = ["Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine", "Megacyte", "Morphite"];
                foreach ($minerals as $mineral): ?>
                    <tr>
                        <td><?= $mineral ?></td>
                        <td><input type="number" step="0.01" class="eve-input custom-buy" data-mineral="<?= $mineral ?>" /></td>
                        <td><input type="number" step="0.01" class="eve-input custom-sell" data-mineral="<?= $mineral ?>" /></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <label id="secondary_toggle_wrapper">Include Secondary Trade Hubs?
        <select id="include_secondary" class="eve-input">
            <option value="no" selected>No</option>
            <option value="yes">Yes</option>
        </select>
    </label>

    <div id="market_group_filter" style="margin-top: 30px;">
        <label>Filter Market Group:
            <select id="market_group_select" class="eve-input">
                <option value="4">Ships</option>
                <option value="9" selected>Ship Equipment</option>
            </select>
        </label>
    </div>

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
                    <input id="faction_standing_input" type="number" class="eve-input" step="0.001" min="-10" max="10" value="0.0" />
                </label>
                <div id="faction_standing_result" class="output">Effective: 0.00</div>

                <label><span id="corp_label">Base Caldari Navy Standing</span>
                    <input id="corp_standing_input" type="number" class="eve-input" step="0.001" min="-10" max="10" value="0.0" />
                </label>
                <div id="corp_standing_result" class="output">Effective: 0.00</div>
            </div>

            <div id="custom_brokerage_wrapper" style="display:none;">
                <label>Private Hub Brokerage Fee (%):</label>
                <input id="custom_brokerage_input" type="number" class="eve-input" step="0.01" min="0" max="100" value="0.00" />

                <label style="margin-top: 15px;">Private Hub Reprocessing Tax (%):</label>
                <input id="custom_tax_input" type="number" class="eve-input" step="0.01" min="0" max="100" value="0.00" />
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

    <button id="generate_btn" class="eve-input action-button" style="margin-top: 20px;">
        <span class="spinner"></span>
        <span class="btn-text">Generate List</span>
    </button>

    <button id="generate_prices_btn" class="eve-input action-button" style="margin-top: 10px;">
        <span class="spinner"></span>
        <span class="btn-text">Generate Prices</span>
    </button>

    <button id="copy_toolbar_btn" class="eve-input action-button" style="margin-top: 10px;">
        <span class="spinner"></span>
        <span class="btn-text">Copy Market Toolbar</span>
    </button>

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

    <div id="market_group_results_wrapper" style="display:none; margin-top: 20px;">
        <h3>Items in Selected Market Group</h3>
        <ul id="market_group_results"></ul>
    </div>
</div>
