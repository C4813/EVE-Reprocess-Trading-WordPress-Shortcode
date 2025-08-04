document.addEventListener('DOMContentLoaded', () => {
    const hubSelect = document.getElementById('hub_select');
    const generateBtn = document.getElementById('generate_btn');
    const generatePricesBtn = document.getElementById('generate_prices_btn');
    const includeSecondarySelect = document.getElementById('include_secondary');
    const tableWrapper = document.getElementById('price_table_wrapper');
    const outputTable = document.getElementById('output_price_table');
    const outputTableBody = outputTable.querySelector('tbody');
    const regionHeader = document.getElementById('region_volume_header');
    const customPriceWrapper = document.getElementById('custom_prices_wrapper');
    const standingInputsWrapper = document.getElementById('standing_inputs_wrapper');
    const customBrokerageWrapper = document.getElementById('custom_brokerage_wrapper');
    const resultSkillsBox = document.getElementById('result_skills');
    const factionLabel = document.getElementById('faction_label');
    const corpLabel = document.getElementById('corp_label');
    const factionInput = document.getElementById('faction_standing_input');
    const corpInput = document.getElementById('corp_standing_input');
    const factionResult = document.getElementById('faction_standing_result');
    const corpResult = document.getElementById('corp_standing_result');
    const brokerFeeOutput = document.getElementById('broker_fee');
    const taxOutput = document.getElementById('reprocess_tax');
    const salesTaxOutput = document.getElementById('sales_tax');
    const yieldOutput = document.getElementById('reprocess_yield');

    const customBrokerageInput = document.getElementById('custom_brokerage_input');
    const customTaxInput = document.getElementById('custom_tax_input');

    const marketGroupSelect = document.getElementById('market_group_select');
    const marketGroupResultsWrapper = document.getElementById('market_group_results_wrapper');
    const marketGroupResults = document.getElementById('market_group_results');

    let invTypes = {};
    let marketGroups = {};
    let reprocessYields = {};

    const hubToFactionCorp = {
        jita: { faction: "Caldari State", corp: "Caldari Navy" },
        amarr: { faction: "Amarr Empire", corp: "Emperor Family" },
        rens: { faction: "Minmatar Republic", corp: "Brutor Tribe" },
        hek: { faction: "Minmatar Republic", corp: "Boundless Creations" },
        dodixie: { faction: "Gallente Federation", corp: "Federation Navy" },
    };

    function safeParse(val) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }

    function getTopLevelGroup(marketGroupID) {
        let current = marketGroups[marketGroupID];
        while (current && current.parentGroupID !== "None") {
            marketGroupID = current.parentGroupID;
            current = marketGroups[marketGroupID];
        }
        return marketGroupID;
    }

    function updateFactionAndCorp() {
        const hub = hubSelect.value;
        const data = hubToFactionCorp[hub] || { faction: "[Faction]", corp: "[Corporation]" };
        factionLabel.textContent = `Base ${data.faction} Standing`;
        corpLabel.textContent = `Base ${data.corp} Standing`;
    }

    function updateResults() {
        const accounting = safeParse(document.getElementById('skill_accounting').value);
        const broker = safeParse(document.getElementById('skill_broker').value);
        const conn = safeParse(document.getElementById('skill_connections').value);
        const crim = safeParse(document.getElementById('skill_criminal').value);
        const diplo = safeParse(document.getElementById('skill_diplomacy').value);
        const scrap = safeParse(document.getElementById('skill_scrapmetal').value);

        const baseFaction = safeParse(factionInput.value);
        const baseCorp = safeParse(corpInput.value);

        const isPrivate = hubSelect.value === 'private';

        const factionEff = baseFaction < 0 ? baseFaction + ((10 - baseFaction) * 0.04 * diplo) : baseFaction + ((10 - baseFaction) * 0.04 * conn);
        const corpEff = baseCorp < 0 ? baseCorp + ((10 - baseCorp) * 0.04 * diplo) : baseCorp + ((10 - baseCorp) * 0.04 * conn);

        const brokerFee = isPrivate
            ? safeParse(customBrokerageInput.value)
            : Math.max(0, 3 - (0.3 * broker) - (0.03 * baseFaction) - (0.02 * baseCorp));

        const reprocessTax = isPrivate
            ? safeParse(customTaxInput.value)
            : corpEff <= 0 ? 5.0 : corpEff < 6.67 ? +(0.05 * (1 - corpEff / 6.67)).toFixed(4) * 100 : 0;

        const salesTax = 7.5 * (1 - (0.11 * accounting));
        const yieldPercent = 50 * (1 + 0.02 * scrap);

        factionResult.textContent = isPrivate ? '' : `Effective: ${factionEff.toFixed(2)}`;
        corpResult.textContent = isPrivate ? '' : `Effective: ${corpEff.toFixed(2)}`;

        brokerFeeOutput.textContent = `${brokerFee.toFixed(2)}%`;
        taxOutput.textContent = `${reprocessTax.toFixed(2)}%`;
        salesTaxOutput.textContent = `${salesTax.toFixed(2)}%`;
        yieldOutput.textContent = `${yieldPercent.toFixed(2)}%`;

        resultSkillsBox.style.display = isPrivate ? 'none' : 'block';
        if (!isPrivate) {
            resultSkillsBox.innerHTML = `
                <div><strong>Skill Used (Faction)</strong><br><i>${baseFaction < 0 ? 'Diplomacy' : 'Connections'}</i></div>
                <div><strong>Skill Used (Corp)</strong><br><i>${baseCorp < 0 ? 'Diplomacy' : 'Connections'}</i></div>
            `;
        }
    }

    function updateMarketGroupResults() {
        const selectedTopGroup = marketGroupSelect.value;
        const yieldText = yieldOutput.textContent || "0%";
        const yieldMatch = yieldText.match(/([\d.]+)%/);
        const yieldPercent = yieldMatch ? parseFloat(yieldMatch[1]) / 100 : 0;

        const results = Object.entries(invTypes)
            .filter(([name, item]) => {
                const topGroup = item.marketGroupID ? getTopLevelGroup(item.marketGroupID) : null;
                return topGroup === selectedTopGroup;
            })
            .map(([name, item]) => {
                const typeID = item.typeID;
                const yieldData = reprocessYields[typeID];
                if (!yieldData) return name;

                const components = Object.entries(yieldData)
                    .map(([matID, qty]) => {
                        const adjustedQty = Math.floor(qty * yieldPercent);
                        if (adjustedQty < 1) return null;
                        const mineralEntry = Object.entries(invTypes).find(([, v]) => v.typeID == matID);
                        const mineralName = mineralEntry ? mineralEntry[0] : `#${matID}`;
                        return `${mineralName} x${adjustedQty}`;
                    })
                    .filter(Boolean);

                return `${name} [${components.join(', ')}]`;
            });

        marketGroupResults.innerHTML = results.length === 0
            ? `<li><em>No items found for this group</em></li>`
            : results.map(name => `<li>${name}</li>`).join('');

        marketGroupResultsWrapper.style.display = 'block';
        generatePricesBtn.style.display = 'inline-block';
    }

    generateBtn.addEventListener('click', () => {
        updateMarketGroupResults();
    });

    generatePricesBtn.addEventListener('click', () => {
        generatePricesBtn.disabled = true;
        generatePricesBtn.innerHTML = `<span class="spinner"></span> Generating...`;

        const isPrivate = hubSelect.value === 'private';
        outputTableBody.innerHTML = '';
        tableWrapper.style.display = 'none';

        const finishGenerate = () => {
            tableWrapper.style.display = 'block';
            generatePricesBtn.disabled = false;
            generatePricesBtn.innerHTML = `<span class="btn-text">Generate Prices</span>`;
        };

        if (isPrivate) {
            const minerals = ["Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine", "Megacyte", "Morphite"];
            minerals.forEach(mineral => {
                const buyInput = document.querySelector(`.custom-buy[data-mineral='${mineral}']`);
                const sellInput = document.querySelector(`.custom-sell[data-mineral='${mineral}']`);
                const buy = safeParse(buyInput.value);
                const sell = safeParse(sellInput.value);

                outputTableBody.innerHTML += `
                    <tr>
                        <td>${mineral}</td>
                        <td>${buy.toFixed(2)}</td>
                        <td>${sell.toFixed(2)}</td>
                    </tr>`;
            });
            regionHeader.style.display = 'none';
            finishGenerate();
        } else {
            fetch('/wp-content/plugins/eve-reprocess-trading/price_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hub: hubSelect.value,
                    includeSecondary: includeSecondarySelect.value === 'yes'
                })
            })
                .then(r => r.json())
                .then(data => {
                    const minerals = ["Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine", "Megacyte", "Morphite"];
                    minerals.forEach(mineral => {
                        const buy = data.buy[mineral] || 0;
                        const sell = data.sell[mineral] || 0;
                        const volume = data.volumes[mineral] || 0;

                        outputTableBody.innerHTML += `
                            <tr>
                                <td>${mineral}</td>
                                <td>${buy.toFixed(2)}</td>
                                <td>${sell.toFixed(2)}</td>
                                <td>${Math.round(volume).toLocaleString()}</td>
                            </tr>`;
                    });
                    regionHeader.style.display = '';
                    finishGenerate();
                })
                .catch(err => {
                    console.error("Fetch error:", err);
                    finishGenerate();
                });
        }
    });

    function loadJSON(url) {
        return fetch(url).then(r => r.json());
    }

    Promise.all([
        loadJSON('/wp-content/plugins/eve-reprocess-trading/invTypes.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/marketGroups.json'),
        loadJSON('/wp-content/plugins/eve-reprocess-trading/reprocess_yield.json')
    ]).then(([types, groups, yields]) => {
        invTypes = types;
        marketGroups = groups;
        reprocessYields = yields;
    });

    hubSelect.addEventListener('change', () => {
        const isPrivate = hubSelect.value === 'private';
        customPriceWrapper.style.display = isPrivate ? 'block' : 'none';
        customBrokerageWrapper.style.display = isPrivate ? 'block' : 'none';
        standingInputsWrapper.style.display = isPrivate ? 'none' : 'block';
        includeSecondarySelect.parentElement.style.display = isPrivate ? 'none' : 'block';

        if (!isPrivate) updateFactionAndCorp();
        updateResults();
    });

    document.querySelectorAll('select, input[type="number"]').forEach(el => el.addEventListener('input', updateResults));

    updateFactionAndCorp();
    updateResults();
});
