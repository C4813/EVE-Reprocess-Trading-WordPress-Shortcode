<div id="eve-reprocess-wrapper" class="erp-wrapper">

  <!-- Trade Hub -->
  <div class="erp-center">
    <label class="eve-label">
      Trade Hub
      <select id="hub_select" class="eve-input">
        <option value="jita" selected>Jita</option>
        <option value="amarr">Amarr</option>
        <option value="rens">Rens</option>
        <option value="hek">Hek</option>
        <option value="dodixie">Dodixie</option>
      </select>
    </label>
  </div>

  <!-- Skills & Standings -->
  <div id="skills_and_standings" class="erp-two-col">

    <div class="erp-col erp-col--skills">
      <?php
        $skills = [
          'Accounting'                => 'skill_accounting',
          'Broker Relations'          => 'skill_broker',
          'Advanced Broker Relations' => 'skill_broker_adv',
          'Connections'               => 'skill_connections',
          'Diplomacy'                 => 'skill_diplomacy',
          'Scrapmetal Processing'     => 'skill_scrapmetal'
        ];
        foreach ($skills as $label => $id): ?>
          <label class="eve-label">
            <?= esc_html($label) ?>
            <select id="<?= esc_attr($id) ?>" class="eve-input">
              <?php for ($i = 0; $i <= 5; $i++): ?>
                <option value="<?= $i ?>"<?= $i === 5 ? ' selected' : '' ?>><?= $i ?></option>
              <?php endfor; ?>
            </select>
          </label>
      <?php endforeach; ?>
    </div>

    <div class="erp-col erp-col--standings">
      <label class="eve-label">
        <span id="faction_label">Base Caldari State Standing</span>
        <input id="faction_standing_input" type="number" class="eve-input" step="0.001" min="-10" max="10" value="0.00">
      </label>
      <div id="faction_standing_result">Effective: 0.00</div>

      <label class="eve-label">
        <span id="corp_label">Base Caldari Navy Standing</span>
        <input id="corp_standing_input" type="number" class="eve-input" step="0.001" min="-10" max="10" value="0.00">
      </label>
      <div id="corp_standing_result">Effective: 0.00</div>

      <div id="result_skills"></div>
      <div id="result_main">
        <div><strong>Brokerage Fee:</strong> <span id="broker_fee">0.00%</span></div>
        <div><strong>Reprocessing Tax:</strong> <span id="reprocess_tax">0.00%</span></div>
        <div><strong>Sales Tax:</strong> <span id="sales_tax">0.00%</span></div>
        <div><strong>Reprocessing Yield:</strong> <span id="reprocess_yield">50.00%</span></div>
      </div>
    </div>

  </div>

  <!-- Filter Group & Toggles -->
  <div class="erp-center erp-filter-group">
    <label class="eve-label">
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
    <label id="exclude_capital_wrapper" class="eve-label">
      Exclude Capital-Sized?
      <select id="exclude_capital" class="eve-input">
        <option value="yes" selected>Yes</option>
        <option value="no">No</option>
      </select>
    </label>
    <label id="exclude_t1_wrapper" class="eve-label hidden">
      Exclude T1 Modules?
      <select id="exclude_t1" class="eve-input">
        <option value="yes" selected>Yes</option>
        <option value="no">No</option>
      </select>
    </label>
    <label class="eve-label">
      Exclude T2?
      <select id="exclude_t2" class="eve-input">
        <option value="yes">Yes</option>
        <option value="no" selected>No</option>
      </select>
    </label>
  </div>

  <!-- Generate List -->
  <div class="erp-center">
    <button id="generate_btn" class="eve-btn">Generate List</button>
  </div>

  <!-- After-Generation Controls -->
  <div id="after_generate_controls">

    <div class="erp-aftergen">
      <div class="erp-col erp-col--aftergen-main">
        <label class="eve-label">
          Include Secondary Trade Hubs?
          <select id="include_secondary" class="eve-input">
            <option value="yes" selected>Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label class="eve-label">
          Sell To
          <select id="sell_to_select" class="eve-input">
            <option value="buy">Buy Orders</option>
            <option value="sell" selected>Sell Orders</option>
          </select>
        </label>
        <label class="eve-label">
          Minimum Margin %
          <input id="min_margin" type="number" class="eve-input" min="0" value="5" step="0.01">
        </label>
        <label class="eve-label">
          Maximum Margin %
          <input id="max_margin" type="number" class="eve-input" min="0" value="25" step="0.01">
        </label>
        <label class="eve-label">
          Minimum Daily Volume
          <input id="min_daily_volume" type="number" class="eve-input" min="1" value="1" step="1">
        </label>
        <label class="eve-label">
          Stack Size
          <input id="stack_size" type="number" class="eve-input" min="1" value="100" step="1">
        </label>
      </div>
      <div class="erp-col erp-col--aftergen-side">
        <label id="buy_qty_recommendation_wrapper" class="eve-label hidden">
          Buy order QTY recommendation?
          <select id="buy_qty_recommendation" class="eve-input">
            <option value="no" selected>No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
        <label id="buy_qty_percentage_wrapper" class="eve-label hidden">
          % of Daily Volume
          <input id="buy_qty_percentage" type="number" class="eve-input" min="0" max="100" value="10" step="1">
        </label>
        <div id="relist_fees_wrapper" class="hidden">
          <label class="eve-label">
            Re-list brokerage fees?
            <select id="relist_broker_fees" class="eve-input">
              <option value="no" selected>No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
        </div>
        <div id="order_updates_wrapper" class="hidden">
          <label class="eve-label">
            Order updates
            <input id="order_updates" type="number" class="eve-input" min="1" value="5" step="1">
          </label>
        </div>
      </div>
    </div>

    <div class="erp-center erp-actions">
        <button id="generate_prices_btn" class="eve-btn hidden">Generate Prices</button>
    </div>
    <div class="erp-center mt-12" id="quickbar-btn-wrapper">
        <button id="copy_market_quickbar_btn" class="eve-btn hidden">Copy Market Quickbar</button>
    </div>

  <!-- Item Breakdown -->
  <div id="market_group_results_wrapper" class="erp-breakdown hidden">
    <h3>Items in Selected Market Group</h3>
    <ul id="market_group_results"></ul>
  </div>

  <!-- No Results -->
  <div id="no_results_message" class="erp-center erp-error hidden">
    No profitable items within your filter parameters.<br>
    Try increasing stack size or widening margins.
  </div>

</div>
