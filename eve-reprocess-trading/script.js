document.addEventListener('DOMContentLoaded', () => {
    const hubSelect = document.getElementById('hub_select');
    const includeSecondarySelect = document.getElementById('include_secondary');
    const secondaryToggleWrapper = document.getElementById('secondary_toggle_wrapper');
    const customBrokerageWrapper = document.getElementById('custom_brokerage_wrapper');
    const customBrokerageInput = document.getElementById('custom_brokerage_input');
    const customTaxInput = document.getElementById('custom_tax_input');
    const customPricesWrapper = document.getElementById('custom_prices_wrapper');
    const generateBtn = document.getElementById('generate_btn');
    const tableWrapper = document.getElementById('price_table_wrapper');
    const mineralTable = document.querySelector('#output_price_table tbody');
    const regionHeader = document.getElementById('region_volume_header');
    const standingInputsWrapper = document.getElementById('standing_inputs_wrapper');
    const resultSkillsBox = document.getElementById('result_skills');

    const hubToRegion = {
        jita: "The Forge",
        amarr: "Domain",
        rens: "Heimatar",
        hek: "Metropolis",
        dodixie: "Sinq Laison"
    };

    const hubToFactionCorp = {
        jita:      { faction: "Caldari State",       corp: "Caldari Navy" },
        amarr:     { faction: "Amarr Empire",        corp: "Emperor Family" },
        rens:      { faction: "Minmatar Republic",   corp: "Brutor Tribe" },
        hek:       { faction: "Minmatar Republic",   corp: "Boundless Creations" },
        dodixie:   { faction: "Gallente Federation", corp: "Federation Navy" }
    };

    function safeParse(val) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }

    function applyEffectiveStanding(standing, skillType, connSkill, crimSkill, diploSkill) {
        if (standing === 0) return 0;
        if (standing < 0) {
            return standing + ((10 - standing) * 0.04 * diploSkill);
        } else {
            const skillLevel = (skillType === "Criminal Connections") ? crimSkill : connSkill;
            return standing + ((10 - standing) * 0.04 * skillLevel);
        }
    }

    function calcBrokerFee(skill, baseFaction, baseCorp) {
        return Math.max(0, 3 - (0.3 * skill) - (0.03 * baseFaction) - (0.02 * baseCorp));
    }

    function calcReprocessingTax(baseStanding, connectionsSkill) {
        if (baseStanding === 0) return 5.0;
        const rawEff = baseStanding + ((10 - baseStanding) * 0.04 * connectionsSkill);
        const eff = Math.round(rawEff * 100) / 100;
        if (eff <= 0) return 5.0;
        if (eff < 6.67) return +(0.05 * (1 - eff / 6.67)).toFixed(4) * 100;
        return 0;
    }

    function calcSalesTax(accountingSkill) {
        return 7.5 * (1 - (0.11 * accountingSkill));
    }

    function updateFactionAndCorp() {
        const hub = hubSelect.value;
        const data = hubToFactionCorp[hub] || { faction: "[Faction]", corp: "[Corporation]" };

        const factionLabel = document.getElementById('faction_label');
        const corpLabel = document.getElementById('corp_label');

        if (factionLabel) factionLabel.textContent = `Base ${data.faction} Standing`;
        if (corpLabel) corpLabel.textContent = `Base ${data.corp} Standing`;
    }

    function updateRegionVolumeHeader() {
        const hub = hubSelect.value;
        const region = hubToRegion[hub] || "Region";
        regionHeader.textContent = `Daily ${region} Volume`;
    }

    function updateResults() {
        const accounting = safeParse(document.getElementById('skill_accounting').value);
        const broker = safeParse(document.getElementById('skill_broker').value);
        const conn = safeParse(document.getElementById('skill_connections').value);
        const crim = safeParse(document.getElementById('skill_criminal').value);
        const diplo = safeParse(document.getElementById('skill_diplomacy').value);
        const baseFaction = safeParse(document.getElementById('faction_standing_input').value);
        const baseCorp = safeParse(document.getElementById('corp_standing_input').value);
        const customBrokerage = safeParse(customBrokerageInput.value);
        const customTax = safeParse(customTaxInput.value);
        const hub = hubSelect.value;

        const invalid = (baseFaction < -10 || baseFaction > 10 || baseCorp < -10 || baseCorp > 10);

        if (invalid) {
            document.getElementById('faction_standing_result').textContent = "Invalid Standings Input";
            document.getElementById('corp_standing_result').textContent = "Invalid Standings Input";
            document.getElementById('broker_fee').textContent = "Invalid Standings Input";
            document.getElementById('reprocess_tax').textContent = "Invalid Standings Input";
            document.getElementById('sales_tax').textContent = "Invalid Standings Input";
            document.getElementById('result_skills').innerHTML = `
                <div><strong>Skill Used (Faction)</strong><br><i>Invalid Standings Input</i></div>
                <div><strong>Skill Used (Corp)</strong><br><i>Invalid Standings Input</i></div>
            `;
            return;
        }

        const factionEff = applyEffectiveStanding(baseFaction, 'Connections', conn, crim, diplo);
        const corpEff = applyEffectiveStanding(baseCorp, 'Connections', conn, crim, diplo);

        const brokerFee = hub === "private"
            ? customBrokerage.toFixed(2)
            : calcBrokerFee(broker, baseFaction, baseCorp).toFixed(2);

        const reprocessingTax = hub === "private"
            ? customTax.toFixed(2)
            : calcReprocessingTax(baseCorp, conn).toFixed(2);

        const salesTax = calcSalesTax(accounting).toFixed(2);

        document.getElementById('faction_standing_result').textContent = factionEff.toFixed(2);
        document.getElementById('corp_standing_result').textContent = corpEff.toFixed(2);
        document.getElementById('broker_fee').textContent = `${brokerFee}%`;
        document.getElementById('reprocess_tax').textContent = `${reprocessingTax}%`;
        document.getElementById('sales_tax').textContent = `${salesTax}%`;

        const skillUsedFaction = (baseFaction < 0) ? 'Diplomacy' : 'Connections';
        const skillUsedCorp = (baseCorp < 0) ? 'Diplomacy' : 'Connections';

        document.getElementById('result_skills').innerHTML = `
            <div><strong>Skill Used (Faction)</strong><br><i>${skillUsedFaction}</i></div>
            <div><strong>Skill Used (Corp)</strong><br><i>${skillUsedCorp}</i></div>
        `;
    }

    generateBtn.addEventListener('click', () => {
        generateBtn.disabled = true;
        generateBtn.textContent = "Loading...";
        const hub = hubSelect.value;

        if (hub === "private") {
            // Use custom inputs
            const minerals = ["Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine", "Megacyte", "Morphite"];
            mineralTable.innerHTML = '';
            regionHeader.style.display = "none";

            minerals.forEach(mineral => {
                const buyInput = document.querySelector(`.custom-buy[data-mineral="${mineral}"]`);
                const sellInput = document.querySelector(`.custom-sell[data-mineral="${mineral}"]`);
                const buy = safeParse(buyInput?.value);
                const sell = safeParse(sellInput?.value);
                if (buy === 0 && sell === 0) return;
                mineralTable.innerHTML += `
                    <tr>
                        <td>${mineral}</td>
                        <td>${buy.toFixed(2)}</td>
                        <td>${sell.toFixed(2)}</td>
                        <td style="display:none;">–</td>
                    </tr>`;
            });

            tableWrapper.style.display = 'block';
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate";
            return;
        }

        regionHeader.style.display = "table-cell";
        const includeSecondary = includeSecondarySelect.value === "yes";

        fetch('/wp-content/plugins/eve-reprocess-trading/price_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hub, includeSecondary })
        })
        .then(r => r.text())
        .then(raw => {
            console.log("RAW PRICE API RESPONSE:", raw);

            try {
                const data = JSON.parse(raw);

                mineralTable.innerHTML = '';
                const minerals = ["Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine", "Megacyte", "Morphite"];
                minerals.forEach(mineral => {
                    if (data.buy[mineral] === 0 && data.sell[mineral] === 0 && data.volumes[mineral] === 0) return;
                    mineralTable.innerHTML += `
                        <tr>
                            <td>${mineral}</td>
                            <td>${data.buy[mineral].toFixed(2)}</td>
                            <td>${data.sell[mineral].toFixed(2)}</td>
                            <td>${Math.round(data.volumes[mineral]).toLocaleString()}</td>
                        </tr>`;
                });

                tableWrapper.style.display = 'block';
                updateRegionVolumeHeader();
            } catch (err) {
                console.error("Failed to parse JSON response from price_api.php:");
                console.error(raw);
                console.error(err);
            }
        })
        .catch(err => {
            console.error("Error fetching price data:", err);
        })
        .finally(() => {
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate";
        });
    });

    hubSelect.addEventListener('change', () => {
        const hub = hubSelect.value;
        const isPrivate = hub === "private";
    
        secondaryToggleWrapper.style.display = isPrivate ? "none" : "block";
        standingInputsWrapper.style.display = isPrivate ? "none" : "block";
        customBrokerageWrapper.style.display = isPrivate ? "block" : "none";
        customPricesWrapper.style.display = isPrivate ? "block" : "none";
        resultSkillsBox.style.display = isPrivate ? "none" : "flex";
    
        updateFactionAndCorp();
        if (!isPrivate) updateRegionVolumeHeader();
        updateResults();
    });

    document.querySelectorAll('select, input[type="number"]').forEach(el => {
        el.addEventListener('input', updateResults);
    });

    updateFactionAndCorp();
    updateResults();
});
