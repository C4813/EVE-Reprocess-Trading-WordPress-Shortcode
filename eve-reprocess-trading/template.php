<?php /* template.php */ ?>
<div class="eve-reprocess-wrapper">
    <label>Select Trade Hub:
        <select id="hub_select" class="eve-input">
            <option value="jita" selected>Jita</option>
            <option value="amarr">Amarr</option>
            <option value="rens">Rens</option>
            <option value="hek">Hek</option>
            <option value="dodixie">Dodixie</option>
        </select>
    </label>

    <label>Include Secondary Trade Hubs:
        <select id="include_secondary" class="eve-input">
            <option value="no" selected>No</option>
            <option value="yes">Yes</option>
        </select>
    </label>

    <div class="eve-skills-columns">
        <div class="eve-col eve-border-right">
            <?php
            $skills = [
                'Accounting' => 'skill_accounting',
                'Broker Relations' => 'skill_broker',
                'Connections' => 'skill_connections',
                'Criminal Connections' => 'skill_criminal',
                'Diplomacy' => 'skill_diplomacy'
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
            <label>Faction</label>
            <div class="output" id="faction_display">Caldari State</div>

            <label>Base Faction Standing
                <input type="number" id="faction_standing" class="eve-input" value="0" step="0.01">
            </label>
            <div class="output"><span class="effective-label">Effective:</span> <span id="derived_faction_standing">0.00</span></div>

            <label>Corporation</label>
            <div class="output" id="corp_display">Caldari Navy</div>

            <label>Base Corp Standing
                <input type="number" id="corp_standing" class="eve-input" value="0" step="0.01">
            </label>
            <div class="output"><span class="effective-label">Effective:</span> <span id="derived_corp_standing">0.00</span></div>
        </div>
    </div>

    <div class="eve-result-row">
        <div class="eve-col eve-border-right">
            <div class="eve-result-box" id="result_skills"></div>
        </div>
        <div class="eve-col">
            <div class="eve-result-box" id="result_main">
                <div><strong>Brokerage Fee:</strong> <span id="broker_fee">0.00%</span></div>
                <div><strong>Reprocessing Tax:</strong> <span id="reprocess_tax">0.00%</span></div>
                <div><strong>Sales Tax:</strong> <span id="sales_tax">0.00%</span></div>
            </div>
        </div>
    </div>

    <button id="generate_btn" class="eve-input" style="margin-top: 20px;">Generate</button>

    <div id="price_table_wrapper" style="display:none;">
        <table class="eve-reprocess-table">
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
</div>
