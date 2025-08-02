<?php
/* template.php */
?>
<div class="eve-reprocess-wrapper">
    <div class="eve-skills-columns">
        <div class="eve-col eve-border-right">
            <label>Accounting
                <select id="skill_accounting" class="eve-input">
                    <?php for ($i = 0; $i <= 5; $i++): ?>
                        <option value="<?= $i ?>" <?= $i === 5 ? 'selected' : '' ?>><?= $i ?></option>
                    <?php endfor; ?>
                </select>
            </label>
            <label>Broker Relations
                <select id="skill_broker" class="eve-input">
                    <?php for ($i = 0; $i <= 5; $i++): ?>
                        <option value="<?= $i ?>" <?= $i === 5 ? 'selected' : '' ?>><?= $i ?></option>
                    <?php endfor; ?>
                </select>
            </label>
            <label>Connections
                <select id="skill_connections" class="eve-input">
                    <?php for ($i = 0; $i <= 5; $i++): ?>
                        <option value="<?= $i ?>" <?= $i === 5 ? 'selected' : '' ?>><?= $i ?></option>
                    <?php endfor; ?>
                </select>
            </label>
            <label>Criminal Connections
                <select id="skill_criminal" class="eve-input">
                    <?php for ($i = 0; $i <= 5; $i++): ?>
                        <option value="<?= $i ?>" <?= $i === 5 ? 'selected' : '' ?>><?= $i ?></option>
                    <?php endfor; ?>
                </select>
            </label>
            <label>Diplomacy
                <select id="skill_diplomacy" class="eve-input">
                    <?php for ($i = 0; $i <= 5; $i++): ?>
                        <option value="<?= $i ?>" <?= $i === 5 ? 'selected' : '' ?>><?= $i ?></option>
                    <?php endfor; ?>
                </select>
            </label>
        </div>
        <div class="eve-col">
            <label>Faction</label>
            <div class="output" id="faction_display">Caldari State</div>

            <label>Base Faction Standing
                <input type="number" id="faction_standing" class="eve-input" value="0" step="0.01">
            </label>
            <div class="output"><span class="effective-label">Effective:</span><span id="derived_faction_standing">0.00</span></div>

            <label>Corporation
                <select id="corp_select" class="eve-input">
                    <?php foreach ($corpList as $corp): ?>
                        <option value="<?= esc_attr($corp) ?>" <?= $corp === 'Caldari Navy' ? 'selected' : '' ?>><?= esc_html($corp) ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <label>Base Corp Standing
                <input type="number" id="corp_standing" class="eve-input" value="0" step="0.01">
            </label>
            <div class="output"><span class="effective-label">Effective:</span><span id="derived_corp_standing">0.00</span></div>
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

    <table class="eve-reprocess-table">
        <thead>
            <tr>
                <th>Mineral</th>
                <th>Buy Price</th>
                <th>Sell Price</th>
                <th>Daily Forge Volume</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $orderedMinerals = ["Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine", "Megacyte", "Morphite"];
            foreach ($orderedMinerals as $mineral):
                if (!isset($buy[$mineral])) continue;
            ?>
                <tr>
                    <td><?= esc_html($mineral) ?></td>
                    <td><?= number_format($buy[$mineral], 2) ?></td>
                    <td><?= number_format($sell[$mineral], 2) ?></td>
                    <td><?= number_format($volumes[$mineral]) ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
